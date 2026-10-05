import { useState } from "react";
import "./App.css";
import "./utils/eval"; // IMPORTANT: side-effect import only

const DEMO_MODE = typeof window !== "undefined" && (
  window.location.hostname.endsWith(".workers.dev") ||
  window.location.hostname.endsWith(".pages.dev")
);
const DEMO_ADDRESS = "0x71C4...9A2F";

function App() {
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("0");
  const [eligible, setEligible] = useState(false);
  const [allowance, setAllowance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activity, setActivity] = useState(() => {
    if (!DEMO_MODE) return [];
    try { return JSON.parse(localStorage.getItem("faucet-demo-activity") || "[]"); } catch { return []; }
  });

  const refresh = async (addr) => {
    const bal = await window.__EVAL__.getBalance(addr);
    const can = await window.__EVAL__.canClaim(addr);
    const rem = await window.__EVAL__.getRemainingAllowance(addr);

    setBalance(bal);
    setEligible(can);
    setAllowance(rem);
  };

  const handleConnect = async () => {
    if (DEMO_MODE) {
      const claimed = localStorage.getItem("faucet-demo-claimed") === "true";
      setAddress(DEMO_ADDRESS);
      setBalance(claimed ? "1,000 TST" : "0 TST");
      setAllowance(claimed ? "0 TST" : "1,000 TST");
      setEligible(!claimed);
      return;
    }

    const addr = await window.__EVAL__.connectWallet();
    setAddress(addr);
    await refresh(addr);
  };

  const handleClaim = async () => {
    if (DEMO_MODE) {
      setLoading(true);
      window.setTimeout(() => {
        localStorage.setItem("faucet-demo-claimed", "true");
        setBalance("1,000 TST");
        setAllowance("0 TST");
        setEligible(false);
        const entry = { id: Date.now(), amount: "1,000 TST", date: new Date().toISOString(), status: "Completed" };
        const nextActivity = [entry, ...activity].slice(0, 5);
        setActivity(nextActivity);
        localStorage.setItem("faucet-demo-activity", JSON.stringify(nextActivity));
        setLoading(false);
      }, 650);
      return;
    }

    try {
      setLoading(true);
      await window.__EVAL__.requestTokens();
      await refresh(address);
      alert("✅ Tokens claimed successfully!");
    } catch (e) {
      alert(e.message || "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="faucet-app">
      <header className="sitebar">
        <a className="brand" href="#top" aria-label="Token faucet home">
          <span className="brand-mark">F</span>
          <span><strong>FIELDNOTE</strong><small>TESTNET FAUCET</small></span>
        </a>
        <div className="sitebar-meta">
          <span className="network-pill"><i /> Sepolia Testnet</span>
          {address ? (
            <button className="wallet-button connected" onClick={copyAddress} title="Copy wallet address">
              <span className="wallet-dot" />{copied ? "Copied" : `${address.slice(0, 8)}…${address.slice(-4)}`}
            </button>
          ) : (
            <button className="wallet-button" onClick={handleConnect}>Connect wallet <span>↗</span></button>
          )}
        </div>
      </header>

      <main id="top" className="workspace">
        <section className="intro-row">
          <div>
            <p className="eyebrow">Developer tools / Token distribution</p>
            <h1>Test your flow.<br /><span>Keep your funds.</span></h1>
            <p className="intro-copy">Claim test ERC-20 tokens to exercise contracts, checkout flows, and integrations on Sepolia.</p>
          </div>
          <div className="network-card">
            <span className="network-card-label">Network status</span>
            <div className="network-state"><i />{DEMO_MODE ? "Preview environment" : "Sepolia connected"}</div>
            <span className="network-card-foot">ERC-20 · Test assets only</span>
          </div>
        </section>

        {DEMO_MODE && <div className="demo-notice" role="status"><strong>Interactive demo</strong><span>Wallet and faucet actions are simulated in this browser. No blockchain transaction will be sent.</span></div>}

        <section className="metrics-row" aria-label="Faucet metrics">
          <div className="metric"><span>Wallet balance</span><strong>{address ? balance : "Connect wallet"}</strong><small>TEST token balance</small></div>
          <div className="metric"><span>Claim allowance</span><strong>{address ? allowance : "1,000 TST"}</strong><small>Per wallet / cooldown period</small></div>
          <div className="metric"><span>Eligibility</span><strong className={eligible ? "metric-good" : address ? "metric-muted" : "metric-good"}>{address ? eligible ? "Ready to claim" : "Claimed" : "Wallet required"}</strong><small>One claim per wallet</small></div>
          <div className="metric"><span>Claim amount</span><strong>1,000 TST</strong><small>Sepolia test token</small></div>
        </section>

        <div className="content-grid">
          <section className="claim-panel">
            <div className="claim-head">
              <div className="token-symbol">T</div>
              <div><p className="eyebrow">Token faucet</p><h2>Get test tokens</h2></div>
              <span className="claim-step">01 / 02</span>
            </div>
            <p className="claim-copy">Connect a wallet on Sepolia to receive test tokens. They have no monetary value and can only be used on the test network.</p>

            {address ? (
              <div className="connected-address"><span>Connected wallet</span><strong>{address}</strong></div>
            ) : (
              <div className="connect-prompt"><span className="connect-icon">↗</span><div><strong>Connect your wallet</strong><span>MetaMask · Sepolia</span></div></div>
            )}

            <button className="claim-button" disabled={address ? !eligible || loading : false} onClick={address ? handleClaim : handleConnect}>
              {loading ? "Claiming test tokens…" : address ? eligible ? "Claim 1,000 TST" : "Claim already used" : "Connect wallet to continue"}
              {!loading && <span>→</span>}
            </button>
            <p className="claim-footnote">No mainnet assets. No payment required.</p>
          </section>

          <aside className="side-panel">
            <section className="checklist-panel">
              <div className="section-heading"><div><p className="eyebrow">Before you claim</p><h2>Eligibility checks</h2></div><span className="check-count">{address ? eligible ? "3/3" : "2/3" : "1/3"}</span></div>
              <div className="check-row"><span className={address ? "check-icon done" : "check-icon"}>{address ? "✓" : "1"}</span><div><strong>Wallet connected</strong><small>{address ? "Address detected" : "Connect a supported wallet"}</small></div></div>
              <div className="check-row"><span className="check-icon done">✓</span><div><strong>Sepolia network</strong><small>Switch network if prompted</small></div></div>
              <div className="check-row"><span className={address && !eligible ? "check-icon done" : "check-icon"}>{address && !eligible ? "✓" : "3"}</span><div><strong>Claim window</strong><small>{address && !eligible ? "Already claimed" : "One claim per wallet"}</small></div></div>
            </section>
            <section className="activity-panel">
              <div className="section-heading"><div><p className="eyebrow">Wallet history</p><h2>Recent claims</h2></div><span className="activity-count">{activity.length}</span></div>
              {activity.length ? activity.map((item) => <div className="activity-row" key={item.id}><span className="activity-check">✓</span><div><strong>{item.amount}</strong><small>{new Date(item.date).toLocaleString()}</small></div><span className="activity-status">{item.status}</span></div>) : <p className="empty-activity">Your recent faucet claims will appear here.</p>}
            </section>
          </aside>
        </div>
        <footer className="page-footer"><span>FIELDNOTE · ERC-20 TEST FAUCET</span><span>{DEMO_MODE ? "Preview data · browser-local only" : "Sepolia test network"}</span></footer>
      </main>
    </div>
  );
}

export default App;
