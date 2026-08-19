import './globals.css';
import AdScripts from '../components/AdScripts';

export const metadata = {
  title: 'Cipro - Play Games, Earn Real Cryptocurrency',
  description: 'Join thousands of players earning real cryptocurrency by playing fun games! Earn SOL, ETH, USDT & USDC daily. Free to start, no investment required.',
  keywords: 'earn cryptocurrency, play to earn games, free crypto, SOL rewards, ETH rewards, USDT rewards, crypto gaming',
  metadataBase: new URL('https://www.ciprohub.site'),
  openGraph: {
    title: 'Cipro - Play Games, Earn Real Cryptocurrency',
    description: 'Play games and earn real crypto rewards. Free to start.',
    url: 'https://www.ciprohub.site',
    siteName: 'Cipro',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cipro - Play Games, Earn Real Cryptocurrency',
    description: 'Play games and earn real crypto rewards.',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        {children}
        <AdScripts />
      </body>
    </html>
  );
}
