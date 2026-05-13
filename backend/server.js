const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { randomUUID } = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const TOKEN_EXPIRES_IN = '1h';

const users = new Map();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));
app.use(express.json({ limit: '10kb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Muitas tentativas. Tente novamente em alguns minutos.'
  }
});

app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return typeof password === 'string' && password.length >= 8;
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt
  };
}

function createToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRES_IN
  });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token de acesso não informado.'
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = [...users.values()].find((item) => item.id === payload.sub);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário da sessão não foi encontrado.'
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Sessão expirada ou inválida.'
    });
  }
}

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API online',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/register', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = normalizeEmail(req.body.email);
  const password = req.body.password;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Nome, email e senha são obrigatórios.'
    });
  }

  if (name.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Informe um nome com pelo menos 2 caracteres.'
    });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Informe um email válido.'
    });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({
      success: false,
      message: 'A senha precisa ter pelo menos 8 caracteres.'
    });
  }

  if (users.has(email)) {
    return res.status(409).json({
      success: false,
      message: 'Já existe uma conta cadastrada com este email.'
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = {
    id: randomUUID(),
    name,
    email,
    passwordHash,
    createdAt: new Date().toISOString()
  };

  users.set(email, user);

  return res.status(201).json({
    success: true,
    message: 'Usuário cadastrado com sucesso.',
    user: publicUser(user),
    token: createToken(user)
  });
});

app.post('/api/login', async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email e senha são obrigatórios.'
    });
  }

  const user = users.get(email);
  const passwordMatches = user
    ? await bcrypt.compare(password, user.passwordHash)
    : false;

  if (!user || !passwordMatches) {
    return res.status(401).json({
      success: false,
      message: 'Email ou senha inválidos.'
    });
  }

  return res.json({
    success: true,
    message: 'Login realizado com sucesso.',
    user: publicUser(user),
    token: createToken(user)
  });
});

app.get('/api/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: publicUser(req.user)
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada.'
  });
});

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});
