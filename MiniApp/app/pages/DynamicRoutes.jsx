// 新建 DynamicRoutes.jsx 文件（与 MyApp 同级）
// DynamicRoutes.jsx 内容：
import { HashRouter, Routes, Route } from "react-router-dom";
import dynamic from "next/dynamic";

const Home = dynamic(() => import("./Home"), { ssr: false });
const Chat = dynamic(() => import("./Chat"), { ssr: false });
const Profile = dynamic(() => import("./Profile"), { ssr: false });

export default function DynamicRoutes() {
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