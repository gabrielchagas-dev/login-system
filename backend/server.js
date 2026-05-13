const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { randomUUID } = require('crypto');
const { connectDatabase } = require('./database');
const { sendCampaign } = require('./emailService');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const TOKEN_EXPIRES_IN = '1h';

let db;

app.use(helmet());
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:3001'
].filter(Boolean);

function isPrivateNetworkOrigin(origin) {
  try {
    const { hostname, port } = new URL(origin);
    const isDevPort = port === '3000' || port === '3001';
    const isPrivateHost = (
      hostname === 'localhost'
      || hostname === '127.0.0.1'
      || hostname.startsWith('192.168.')
      || hostname.startsWith('10.')
      || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
    );

    return isDevPort && isPrivateHost;
  } catch (error) {
    return false;
  }
}

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || isPrivateNetworkOrigin(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Origem nao permitida pelo CORS.'));
  }
}));
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

const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Limite de automacoes atingido. Tente novamente mais tarde.'
  }
});

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return typeof password === 'string' && password.length >= 8;
}

function validateContacts(contacts) {
  if (!Array.isArray(contacts) || contacts.length === 0) {
    return 'Adicione pelo menos um destinatario.';
  }

  if (contacts.length > 20) {
    return 'Envie no maximo 20 destinatarios por campanha.';
  }

  for (const contact of contacts) {
    if (!String(contact.name || '').trim()) {
      return 'Todos os destinatarios precisam ter nome.';
    }

    if (!validateEmail(normalizeEmail(contact.email))) {
      return 'Todos os destinatarios precisam ter email valido.';
    }
  }

  return '';
}

function buildSmtpSettings(body) {
  const smtp = body.smtp || {};
  const user = normalizeEmail(smtp.user);
  const pass = String(smtp.pass || '').trim();

  if (!user && !pass) {
    return null;
  }

  return {
    host: String(smtp.host || 'smtp.gmail.com').trim(),
    port: Number(smtp.port || 587),
    user,
    pass,
    from: normalizeEmail(smtp.from || user)
  };
}

function validateSmtpSettings(smtp) {
  if (!smtp) {
    return '';
  }

  if (!validateEmail(smtp.user)) {
    return 'Informe um email remetente valido.';
  }

  if (!smtp.pass || smtp.pass.length < 8) {
    return 'Informe uma senha de app ou token SMTP valido.';
  }

  if (!smtp.host || !smtp.port) {
    return 'Host e porta SMTP sao obrigatorios.';
  }

  return '';
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.created_at
  };
}

function createToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRES_IN
  });
}

async function authenticateToken(req, res, next) {
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
    const user = await db.get(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      payload.sub
    );

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

  const existingUser = await db.get('SELECT id FROM users WHERE email = ?', email);

  if (existingUser) {
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
    password_hash: passwordHash,
    created_at: new Date().toISOString()
  };

  await db.run(
    'INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)',
    user.id,
    user.name,
    user.email,
    user.password_hash,
    user.created_at
  );

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

  const user = await db.get(
    'SELECT id, name, email, password_hash, created_at FROM users WHERE email = ?',
    email
  );
  const passwordMatches = user
    ? await bcrypt.compare(password, user.password_hash)
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

app.post('/api/email-campaigns', authenticateToken, emailLimiter, async (req, res) => {
  const companyName = String(req.body.companyName || '').trim();
  const subjectTemplate = String(req.body.subjectTemplate || '').trim();
  const messageTemplate = String(req.body.messageTemplate || '').trim();
  const sendMode = req.body.sendMode === 'real' ? 'real' : 'preview';
  const smtp = sendMode === 'real' ? buildSmtpSettings(req.body) : null;
  const contacts = Array.isArray(req.body.contacts)
    ? req.body.contacts.map((contact) => ({
      name: String(contact.name || '').trim(),
      email: normalizeEmail(contact.email),
      company: String(contact.company || '').trim()
    }))
    : [];

  if (!subjectTemplate || !messageTemplate) {
    return res.status(400).json({
      success: false,
      message: 'Assunto e mensagem sao obrigatorios.'
    });
  }

  const contactsError = validateContacts(contacts);

  if (contactsError) {
    return res.status(400).json({
      success: false,
      message: contactsError
    });
  }

  const smtpError = validateSmtpSettings(smtp);

  if (smtpError) {
    return res.status(400).json({
      success: false,
      message: smtpError
    });
  }

  const campaign = await sendCampaign({
    contacts,
    companyName,
    subjectTemplate,
    messageTemplate,
    smtp
  });

  const campaignId = randomUUID();
  const createdAt = new Date().toISOString();

  await db.run(
    `INSERT INTO email_campaigns
      (id, user_id, company_name, subject_template, message_template, recipients_count, preview_only, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    campaignId,
    req.user.id,
    companyName,
    subjectTemplate,
    messageTemplate,
    contacts.length,
    campaign.previewOnly ? 1 : 0,
    createdAt
  );

  return res.status(201).json({
    success: true,
    message: campaign.previewOnly
      ? 'Preview gerado. Para enviar de verdade, selecione Enviar real e informe seu token SMTP.'
      : 'Campanha processada.',
    campaign: {
      id: campaignId,
      recipientsCount: contacts.length,
      previewOnly: campaign.previewOnly,
      createdAt,
      results: campaign.results
    }
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada.'
  });
});

async function startServer() {
  db = await connectDatabase();

  app.listen(PORT, () => {
    console.log(`API rodando em http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Erro ao iniciar o servidor:', error);
  process.exit(1);
});
