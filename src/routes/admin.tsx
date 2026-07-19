import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { LogOut, Inbox, LayoutDashboard, Image as ImageIcon, Tags, MessageSquareQuote, Ticket } from "lucide-react";
import { useSession } from "@/lib/use-session";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administration — Victorious" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { session, isAdmin, loading } = useSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (loading) return;
    if (!session && !isLogin) {
      void navigate({ to: "/admin/login" });
    }
    if (session && !isAdmin && !isLogin) {
      void navigate({ to: "/admin/login" });
    }
  }, [loading, session, isAdmin, isLogin, navigate]);

  if (isLogin) {
    return (
      <div className="min-h-screen bg-obsidian">
        <Outlet />
      </div>
    );
  }

  if (loading || !session || !isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-obsidian">
        <div className="text-xs uppercase tracking-[0.3em] text-champagne/60">
          Vérification…
        </div>
      </div>
    );
  }

  const nav = [
    { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
    { to: "/admin/applications", label: "Candidatures", icon: Inbox, exact: false },
    { to: "/admin/billetterie", label: "Billetterie", icon: Ticket, exact: false },
    { to: "/admin/categories", label: "Catégories", icon: Tags, exact: false },
    { to: "/admin/gallery", label: "Galerie", icon: ImageIcon, exact: false },
    { to: "/admin/testimonials", label: "Témoignages", icon: MessageSquareQuote, exact: false },
  ];

  const signOut = async () => {
    await supabase.auth.signOut();
    void navigate({ to: "/admin/login" });
  };

  return (
    <div className="min-h-screen bg-obsidian text-ivory">
      <header className="border-b border-champagne/15 bg-obsidian/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/admin" className="flex items-center gap-3">
            <span className="font-display text-xl text-champagne">Victorious</span>
            <span className="text-[0.65rem] uppercase tracking-[0.3em] text-ivory/50">
              Admin
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <span className="hidden text-xs text-ivory/50 sm:block">
              {session.user.email}
            </span>
            <button
              onClick={signOut}
              className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-ivory/70 hover:text-champagne"
            >
              <LogOut className="size-4" /> Déconnexion
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto flex max-w-7xl gap-8 px-6 py-10">
        <aside className="hidden w-56 shrink-0 lg:block">
          <nav className="space-y-1">
            {nav.map((item) => {
              const active = item.exact
                ? pathname === item.to
                : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-champagne/10 text-champagne"
                      : "text-ivory/60 hover:bg-ivory/5 hover:text-ivory",
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
