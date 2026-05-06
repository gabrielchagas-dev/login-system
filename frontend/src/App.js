import './App.css';
import { useState } from 'react';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setMessage('Preencha todos os campos!');
      setMessageType('error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage('✅ Login realizado com sucesso!');
        setMessageType('success');
        setEmail('');
        setPassword('');
      } else {
        setMessage('❌ ' + data.message);
        setMessageType('error');
      }
    } catch (error) {
      setMessage('❌ Erro ao conectar ao servidor');
      setMessageType('error');
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      setMessage('Preencha todos os campos!');
      setMessageType('error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage('✅ Cadastro realizado com sucesso!');
        setMessageType('success');
        setName('');
        setEmail('');
        setPassword('');
        setTimeout(() => setIsLogin(true), 2000);
      } else {
        setMessage('❌ ' + data.message);
        setMessageType('error');
      }
    } catch (error) {
      setMessage('❌ Erro ao conectar ao servidor');
      setMessageType('error');
    }
    setLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      isLogin ? handleLogin() : handleRegister();
    }
  };

  return (
    <div className="app-container">
      {/* Background Animado */}
      <div className="background">
        <div className="blob blob1"></div>
        <div className="blob blob2"></div>
        <div className="blob blob3"></div>
      </div>

      {/* Card Principal */}
      <div className="login-card">
        {/* Header */}
        <div className="header">
          <div className="icon">🔐</div>
          <h1>{isLogin ? 'Login' : 'Cadastro'}</h1>
          <p className="subtitle">
            {isLogin ? 'Entre na sua conta' : 'Crie uma nova conta'}
          </p>
        </div>

        {/* Form */}
        <div className="form-container">
          {!isLogin && (
            <div className="input-group">
              <label htmlFor="name">Nome Completo</label>
              <input
                id="name"
                type="text"
                placeholder="Seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyPress={handleKeyPress}
                className="input-field"
              />
            </div>
          )}

          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
              className="input-field"
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              className="input-field"
            />
          </div>

          {/* Botão */}
          <button
            onClick={isLogin ? handleLogin : handleRegister}
            disabled={loading}
            className={`btn-submit ${loading ? 'loading' : ''}`}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Processando...
              </>
            ) : (
              isLogin ? 'Entrar' : 'Criar Conta'
            )}
          </button>

          {/* Mensagem */}
          {message && (
            <div className={`message message-${messageType}`}>
              {message}
            </div>
          )}

          {/* Alternador de Abas */}
          <div className="toggle-auth">
            {isLogin ? (
              <p>
                Não tem conta?{' '}
                <button
                  onClick={() => {
                    setIsLogin(false);
                    setMessage('');
                  }}
                  className="link-btn"
                >
                  Cadastre-se
                </button>
              </p>
            ) : (
              <p>
                Já tem conta?{' '}
                <button
                  onClick={() => {
                    setIsLogin(true);
                    setMessage('');
                  }}
                  className="link-btn"
                >
                  Faça login
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="footer">
          <p>© 2026 Sistema de Login - Todos os direitos reservados</p>
        </div>
      </div>
    </div>
  );
}

export default App;