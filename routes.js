// routes.js - Define as rotas da API
const userRegistry = require('./userRegistry');
const serverCommunication = require('./serverCommunication');

function setupRoutes(app, io, serverId, serverRegistry) {
  // Endpoint para registro de servidor
  app.post('/register-server', (req, res) => {
    const { serverUrl } = req.body;
    if (serverUrl && serverRegistry.addServer(serverUrl)) {
      console.log(`Novo servidor registrado: ${serverUrl}`);
      
      // Informar o novo servidor sobre os servidores existentes
      serverCommunication.syncServers(serverUrl, serverRegistry.getAllServers())
        .catch(err => console.error('Erro ao sincronizar servidores:', err));
      
      // Enviar lista de usuários conectados neste servidor para o novo servidor
      const localUsers = userRegistry.getLocalUsers();
      
      if (localUsers.length > 0) {
        serverCommunication.syncUsers(serverUrl, localUsers, serverId)
          .catch(err => console.error('Erro ao sincronizar usuários:', err));
      }
    }
    res.status(200).send({ success: true, servers: serverRegistry.getAllServers() });
  });

  // Endpoint para sincronizar lista de servidores
  app.post('/sync-servers', (req, res) => {
    const { servers } = req.body;
    if (serverRegistry.syncServersList(servers)) {
      console.log('Lista de servidores atualizada:', serverRegistry.getAllServers());
    }
    res.status(200).send({ success: true });
  });

  // Endpoint para sincronizar usuários conectados
  app.post('/sync-users', (req, res) => {
    const { users, fromServer } = req.body;
    
    if (users && Array.isArray(users)) {
      console.log(`Recebendo lista de ${users.length} usuários do servidor ${fromServer}`);
      
      users.forEach(user => {
        // Adiciona ao registro global
        userRegistry.addToGlobalRegistry(user.username, user.serverId);
        
        // Notifica clientes locais sobre este usuário
        io.emit('user-connected', {
          username: user.username,
          serverId: user.serverId
        });
      });
    }
    
    res.status(200).send({ success: true });
  });

  // Endpoint para notificar sobre novo usuário
  app.post('/new-user', (req, res) => {
    const { username, serverId } = req.body;
    
    // Adiciona ao registro global
    userRegistry.addToGlobalRegistry(username, serverId);
    
    // Notifica clientes locais sobre este usuário
    io.emit('user-connected', { username, serverId });
    
    res.status(200).send({ success: true });
  });

  // Endpoint para notificar sobre usuário desconectado
  app.post('/user-disconnected', (req, res) => {
    const { username } = req.body;
    
    // Remove do registro global
    userRegistry.removeFromGlobalRegistry(username);
    
    // Notifica clientes locais
    io.emit('user-disconnected', { username });
    
    res.status(200).send({ success: true });
  });

  // Endpoint para propagar mensagens entre servidores
  app.post('/message', (req, res) => {
    const { type, from, to, content, fromServer } = req.body;
    
    console.log(`Mensagem recebida de outro servidor: ${type} de ${from} para ${to}`);
    
    // Processa a mensagem recebida de outro servidor
    if (type === 'private') {
      // Encontra o socket do destinatário neste servidor
      const recipientSocketIds = userRegistry.findSocketsByUsername(to);
      
      // Envia a mensagem para o destinatário, se estiver conectado a este servidor
      recipientSocketIds.forEach(socketId => {
        io.to(socketId).emit('private-message', { from, content });
      });
    } else if (type === 'broadcast') {
      // Propaga o broadcast para todos os clientes neste servidor
      io.emit('broadcast-message', { from, content });
    }
    
    res.status(200).send({ success: true });
  });

  // Endpoint para verificar status de usuário
  app.get('/user-status/:username', (req, res) => {
    const { username } = req.params;
    
    // Verifica se o usuário está conectado neste servidor
    const isOnlineHere = userRegistry.findSocketsByUsername(username).length > 0;
    
    if (isOnlineHere) {
      return res.status(200).send({ online: true, server: serverId });
    }
    
    // Se não estiver online neste servidor, responde que não está online
    res.status(200).send({ online: false });
  });

  // Endpoint para obter todos os usuários online
  app.get('/online-users', (req, res) => {
    // Coleta usuários deste servidor
    const localUsers = userRegistry.getLocalUsers();
    
    res.status(200).send({ users: localUsers });
  });
}

module.exports = { setupRoutes };
