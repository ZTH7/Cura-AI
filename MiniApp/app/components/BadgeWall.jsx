"use client"; // ⚠️ 客户端组件
import React, { useEffect, useMemo, useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import { CONTRACT_ADDRESS, ABI, NFT_ABI } from "../config/contract";
const moods = [
  {index: 0, day: "Mon.", mood: "😊" },
  {index: 1, day: "Tue.", mood: "❓" },
  {index: 2, day: "Wed.", mood: "❓" },
  {index: 3, day: "Thur.", mood:  "❓"},
  {index: 4, day: "Fri.", mood: "❓" },
  {index: 5, day: "Sat.", mood: "❓" },
  {index: 6, day: "Sun.", mood: "❓" },
];

function ipfsToHttp(url) {
  if (!url) return "";
  if (url.startsWith("ipfs://")) {
    const path = url.replace("ipfs://", "");
    return `https://ipfs.io/ipfs/${path}`;
  }
  return url;
}

export default function BadgeWall() {
  const [account, setAccount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedMoods, setSelectedMoods] = useState({});
  const [showMoodSelector, setShowMoodSelector] = useState(null);
  const [badges, setBadges] = useState([
  { id: 1, name: "First login", icon: "🏅", earned: true },
  { id: 2, name: "Assessment completed", icon: "🧠", earned: true },
  { id: 3, name: "7 days checkin", icon: "📅", earned: false },
  { id: 4, name: "30 days checkin", icon: "🔥", earned: false },
  { id: 5, name: "Share reflections", icon: "💬", earned: true },
  { id: 6, name: "Invite friends", icon: "🤝", earned: false }
]);

  const enabled = useMemo(
    () =>
      CONTRACT_ADDRESS &&
      Array.isArray(ABI) &&
      ABI.length > 0,
    []
  );

  // ✅ 客户端读取 localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const last = localStorage.getItem("lastAccount");
      if (last) setAccount(last);
    }
  }, []);

  useEffect(() => {
    if (!enabled || !account) return;

    let cancelled = false;

    async function loadNFTs() {
      setLoading(true);
      setError("");
      try {
        if (typeof window === "undefined" || !window.ethereum) {
          setError("Wallet not connected, please connect wallet first.");
          return;
        }

        const provider = new BrowserProvider(window.ethereum);
        try {
          await window.ethereum.request({ method: "eth_requestAccounts" });
        } catch {}

        const contract = new Contract(CONTRACT_ADDRESS, NFT_ABI, provider);
        const bal = await contract.balanceOf(account);
        const count = Number(bal);
        const items = [];

        for (let i = 0; i < count; i++) {
          const tokenId = await contract.tokenOfOwnerByIndex(account, i);
          const uri = await contract.tokenURI(tokenId);
          const httpUri = ipfsToHttp(uri);
          let meta = null;

          try {
            const res = await fetch(httpUri, { mode: "cors" });
            meta = await res.json();
          } catch {}

          items.push({
            tokenId: Number(tokenId),
            name: meta?.name || `Badge #${Number(tokenId)}`,
            image: ipfsToHttp(meta?.image || ""),
          });
        }

        if (!cancelled) setBadges(items);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError(e?.message || "Failed to load NFTs");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    // loadNFTs();
    return () => {
      cancelled = true;
    };
  }, [account, enabled]);

  if (!account) {
    return (
      <div className="notice">
        Please connect wallet first.
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ padding:"0 1rem"}}>My Badge Wall</h3>
        {loading && <p>Reading your NFT badges…</p>}
        {error && (
          <div className="notice" style={{ marginBottom: 12 }}>
            {error}
          </div>
        )}
        {!loading && badges.length === 0 && (
          <p className="small">
            You haven&apos;t earned any badges yet. Complete activities or tasks to unlock exclusive badges.
          </p>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            marginTop: 12,
            justifyItems: "center",
            padding: "0 20px",
          }}
        >
          {badges.map((b) => (
            <div
              key={b.tokenId}
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "2rem",
                borderRadius: "1rem",
                background: "#fff",
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                cursor: "pointer",
                transition: "transform 0.2s",
                width:"100px",
                heigtht:"100px",
                border:"2px solid #faaf98ff",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              {b.image ? (
                <img
                  src={b.image}
                  alt={b.name}
                  style={{
                    width: "80px",
                    height: 80,
                    objectFit: "cover",
                    borderRadius: 12,
                    border: "1px solid #ffe5dc",
                  }}
                />
              ) : (
                <span style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{b.icon}</span>
              )}
              <span style={{ textAlign: "center", fontSize: "0.9rem", marginTop: 8 }}>
                {b.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 style={{ padding:"0 1rem"}}>My Mood Record</h3>
        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            marginTop: 12,
            justifyItems: "center",
            padding: "0 20px",
          }}
        >
          {moods.map((item, index) => (
            <div key={index} style={{ position: 'relative' }}>
              <div
                onClick={() => {
                  if (item.mood === "❓" && index <= 1) {
                    setShowMoodSelector(showMoodSelector === index ? null : index);
                  }
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  background: index > 1 ? "#f5f5f5" : "#fff",
                  padding: "1rem",
                  borderRadius: "1rem",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                  width: "70px",
                  cursor: (item.mood === "❓" && index <= 1) ? "pointer" : "not-allowed",
                  border: showMoodSelector === index ? "2px solid var(--accent)" : "none",
                  opacity: index > 1 ? 0.6 : 1
                }}
              >
                <span style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                  {selectedMoods[index] || item.mood}
                </span>
                <span style={{ fontSize: "0.9rem", color: "#555" }}>{item.day}</span>
              </div>
              
              {showMoodSelector === index && (
                <div style={{
                  position: 'absolute',
                  top: '80px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'white',
                  border: '2px solid #ffe5dc',
                  borderRadius: '12px',
                  padding: '8px',
                  boxShadow: 'var(--shadow)',
                  zIndex: 1000,
                  display: 'flex',
                  gap: '8px'
                }}>
                  {['😊', '😐', '😢', "😡","🥰"].map((emoji, emojiIndex) => (
                    <button
                      key={emojiIndex}
                      onClick={() => {
                        setSelectedMoods(prev => ({
                          ...prev,
                          [index]: emoji
                        }));
                        setShowMoodSelector(null);
                      }}
                      style={{
                        background: 'none',
                        border: '1px solid #ddd',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
