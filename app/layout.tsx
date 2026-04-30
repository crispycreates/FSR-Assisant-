import './globals.css';
import NeonRain from './components/NeonRain';

export const metadata = {
  title: 'FSR Assistant',
  description: 'Internal AI assistant for Fair and Square Roofing',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NeonRain />
        <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
