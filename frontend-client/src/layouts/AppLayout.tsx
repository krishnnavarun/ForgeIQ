import { Link, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, User, Briefcase, Building, Settings, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/developer", label: "Developer Profile", icon: User },
  { href: "/recruiter", label: "Recruiter", icon: Briefcase },
  { href: "/organization", label: "Organization", icon: Building },
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavLinks({ currentPath }: { currentPath: string }) {
  return (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPath.startsWith(item.href);
        return (
          <Link
            key={item.href}
            to={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary ${
              isActive ? "bg-muted text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function AppLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar - Desktop */}
      <aside className="hidden border-r bg-muted/40 md:flex md:w-64 md:flex-col">
        <div className="flex h-14 items-center border-b px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold text-lg tracking-tight">
            ForgeIQ
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-4">
          <nav className="grid items-start px-4 text-sm font-medium gap-1">
            <NavLinks currentPath={location.pathname} />
          </nav>
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 h-screen">
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:px-6">
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="outline" size="icon" className="shrink-0 md:hidden" />
              }
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <div className="flex items-center gap-2 font-semibold text-lg tracking-tight mb-4">
                ForgeIQ
              </div>
              <nav className="grid gap-2 text-lg font-medium">
                <NavLinks currentPath={location.pathname} />
              </nav>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1 md:hidden">
            <Link to="/" className="flex items-center gap-2 font-semibold text-lg tracking-tight">
              ForgeIQ
            </Link>
          </div>
          <div className="hidden md:flex flex-1" />
          <div className="flex items-center gap-4">
             <Avatar className="h-8 w-8">
               <AvatarFallback>U</AvatarFallback>
             </Avatar>
          </div>
        </header>
        <div className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
