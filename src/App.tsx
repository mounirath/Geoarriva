// Interception propre qui ignore complètement les erreurs CORS tierces
window.onerror = function (message, source, lineno, colno, error) {
  const errorMsg = typeof message === 'string' ? message : JSON.stringify(message || '');
  
  // Si c'est un Script error (CORS), on l'ignore totalement et on laisse tourner l'app
  if (errorMsg.includes('Script error') || !source) {
    console.warn("Erreur cross-origin masquée par le navigateur ignorée avec succès.");
    return true; 
  }

  // Affichage uniquement pour les vraies erreurs de votre code interne
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
};

window.addEventListener('unhandledrejection', function(event) {
  event.preventDefault(); // Empêche les rejets de promesses async de planter l'affichage
});
