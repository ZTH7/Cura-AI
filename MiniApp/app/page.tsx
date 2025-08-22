import ClientRouter from "./components/ClientRouter";

export default function Page() {
  return (
    <div>
      <h1>Welcome to My App</h1>
      <ClientRouter /> {/* SPA 页面路由 */}
    </div>
  );
}
