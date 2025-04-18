const http = require("http"); // Importer le module http pour créer un serveur
const fs = require("fs"); // Importer le module fs pour lire les fichiers
const path = require("path"); // Importer le module path pour gérer les chemins de fichiers
const WebSocket = require("ws"); // Importer le module ws pour gérer les WebSockets

const server = http.createServer((req, res) => {
  // Créer un serveur HTTP
  let filePath = path.join(
    __dirname,
    "public",
    req.url === "/" ? "index.html" : req.url
  ); // Déterminer le chemin du fichier à servir

  fs.readFile(filePath, (err, data) => {
    // Lecture du fichier
    if (err) {
      // Si une erreur se produit lors de la lecture du fichier
      res.writeHead(404); // Envoyer un code de statut 404 (non trouvé)
      return res.end("Page non trouvée"); // Envoyer le message d'erreur
    }

    let ext = path.extname(filePath); // Obtention de l'extension du fichier
    let contentType = "text/html"; // Définition du type de contenu par défaut

    if (ext === ".js") contentType = "text/javascript"; // Si le fichier est un JavaScript
    if (ext === ".css") contentType = "text/css"; // Si le fichier est une feuille de style CSS

    res.writeHead(200, { "Content-Type": contentType }); // Envoyer un code de statut 200 (OK) et le type de contenu approprié
    res.end(data); // Envoyer le contenu du fichier à l'utilisateur
  });
});

const wss = new WebSocket.Server({ server }); // Création d'un serveur WebSocket en utilisant le serveur HTTP existant

wss.on("connection", (socket) => {
  // Événement déclenché lorsqu'un utilisateur se connecte
  console.log("Nouvel utilisateur connecté");
  socket.pseudo = "Anonyme";

  socket.on("message", (msg) => {
    // Événement déclenché lorsqu'un message est reçu de l'utilisateur
    // const messageText = typeof msg === 'string' ? msg : msg.toString(); // Convertir le message en texte si nécessaire
    // console.log(`Message reçu : ${messageText}`); // Afficher le message reçu dans la console

    try {
      const data = JSON.parse(msg);

      if (data.type === "join") {
        socket.pseudo = data.pseudo;
        console.log(`Utilisateur rejoint avec le pseudo : ${socket.pseudo}`);
        return;
      }

      if (data.type === "message") {
        const messageToSend = JSON.stringify({
          pseudo: socket.pseudo,
          message: data.message,
        });

        // Envoi du message à tous les utilisateurs connectés
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(messageToSend);
          }
        });
      }
    } catch (err) {
      console.error("Erreur de parsing JSON :", err);
    }
  });

  socket.on("close", () => {
    console.log(`Utilisateur déconnecté (${socket.pseudo})`);
  });
});

server.listen(3000, () => {
  console.log("Serveur démarré sur http://localhost:3000");
});
