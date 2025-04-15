// server.js - Arquivo principal do servidor
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const { setupRoutes } = require('./routes');
const { setupSocketHandlers } = require('./socketHandlers');
const { initializeServerRegistry } = require('./serverRegistry');

// Configuração do servidor
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Dados do servidor
const SERVER_ID = process.env.SERVER_ID || 'server-' + Math.floor(Math.random() * 1000);
const PORT = process.env.PORT || 3000;
const OTHER_SERVERS = (process.env.OTHER_SERVERS || '').split(',').filter(s => s);

// Middleware para servir a página do cliente
app.use(express.static('public'));
app.use(express.json());

// Inicializa o registro de servidores
const serverRegistry = initializeServerRegistry(OTHER_SERVERS);

// Configura as rotas da API
setupRoutes(app, io, SERVER_ID, serverRegistry);

// Configura os handlers de socket.io
setupSocketHandlers(io, SERVER_ID, serverRegistry);

// Inicialização do servidor
server.listen(PORT, () => {
  console.log(`Servidor ${SERVER_ID} rodando na porta ${PORT}`);
  
  // Registra-se com outros servidores
  const { registerWithServers } = require('./serverCommunication');
  registerWithServers(OTHER_SERVERS, PORT);
});
