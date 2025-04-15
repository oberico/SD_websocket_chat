# Mini WhatsApp - Sistema de Mensagens Distribuído

Este projeto implementa um sistema de mensagens distribuído, semelhante a um "Mini WhatsApp", para demonstrar conceitos de Sistemas Distribuídos. O sistema permite múltiplos servidores e clientes se comunicando em tempo real.

## Funcionalidades

- Registro de usuários
- Envio de mensagens privadas entre usuários
- Broadcast de mensagens para todos os usuários
- Verificação de status (online/offline) dos usuários
- Lista de usuários conectados atualizada em tempo real
- Comunicação entre servidores para manter estado global

## Tecnologias Utilizadas

- **Node.js**: Plataforma de execução
- **Express**: Framework web para configuração do servidor
- **Socket.IO**: Biblioteca para comunicação em tempo real
- **Axios**: Cliente HTTP para comunicação entre servidores

## Arquitetura

O sistema segue uma arquitetura distribuída com as seguintes características:

1. **Múltiplos servidores**: O sistema pode ter vários servidores executando simultaneamente.
2. **Comunicação entre servidores**: Os servidores se comunicam entre si para manter um estado global consistente.
3. **Balanceamento implícito**: Clientes podem se conectar a qualquer servidor disponível.
4. **Roteamento de mensagens**: Mensagens são roteadas entre servidores quando necessário.

## Como Executar

### Requisitos

- Node.js 16+
- npm ou yarn

### Instalação

```bash
# Clone o repositório (ou crie os arquivos manualmente)
git clone <repositório> mini-whatsapp
cd mini-whatsapp

# Instale as dependências
npm install
```

### Execução dos Servidores

É possível iniciar múltiplos servidores que se comunicarão entre si.

```bash
# Iniciar o primeiro servidor (porta 3000)
npm run start-server-1

# Em outro terminal, iniciar o segundo servidor (porta 3001)
npm run start-server-2

# Em outro terminal, iniciar o terceiro servidor (porta 3002)
npm run start-server-3
```

Também é possível iniciar um único servidor:

```bash
npm start
```

### Execução dos Clientes

#### Cliente Web

Acesse em seu navegador:
- http://localhost:3000 (para o servidor 1)
- http://localhost:3001 (para o servidor 2)
- http://localhost:3002 (para o servidor 3)

#### Cliente Terminal

Execute em diferentes terminais para simular múltiplos clientes:

```bash
# Conectar ao servidor padrão (localhost:3000)
npm run client

# Conectar a um servidor específico
SERVER_URL=http://localhost:3001 npm run client
```

## Conceitos de Sistemas Distribuídos Aplicados

### 1. Comunicação Cliente-Servidor

O sistema utiliza o modelo cliente-servidor, onde múltiplos clientes se conectam a servidores para troca de mensagens. A comunicação é baseada em eventos usando Socket.IO, que abstrai a complexidade da comunicação bidirecional em tempo real.

### 2. Modelo Publish-Subscribe

O sistema implementa o padrão publish-subscribe, onde:
- Os clientes se inscrevem (subscribe) em eventos específicos
- Os servidores publicam (publish) eventos quando ocorrem mudanças
- Os clientes recebem notificações em tempo real

### 3. Transparência de Localização

Os clientes não precisam conhecer a localização física dos outros clientes para se comunicarem. O sistema abstrai essa complexidade, permitindo que um cliente se comunique com qualquer outro independentemente de em qual servidor estão conectados.

### 4. Sincronização de Estado

Os servidores mantêm uma visão consistente do estado global (quais usuários estão online e em qual servidor) através de comunicação inter-servidor usando chamadas REST com Axios.

### 5. Detecção de Falhas

O sistema implementa mecanismos básicos de detecção de falhas e reconexão:
- Detecção de desconexão de clientes
- Tentativas automáticas de reconexão
- Notificação de eventos de conexão/desconexão

### 6. Escalabilidade Horizontal

A arquitetura permite a adição de novos servidores sem interromper o funcionamento do sistema, demonstrando escalabilidade horizontal.

### 7. Comunicação Assíncrona

Toda a comunicação no sistema é assíncrona, baseada em eventos, o que permite melhor escalabilidade e responsividade.

### 8. Replicação de Dados

Informações sobre usuários conectados são replicadas entre os servidores para manter consistência do estado global.

## Fluxo de Mensagens

Quando um cliente envia uma mensagem privada para outro cliente:

1. O cliente emissor envia a mensagem para seu servidor
2. O servidor verifica se o destinatário está conectado localmente
   - Se sim, entrega diretamente
   - Se não, consulta outros servidores para localizar o destinatário
3. Ao encontrar o servidor correto, a mensagem é encaminhada
4. O servidor destinatário entrega a mensagem ao cliente destinatário

Este fluxo é transparente para os usuários, que têm a impressão de se comunicarem diretamente.

## Limitações e Possíveis Melhorias

- **Persistência de mensagens**: Atualmente, as mensagens não são armazenadas permanentemente
- **Autenticação robusta**: O sistema usa apenas nomes de usuário sem autenticação segura
- **Criptografia**: As mensagens não são criptografadas
- **Tolerância a falhas**: Implementação de mecanismos mais robustos de tolerância a falhas

## Conclusão

Este projeto demonstra como conceitos fundamentais de sistemas distribuídos podem ser aplicados na prática para criar um sistema de mensagens escalável e resiliente. Os princípios de transparência, escalabilidade horizontal e comunicação assíncrona são particularmente evidentes na implementação.
