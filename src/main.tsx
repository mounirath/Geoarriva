// 1. Interception globale et silencieuse des erreurs de scripts tiers / CORS
window.addEventListener('error', (event) => {
  if (event.message === 'Script error.' || !event.filename) {
    event.preventDefault();
    return true;
  }
}, true);

window.addEventListener('unhandledrejection', function(event) {
  event.preventDefault();
});

import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// 2. Client-Side Quota Defense (Demo Key Specialization)
(window as any).gm_authFailure = () => {
  window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
};

const origError = console.error;
console.error = (...args: unknown[]) => {
  origError.apply(console, args);
  const msg = args.map((a) => String(a)).join(' ');
  if (msg.includes('OverQuotaMapError') || msg.includes('QuotaExceededError')) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
};

createRoot(document.getElementById('root')!).render(<App />);
