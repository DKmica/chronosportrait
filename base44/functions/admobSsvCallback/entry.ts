import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * AdMob Server-Side Verification (SSV) callback handler.
 *
 * When a user earns a rewarded ad, Google/AdMob sends a GET request
 * to this endpoint with cryptographically signed query parameters.
 * This function:
 *   1. Verifies the RSA-SHA256 signature using Google's public keys.
 *   2. Checks the timestamp is fresh (replay protection).
 *   3. Marks the corresponding RewardToken as "verified".
 *
 * Only after this callback verifies a token can grantBonusTransformation
 * grant the actual bonus — preventing bypass via direct HTTP calls.
 *
 * Configure this endpoint URL in the AdMob console for each rewarded ad unit.
 */
const ADMOB_KEYS_URL = 'https://www.gstatic.com/admob/reward/verifier-keys.json';
const MAX_TIMESTAMP_AGE_MS = 6 * 60 * 60 * 1000; // 6 hours

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const params = url.searchParams;

    const customData = params.get('custom_data');
    const transactionId = params.get('transaction_id');
    const timestamp = params.get('timestamp');
    const keyId = params.get('key_id');
    const signature = params.get('signature');

    if (!customData || !transactionId || !keyId || !signature || !timestamp) {
      return Response.json({ error: 'Missing required SSV parameters' }, { status: 400 });
    }

    // ── Replay protection: reject stale timestamps ──
    const ts = parseInt(timestamp, 10);
    if (isNaN(ts) || Math.abs(Date.now() - ts) > MAX_TIMESTAMP_AGE_MS) {
      return Response.json({ error: 'Stale or invalid timestamp' }, { status: 400 });
    }

    // ── Construct unsigned query string (all params except key_id & signature, original order) ──
    const rawQuery = url.search.slice(1);
    const pairs = rawQuery.split('&');
    const unsignedPairs = pairs.filter((p) => {
      const eqIdx = p.indexOf('=');
      const key = eqIdx >= 0 ? p.slice(0, eqIdx) : p;
      return key !== 'key_id' && key !== 'signature';
    });
    const unsignedQueryString = unsignedPairs.join('&');

    // ── Fetch Google's public verification keys ──
    const keysRes = await fetch(ADMOB_KEYS_URL);
    if (!keysRes.ok) throw new Error('Failed to fetch AdMob verification keys');
    const keysData = await keysRes.json();

    const keyEntry = (keysData.keys || []).find((k) => String(k.keyId) === String(keyId));
    if (!keyEntry) return Response.json({ error: 'Unknown key ID' }, { status: 400 });

    // ── Verify RSA-SHA256 signature ──
    const isValid = await verifyAdmobSignature(unsignedQueryString, signature, keyEntry.pem);
    if (!isValid) return Response.json({ error: 'Invalid signature' }, { status: 403 });

    // ── Signature verified — mark the reward token as verified ──
    const base44 = createClientFromRequest(req);

    const tokens = await base44.asServiceRole.entities.RewardToken.filter({ token: customData });
    const tokenRecord = tokens?.[0];

    if (!tokenRecord) return Response.json({ error: 'Reward token not found' }, { status: 404 });

    // Idempotent: if already verified or consumed, return success without changes.
    if (tokenRecord.status !== 'pending') {
      return Response.json({ success: true, message: 'Token already processed' });
    }

    await base44.asServiceRole.entities.RewardToken.update(tokenRecord.id, {
      status: 'verified',
      verified_at: new Date().toISOString(),
      transaction_id: transactionId,
    });

    console.log(`[admobSsv] Verified reward token for ${tokenRecord.user_email}, txn=${transactionId}`);
    return Response.json({ success: true });
  } catch (error) {
    console.error('[admobSsvCallback] error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function verifyAdmobSignature(unsignedQueryString, signatureBase64, pem) {
  const pemContents = pem
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\s/g, '');

  const binaryStr = atob(pemContents);
  const keyBytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) keyBytes[i] = binaryStr.charCodeAt(i);

  const cryptoKey = await crypto.subtle.importKey(
    'spki',
    keyBytes.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const sigBinaryStr = atob(signatureBase64);
  const sigBytes = new Uint8Array(sigBinaryStr.length);
  for (let i = 0; i < sigBinaryStr.length; i++) sigBytes[i] = sigBinaryStr.charCodeAt(i);

  const encoder = new TextEncoder();
  const data = encoder.encode(unsignedQueryString);

  return crypto.subtle.verify('RSASSA-PKCS1-v1_5', cryptoKey, sigBytes, data);
}