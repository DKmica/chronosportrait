import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Sparkles, Images } from "lucide-react";

export default function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-heading font-bold text-lg text-foreground tracking-tight">
              TimeWarp
            </span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        <Outlet />
      </main>

      {/* Bottom Nav */}
      <nav className="sticky bottom-0 bg-background/80 backdrop-blur-xl border-t border-border/50">
        <div className="max-w-lg mx-auto flex">
          <Link
            to="/"
            className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${
              location.pathname === "/"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] font-body font-medium">Transform</span>
          </Link>
          <Link
            to="/gallery"
            className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${
              location.pathname === "/gallery"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Images className="w-5 h-5" />
            <span className="text-[10px] font-body font-medium">Gallery</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}