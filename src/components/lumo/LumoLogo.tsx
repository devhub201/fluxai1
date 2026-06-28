import { Link } from "react-router-dom";

export function LumoLogo({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="flex items-center gap-2">
      <div className="relative flex h-7 w-7 items-center justify-center">
        <div className="absolute inset-0 rounded-md bg-gradient-to-br from-primary to-primary-glow opacity-90 blur-[2px]" />
        <svg viewBox="0 0 24 24" className="relative h-5 w-5 text-white" fill="currentColor">
          <path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4L12 2z" />
        </svg>
      </div>
      <span className="text-base font-semibold tracking-tight">Lumo</span>
    </Link>
  );
}
