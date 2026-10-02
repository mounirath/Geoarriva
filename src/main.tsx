// === NEUTRALISATION TOTALE DES SCRIPT ERRORS (CORS) ===
window.addEventListener('error', (event) => {
  // Si c'est une erreur de script externe/CORS, on bloque l'événement net
  if (!event.message || event.message === 'Script error.' || event.message.includes('Script error') || !event.filename || event.filename === '') {
    event.preventDefault();
    event.stopImmediatePropagation();
    return true;
  }
}, true);

window.addEventListener('unhandledrejection', (event) => {
  event.preventDefault();
});
// ======================================================

import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Client-Side Quota Defense (Google Maps)
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
