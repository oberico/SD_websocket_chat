// serverCommunication.js - Gerencia a comunicação entre servidores
const axios = require('axios');
const userRegistry = require('./userRegistry');

const serverCommunication = {
  // Registra este servidor com outros servidores
  registerWithServers(otherServers, port) {
    otherServers.forEach(serverUrl => {
      axios.post(`${serverUrl}/register-server`, {
        serverUrl: `http://localhost:${port}`
      }).catch(err => console.error(`Erro ao registrar com ${serverUrl}:`, err.message));
    });
  },
  
  // Envia notificação de novo usuário para outros servidores
  notifyNewUser(serverUrls, username, serverId) {
    serverUrls.forEach(serverUrl => {
      axios.post(`${serverUrl}/new-user`, {
        username,
        serverId
      }).catch(err => {
        console.error(`Erro ao notificar servidor ${serverUrl} sobre novo usuário:`, err.message);
      });
    });
  },
  
  // Envia notificação de usuário desconectado para outros servidores
  notifyUserDisconnected(serverUrls, username) {
    serverUrls.forEach(serverUrl => {
      axios.post(`${serverUrl}/user-disconnected`, { username })
        .catch(err => {
          console.error(`Erro ao notificar servidor ${serverUrl} sobre desconexão:`, err.message);
        });
    });
  },
  
  // Envia mensagem para outro servidor
  async sendMessageToServer(serverUrl, type, from, to, content, fromServer) {
    try {
      await axios.post(`${serverUrl}/message`, {
        type,
        from,
        to,
        content,
        fromServer
      });
      return true;
    } catch (err) {
      console.error(`Erro ao enviar mensagem para ${serverUrl}:`, err.message);
      return false;
    }
  },
  
  // Verifica o status de um usuário em outro servidor
  async checkUserStatusOnServer(serverUrl, username) {
    try {
      const response = await axios.get(`${serverUrl}/user-status/${username}`);
      return response.data;
    } catch (err) {
      console.error(`Erro ao verificar status no servidor ${serverUrl}:`, err.message);
      return { online: false };
    }
  },
  
  // Obtém usuários online de outro servidor
  async getOnlineUsersFromServer(serverUrl) {
    try {
      const response = await axios.get(`${serverUrl}/online-users`);
      return response.data.users || [];
    } catch (err) {
      console.error(`Erro ao obter usuários do servidor ${serverUrl}:`, err.message);
      return [];
    }
  },
  
  // Propaga broadcast para outros servidores
  async propagateBroadcast(serverUrls, from, content, fromServer) {
    for (const serverUrl of serverUrls) {
      try {
        await this.sendMessageToServer(serverUrl, 'broadcast', from, null, content, fromServer);
      } catch (err) {
        console.error(`Erro ao propagar broadcast para ${serverUrl}:`, err.message);
      }
    }
  },
  
  // Sincroniza servidores
  async syncServers(serverUrl, servers) {
    try {
      await axios.post(`${serverUrl}/sync-servers`, { servers });
      return true;
    } catch (err) {
      console.error('Erro ao sincronizar servidores:', err);
      return false;
    }
  },
  
  // Sincroniza usuários
  async syncUsers(serverUrl, users, fromServer) {
    try {
      await axios.post(`${serverUrl}/sync-users`, { users, fromServer });
      return true;
    } catch (err) {
      console.error('Erro ao sincronizar usuários:', err);
      return false;
    }
  }
};

module.exports = serverCommunication;
