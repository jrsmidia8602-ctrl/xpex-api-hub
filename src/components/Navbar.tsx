import { Button } from "@/components/ui/button";
import { Zap, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const navLinks = [
    { name: "APIs", href: "/marketplace", isRoute: true },
    { name: "Pricing", href: "/pricing", isRoute: true },
    { name: "Docs", href: "/docs", isRoute: true },
    { name: "Status", href: "/status", isRoute: true },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Zap className="w-8 h-8 text-primary transition-all group-hover:scale-110" />
              <div className="absolute inset-0 bg-primary/30 blur-xl group-hover:bg-primary/50 transition-all" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              <span className="text-gradient">XPEX</span>
              <span className="text-foreground"> NEURAL</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) =>
              link.isRoute ? (
                <Link key={link.name} to={link.href} className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
                  {link.name}
                </Link>
              ) : (
                <a key={link.name} href={link.href} className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium">
                  {link.name}
                </a>
              )
            )}
          </div>

          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <Link to="/dashboard">
                <Button variant="neon" size="sm">Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link to="/auth">
                  <Button variant="neon" size="sm">Get API Key</Button>
                </Link>
              </>
            )}
          </div>

          <button className="md:hidden text-foreground" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden py-4 border-t border-border/50">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) =>
                link.isRoute ? (
                  <Link key={link.name} to={link.href} className="text-muted-foreground hover:text-primary transition-colors" onClick={() => setIsOpen(false)}>
                    {link.name}
                  </Link>
                ) : (
                  <a key={link.name} href={link.href} className="text-muted-foreground hover:text-primary transition-colors" onClick={() => setIsOpen(false)}>
                    {link.name}
                  </a>
                )
              )}
              <div className="flex gap-4 pt-4">
                {user ? (
                  <Link to="/dashboard" className="flex-1">
                    <Button variant="neon" size="sm" className="w-full">Dashboard</Button>
                  </Link>
                ) : (
                  <Link to="/auth" className="flex-1">
                    <Button variant="neon" size="sm" className="w-full">Login</Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
