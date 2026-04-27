import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Menu, X } from "lucide-react";
import { SITE_BRAND } from "../siteConfig";
import { Button } from "../components/ui/button";
import { useState } from "react";
import { useAuth } from "../AuthContext";

export default function Layout({
  children,
  hideHeaderBrand = false,
  hideHeaderNav = false,
}) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();
  const isAdminUser = user && ['admin', 'manager'].includes(user.role);

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <header className="sticky top-0 z-50 bg-[#C5961A] text-[#111827] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            {/* {hideHeaderBrand ? <div /> : (
              <Link to="/" className="flex items-center gap-3">
                <img src={SITE_BRAND.logoPath} alt={SITE_BRAND.logoAlt} className="w-10 h-10 object-contain" />
                <span className="text-xl font-bold tracking-tight">{SITE_BRAND.name}</span>
              </Link>
            )} */}

            {/* Navbar */}
            {hideHeaderNav ? <div /> : (
              <>
                <nav className="hidden md:flex items-center gap-1">

                  {/* ✅ Only Admin Panel (if admin) */}
                  {isAdminUser && (
                    <Link to="/admin">
                      <Button variant="ghost" className={`text-[#111827] hover:bg-black/10 hover:text-[#111827] ${isAdmin ? "bg-black/10 text-[#111827]" : ""}`}>
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Admin Panel
                      </Button>
                    </Link>
                  )}

                  

                </nav>

                {/* Mobile Menu Button */}
                <button
                  className="md:hidden text-[#111827]"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && !hideHeaderNav && (
          <div className="md:hidden border-t border-black/10 px-4 pb-4 pt-2 space-y-2">

            {/* ✅ Only Admin Panel (if admin) */}
            {isAdminUser && (
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block">
                <Button variant="ghost" className="w-full justify-start text-[#111827] hover:bg-black/10 hover:text-[#111827]">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Admin Panel
                </Button>
              </Link>
            )}

            {/* ❌ My Account REMOVED */}

          </div>
        )}
      </header>

      <main>{children}</main>
    </div>
  );
}