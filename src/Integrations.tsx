import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Asterisk,
  MessageSquare,
  Webhook,
  Pause,
  Play,
  Search,
} from "lucide-react";
import { Logo, Footer, Modal } from "./components";
import {
  integrations,
  integrationCategories,
  type Integration,
} from "./integration-catalog";

export function IntegrationLogo({ item }: { item: Integration }) {
  return (
    <span className="integration-logo">
      {item.icon === "sms" ? (
        <MessageSquare size={28} />
      ) : item.icon === "webhook" ? (
        <Webhook size={28} />
      ) : (
        <img src={`/brands/${item.icon}`} alt="" width={32} height={32} />
      )}
    </span>
  );
}
export function IntegrationMap({
  onSelect,
}: {
  onSelect: (item: Integration) => void;
}) {
  const [paused, setPaused] = useState(false);
  const nodes = [
    ["chatgpt", 16, 20],
    ["claude", 39, 8],
    ["gemini", 65, 10],
    ["strava", 86, 26],
    ["apple-health", 92, 52],
    ["imessage", 81, 80],
    ["google-calendar", 57, 91],
    ["apple-calendar", 31, 87],
    ["notion", 11, 72],
    ["todoist", 6, 44],
  ] as const;
  return (
    <div
      className={`integration-map ${paused ? "paused" : ""}`}
      aria-label="Adler integration map"
    >
      <svg viewBox="0 0 800 440" preserveAspectRatio="none" aria-hidden="true">
        <ellipse
          cx="400"
          cy="220"
          rx="280"
          ry="158"
          className="integration-orbit"
        />
        {nodes.map(([id, x, y], i) => (
          <path
            key={id}
            className={`integration-connection ${integrations.find((item) => item.id === id)!.status === "Planned" ? "planned" : "available"}`}
            style={{ animationDelay: `${i * -0.45}s` }}
            d={`M400 220 Q${x < 50 ? 260 : 540} 220 ${x * 8} ${y * 4.4}`}
          />
        ))}
      </svg>
      <div className="integration-center">
        <Asterisk size={37} strokeWidth={1.5} />
        <b>Adler</b>
        <span>Your goals. One plan.</span>
      </div>
      {nodes.map(([id, x, y]) => {
        const item = integrations.find((item) => item.id === id)!;
        return (
          <button
            className="integration-node"
            key={id}
            style={{ left: `${x}%`, top: `${y}%` }}
            onClick={() => onSelect(item)}
            aria-label={`${item.name}: ${item.status}`}
          >
            <IntegrationLogo item={item} />
            <span>{item.name}</span>
          </button>
        );
      })}
      <button
        className="integration-motion"
        onClick={() => setPaused(!paused)}
        aria-label={
          paused ? "Play integration animation" : "Pause integration animation"
        }
      >
        {paused ? <Play size={13} /> : <Pause size={13} />}
      </button>
    </div>
  );
}
function IntegrationDetail({
  item,
  onClose,
}: {
  item: Integration;
  onClose: () => void;
}) {
  return (
    <Modal title={item.name} onClose={onClose}>
      <div className="integration-detail-title">
        <IntegrationLogo item={item} />
        <span
          className={`integration-status ${item.status === "Planned" ? "planned" : ""}`}
        >
          {item.status}
        </span>
      </div>
      <p className="integration-detail-copy">{item.detail}</p>
      {item.route ? (
        <Link className="button primary" to={item.route}>
          Open setup <ArrowRight size={15} />
        </Link>
      ) : (
        <p className="integration-planned-note">
          This connection is on the roadmap. It does not access or sync your
          account yet.
        </p>
      )}
    </Modal>
  );
}
export function IntegrationShowcase() {
  const [selected, setSelected] = useState<Integration | null>(null);
  return (
    <section className="landing-integrations">
      <div className="landing-integrations-copy">
        <span className="section-kicker">YOUR GOALS, WHERE LIFE HAPPENS</span>
        <h2>
          Bring your everyday tools
          <br />
          into the plan.
        </h2>
        <p>
          Your calendar, conversations, workouts, and notes all hold part of the
          picture. See the connections available today and the ones we’re
          planning next.
        </p>
        <Link className="text-link" to="/integrations">
          Explore integrations <ArrowRight size={16} />
        </Link>
      </div>
      <div>
        <IntegrationMap onSelect={setSelected} />
        <p className="integration-map-legend">
          <span>Solid: setup available</span>
          <span>Dashed: planned</span>
        </p>
      </div>
      {selected && (
        <IntegrationDetail item={selected} onClose={() => setSelected(null)} />
      )}
    </section>
  );
}
export function Integrations({ inApp = false }: { inApp?: boolean }) {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Integration | null>(null);
  const visible = integrations.filter(
    (item) =>
      (category === "All" || item.category === category) &&
      `${item.name} ${item.description}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const content = (
    <>
      <div className="integrations-heading">
        <span className="section-kicker">INTEGRATIONS</span>
        <h1>
          Your tools, connected
          <br />
          to your goals.
        </h1>
        <p>
          Connect the tools you use to plan, learn, move, and check in. One
          place to understand your progress and decide what comes next.
        </p>
        <span className="integration-roadmap-note">
          Explore available setup options and planned connections.
        </span>
      </div>
      <IntegrationMap onSelect={setSelected} />
      <p className="integration-map-legend">
        <span>Solid: setup available</span>
        <span>Dashed: planned</span>
      </p>
      <section className="integration-catalog" aria-label="Integration catalog">
        <div className="integration-catalog-heading">
          <div>
            <h2>Find your tools</h2>
            <p>
              Choose a connection to see what it does and whether it’s ready.
            </p>
          </div>
          <label className="integration-search">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search integrations"
              aria-label="Search integrations"
            />
          </label>
        </div>
        <div
          className="integration-filters"
          role="group"
          aria-label="Filter integrations"
        >
          {integrationCategories.map((value) => (
            <button
              key={value}
              aria-pressed={category === value}
              onClick={() => setCategory(value)}
            >
              {value}
            </button>
          ))}
        </div>
        <div className="integration-cards">
          {visible.map((item) => (
            <button
              key={item.id}
              className="integration-card"
              onClick={() => setSelected(item)}
            >
              <div>
                <IntegrationLogo item={item} />
                <span
                  className={`integration-status ${item.status === "Planned" ? "planned" : ""}`}
                >
                  {item.status}
                </span>
              </div>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <span className="integration-card-link">
                {item.status === "Planned"
                  ? "See what’s planned"
                  : "View setup"}
                <ArrowUpRight size={14} />
              </span>
            </button>
          ))}
        </div>
        {!visible.length && (
          <p className="integration-no-results">
            No matching connections. Try another name or category.
          </p>
        )}
      </section>
      {selected && (
        <IntegrationDetail item={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
  return inApp ? (
    <div className="integrations-page in-app">{content}</div>
  ) : (
    <div className="integrations-public">
      <header className="site-header">
        <Logo />
        <nav aria-label="Main navigation">
          <Link to="/#how-it-works">How it works</Link>
          <Link to="/method">The method</Link>
          <Link to="/sign-in">Log in</Link>
        </nav>
        <Link className="button primary" to="/app/today">
          Open Adler <ArrowUpRight size={16} />
        </Link>
      </header>
      <main className="integrations-page">{content}</main>
      <Footer />
    </div>
  );
}
