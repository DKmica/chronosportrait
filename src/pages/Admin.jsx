import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Sparkles, CheckCircle, XCircle, TrendingUp, ImageIcon, Heart } from 'lucide-react';

function StatCard({ icon: Icon, label, value, color = 'text-primary', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3"
    >
      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="font-display text-xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </motion.div>
  );
}

export default function Admin() {
  const navigate = useNavigate();

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });

  const { data: allTransformations = [], isLoading: loadingT } = useQuery({
    queryKey: ['admin-transformations'],
    queryFn: () => base44.entities.Transformation.list('-created_date', 500),
    enabled: me?.role === 'admin',
  });

  const { data: allProfiles = [], isLoading: loadingP } = useQuery({
    queryKey: ['admin-profiles'],
    queryFn: () => base44.entities.UserProfile.list('-created_date', 500),
    enabled: me?.role === 'admin',
  });

  const { data: allPosts = [], isLoading: loadingC } = useQuery({
    queryKey: ['admin-posts'],
    queryFn: () => base44.entities.CommunityPost.list('-likes_count', 50),
    enabled: me?.role === 'admin',
  });

  if (me && me.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-5 text-center">
        <XCircle className="w-12 h-12 text-destructive" />
        <h1 className="font-display text-xl font-semibold text-foreground">Admin access required</h1>
        <button onClick={() => navigate('/')} className="text-primary underline text-sm">Go Home</button>
      </div>
    );
  }

  const completed = allTransformations.filter(t => t.status === 'completed');
  const failed = allTransformations.filter(t => t.status === 'failed');
  const proUsers = allProfiles.filter(p => p.plan !== 'free');
  const failRate = allTransformations.length > 0
    ? ((failed.length / allTransformations.length) * 100).toFixed(1)
    : '0';

  const eraCounts = {};
  allTransformations.forEach(t => {
    if (t.era_label) eraCounts[t.era_label] = (eraCounts[t.era_label] || 0) + 1;
  });
  const topEras = Object.entries(eraCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const isLoading = loadingT || loadingP || loadingC;

  return (
    <div className="min-h-screen pb-16">
      <div className="px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="font-display text-xl font-bold text-foreground">Admin Dashboard</h1>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="px-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <StatCard icon={Users} label="Total Users" value={allProfiles.length} delay={0} />
            <StatCard icon={Sparkles} label="Total Transforms" value={allTransformations.length} delay={0.05} />
            <StatCard icon={CheckCircle} label="Completed" value={completed.length} color="text-green-500" delay={0.1} />
            <StatCard icon={XCircle} label="Failed" value={failed.length} color="text-destructive" delay={0.15} />
            <StatCard icon={TrendingUp} label="Pro Users" value={proUsers.length} color="text-accent" delay={0.2} />
            <StatCard
              icon={ImageIcon}
              label="Fail Rate"
              value={`${failRate}%`}
              color={parseFloat(failRate) > 15 ? 'text-destructive' : 'text-green-500'}
              delay={0.25}
            />
          </div>

          {/* Top Eras */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground mb-3">Top Eras</h3>
            <div className="space-y-2">
              {topEras.map(([era, count]) => (
                <div key={era} className="flex items-center justify-between text-sm">
                  <span className="text-foreground truncate flex-1">{era}</span>
                  <span className="font-bold text-primary ml-2">{count}</span>
                </div>
              ))}
              {topEras.length === 0 && <p className="text-sm text-muted-foreground">No data yet</p>}
            </div>
          </motion.div>

          {/* Top Posts */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Heart className="w-4 h-4 text-destructive" /> Most Liked Posts
            </h3>
            <div className="space-y-3">
              {allPosts.slice(0, 5).map(post => (
                <div key={post.id} className="flex items-center gap-3">
                  <img src={post.image_url} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{post.era_label}</p>
                    <p className="text-xs text-muted-foreground">{post.author_name}</p>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-semibold text-destructive">
                    <Heart className="w-3.5 h-3.5" />{post.likes_count || 0}
                  </div>
                </div>
              ))}
              {allPosts.length === 0 && <p className="text-sm text-muted-foreground">No posts yet</p>}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}