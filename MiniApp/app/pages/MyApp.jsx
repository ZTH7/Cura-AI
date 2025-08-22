"use client";

import React from "react";
import dynamic from "next/dynamic";

// 关键修复：动态导入路由组件，并禁用 SSR
const DynamicRoutes = dynamic(
  () => import("./DynamicRoutes"), // 将路由逻辑拆分到单独文件
  { ssr: false } // 禁用服务端渲染，确保在客户端运行
);

export default function MyApp() {
  return <DynamicRoutes />;
}


