import './styles.css' // CSS 必须最先导入
import { Providers } from './providers';
import MyApp from './pages/MyApp.jsx';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <MyApp />  {/* React Router 客户端路由 */}
        </Providers>
      </body>
    </html>
  );
}
