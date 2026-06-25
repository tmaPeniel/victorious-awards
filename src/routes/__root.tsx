import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Header } from "@/components/victorious/Header";
import { Footer } from "@/components/victorious/Footer";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-obsidian px-4">
      <div className="max-w-md text-center">
        <div className="font-display text-[8rem] leading-none text-champagne">404</div>
        <h2 className="mt-4 font-display text-2xl text-ivory">Page introuvable</h2>
        <p className="mt-2 text-sm text-ivory/60">
          Cette page n'existe pas — ou plus. Le rideau est tombé sur celle-ci.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex h-12 items-center justify-center bg-champagne px-8 text-xs uppercase tracking-[0.2em] text-obsidian transition-colors hover:bg-ivory"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-obsidian px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl text-ivory">
          Quelque chose s'est éteint
        </h1>
        <p className="mt-3 text-sm text-ivory/60">
          La scène a connu un incident. Rallumez les projecteurs.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex h-12 items-center justify-center bg-champagne px-8 text-xs uppercase tracking-[0.2em] text-obsidian hover:bg-ivory"
          >
            Réessayer
          </button>
          <a
            href="/"
            className="inline-flex h-12 items-center justify-center border border-champagne/60 px-8 text-xs uppercase tracking-[0.2em] text-champagne hover:bg-champagne/10"
          >
            Accueil
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Victorious — La Nuit de l'Excellence" },
      {
        name: "description",
        content:
          "Victorious, la cérémonie annuelle de gala d'ICC Rouen, célèbre les parcours marqués par la fidélité de Dieu. 25 juillet 2026 à Isneauville.",
      },
      { name: "author", content: "ICC Rouen" },
      { property: "og:title", content: "Victorious — La Nuit de l'Excellence" },
      {
        property: "og:description",
        content:
          "Une cérémonie de gala pour célébrer les parcours marqués par la fidélité de Dieu. 25 juillet 2026 — ICC Rouen, Isneauville.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#0B0A08" },
      { name: "twitter:title", content: "Victorious — La Nuit de l'Excellence" },
      { name: "description", content: "Victorious est une soirée gala unique, pensée pour célébrer et honorer les parcours de vie marqués par la fidélité de Dieu. Plus qu’un simple événement, c’est u" },
      { property: "og:description", content: "Victorious est une soirée gala unique, pensée pour célébrer et honorer les parcours de vie marqués par la fidélité de Dieu. Plus qu’un simple événement, c’est u" },
      { name: "twitter:description", content: "Victorious est une soirée gala unique, pensée pour célébrer et honorer les parcours de vie marqués par la fidélité de Dieu. Plus qu’un simple événement, c’est u" },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/1058c7cb-ecc3-4ec5-b9f4-b9fa25c8dae6" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/1058c7cb-ecc3-4ec5-b9f4-b9fa25c8dae6" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin");

  return (
    <QueryClientProvider client={queryClient}>
      {isAdmin ? (
        <Outlet />
      ) : (
        <>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-champagne focus:px-4 focus:py-2 focus:text-obsidian"
          >
            Aller au contenu
          </a>
          <Header />
          <main id="main" className="bg-obsidian">
            <Outlet />
          </main>
          <Footer />
        </>
      )}
    </QueryClientProvider>
  );
}
