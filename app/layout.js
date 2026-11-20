import './globals.css';

export const metadata = { title: 'Coy · Discover', description: 'Swipe. Match only when it is mutual.' };
export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#15101c' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
