import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  GitBranch,
  GitPullRequest,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/Reveal";
import { useCountUp } from "@/hooks/useCountUp";

const HEALTH_SIGNALS = [
  { label: "Delivery", value: 82 },
  { label: "PR Flow", value: 74 },
  { label: "Issue Flow", value: 88 },
  { label: "Reviews", value: 61 },
];

const WORKFLOW_STEPS = [
  {
    icon: GitBranch,
    title: "Connect & normalize",
    description: "GitHub repositories, PRs, issues, and reviews sync into one validated data model.",
  },
  {
    icon: AlertTriangle,
    title: "Analyze & detect",
    description: "Real engineering metrics surface bottlenecks before they slow delivery.",
  },
  {
    icon: Sparkles,
    title: "Explain, grounded",
    description: "AI narrates verified metrics only. It never invents a number.",
  },
];

function HealthBar({ label, value, delay }: { label: string; value: number; delay: number }) {
  const animated = useCountUp(value, { duration: 1000, delay: 450 + delay });
  return (
    <div className="hvc-bar" style={{ "--h": `${value}%`, "--d": `${delay}ms` } as CSSProperties}>
      <span className="hvc-bar-value">{animated}</span>
      <span className="hvc-bar-label">{label}</span>
    </div>
  );
}

export function Home() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <Link to="/" className="landing-brand">
          <span className="brand-mark"><GitBranch size={17} strokeWidth={2.5} /></span>
          ForgeIQ
        </Link>
        <Link to="/login">
          <Button className="hero-cta" size="sm">
            Sign in <ArrowRight size={15} />
          </Button>
        </Link>
      </header>

      <main>
        <section className="hero">
          <div className="hero-blob hero-blob-blue" aria-hidden="true" />
          <div className="hero-blob hero-blob-violet" aria-hidden="true" />

          <div className="hero-copy">
            <span className="eyebrow-pill">Engineering intelligence platform</span>
            <h1>
              Turn fragmented engineering activity into <em>one trusted signal.</em>
            </h1>
            <p>
              ForgeIQ connects GitHub activity, normalizes it, and turns verified metrics into
              grounded AI insight &mdash; so teams see real delivery health, not guesses.
            </p>
            <div className="hero-actions">
              <Link to="/login">
                <Button size="lg" className="hero-cta">
                  Sign in to ForgeIQ <ArrowRight size={17} />
                </Button>
              </Link>
            </div>
            <div className="hero-trust">
              <strong>Multi-tenant</strong>
              <span aria-hidden="true">&middot;</span>
              <strong>Role-based access</strong>
              <span aria-hidden="true">&middot;</span>
              <strong>Grounded, not hallucinated</strong>
            </div>
          </div>

          <div className="hero-visual" role="img" aria-label="Project health dashboard preview">
            <div className="hvc">
              <div className="hvc-head">
                <span>Project Health</span>
                <span className="hvc-live"><span className="hvc-dot" />Live</span>
              </div>
              <div className="hvc-bars">
                {HEALTH_SIGNALS.map((signal, index) => (
                  <HealthBar key={signal.label} label={signal.label} value={signal.value} delay={index * 110} />
                ))}
              </div>
            </div>
            <div className="hvc-note">
              <GitPullRequest size={15} />
              7 PRs waiting for review 48h+
            </div>
          </div>
        </section>

        <section className="section section-workflow" id="workflow">
          <Reveal className="section-head">
            <span className="eyebrow">How it works</span>
            <h2>From raw activity to a decision you can trust</h2>
          </Reveal>
          <div className="workflow-row">
            <Reveal className="workflow-line" delay={0}>
              <span className="workflow-line-fill" />
            </Reveal>
            {WORKFLOW_STEPS.map((step, index) => (
              <Reveal key={step.title} delay={index * 140} className="workflow-step">
                <div className="workflow-icon">
                  <step.icon size={22} />
                </div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="section">
          <div className="section-split">
            <Reveal direction="left" className="split-copy">
              <span className="eyebrow">Live workspace</span>
              <h2>See delivery health the moment you connect.</h2>
              <p>
                Every number on the dashboard traces back to a synchronized commit, pull request,
                or issue &mdash; no mock data, no guessed metrics.
              </p>
              <ul className="split-points">
                <li>Organization-wide project health</li>
                <li>Bottleneck alerts with supporting evidence</li>
                <li>Historical engineering trends</li>
              </ul>
            </Reveal>
            <Reveal direction="right" delay={120} className="preview-panel">
              <div className="preview-panel-head">
                <span>Project Health</span>
                <span className="hvc-live"><span className="hvc-dot" />Live</span>
              </div>
              <div className="hvc-bars">
                {HEALTH_SIGNALS.map((signal, index) => (
                  <HealthBar key={signal.label} label={signal.label} value={signal.value} delay={index * 110} />
                ))}
              </div>
              <ul className="preview-signals">
                <li><AlertTriangle size={16} /> 7 PRs waiting for review 48h+</li>
                <li><GitPullRequest size={16} /> 24 PRs merged this week</li>
              </ul>
            </Reveal>
          </div>
        </section>

        <section className="section">
          <div className="section-split section-split-reverse">
            <Reveal direction="right" className="ai-panel">
              <div className="ai-panel-question">&ldquo;Why is Project Alpha at risk?&rdquo;</div>
              <div className="ai-panel-answer">
                Review turnaround increased compared with last week. 7 pull requests have been
                waiting more than 48 hours, concentrated in the payments service.
              </div>
              <div className="ai-panel-evidence">
                <span>PR #482</span>
                <span>PR #479</span>
                <span>Issue #201</span>
              </div>
            </Reveal>
            <Reveal direction="left" delay={120} className="split-copy">
              <span className="eyebrow">Grounded AI</span>
              <h2>Ask a question. Get an answer with receipts.</h2>
              <p>
                The language model narrates what already happened in your data. It cannot invent a
                metric or reach outside your organization&rsquo;s authorized scope.
              </p>
              <ul className="split-points">
                <li>Distinguishes measured facts from inference</li>
                <li>Shows the evidence behind every claim</li>
                <li>Never ranks or scores individual developers</li>
              </ul>
            </Reveal>
          </div>
        </section>

        <section className="section section-compact">
          <Reveal className="section-head">
            <span className="eyebrow">Built right</span>
            <h2>Production-minded from the first commit</h2>
          </Reveal>
          <div className="feature-grid feature-grid-compact">
            <Reveal delay={0} className="feature-card">
              <div className="feature-icon"><Building2 size={19} /></div>
              <h3>Organization isolation</h3>
              <p>Every resource is scoped to an organization. Cross-tenant access is rejected by design.</p>
            </Reveal>
            <Reveal delay={90} className="feature-card">
              <div className="feature-icon"><ShieldCheck size={19} /></div>
              <h3>Role-based access</h3>
              <p>Admin, Manager, Developer, and Viewer roles enforced server-side on every request.</p>
            </Reveal>
            <Reveal delay={180} className="feature-card">
              <div className="feature-icon"><Sparkles size={19} /></div>
              <h3>Grounded, not guessed</h3>
              <p>Analytics and AI insight are both calculated from persisted, validated data.</p>
            </Reveal>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-brand">
          <span className="brand-mark"><GitBranch size={16} strokeWidth={2.5} /></span>
          ForgeIQ
        </div>
        <p>Engineering intelligence, grounded in real data.</p>
        <Link to="/login" className="landing-footer-cta">
          Sign in to ForgeIQ <ArrowRight size={14} />
        </Link>
        <p className="landing-footer-copyright">&copy; {new Date().getFullYear()} ForgeIQ</p>
      </footer>
    </div>
  );
}
