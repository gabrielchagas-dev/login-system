const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend funcionando! ✅' });
});

// Rota de login (exemplo)
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  if (email && password) {
    res.json({ 
      success: true, 
      message: 'Login realizado com sucesso!',
      user: { email }
    });
  } else {
    res.json({ 
      success: false, 
      message: 'Email e senha são obrigatórios'
    });
  }
});

// Rota de cadastro (exemplo)
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  
  if (name && email && password) {
    res.json({ 
      success: true, 
      message: 'Usuário cadastrado com sucesso!',
      user: { name, email }
    });
  } else {
    res.json({ 
      success: false, 
      message: 'Nome, email e senha são obrigatórios'
    });
  }
});

// Iniciar servidor
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});