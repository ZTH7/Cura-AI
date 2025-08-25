"use client";
import React, { useEffect, useState } from 'react';
import BadgeWall from '../components/BadgeWall';

export default function Profile() {
  const [account, setAccount] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const lastAccount = localStorage.getItem('lastAccount') || '';
    setAccount(lastAccount);

    if (lastAccount) {
      const rawUser = localStorage.getItem(`user:${lastAccount.toLowerCase()}`);
      if (rawUser) setUser(JSON.parse(rawUser));
    }
  }, []);

  const goHome = () => {
    if (typeof window !== 'undefined') window.location.href = '/';
  };

  return (
    <div className="container">
      <header className="header">
        <div className="brand">
          
          <div>
            <div className="title">My Profile and Badges</div>
            <div className="small">Connect your story with every badge</div>
          </div>
        </div>
        <button className="button" onClick={goHome}>Home</button>
      </header>

      <div className="row" style={{ marginTop: 16, alignItems: 'flex-start'}}>
        <div className="card" style={{ flex: '1 1 320px', height: 'fit-content' }}>
          <h3>My Info</h3>
          {user ? (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div className="avatar" />
                <div>
                  <div style={{ fontWeight:700, fontSize:16 }}>{user.nickname}</div>
                  <div className="small">
                    Gender: {user.gender || 'Not filled'}
                  </div>
                  <div className="small">
                   Age: {user.age ?? 'Not filled'}
                  </div>
                  <div className="small">
                Wallet: {account ? `${account.slice(0,6)}…${account.slice(-4)}` : 'Not connected'}
              </div>
                </div>
              </div>
              <div style={{ 
                marginTop: 12, 
                padding: '8px 12px', 
                background: '#fff7f3', 
                border: '1px solid #ffe5dc', 
                borderRadius: '8px' 
              }}>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
                  📅 Check-ins: {(user.totalDays || 0) + 30} days
                </div>
              </div>
            </div>
          ) : (
            <div className="notice">
              Profile not found. Please go back to the home page to complete your profile, which will help me better accompany you.
            </div>
          )}
        </div>

        <div className="card" style={{ flex:'3 1 320px',padding:"0 0"}}>
          <BadgeWall />
        </div>
      </div>
    </div>
  );
}
