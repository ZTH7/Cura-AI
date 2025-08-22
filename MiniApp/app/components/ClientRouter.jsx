"use client"; // ⚠️ 必须客户端组件

import React from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Chat from "../pages/Chat";
import Profile from "../pages/Profile";

export default function ClientRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </HashRouter>
  );
}
