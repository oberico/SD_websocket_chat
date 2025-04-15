// userRegistry.js - Gerencia o registro de usuários
const connectedClients = new Map(); // Mapa de socketId -> {username, serverId}
const globalUserRegistry = new Map(); // username -> serverId

const userRegistry = {
  // Adiciona um cliente ao registro
  registerClient(socketId, username, serverId) {
    connectedClients.set(socketId, { username, serverId });
    globalUserRegistry.set(username, serverId);
    return { username, serverId };
  },
  
  // Remove um cliente do registro
  removeClient(socketId) {
    if (connectedClients.has(socketId)) {
      const { username } = connectedClients.get(socketId);
      globalUserRegistry.delete(username);
      connectedClients.delete(socketId);
      return username;
    }
    return null;
  },
  
  // Verifica se um nome de usuário já está em uso
  isUsernameTaken(username) {
    return globalUserRegistry.has(username) || 
      Array.from(connectedClients.values()).some(client => client.username === username);
  },
  
  // Retorna um cliente pelo socketId
  getClient(socketId) {
    return connectedClients.get(socketId);
  },
  
  // Verifica se um cliente está registrado
  isClientRegistered(socketId) {
    return connectedClients.has(socketId);
  },
  
  // Encontra sockets por nome de usuário
  findSocketsByUsername(username) {
    return Array.from(connectedClients.entries())
      .filter(([_, client]) => client.username === username)
      .map(([socketId, _]) => socketId);
  },
  
  // Adiciona um usuário ao registro global
  addToGlobalRegistry(username, serverId) {
    globalUserRegistry.set(username, serverId);
  },
  
  // Remove um usuário do registro global
  removeFromGlobalRegistry(username) {
    globalUserRegistry.delete(username);
  },
  
  // Verifica se um usuário está no registro global
  isInGlobalRegistry(username) {
    return globalUserRegistry.has(username);
  },
  
  // Obter servidor de um usuário no registro global
  getServerForUser(username) {
    return globalUserRegistry.get(username);
  },
  
  // Obtém todos os usuários locais
  getLocalUsers() {
    const users = [];
    connectedClients.forEach(client => {
      users.push({
        username: client.username,
        serverId: client.serverId
      });
    });
    return users;
  },
  
  // Obtém todos os usuários globais
  getGlobalUsers() {
    const users = [];
    globalUserRegistry.forEach((serverId, username) => {
      users.push({
        username,
        serverId
      });
    });
    return users;
  },
  
  // Obtém todos os usuários online (local + global sem duplicatas)
  getAllOnlineUsers() {
    const users = this.getLocalUsers();
    const localUsernames = new Set(users.map(u => u.username));
    
    globalUserRegistry.forEach((serverId, username) => {
      if (!localUsernames.has(username)) {
        users.push({ username, serverId });
      }
    });
    
    return users;
  }
};

module.exports = userRegistry;
