// 1. Interception globale et silencieuse des erreurs de scripts tiers / CORS
window.addEventListener('error', (event) => {
  if (event.message === 'Script error.' || !event.filename) {
    event.preventDefault();
    return true;
  }
  
  // Affichage uniquement pour les vraies erreurs de votre code interne
  const errorMsg = typeof event.message === 'string' ? event.message : JSON.stringify(event.message || '');
  const source = event.filename || 'Inconnu';
  const lineno = event.lineno || 0;
  const colno = event.colno || 0;
  const error = event.error;

  const errorBox = document.createElement('div');
  errorBox.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;background:#111;color:#ff4444;padding:20px;z-index:999999;overflow:auto;font-family:monospace;font-size:13px;';
  errorBox.innerHTML = `
    <h2 style="color:white; margin-bottom:10px;">🚨 Erreur de l'application :</h2>
    <p><b>Message :</b> ${errorMsg}</p>
    <p><b>Fichier :</b> ${source} (Ligne ${lineno}:${colno})</p>
    <p><b>Détails :</b> ${error && error.stack ? error.stack : 'Aucune trace'}</p>
    <button onclick="this.parentElement.remove()" style="margin-top:20px;padding:10px 20px;background:#ff4444;color:white;border:none;border-radius:5px;cursor:pointer;">Fermer</button>
  `;
  document.body.appendChild(errorBox);
  return true;
}, true);

// 2. Empêche les rejets de promesses asynchrones non gérés de planter l'affichage
window.addEventListener('unhandledrejection', function(event) {
  event.preventDefault();
});
