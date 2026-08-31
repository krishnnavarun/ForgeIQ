import { useCallback, useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Briefcase,
  Building,
  Check,
  ChevronDown,
  FolderGit2,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings,
  User,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCurrentUser, logout, type AuthUser } from "@/services/auth";
import { getMyProfile, type DeveloperProfile } from "@/services/profile";
import { initialsOf } from "@/lib/initials";
import { OrganizationProvider } from "@/context/OrganizationContext";
import { useOrganization } from "@/context/organization-context";

export type AppOutletContext = {
  profile: DeveloperProfile | null;
  loadingProfile: boolean;
  refreshProfile: () => Promise<void>;
};

const navItems: Array<{ href: string; label: string; icon: typeof LayoutDashboard; comingSoon?: boolean }> = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/developer", label: "Developer Profile", icon: User },
  { href: "/projects", label: "Projects", icon: FolderGit2 },
  { href: "/repositories", label: "Repositories", icon: GitBranch },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/recruiter", label: "Recruiter", icon: Briefcase },
  { href: "/organization", label: "Organization", icon: Building },
  { href: "/settings", label: "Settings", icon: Settings, comingSoon: true },
];

function NavLinks({ currentPath, onNavigate }: { currentPath: string; onNavigate?: () => void }) {
  return (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPath.startsWith(item.href);
        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={onNavigate}
            className={`app-nav-item${isActive ? " is-active" : ""}`}
          >
            <Icon size={17} />
            {item.label}
            {item.comingSoon && <span className="app-nav-item-badge">Soon</span>}
          </Link>
        );
      })}
    </>
  );
}

function OrgSwitcher() {
  const navigate = useNavigate();
  const { organizations, currentOrg, setCurrentOrgId, isLoading } = useOrganization();

  if (isLoading) return <div className="org-switcher org-switcher-loading">Loading organizations…</div>;

  if (!currentOrg) {
    return (
      <button type="button" className="org-switcher org-switcher-empty" onClick={() => navigate("/organization")}>
        <Plus size={14} /> Create an organization
      </button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<button type="button" className="org-switcher" />}>
        <span className="org-switcher-avatar">{currentOrg.name.slice(0, 1).toUpperCase()}</span>
        <span className="org-switcher-name">{currentOrg.name}</span>
        <ChevronDown size={14} className="chev" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={6}>
        <DropdownMenuLabel>Your organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem key={org.id} onClick={() => setCurrentOrgId(org.id)}>
            {org.id === currentOrg.id && <Check size={14} />}
            {org.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/organization")}>
          <Plus size={14} /> New / manage organizations
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<DeveloperProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const [currentUser, currentProfile] = await Promise.all([getCurrentUser(), getMyProfile()]);
      if (!currentUser) {
        navigate("/login", { replace: true });
        return;
      }
      setUser(currentUser);
      setProfile(currentProfile);
    } catch {
      navigate("/login", { replace: true });
    } finally {
      setLoadingProfile(false);
    }
  }, [navigate]);

  useEffect(() => {
    // Initial profile/user fetch requires network I/O — there is no synchronous
    // lazy-initializer alternative here, unlike the read-once cases elsewhere.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshProfile();
  }, [refreshProfile]);

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  const displayName = user?.displayName?.trim() || user?.email.split("@")[0] || "Developer";
  const initials = user ? initialsOf(user.displayName, user.email) : "..";

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link to="/" className="app-sidebar-brand">
          <span className="brand-mark"><GitBranch size={17} strokeWidth={2.5} /></span>
          ForgeIQ
        </Link>
        <div className="app-sidebar-org">
          <OrgSwitcher />
        </div>
        <nav className="app-nav">
          <span className="app-nav-label">Workspace</span>
          <NavLinks currentPath={location.pathname} />
        </nav>
        <div className="app-sidebar-foot">
          <div className="app-plan-card">
            <p>Developer intelligence, all phases</p>
            <p>GitHub sync and AI insights activate automatically once GitHub/Anthropic credentials are configured.</p>
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar">
          <Sheet>
            <SheetTrigger
              render={<Button variant="outline" size="icon" className="app-topbar-menu-btn" />}
            >
              <Menu size={18} />
              <span className="sr-only">Toggle navigation menu</span>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
              <div className="app-sidebar-brand">
                <span className="brand-mark"><GitBranch size={17} strokeWidth={2.5} /></span>
                ForgeIQ
              </div>
              <div className="app-sidebar-org">
                <OrgSwitcher />
              </div>
              <nav className="app-nav">
                <NavLinks currentPath={location.pathname} />
              </nav>
            </SheetContent>
          </Sheet>

          <Link to="/" className="app-topbar-mobile-brand">
            <span className="brand-mark"><GitBranch size={17} strokeWidth={2.5} /></span>
            ForgeIQ
          </Link>

          <div className="app-topbar-spacer" />

          <DropdownMenu>
            <DropdownMenuTrigger render={<button className="app-user-trigger" type="button" />}>
              <span className="app-user-trigger-avatar">{initials}</span>
              <span className="app-user-trigger-text">
                <span className="app-user-trigger-name">{displayName}</span>
                <span className="app-user-trigger-email">{user?.email ?? ""}</span>
              </span>
              <ChevronDown size={15} className="chev" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8}>
              <DropdownMenuLabel>Signed in as {user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/developer")}>
                <User size={15} /> Developer profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings size={15} /> Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                <LogOut size={15} /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <div className="app-content">
          <div className="app-content-inner">
            <Outlet context={{ profile, loadingProfile, refreshProfile } satisfies AppOutletContext} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AppLayout() {
  return (
    <OrganizationProvider>
      <AppShell />
    </OrganizationProvider>
  );
}
