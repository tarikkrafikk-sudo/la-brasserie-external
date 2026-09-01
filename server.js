// server.js
// La Brasserie — serveur Node.js + Express, sert le dossier "public" tel quel.
// Prêt pour Render (Web Service) et GitHub.

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10000;
const PUBLIC_DIR = path.join(__dirname, 'public');

app.set('trust proxy', 1);

// Sert tous les fichiers statiques du dossier "public" à la racine du site :
// public/style.css       -> /style.css
// public/script.js       -> /script.js
// public/images/xxx.jpg  -> /images/xxx.jpg
// public/videos/xxx.mp4  -> /videos/xxx.mp4
app.use(express.static(PUBLIC_DIR));

// Page unique : index.html (site mono-page avec ancres #home, #menu, #videos, #gallery, #contact)
app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Repli : toute autre route GET renvoie aussi index.html (site mono-page)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`La Brasserie est en ligne sur http://localhost:${PORT}`);
  });
}

module.exports = app;
