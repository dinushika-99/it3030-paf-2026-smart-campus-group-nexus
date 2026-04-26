import { Link, useLocation } from "react-router-dom";
import { Building2, LayoutDashboard, Menu, X, UserCircle } from "lucide-react";
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
      <header className="sticky top-0 z-50 bg-[#1B2A4A] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {hideHeaderBrand ? <div /> : (
              <Link to="/" className="flex items-center gap-3">
                <img src={SITE_BRAND.logoPath} alt={SITE_BRAND.logoAlt} className="w-10 h-10 object-contain" />
                <span className="text-xl font-bold tracking-tight">{SITE_BRAND.name}</span>
              </Link>
            )}

            {hideHeaderNav ? <div /> : (
              <>
                <nav className="hidden md:flex items-center gap-1">
                  <Link to="/facilities">
                    <Button variant="ghost" className={`text-white hover:bg-white/10 hover:text-white ${location.pathname === "/facilities" ? "bg-white/15 text-white" : ""}`}>
                      <Building2 className="w-4 h-4 mr-2" />
                      Facilities
                    </Button>
                  </Link>
                  {isAdminUser ? (
                    <Link to="/admin">
                      <Button variant="ghost" className={`text-white hover:bg-white/10 hover:text-white ${isAdmin ? "bg-white/15 text-white" : ""}`}>
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Admin Panel
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/dashboard">
                      <Button variant="ghost" className={`text-white hover:bg-white/10 hover:text-white ${location.pathname === "/dashboard" ? "bg-white/15 text-white" : ""}`}>
                        <UserCircle className="w-4 h-4 mr-2" />
                        My Account
                      </Button>
                    </Link>
                  )}
                </nav>
                <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </>
            )}
          </div>
        </div>
        {mobileMenuOpen && !hideHeaderNav && (
          <div className="md:hidden border-t border-white/10 px-4 pb-4 pt-2 space-y-2">
            <Link to="/facilities" onClick={() => setMobileMenuOpen(false)} className="block">
              <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10 hover:text-white">
                <Building2 className="w-4 h-4 mr-2" />
                Facilities
              </Button>
            </Link>
            {isAdminUser ? (
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block">
                <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10 hover:text-white">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Admin Panel
                </Button>
              </Link>
            ) : (
              <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="block">
                <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10 hover:text-white">
                  <UserCircle className="w-4 h-4 mr-2" />
                  My Account
                </Button>
              </Link>
            )}
          </div>
        )}
      </header>
      <main>{children}</main>
    </div>
  );
}