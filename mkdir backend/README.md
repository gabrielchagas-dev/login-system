# 🔧 Backend - Node.js

API do sistema de login.

## 📦 Instalação

```bash
npm install
```

## 🚀 Rodar

```bash
npm start
```

Roda em `http://localhost:5000`

## 📂 Estrutura
src/
├── routes/
│   ├── auth.js
│   └── users.js
├── controllers/
├── middleware/
├── models/
└── server.js
## 🛠️ Dependências

- express
- cors
- dotenv
- jsonwebtoken
- bcryptjs

## 📡 Endpoints

### POST /api/auth/register
Cadastra um novo usuário

### POST /api/auth/login
Faz login

### GET /api/users
Lista usuários (requer token)