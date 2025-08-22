"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import sdk from "@farcaster/frame-sdk";

// 关键修复：动态导入路由组件，并禁用 SSR
const DynamicRoutes = dynamic(
  () => import("./DynamicRoutes"), // 将路由逻辑拆分到单独文件
  { ssr: false } // 禁用服务端渲染，确保在客户端运行
);

export default function MyApp() {
  useEffect(() => {
    // 初始化 Farcaster Frame SDK
    const initSdk = async () => {
      try {
        // 调用 ready() 方法告知 Frame 应用已准备就绪
        await sdk.actions.ready();
        console.log("Farcaster Frame SDK initialized successfully");
      } catch (error) {
        console.warn("Failed to initialize Farcaster Frame SDK:", error);
      }
    };

    initSdk();
  }, []);

  return <DynamicRoutes />;
}


