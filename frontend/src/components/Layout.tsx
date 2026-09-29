import { NavLink, Outlet } from "react-router-dom";
import { Compass } from "lucide-react";
import { cn } from "../lib/utils";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "text-sm font-medium transition-colors",
    isActive ? "text-brand-700" : "text-gray-600 hover:text-gray-900",
  );

export function Layout() {
  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <NavLink to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-brand-600 flex items-center justify-center">
              <Compass className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold tracking-tight">
              Vantion <span className="text-brand-600">· Programs</span>
            </span>
          </NavLink>
          <nav className="flex items-center gap-6">
            <NavLink to="/intake" className={linkClass}>Find matches</NavLink>
            <NavLink to="/matches" className={linkClass}>Matches</NavLink>
            <NavLink to="/saved" className={linkClass}>Saved</NavLink>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 text-xs text-gray-500">
          Prototype extension of vantion.com · Walnutech PBC
        </div>
      </footer>
    </div>
  );
}
