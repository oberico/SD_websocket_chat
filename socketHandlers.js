// socketHandlers.js - Manipula eventos de socket.io
const userRegistry = require('./userRegistry');
const serverCommunication = require('./serverCommunication');

function setupSocketHandlers(io, serverId, serverRegistry) {
  io.on('connection', (socket) => {
    console.log('Novo cliente conectado:', socket.id);
    
    // Registro de usuário
    socket.on('register', async (username) => {
      // Verifica se o nome de usuário já está em uso
      if (userRegistry.isUsernameTaken(username)) {
        socket.emit('register-response', { 
          success: false, 
          message: 'Nome de usuário já está em uso' 
        });
        return;
      }
      
      // Registra o cliente
      userRegistry.registerClient(socket.id, username, serverId);
      
      // Notifica o cliente do sucesso
      socket.emit('register-response', { 
        success: true, 
        message: `Registrado como ${username} no servidor ${serverId}` 
      });
      
      // Notifica todos os clientes sobre o novo usuário
      io.emit('user-connected', { username, serverId });
      console.log(`Usuário ${username} registrado no servidor ${serverId}`);
      
      // Notifica outros servidores sobre o novo usuário
      serverCommunication.notifyNewUser(
        serverRegistry.getOtherServers(),
        username,
        serverId
      );
      
      // Coleta e envia a lista de usuários atualmente conectados
      const onlineUsers = userRegistry.getAllOnlineUsers();
      socket.emit('online-users', onlineUsers);
      
      // Solicita listas de usuários de outros servidores para completar o registro global
      const otherServers = serverRegistry.getOtherServers();
      for (const serverUrl of otherServers) {
        try {
          const remoteUsers = await serverCommunication.getOnlineUsersFromServer(serverUrl);
          
          // Atualiza o registro global e notifica clientes
          remoteUsers.forEach(user => {
            if (!userRegistry.isInGlobalRegistry(user.username)) {
              userRegistry.addToGlobalRegistry(user.username, user.serverId);
              io.emit('user-connected', {
                username: user.username,
                serverId: user.serverId
              });
            }
          });
          
          // Atualiza a lista para o cliente recém-conectado
          socket.emit('online-users', userRegistry.getAllOnlineUsers());
        } catch (err) {
          console.error(`Erro ao obter usuários do servidor ${serverUrl}:`, err.message);
        }
      }
    });
    
    // Envio de mensagem privada
    socket.on('private-message', async ({ to, content }) => {
      if (!userRegistry.isClientRegistered(socket.id)) {
        socket.emit('error', { message: 'Você não está registrado' });
        return;
      }
      
      const sender = userRegistry.getClient(socket.id).username;
      
      // Verifica se o destinatário está conectado neste servidor
      const recipientSocketIds = userRegistry.findSocketsByUsername(to);
      
      if (recipientSocketIds.length > 0) {
        // O destinatário está neste servidor
        recipientSocketIds.forEach(socketId => {
          io.to(socketId).emit('private-message', { from: sender, content });
        });
        
        socket.emit('message-status', { 
          success: true, 
          to, 
          message: `Mensagem enviada para ${to}` 
        });
      } else {
        // Verifica no registro global se o usuário está em outro servidor
        if (userRegistry.isInGlobalRegistry(to)) {
          const targetServerId = userRegistry.getServerForUser(to);
          const targetServerUrl = serverRegistry.findServerUrlById(targetServerId);
          
          if (targetServerUrl) {
            // Usuário encontrado em outro servidor - envia a mensagem
            const success = await serverCommunication.sendMessageToServer(
              targetServerUrl, 'private', sender, to, content, serverId
            );
            
            if (success) {
              socket.emit('message-status', { 
                success: true, 
                to, 
                message: `Mensagem enviada para ${to} via servidor ${targetServerId}` 
              });
              return;
            }
          }
        }
        
        // Se chegou aqui, tenta verificar em cada servidor (fallback)
        let recipientFound = false;
        
        // Pergunta para cada servidor se o usuário está conectado
        for (const serverUrl of serverRegistry.getOtherServers()) {
          try {
            const status = await serverCommunication.checkUserStatusOnServer(serverUrl, to);
            if (status.online) {
              // Usuário encontrado em outro servidor - envia a mensagem
              await serverCommunication.sendMessageToServer(
                serverUrl, 'private', sender, to, content, serverId
              );
              
              recipientFound = true;
              socket.emit('message-status', { 
                success: true, 
                to, 
                message: `Mensagem enviada para ${to} via servidor ${status.server}` 
              });
              
              // Atualiza o registro global
              userRegistry.addToGlobalRegistry(to, status.server);
              break;
            }
          } catch (err) {
            console.error(`Erro ao verificar status no servidor ${serverUrl}:`, err.message);
          }
        }
        
        if (!recipientFound) {
          socket.emit('message-status', { 
            success: false, 
            to, 
            message: `Usuário ${to} não está online` 
          });
        }
      }
    });
    
    // Broadcast para todos os usuários
    socket.on('broadcast-message', async ({ content }) => {
      if (!userRegistry.isClientRegistered(socket.id)) {
        socket.emit('error', { message: 'Você não está registrado' });
        return;
      }
      
      const sender = userRegistry.getClient(socket.id).username;
      
      // Envia para todos os clientes neste servidor
      io.emit('broadcast-message', { from: sender, content });
      
      // Propaga para outros servidores
      await serverCommunication.propagateBroadcast(
        serverRegistry.getOtherServers(), 
        sender, 
        content, 
        serverId
      );
      
      socket.emit('message-status', { 
        success: true, 
        message: 'Mensagem enviada para todos os usuários' 
      });
    });
    
    // Verificação de status de usuário
    socket.on('check-user-status', async (username) => {
      if (!userRegistry.isClientRegistered(socket.id)) {
        socket.emit('error', { message: 'Você não está registrado' });
        return;
      }
      
      // Verifica no registro global
      if (userRegistry.isInGlobalRegistry(username)) {
        const userServerId = userRegistry.getServerForUser(username);
        socket.emit('user-status', { username, online: true, server: userServerId });
        return;
      }
      
      // Verifica se o usuário está neste servidor
      const isOnlineHere = userRegistry.findSocketsByUsername(username).length > 0;
      
      if (isOnlineHere) {
        socket.emit('user-status', { username, online: true, server: serverId });
        return;
      }
      
      // Verifica em outros servidores
      let userFound = false;
      
      for (const serverUrl of serverRegistry.getOtherServers()) {
        try {
          const status = await serverCommunication.checkUserStatusOnServer(serverUrl, username);
          if (status.online) {
            socket.emit('user-status', { 
              username, 
              online: true, 
              server: status.server 
            });
            
            // Atualiza o registro global
            userRegistry.addToGlobalRegistry(username, status.server);
            userFound = true;
            break;
          }
        } catch (err) {
          console.error(`Erro ao verificar status no servidor ${serverUrl}:`, err.message);
        }
      }
      
      if (!userFound) {
        socket.emit('user-status', { username, online: false });
      }
    });
    
    // Solicitação de lista de usuários online
    socket.on('get-online-users', async () => {
      if (!userRegistry.isClientRegistered(socket.id)) {
        socket.emit('error', { message: 'Você não está registrado' });
        return;
      }
      
      // Envia lista combinada de usuários locais e globais
      socket.emit('online-users', userRegistry.getAllOnlineUsers());
      
      // Atualiza lista solicitando a outros servidores
      for (const serverUrl of serverRegistry.getOtherServers()) {
        try {
          const remoteUsers = await serverCommunication.getOnlineUsersFromServer(serverUrl);
          
          // Atualiza o registro global
          remoteUsers.forEach(user => {
            userRegistry.addToGlobalRegistry(user.username, user.serverId);
          });
          
          // Atualiza a lista para o cliente
          socket.emit('online-users', userRegistry.getAllOnlineUsers());
        } catch (err) {
          console.error(`Erro ao obter usuários do servidor ${serverUrl}:`, err.message);
        }
      }
    });
    
    // Desconexão do cliente
    socket.on('disconnect', () => {
      if (userRegistry.isClientRegistered(socket.id)) {
        const username = userRegistry.getClient(socket.id).username;
        console.log(`Usuário ${username} desconectado`);
        
        // Remove do registro
        userRegistry.removeClient(socket.id);
        
        // Notifica todos os clientes sobre a desconexão
        io.emit('user-disconnected', { username });
        
        // Notifica outros servidores
        serverCommunication.notifyUserDisconnected(
          serverRegistry.getOtherServers(),
          username
        );
      }
    });
  });
}

module.exports = { setupSocketHandlers };
