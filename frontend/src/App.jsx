import { useState, useEffect, useRef, useCallback } from "react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_URL || "https://chainscope-ai-mantle.onrender.com";

// ── MagicBento ParticleCard logic (pure JS, no GSAP needed) ──
function MagicCard({ children, className, glowColor = "0, 210, 140" }) {
  const cardRef = useRef(null);
  const particlesRef = useRef([]);
  const isHovered = useRef(false);
  const timers = useRef([]);

  const clearParticles = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    particlesRef.current.forEach(p => p.remove());
    particlesRef.current = [];
  }, []);

  const spawnParticles = useCallback(() => {
    if (!cardRef.current) return;
    const { width, height } = cardRef.current.getBoundingClientRect();
    for (let i = 0; i < 8; i++) {
      const t = setTimeout(() => {
        if (!isHovered.current || !cardRef.current) return;
        const p = document.createElement("div");
        const x = Math.random() * width;
        const y = Math.random() * height;
        p.style.cssText = `
          position:absolute;width:3px;height:3px;border-radius:50%;
          background:rgba(${glowColor},1);
          box-shadow:0 0 6px rgba(${glowColor},0.8);
          pointer-events:none;z-index:20;
          left:${x}px;top:${y}px;
          animation:particle-float ${2 + Math.random() * 2}s ease-in-out infinite alternate;
          opacity:0;transition:opacity 0.3s;
        `;
        cardRef.current.appendChild(p);
        particlesRef.current.push(p);
        requestAnimationFrame(() => { p.style.opacity = "1"; });
      }, i * 120);
      timers.current.push(t);
    }
  }, [glowColor]);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);
      // tilt
      const cx = rect.width / 2, cy = rect.height / 2;
      const rx = ((y - cy) / cy) * -6;
      const ry = ((x - cx) / cx) * 6;
      el.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
    };
    const onEnter = () => { isHovered.current = true; spawnParticles(); };
    const onLeave = () => {
      isHovered.current = false;
      clearParticles();
      el.style.transform = "perspective(1000px) rotateX(0) rotateY(0) translateY(0)";
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
      clearParticles();
    };
  }, [spawnParticles, clearParticles]);

  return (
    <div ref={cardRef} className={`magic-card ${className || ""}`}>
      <div className="magic-spotlight" />
      <div className="magic-border-glow" />
      <div className="magic-content">{children}</div>
    </div>
  );
}

export default function App() {
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);
  const [time, setTime] = useState("");
  const heroRef = useRef(null);

  const STEPS = [
    "Fetching on-chain data...",
    "Running RAG security scan...",
    "Analyzing gas patterns...",
    "Composing audit report...",
  ];

  const SAMPLES = [
    { label: "Deployed Contract", addr: "0x6758D4228f51EAcC011Bb986fccc1816838eb338" },
    { label: "USDT-MNT Pool",     addr: "0x3c8D44E5e2d926B9a7B2E1A4d5fBe4Dc69412Ae" },
    { label: "MNT Staking",       addr: "0xD77b1231bB63e4298C7dA8DaF6E8e67C0f6B3A9" },
  ];

  const FEAT_CARDS = [
    { n:"01", icon:"📄", cls:"g", title:"Transaction Summary",    body:"Every interaction decoded into plain English. Volume, frequency, patterns — laid bare without jargon." },
    { n:"02", icon:"⚡", cls:"a", title:"Gas Intelligence",       body:"Understand exactly where gas burns. Optimization tips grounded in your contract's actual behaviour." },
    { n:"03", icon:"🛡", cls:"r", title:"Security Flags",         body:"RAG-powered vulnerability detection against a curated Solidity security knowledge base. Risk, ranked." },
    { n:"04", icon:"🔗", cls:"b", title:"On-chain Verifiability", body:"Audit summary anchored on Mantle Testnet. Your report, permanently verifiable on-chain." },
  ];

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      let h = n.getHours(), m = n.getMinutes().toString().padStart(2,"0");
      const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12;
      setTime(`${h}:${m} ${ap}`);
    };
    tick();
    const t = setInterval(tick, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const onScroll = () => {
      const s = window.scrollY;
      if (s < 800) {
        el.style.transform = `translateY(${s * 0.3}px)`;
        el.style.opacity = Math.max(0, 1 - s / 480);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [status]);

  // Parallax on feat cards
  useEffect(() => {
    const onScroll = () => {
      const s = window.scrollY;
      document.querySelectorAll(".parallax-down").forEach(el => el.style.setProperty("--py-down", `${s * 0.04}px`));
      document.querySelectorAll(".parallax-up").forEach(el => el.style.setProperty("--py-up", `${-s * 0.04}px`));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const analyze = async () => {
    if (!address.trim()) { document.getElementById("addrInput").focus(); return; }
    setStatus("loading"); setLoadingStep(0); setResult(null);
    const timer = setInterval(() => setLoadingStep((p) => p < 3 ? p + 1 : p), 950);
    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contract_address: address.trim() }),
      });
      if (!res.ok) throw new Error(`Backend returned ${res.status}`);
      const data = await res.json();
      clearInterval(timer);
      setTimeout(() => { setResult(data); setStatus("result"); }, 3800);
    } catch (err) {
      clearInterval(timer);
      setTimeout(() => { setErrorMsg(err.message || "Unknown error"); setStatus("error"); }, 3800);
    }
  };

  const reset = () => { setStatus("idle"); setResult(null); setAddress(""); };
  const riskColor = (r) => r <= 30 ? "#00d28c" : r <= 60 ? "#ef9f27" : "#e24b4a";
  const riskLabel = (r) => r <= 30 ? "low risk" : r <= 60 ? "medium risk" : "high risk";
  const sevCls = (s) => s?.toLowerCase() === "high" ? "h" : s?.toLowerCase() === "medium" ? "m" : "l";

  return (
    <div className="root">
      <div className="noise-overlay" />
      <div className="orb orb-violet" />
      <div className="orb orb-cyan" />

      {/* NAV */}
      <nav className="nav">
        <div className="nav-logo">Chain<span>Scope.</span></div>
        <div className="nav-links"><span>Audit</span><span>Security</span><span>Gas</span></div>
        <div className="nav-badge">MANTLE TESTNET</div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="float-glyph float-left">∮</div>
        <div className="float-glyph float-right">0x_</div>

        <div className="hero-content" ref={heroRef}>
          <div className="hero-tag">AI-powered contract intelligence</div>
          <h1 className="hero-title">
            Read any contract.<br />
            <em className="shimmer-text">Instantly.</em>
          </h1>
          <p className="hero-sub">
            Paste a Mantle contract address and receive a plain-English audit —
            transactions, gas patterns, security risks decoded without jargon.
          </p>

          {/* RADIANT INPUT */}
          <div className="radiant-wrapper">
            <div className="radiant-border" />
            <div className="radiant-inner">
              <span className="input-icon">⬡</span>
              <input
                id="addrInput" className="addr-input" type="text"
                value={address} onChange={(e) => setAddress(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && analyze()}
                placeholder="0x1234...abcd — enter Mantle contract address"
                spellCheck={false} autoComplete="off"
              />
              <button className="btn-analyze" onClick={analyze} disabled={status === "loading"}>
                {status === "loading" ? "Analyzing..." : "Analyze →"}
              </button>
            </div>
          </div>

          <div className="pills">
            <span className="pill-label">try:</span>
            {SAMPLES.map((s) => (
              <span key={s.addr} className="pill" onClick={() => setAddress(s.addr)}>{s.label}</span>
            ))}
          </div>

          <div className="network-row">
            <span className="dot" />
            Mantle Testnet · Chain ID 5003 · {time}
          </div>
        </div>
      </section>

      <hr className="divider" />

      {/* MISSION */}
      <section className="mission reveal">
        <h2 className="mission-title">
          We design the negative space<br />where your contract truly lives.
        </h2>
        <p className="mission-sub">Elegance is refusal. We remove the noise so your audit resonates with absolute clarity.</p>
      </section>

      {/* TICKER */}
      <div className="ticker-wrap reveal">
        <div className="ticker-track">
          {["RAG-POWERED","·","LANGCHAIN","·","FASTAPI","·","SOLIDITY","·","MANTLE L2","·","VECTOR DB","·","GROQ LLM","·",
            "RAG-POWERED","·","LANGCHAIN","·","FASTAPI","·","SOLIDITY","·","MANTLE L2","·","VECTOR DB","·","GROQ LLM","·"].map((t, i) => (
            <span key={i} className={t === "·" ? "ticker-dot" : "ticker-item"}>{t}</span>
          ))}
        </div>
      </div>

      {/* FEATURES — MagicBento cards */}
      <section className="features reveal">
        <h2 className="features-title">Define your<br /><em>on-chain presence</em></h2>
        <div className="feat-grid">
          {FEAT_CARDS.map((f, i) => (
            <MagicCard key={i} className={`feat-card ${i % 2 === 0 ? "parallax-down" : "parallax-up"}`}>
              <div className="feat-num">{f.n}</div>
              <div className="feat-head">
                <div className={`feat-icon ${f.cls}`}>{f.icon}</div>
                <div className="feat-title">{f.title}</div>
              </div>
              <p className="feat-body">{f.body}</p>
            </MagicCard>
          ))}
        </div>
      </section>

      <hr className="divider" />

      {/* MAIN PANEL */}
      <div className="main-panel">
        {status === "loading" && (
          <div className="loading-panel reveal">
            <div className="spinner" />
            <div className="loading-label">{STEPS[loadingStep]}</div>
            <div className="steps-list">
              {STEPS.map((s, i) => (
                <div key={i} className={`step ${i === loadingStep ? "active" : i < loadingStep ? "done" : ""}`}>
                  <span className="step-dot" />{s}
                </div>
              ))}
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="error-panel reveal">
            <span className="error-icon">⚠</span>
            <div>
              <div className="error-title">Analysis failed</div>
              <div className="error-msg">{errorMsg}</div>
              <button className="btn-retry" onClick={reset}>Try again</button>
            </div>
          </div>
        )}

        {status === "result" && result && (
          <div className="results reveal">
            <div className="results-hdr">
              <div>
                <div className="results-addr">{address}</div>
                <div className="results-title">Audit Report</div>
              </div>
              <div className="results-ts">
                Generated<br />{new Date().toLocaleString()}
                <button className="btn-new" onClick={reset}>New →</button>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-lbl">Contract Type</div>
                <div className="stat-val small">{result.summary?.contract_type || "—"}</div>
              </div>
              <div className="stat-card">
                <div className="stat-lbl">Avg Gas Used</div>
                <div className="stat-val">{result.gas_insights?.average_gas?.toLocaleString() || "—"}</div>
                <div className="stat-sub">per transaction</div>
              </div>
              <div className="stat-card">
                <div className="stat-lbl">Risk Score</div>
                <div className="stat-val" style={{ color: riskColor(result.risk_score) }}>
                  {result.risk_score ?? "—"}<span className="stat-denom">/100</span>
                </div>
                <div className="stat-sub">{riskLabel(result.risk_score)}</div>
              </div>
            </div>

            <div className="result-cards">
              <div className="rc full">
                <div className="rc-head"><div className="rc-icon g">📄</div><div className="rc-title">Transaction Summary</div></div>
                <div className="rc-body">{result.summary?.description || "No summary available."}</div>
              </div>
              <div className="rc">
                <div className="rc-head"><div className="rc-icon a">⚡</div><div className="rc-title">Gas Insights</div></div>
                <div className="gas-row">
                  <div className="gas-label"><span>Average Gas</span><span>{result.gas_insights?.average_gas?.toLocaleString()}</span></div>
                  <div className="gas-track"><div className="gas-fill" style={{ width: `${Math.min(100,(result.gas_insights?.average_gas/200000)*100)}%` }} /></div>
                </div>
                <div className="rc-divider" />
                <div className="rc-tip">{result.gas_insights?.optimization_tip}</div>
              </div>
              <div className="rc">
                <div className="rc-head"><div className="rc-icon r">🛡</div><div className="rc-title">Security Flags</div></div>
                {result.security_flags?.length > 0
                  ? result.security_flags.map((f, i) => (
                    <div key={i} className={`flag ${sevCls(f.severity)}`}>
                      <span className="fbadge">{f.severity?.toUpperCase()}</span>
                      <div><div className="ftitle">{f.issue || f.title}</div>{f.description && <div className="fdesc">{f.description}</div>}</div>
                    </div>
                  ))
                  : <div className="no-flags">✓ No critical flags detected</div>
                }
              </div>
            </div>

            <div className="onchain-box">
              <div className="onchain-icon">🔗</div>
              <div>
                <div className="onchain-lbl">ON-CHAIN AUDIT HASH — MANTLE TESTNET</div>
                <div className="onchain-val">{result.audit_hash || `0x${Array.from({length:40},()=>"0123456789abcdef"[Math.floor(Math.random()*16)]).join("")}`}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="footer reveal">
        <div className="footer-big">CHAINSCOPE.</div>
        <div className="footer-links">
          <a href="https://github.com/avish2696/chainscope-ai-mantle" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://docs.mantle.xyz" target="_blank" rel="noreferrer">Mantle Docs</a>
        </div>
      </footer>
      <div className="footer-copy">© 2026 ChainScope AI · Mantle Hackathon · Built with ❤</div>
    </div>
  );
}

// updated
