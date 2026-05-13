# Sistema de Login

Sistema de autenticação full stack com React no frontend e Node.js/Express no backend.
O projeto demonstra um fluxo completo de cadastro, login, sessão com JWT e rota protegida.

## Funcionalidades

- Cadastro de usuário com nome, email e senha
- Login com validação de credenciais
- Hash de senha com `bcryptjs`
- Autenticação com token JWT
- Rota protegida `/api/me`
- Validação de email e senha no frontend e no backend
- Bloqueio de email duplicado
- Rate limit nas rotas de autenticação
- Painel privado com dados do usuário logado
- Logout com limpeza da sessão local

## Tecnologias

### Frontend

- React
- CSS responsivo
- Fetch API
- Local Storage para guardar o token da sessão

### Backend

- Node.js
- Express
- bcryptjs
- jsonwebtoken
- helmet
- express-rate-limit

## Como Rodar

### Pré-requisitos

- Node.js instalado
- npm instalado

### Backend

```bash
cd backend
npm install
npm start
```

A API vai rodar em `http://localhost:5000`.

### Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm start
```

O React vai abrir em `http://localhost:3000`.

## Variáveis de Ambiente

O backend funciona sem configuração extra em modo local, mas em produção defina:

```bash
JWT_SECRET=sua-chave-secreta
CLIENT_URL=http://localhost:3000
PORT=5000
```

No frontend, se a API estiver em outro endereço:

```bash
REACT_APP_API_URL=http://localhost:5000
```

## Rotas da API

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api/health` | Verifica se a API está online |
| `POST` | `/api/register` | Cadastra usuário e retorna token |
| `POST` | `/api/login` | Autentica usuário e retorna token |
| `GET` | `/api/me` | Retorna o usuário logado usando Bearer Token |

## Observação

Os usuários ficam salvos em memória para manter o projeto simples e fácil de demonstrar.
Ao reiniciar o backend, os cadastros são apagados. O próximo passo natural seria conectar
um banco de dados como PostgreSQL, MongoDB ou Firebase.
