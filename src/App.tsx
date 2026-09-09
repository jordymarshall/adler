import { todayStep } from "../shared/next-step";
import { Onboarding } from "./Onboarding";
import { AppIntegrations, Integrations } from "./Integrations";
import { Insights } from "./Insights";
import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import {
  CalendarDays,
  Asterisk,
  ChevronRight,
  CircleHelp,
  MessageCircle,
  Lightbulb,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sun,
  Target,
} from "lucide-react";
import { Footer, Logo } from "./components";
import { Landing, PublicPage } from "./Landing";
import { SignIn } from "./Auth";
import { Connections, ProviderSettings } from "./Connections";
import { useStore } from "./store";
import { Today } from "./Today";
import { NewGoal, SettingsPage } from "./Workspace";
import { GoalWorkspace } from "./GoalWorkspace";
import { Coach, Memory } from "./Coach";
import { Program } from "./Program";
import { Calendar } from "./Calendar";
import { OrganizedGoals } from "./GoalOrganization";

function ScrollReset() {
  const { pathname, hash } = useLocation();
  const { loading } = useStore();
  useEffect(() => {
    if (hash) {
      const frame = requestAnimationFrame(() =>
        (() => { const target = document.getElementById(decodeURIComponent(hash.slice(1)));
          for (let node = target; node; node = node.parentElement) if (node instanceof HTMLDetailsElement) node.open = true;
          target?.scrollIntoView(); })(),
      );
      return () => cancelAnimationFrame(frame);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash, loading]);
  return null;
}
function AppShell() {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("adler-sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("adler-sidebar-collapsed", String(sidebarCollapsed));
    } catch {
      // Keep the toggle usable when browser storage is unavailable.
    }
  }, [sidebarCollapsed]);
  const { data, user, loading, saving, saveError } = useStore();
  const viewedGoal = location.pathname.match(/\/goals\/([^/]+)/)?.[1] ?? (location.pathname === "/app/today" ? new URLSearchParams(location.search).get("goal") ?? todayStep(data).step?.goal.id : undefined);
  const focusGoal = data.goals.find(g => g.id === viewedGoal);
  const label = location.pathname.includes("/settings")
    ? "Settings"
    : location.pathname.includes("/integrations")
    ? "Integrations"
    : location.pathname.includes("/insights")
      ? "Insights"
      : location.pathname.includes("/calendar")
        ? "Calendar"
        : location.pathname.includes("/goals")
          ? "Goals"
          : location.pathname.includes("/check-in")
            ? "Check-in"
            : location.pathname.includes("/settings")
              ? "Settings"
              : location.pathname.includes("/reviews")
                ? "Your weekly review"
                : "Today";
  const nav = [
    { to: "/app/today", label: "Today", Icon: Sun },
    { to: "/app/goals", label: "Goals", Icon: Target },
    { to: "/app/calendar", label: "Calendar", Icon: CalendarDays },
    { to: `/app/check-in${focusGoal ? `?goal=${encodeURIComponent(focusGoal.id)}` : ""}`, label: "Check-in", Icon: MessageCircle },
    { to: "/app/insights", label: "Insights", Icon: Lightbulb },
  ];
  if (loading) return <div className="auth-page">Opening your workspace…</div>;
  if (!user) return <SignIn />;
  return (
    <div className={`app-shell${sidebarCollapsed ? " sidebar-collapsed" : ""}`}>
      <a className="skip-link" href="#app-main">
        Skip to content
      </a>
      <aside id="app-sidebar" className="app-sidebar">
        <Logo />
        <span className="workspace-label">YOUR WORKSPACE</span>
        <nav aria-label="App navigation">
          {nav.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <Icon size={20} strokeWidth={1.7} />
              {label}
              <ChevronRight className="nav-chevron" size={15} />
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <NavLink to="/app/settings" className="sidebar-setting">
            <Settings size={19} />
            Settings
          </NavLink>
          <Link to="/support" className="sidebar-setting">
            <CircleHelp size={19} />
            Help & the method
          </Link>
          <div className="sidebar-profile">
            <span className="avatar">Y</span>
            <div>
              <b>Your workspace</b>
              <span>{user.username}</span>
            </div>
            <span className="status-dot" />
          </div>
        </div>
      </aside>
      <div className="app-body">
        <header className="app-topbar">
          <div className="breadcrumb">
            <button
              type="button"
              className="icon-button sidebar-toggle"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!sidebarCollapsed}
              aria-controls="app-sidebar"
              onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
            >
              {sidebarCollapsed ? <PanelLeftOpen size={20} aria-hidden="true" /> : <PanelLeftClose size={20} aria-hidden="true" />}
            </button>
            <b>{label}</b>
          </div>
          <span className="sync-state" role="status">
            {saving ? "Saving…" : saveError ? "Sync needs attention" : ""}
          </span>
          <Link className="mobile-logo" to="/" aria-label="Adler home">
            <Asterisk size={27} />
          </Link>
        </header>
        <main id="app-main" className="app-main">
          {saveError && (
            <p role="alert" className="save-error">
              {saveError}
            </p>
          )}
          <Outlet />
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Mobile app navigation">
        {nav.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            <Icon size={21} />
            <span>{label}</span>
          </NavLink>
        ))}
        <NavLink to="/app/settings">
          <Settings size={21} />
          <span>Settings</span>
        </NavLink>
      </nav>
    </div>
  );
}
function LegacyCoachRedirect({ to }: { to: string }) {
  const { search, hash } = useLocation();
  return <Navigate to={`${to}${search}${hash}`} replace />;
}
export function App() {
  const { toast } = useStore();
  return (
    <>
      <ScrollReset />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/integrations" element={<Integrations />} />
        <Route path="/sign-in" element={<SignIn />} />
        {(["method", "privacy", "terms", "support"] as const).map((type) => (
          <Route
            key={type}
            path={`/${type}`}
            element={<PublicPage type={type} />}
          />
        ))}
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Navigate to="today" replace />} />
          <Route path="today" element={<Today />} />
          <Route path="goals" element={<OrganizedGoals />} />
          <Route path="goals/new" element={<Onboarding />} />
          <Route path="goals/new/manual" element={<NewGoal />} />
          <Route path="onboarding" element={<Onboarding />} />
          <Route path="goals/:goalId" element={<GoalWorkspace />} />
          <Route path="goals/:goalId/:tab" element={<GoalWorkspace />} />
          <Route path="integrations" element={<AppIntegrations />} />
          <Route path="check-in" element={<Coach />} />
          <Route path="insights" element={<><Insights /><details className="journey-disclosure"><summary>Saved context & preferences</summary><Memory /></details></>} />
          <Route path="coach" element={<LegacyCoachRedirect to="/app/check-in" />} />
          <Route path="coach/about-you" element={<LegacyCoachRedirect to="/app/insights" />} />
          <Route path="coach/program" element={<LegacyCoachRedirect to="/app/settings/coaching" />} />
          <Route path="reviews/:reviewId" element={<Navigate to="/app/check-in?intent=review&prompt=Let’s%20review%20what%20happened%20this%20week%20and%20what%20to%20adjust." replace />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="settings/coaching" element={<Program />} />
          <Route path="settings/provider" element={<ProviderSettings />} />
          <Route path="connections" element={<Connections />} />
        </Route>
        <Route
          path="*"
          element={
            <div className="public-page">
              <header className="site-header">
                <Logo />
              </header>
              <main className="empty-state">
                <h1>This path is still unwritten.</h1>
                <p>Let’s get you back to a familiar place.</p>
                <Link className="button primary" to="/">
                  Back to Adler
                </Link>
              </main>
              <Footer />
            </div>
          }
        />
      </Routes>
      {toast && (
        <div className="toast" role="status">
          <Asterisk size={18} />
          {toast}
        </div>
      )}
    </>
  );
}
