import './App.css';
import { useEffect, useMemo, useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [formMode, setFormMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState(null);

  const isLogin = formMode === 'login';
  const passwordStrength = useMemo(() => getPasswordStrength(form.password), [form.password]);

  useEffect(() => {
    const token = localStorage.getItem('authToken');

    if (!token) {
      setSessionLoading(false);
      return;
    }

    fetch(`${API_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || 'Sessão inválida.');
        }

        setUser(data.user);
      })
      .catch(() => {
        localStorage.removeItem('authToken');
      })
      .finally(() => setSessionLoading(false));
  }, []);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage('');
  }

  function changeMode(mode) {
    setFormMode(mode);
    setMessage('');
    setShowPassword(false);
  }

  function validateForm() {
    if (!isLogin && form.name.trim().length < 2) {
      return 'Informe seu nome completo.';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return 'Informe um email válido.';
    }

    if (form.password.length < 8) {
      return 'A senha precisa ter pelo menos 8 caracteres.';
    }

    return '';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationMessage = validateForm();

    if (validationMessage) {
      setMessage(validationMessage);
      setMessageType('error');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/login' : '/api/register';
      const payload = isLogin
        ? { email: form.email, password: form.password }
        : form;

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Não foi possível concluir a operação.');
      }

      localStorage.setItem('authToken', data.token);
      setUser(data.user);
      setForm({ name: '', email: '', password: '' });
      setMessage('');
    } catch (error) {
      setMessage(error.message || 'Erro ao conectar ao servidor.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem('authToken');
    setUser(null);
    setFormMode('login');
    setMessage('Sessão encerrada com sucesso.');
    setMessageType('success');
  }

  if (sessionLoading) {
    return (
      <main className="app-shell">
        <section className="auth-panel auth-panel-compact">
          <div className="spinner dark" aria-label="Carregando sessão"></div>
        </section>
      </main>
    );
  }

  if (user) {
    return (
      <main className="app-shell">
        <section className="dashboard">
          <div className="dashboard-header">
            <div>
              <span className="eyebrow">Área autenticada</span>
              <h1>Olá, {user.name}</h1>
              <p>Sua sessão foi validada no backend usando token JWT.</p>
            </div>
            <button className="secondary-button" onClick={handleLogout}>
              Sair
            </button>
          </div>

          <div className="account-grid">
            <article>
              <span>Email</span>
              <strong>{user.email}</strong>
            </article>
            <article>
              <span>ID do usuário</span>
              <strong>{user.id.slice(0, 8)}</strong>
            </article>
            <article>
              <span>Conta criada</span>
              <strong>{new Date(user.createdAt).toLocaleDateString('pt-BR')}</strong>
            </article>
          </div>

          <div className="feature-list">
            <div>
              <strong>Cadastro protegido</strong>
              <span>Emails duplicados são bloqueados pela API.</span>
            </div>
            <div>
              <strong>Senha com hash</strong>
              <span>A senha não fica exposta na resposta do servidor.</span>
            </div>
            <div>
              <strong>Rota privada</strong>
              <span>O painel só aparece depois de validar o token.</span>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <section className="auth-panel">
        <div className="brand-block">
          <span className="eyebrow">Sistema de Login</span>
          <h1>{isLogin ? 'Entrar na conta' : 'Criar nova conta'}</h1>
          <p>
            Autenticação com React, Node.js, Express, senha criptografada e sessão
            por token JWT.
          </p>
        </div>

        <div className="mode-tabs" role="tablist" aria-label="Modo de autenticação">
          <button
            className={isLogin ? 'active' : ''}
            onClick={() => changeMode('login')}
            type="button"
          >
            Login
          </button>
          <button
            className={!isLogin ? 'active' : ''}
            onClick={() => changeMode('register')}
            type="button"
          >
            Cadastro
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <label className="field">
              <span>Nome completo</span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                autoComplete="name"
                placeholder="Seu nome"
              />
            </label>
          )}

          <label className="field">
            <span>Email</span>
            <input
              type="text"
              inputMode="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
              autoComplete="email"
              placeholder="seu@email.com"
            />
          </label>

          <label className="field">
            <span>Senha</span>
            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                placeholder="Mínimo de 8 caracteres"
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </label>

          {!isLogin && form.password && (
            <div className="password-meter" aria-label={`Força da senha: ${passwordStrength.label}`}>
              <span className={`meter-bar ${passwordStrength.level}`}></span>
              <small>{passwordStrength.label}</small>
            </div>
          )}

          <button className="primary-button" disabled={loading} type="submit">
            {loading ? (
              <>
                <span className="spinner" aria-hidden="true"></span>
                Processando
              </>
            ) : (
              isLogin ? 'Entrar' : 'Criar conta'
            )}
          </button>

          {message && <div className={`message ${messageType}`}>{message}</div>}
        </form>
      </section>
    </main>
  );
}

function getPasswordStrength(password) {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { level: 'weak', label: 'Senha fraca' };
  if (score <= 3) return { level: 'medium', label: 'Senha média' };
  return { level: 'strong', label: 'Senha forte' };
}

export default App;
