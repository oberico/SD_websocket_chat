// serverRegistry.js - Gerencia o registro de servidores
const axios = require('axios');

function initializeServerRegistry(otherServers) {
  const serverRegistry = new Set([...otherServers]);
  
  // Adiciona o próprio servidor após inicialização
  setTimeout(() => {
    const PORT = process.env.PORT || 3000;
    serverRegistry.add(`http://localhost:${PORT}`);
  }, 100);
  
  return {
    // Adiciona um servidor ao registro
    addServer(serverUrl) {
      if (!serverRegistry.has(serverUrl)) {
        serverRegistry.add(serverUrl);
        return true;
      }
      return false;
    },
    
    // Remove um servidor do registro
    removeServer(serverUrl) {
      return serverRegistry.delete(serverUrl);
    },
    
    // Verifica se um servidor está no registro
    hasServer(serverUrl) {
      return serverRegistry.has(serverUrl);
    },
    
    // Retorna todos os servidores exceto o próprio
    getOtherServers() {
      const PORT = process.env.PORT || 3000;
      return Array.from(serverRegistry).filter(url => url !== `http://localhost:${PORT}`);
    },
    
    // Retorna todos os servidores
    getAllServers() {
      return Array.from(serverRegistry);
    },
    
    // Encontra o URL do servidor pelo ID
    findServerUrlById(serverId) {
      return Array.from(serverRegistry)
        .find(url => url.includes(serverId) || url.endsWith(serverId.split('-')[1]));
    },
    
    // Sincroniza a lista de servidores
    syncServersList(servers) {
      if (servers && Array.isArray(servers)) {
        servers.forEach(s => serverRegistry.add(s));
        return true;
      }
      return false;
    }
  };
}

module.exports = { initializeServerRegistry };
