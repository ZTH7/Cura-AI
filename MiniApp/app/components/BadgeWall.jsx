"use client"; // ⚠️ 客户端组件
import React, { useEffect, useMemo, useState } from "react";
import { BrowserProvider, Contract } from "ethers";
import { NFT_CONTRACT_ADDRESS, NFT_ABI } from "../config/nft";

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";

const moods = [
  { day: "Mon.", mood: "😊" },
  { day: "Tue.", mood: "😐" },
  { day: "Wed.", mood: "😢" },
  { day: "Thur.", mood: "😄" },
  { day: "Fri.", mood: "😎" },
  { day: "Sat.", mood: "🥳" },
  { day: "Sun.", mood: "😴" },
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
  const [badges, setBadges] = useState([
  { id: 1, name: "First login", icon: "🏅", earned: true },
  { id: 2, name: "Complete the assessment", icon: "🧠", earned: true },
  { id: 3, name: "Maintain daily records for 7 days ", icon: "📅", earned: false },
  { id: 4, name: "Check in daily for 30 days", icon: "🔥", earned: false },
  { id: 5, name: "Share reflections", icon: "💬", earned: true },
  { id: 6, name: "Invite friends", icon: "🤝", earned: false }
]);

  const enabled = useMemo(
    () =>
      NFT_CONTRACT_ADDRESS &&
      NFT_CONTRACT_ADDRESS !== ZERO_ADDR &&
      Array.isArray(NFT_ABI) &&
      NFT_ABI.length > 0,
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
          setError("未检测到钱包，无法读取 NFT。");
          return;
        }

        const provider = new BrowserProvider(window.ethereum);
        try {
          await window.ethereum.request({ method: "eth_requestAccounts" });
        } catch {}

        const contract = new Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, provider);
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
        if (!cancelled) setError(e?.message || "读取 NFT 失败");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadNFTs();
    return () => {
      cancelled = true;
    };
  }, [account, enabled]);

  if (!account) {
    return (
      <div className="notice">
        请先在首页连接钱包，之后回到此处查看你的勋章墙。
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h3>My Badge Wall</h3>
        {loading && <p>Reading your NFT badges…</p>}
        {error && (
          <div className="notice" style={{ marginBottom: 12 }}>
            {error}
          </div>
        )}
        {!loading && badges.length === 0 && (
          <p className="small">
            You haven't earned any badges yet. Complete activities or tasks to unlock exclusive badges.
          </p>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            marginTop: 12,
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
                padding: "1rem",
                borderRadius: "1rem",
                background: "#fff",
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                cursor: "pointer",
                transition: "transform 0.2s",
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
        <h3>My Mood Record</h3>
        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            marginTop: 12,
          }}
        >
          {moods.map((item, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: "#fff",
                padding: "1rem",
                borderRadius: "1rem",
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                width: "80px",
              }}
            >
              <span style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>{item.mood}</span>
              <span style={{ fontSize: "0.9rem", color: "#555" }}>{item.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
