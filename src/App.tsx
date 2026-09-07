import { Onboarding } from "./Onboarding";
import { AppIntegrations, Integrations } from "./Integrations";
import { Insights } from "./Insights";
import { useEffect } from "react";
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
import { todayStep } from "../shared/next-step";
import { NewGoal, SettingsPage, WeeklyReview } from "./Workspace";
import { GoalWorkspace } from "./GoalWorkspace";
import { Coach, Memory } from "./Coach";
import { Program } from "./Program";
import { Calendar } from "./Calendar";
import { OrganizedGoals } from "./GoalOrganization";

function ScrollReset() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const frame = requestAnimationFrame(() =>
        document.getElementById(hash.slice(1))?.scrollIntoView(),
      );
      return () => cancelAnimationFrame(frame);
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}
function AppShell() {
  const location = useLocation();
  const { data, user, loading, saving, saveError } = useStore();
  const today = todayStep(data);
  const requestedGoal =
    location.pathname.match(/\/goals\/([^/]+)/)?.[1] ??
    (location.pathname === "/app/today"
      ? (new URLSearchParams(location.search).get("goal") ??
        (!today.review ? today.step?.goal.id : undefined))
      : undefined);
  const contextGoal =
    data.goals.find((g) => g.id === requestedGoal)?.id ?? "general";
  const label = location.pathname.includes("/integrations")
    ? "Integrations"
    : location.pathname.includes("/insights")
      ? "Insights"
      : location.pathname.includes("/calendar")
        ? "Calendar"
        : location.pathname.includes("/goals")
          ? "Goals"
          : location.pathname.includes("/coach")
            ? "Coach"
            : location.pathname.includes("/settings")
              ? "Settings"
              : location.pathname.includes("/reviews")
                ? "Your weekly review"
                : "Today";
  const nav = [
    { to: "/app/today", label: "Today", Icon: Sun },
    { to: "/app/goals", label: "Goals", Icon: Target },
    { to: "/app/calendar", label: "Calendar", Icon: CalendarDays },
    { to: "/app/coach", label: "Coach", Icon: MessageCircle },
  ];
  if (loading) return <div className="auth-page">Opening your workspace…</div>;
  if (!user) return <SignIn />;
  return (
    <div className="app-shell">
      <a className="skip-link" href="#app-main">
        Skip to content
      </a>
      <aside className="app-sidebar">
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
            <b>{label}</b>
          </div>
          <span className="sync-state" role="status">
            {saving ? "Saving…" : saveError ? "Sync needs attention" : ""}
          </span>
          <Link
            className="ask-adler-link"
            to={`/app/coach?goal=${encodeURIComponent(contextGoal)}`}
          >
            Ask Adler <MessageCircle size={16} />
          </Link>
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
function CoachSection() {
  return <><nav className="coaching-nav" aria-label="Coaching navigation">
    <NavLink to="/app/coach" end>Chat</NavLink>
    <NavLink to="/app/insights">Insights</NavLink>
    <NavLink to="/app/coach/about-you">About you</NavLink>
    <NavLink to="/app/coach/program">Preferences</NavLink>
    <NavLink to="/app/reviews/current">Review</NavLink>
  </nav><Outlet /></>;
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
          <Route element={<CoachSection />}>
            <Route path="insights" element={<Insights />} />
            <Route path="coach" element={<Coach />} />
            <Route path="coach/program" element={<Program />} />
            <Route path="coach/about-you" element={<Memory />} />
            <Route path="reviews/:reviewId" element={<WeeklyReview />} />
          </Route>
          <Route path="calendar" element={<Calendar />} />
          <Route path="settings" element={<SettingsPage />} />
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
