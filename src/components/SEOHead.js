import React from 'react';
import { Helmet } from 'react-helmet-async';

function SEOHead({ 
  title = "🎮 Cipro - Play Games, Earn Cryptocurrency | Free SOL, ETH, USDT, USDC Rewards",
  description = "🚀 Join 15,000+ players earning real cryptocurrency daily! Play fun games, complete tasks & earn SOL, ETH, USDT, USDC. Free to start, VIP tiers available. Start earning crypto now!",
  keywords = "earn cryptocurrency, play to earn games, free crypto, SOL rewards, ETH rewards, USDT rewards, USDC rewards, blockchain games, crypto gaming",
  image = "https://www.ciprohub.site/ciprohub.png",
  url = "https://www.ciprohub.site",
  type = "website",
  noindex = false,
  structuredData = null
}) {
  const fullTitle = title.includes('Cipro') ? title : `${title} | Cipro`;
  
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Robots */}
      <meta name="robots" content={noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="512" />
      <meta property="og:image:height" content="512" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:site_name" content="Cipro" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@CiproGaming" />
      <meta name="twitter:creator" content="@CiproGaming" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={title} />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}

export default SEOHead;