// Applique le thème choisi avant le premier affichage (évite un flash clair/sombre).
try {
  var t = JSON.parse(localStorage.getItem('orbo:settings') || '{}').theme;
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
} catch (e) {}
