'use client';

import { useEffect, useRef } from 'react';

const CONTAINER_AD = 'https://pl28358995.effectivecpmnetwork.com/70857de986c19f84718e34ef68076c17/invoke.js';
const SECONDARY_AD = 'https://pl28358996.effectivecpmnetwork.com/e9/57/89/e957892c2ff9c906a642ea7aa0b7f220.js';

export default function AdScripts() {
  const adHostRef = useRef(null);

  useEffect(() => {
    const host = adHostRef.current;
    if (!host) return undefined;

    const containerScript = document.createElement('script');
    containerScript.async = true;
    containerScript.dataset.cfasync = 'false';
    containerScript.src = CONTAINER_AD;
    host.appendChild(containerScript);

    const secondaryScript = document.createElement('script');
    secondaryScript.async = true;
    secondaryScript.src = SECONDARY_AD;
    document.body.appendChild(secondaryScript);

    return () => {
      containerScript.parentNode?.removeChild(containerScript);
      secondaryScript.parentNode?.removeChild(secondaryScript);
    };
  }, []);

  return (
    <div ref={adHostRef}>
      <div id="container-70857de986c19f84718e34ef68076c17" />
    </div>
  );
}
