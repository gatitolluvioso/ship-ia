"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

export type IconName =
  | "activity"
  | "chart"
  | "chevron-left"
  | "chevron-right"
  | "database"
  | "file-plus"
  | "history"
  | "map-pin"
  | "refresh"
  | "report"
  | "settings"
  | "settings-2"
  | "summary";

const navItems: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Nuevo proyecto", icon: "file-plus" },
  { href: "/history", label: "Historial", icon: "history" },
  { href: "/reports", label: "Reportes", icon: "report" },
  { href: "/settings", label: "Configuracion", icon: "settings" },
];

type AuthUser = {
  id: number;
  name: string | null;
  email: string;
  role: string;
  avatarUrl: string | null;
  avatarInitial: string | null;
  avatarColor: string | null;
};

export function ShipShell({
  actionFooter,
  children,
  loadingOverlay,
}: {
  actionFooter?: ReactNode;
  children: ReactNode;
  loadingOverlay?: ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/auth/me")
      .then((response) => {
        if (!response.ok) return null;
        return response.json() as Promise<{ user: AuthUser | null }>;
      })
      .then((data) => {
        if (!active || !data) return;
        setUser(data.user);
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
      });

    return () => {
      active = false;
    };
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <main className="min-h-screen bg-[#f5f8fc] text-[#0a2147]">
      <header className="sticky top-0 z-20 border-b border-blue-950/10 bg-[#092c5f] text-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <Link
              className="flex items-center gap-2 rounded-lg transition hover:opacity-85 focus:outline-none focus:ring-4 focus:ring-white/20"
              href="/"
            >
              <h1 className="text-2xl font-bold tracking-tight">SHIP</h1>
              <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-bold">
                IA
              </span>
            </Link>
            <span className="hidden h-6 w-px bg-white/30 sm:block" />
            <a
              className="hidden rounded-lg leading-tight transition hover:opacity-85 focus:outline-none focus:ring-4 focus:ring-white/20 sm:block"
              href="https://cimav.edu.mx/"
              rel="noreferrer"
              target="_blank"
            >
              <p className="text-sm font-bold tracking-wide">CIMAV</p>
              <p className="text-[11px] text-blue-100">
                Centro de Investigacion en Materiales Avanzados
              </p>
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              aria-label="Iniciar sesion con otra cuenta"
              className="grid size-8 cursor-pointer place-items-center rounded-full border border-white/70 text-lg font-bold transition hover:border-white hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-white/20"
              href="/login"
            >
              +
            </Link>
            {user ? (
              <button
                aria-label="Cerrar sesion"
                className="grid size-9 cursor-pointer place-items-center overflow-hidden rounded-full bg-white/95 font-bold text-[#7890ad] transition hover:bg-white hover:ring-4 hover:ring-white/20 focus:outline-none focus:ring-4 focus:ring-white/30"
                onClick={logout}
                type="button"
              >
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt=""
                    className="size-full object-cover"
                    src={user.avatarUrl}
                  />
                ) : (
                  <span
                    className="grid size-full place-items-center rounded-full text-white"
                    style={{ backgroundColor: user.avatarColor || "#0b63e5" }}
                  >
                    {getInitial(user)}
                  </span>
                )}
              </button>
            ) : (
              <Link
                className="grid size-9 cursor-pointer place-items-center rounded-full bg-white/95 font-bold text-[#7890ad] transition hover:bg-white hover:ring-4 hover:ring-white/20 focus:outline-none focus:ring-4 focus:ring-white/30"
                href="/login"
              >
                U
              </Link>
            )}
          </div>
        </div>
      </header>

      <aside
        className={`fixed left-0 top-16 z-10 hidden h-[calc(100vh-4rem)] flex-col border-r border-slate-200 bg-white p-4 shadow-sm transition-all lg:flex ${
          sidebarOpen ? "w-72" : "w-20"
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-2 py-2">
          {sidebarOpen ? (
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Navegacion
            </p>
          ) : null}
          <button
            aria-label={sidebarOpen ? "Ocultar sidebar" : "Mostrar sidebar"}
            className="grid size-9 place-items-center rounded-lg border border-slate-200 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            onClick={() => setSidebarOpen((current) => !current)}
            type="button"
          >
            <Icon name={sidebarOpen ? "chevron-left" : "chevron-right"} />
          </button>
        </div>
        <nav className="mt-2 space-y-2">
          {navItems.map(({ href, icon, label }) => {
            const active = pathname === href;

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                  active
                    ? "bg-[#0b63e5] text-white shadow-md shadow-blue-100"
                    : "text-slate-600 hover:bg-slate-50 hover:text-[#0a2147]"
                }`}
                href={href}
                key={href}
              >
                <span
                  className={`grid size-8 place-items-center rounded-lg text-xs font-bold ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <Icon name={icon} />
                </span>
                {sidebarOpen ? <span>{label}</span> : null}
              </Link>
            );
          })}
        </nav>

        {sidebarOpen ? (
          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-bold text-[#0a2147]">
              {user ? user.name || user.email : "SHIP IA"}
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {user
                ? "Sesion activa. Tus proyectos quedan asociados a esta cuenta."
                : "Inicia sesion para guardar proyectos y reportes."}
            </p>
          </div>
        ) : null}
      </aside>

      <div
        className={`transition-all ${sidebarOpen ? "lg:pl-72" : "lg:pl-20"}`}
      >
        <div className="mx-auto max-w-7xl px-4 pb-24 pt-5 sm:px-6">
          {children}
        </div>
      </div>

      {loadingOverlay}

      {actionFooter ? (
        <footer
          className={`fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur transition-all ${
            sidebarOpen ? "lg:pl-72" : "lg:pl-20"
          }`}
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            {actionFooter}
          </div>
        </footer>
      ) : null}
    </main>
  );
}

function getInitial(user: AuthUser) {
  return (user.avatarInitial || user.name || user.email || "U")
    .trim()
    .charAt(0)
    .toUpperCase();
}

export function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    activity: (
      <>
        <path d="M4 13h4l2-6 4 12 2-6h4" />
      </>
    ),
    chart: (
      <>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M8 15v-4" />
        <path d="M12 15V8" />
        <path d="M16 15v-6" />
      </>
    ),
    "chevron-left": <path d="m15 6-6 6 6 6" />,
    "chevron-right": <path d="m9 6 6 6-6 6" />,
    database: (
      <>
        <ellipse cx="12" cy="5" rx="7" ry="3" />
        <path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5" />
        <path d="M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
      </>
    ),
    "file-plus": (
      <>
        <path d="M14 3v4a1 1 0 0 0 1 1h4" />
        <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" />
        <path d="M12 11v6" />
        <path d="M9 14h6" />
      </>
    ),
    history: (
      <>
        <path d="M12 8v5l3 2" />
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v5h5" />
      </>
    ),
    "map-pin": (
      <>
        <path d="M12 21s7-5.4 7-12a7 7 0 1 0-14 0c0 6.6 7 12 7 12Z" />
        <path d="M12 10.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4" />
        <path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4" />
      </>
    ),
    report: (
      <>
        <path d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
        <path d="M15 3v4h4" />
        <path d="M9 13h6" />
        <path d="M9 17h4" />
      </>
    ),
    settings: (
      <>
        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 3.4-.2-.1a1.7 1.7 0 0 0-2 .3l-.2.2a1.7 1.7 0 0 0-.5 1.2V22H9v-.2a1.7 1.7 0 0 0-.5-1.2l-.2-.2a1.7 1.7 0 0 0-2-.3l-.2.1-2-3.4.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3v-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 2-3.4.2.1a1.7 1.7 0 0 0 2-.3l.2-.2A1.7 1.7 0 0 0 9 2.2V2h6v.2a1.7 1.7 0 0 0 .5 1.2l.2.2a1.7 1.7 0 0 0 2 .3l.2-.1 2 3.4-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
    "settings-2": (
      <>
        <path d="M4 8h4" />
        <path d="M12 8h8" />
        <path d="M10 5v6" />
        <path d="M4 16h10" />
        <path d="M18 16h2" />
        <path d="M16 13v6" />
      </>
    ),
    summary: (
      <>
        <path d="M5 5h14" />
        <path d="M5 12h14" />
        <path d="M5 19h10" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
}
