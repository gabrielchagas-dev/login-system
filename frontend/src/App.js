import './App.css';
import { useEffect, useMemo, useState } from 'react';

const API_URL = process.env.REACT_APP_API_URL || getDefaultApiUrl();

const emptyCampaign = {
  sendMode: 'preview',
  companyName: '',
  subjectTemplate: 'Ideia para a {{empresa}} - Ola {{nome}}!',
  messageTemplate:
    'Ola {{nome}}, tudo bem?\n\nVi que voce esta na {{empresa}} e tive uma ideia de automacao que pode ajudar o seu time.\n\nTeria 5 minutos para uma conversa rapida?\n\nAbracos,\nGabriel',
  smtp: {
    user: '',
    pass: '',
    host: 'smtp.gmail.com',
    port: '587'
  },
  contacts: [
    { name: '', email: '', company: '' }
  ]
};

const templateOptions = {
  prospeccao: {
    subjectTemplate: 'Ideia para a {{empresa}} - Ola {{nome}}!',
    messageTemplate:
      'Ola {{nome}}, tudo bem?\n\nVi que voce esta na {{empresa}} e tive uma ideia de automacao que pode ajudar o seu time.\n\nTeria 5 minutos para uma conversa rapida?\n\nAbracos,\nGabriel'
  },
  entrevista: {
    subjectTemplate: 'Obrigado pela oportunidade, {{nome}}',
    messageTemplate:
      'Ola {{nome}}, tudo bem?\n\nQueria agradecer pelo contato com a {{empresa}}. Estou muito animado para apresentar meus projetos e mostrar como venho evoluindo em automacao, frontend e backend.\n\nFico a disposicao.\n\nAbracos,\nGabriel'
  },
  followup: {
    subjectTemplate: 'Retomando nossa conversa - {{empresa}}',
    messageTemplate:
      'Ola {{nome}}, tudo bem?\n\nPassando para retomar nossa conversa sobre a {{empresa}}. Acredito que posso contribuir com solucoes simples, automatizadas e bem organizadas.\n\nPodemos marcar um horario rapido?\n\nAbracos,\nGabriel'
  }
};

const sampleContactsText = [
  'Ana Oliveira,ana.oliveira@example.com,Cloud Services',
  'Pedro Costa,pedro.costa@example.com,Future Systems',
  'Maria Santos,maria.santos@example.com,Digital Innovations'
].join('\n');

function App() {
  const [formMode, setFormMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState(null);
  const [activePanel, setActivePanel] = useState('automation');
  const [campaignForm, setCampaignForm] = useState(emptyCampaign);
  const [campaignLoading, setCampaignLoading] = useState(false);
  const [campaignResult, setCampaignResult] = useState(null);
  const [campaignMessage, setCampaignMessage] = useState('');
  const [showTutorial, setShowTutorial] = useState(false);
  const [bulkContactsText, setBulkContactsText] = useState('');

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
          throw new Error(data.message || 'Sessao invalida.');
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
      return 'Informe um email valido.';
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
        throw new Error(data.message || 'Nao foi possivel concluir a operacao.');
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
    setMessage('Sessao encerrada com sucesso.');
    setMessageType('success');
  }

  function updateCampaignField(field, value) {
    setCampaignForm((current) => ({ ...current, [field]: value }));
    setCampaignResult(null);
    setCampaignMessage('');
  }

  function updateSmtpField(field, value) {
    setCampaignForm((current) => ({
      ...current,
      smtp: {
        ...current.smtp,
        [field]: value
      }
    }));
    setCampaignResult(null);
    setCampaignMessage('');
  }

  function updateContact(index, field, value) {
    setCampaignForm((current) => ({
      ...current,
      contacts: current.contacts.map((contact, currentIndex) => (
        currentIndex === index ? { ...contact, [field]: value } : contact
      ))
    }));
    setCampaignResult(null);
    setCampaignMessage('');
  }

  function addContact() {
    setCampaignForm((current) => ({
      ...current,
      contacts: [...current.contacts, { name: '', email: '', company: '' }]
    }));
  }

  function duplicateContact(index) {
    setCampaignForm((current) => ({
      ...current,
      contacts: [
        ...current.contacts.slice(0, index + 1),
        { ...current.contacts[index], email: '' },
        ...current.contacts.slice(index + 1)
      ]
    }));
    setCampaignResult(null);
    setCampaignMessage('');
  }

  function removeContact(index) {
    setCampaignForm((current) => ({
      ...current,
      contacts: current.contacts.length === 1
        ? current.contacts
        : current.contacts.filter((_, currentIndex) => currentIndex !== index)
    }));
  }

  function clearContacts() {
    setCampaignForm((current) => ({
      ...current,
      contacts: [{ name: '', email: '', company: '' }]
    }));
    setCampaignResult(null);
    setCampaignMessage('');
  }

  function applyTemplate(templateKey) {
    const template = templateOptions[templateKey];

    setCampaignForm((current) => ({
      ...current,
      subjectTemplate: template.subjectTemplate,
      messageTemplate: template.messageTemplate
    }));
    setCampaignResult(null);
    setCampaignMessage('');
  }

  function importBulkContacts() {
    const contacts = parseBulkContacts(bulkContactsText);

    if (contacts.length === 0) {
      setCampaignMessage('Cole contatos no formato nome,email,empresa.');
      return;
    }

    setCampaignForm((current) => ({
      ...current,
      contacts: mergeContacts(current.contacts, contacts).slice(0, 20)
    }));
    setBulkContactsText('');
    setCampaignResult(null);
    setCampaignMessage(`${contacts.length} contato(s) importado(s).`);
  }

  function validateCampaign() {
    if (!campaignForm.subjectTemplate.trim() || !campaignForm.messageTemplate.trim()) {
      return 'Preencha o assunto e a mensagem.';
    }

    if (campaignForm.sendMode === 'real') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(campaignForm.smtp.user.trim())) {
        return 'Informe o email remetente para enviar de verdade.';
      }

      if (campaignForm.smtp.pass.trim().length < 8) {
        return 'Informe a senha de app/token SMTP.';
      }
    }

    for (const contact of campaignForm.contacts) {
      if (!contact.name.trim()) {
        return 'Todos os contatos precisam ter nome.';
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) {
        return 'Todos os contatos precisam ter email valido.';
      }
    }

    return '';
  }

  async function handleCampaignSubmit(event) {
    event.preventDefault();
    const validationMessage = validateCampaign();

    if (validationMessage) {
      setCampaignMessage(validationMessage);
      return;
    }

    setCampaignLoading(true);
    setCampaignMessage('');
    setCampaignResult(null);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_URL}/api/email-campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(campaignForm)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Nao foi possivel processar a campanha.');
      }

      setCampaignResult(data.campaign);
      setCampaignMessage(data.message);
    } catch (error) {
      setCampaignMessage(error.message || 'Erro ao conectar ao servidor.');
    } finally {
      setCampaignLoading(false);
    }
  }

  if (sessionLoading) {
    return (
      <main className="app-shell">
        <section className="auth-panel auth-panel-compact">
          <div className="spinner dark" aria-label="Carregando sessao"></div>
        </section>
      </main>
    );
  }

  if (user) {
    return (
      <main className="app-shell">
        <section className="dashboard workspace">
          <div className="dashboard-header">
            <div>
              <span className="eyebrow">Area autenticada</span>
              <h1>Ola, {user.name}</h1>
              <p>Escolha uma ferramenta para usar depois do login.</p>
            </div>
            <button className="secondary-button" onClick={handleLogout}>
              Sair
            </button>
          </div>

          <div className="workspace-tabs" role="tablist" aria-label="Ferramentas">
            <button
              className={activePanel === 'automation' ? 'active' : ''}
              onClick={() => setActivePanel('automation')}
              type="button"
            >
              Automatizador de email
            </button>
            <button
              className={activePanel === 'account' ? 'active' : ''}
              onClick={() => setActivePanel('account')}
              type="button"
            >
              Minha conta
            </button>
          </div>

          {activePanel === 'automation' ? (
            <EmailAutomation
              form={campaignForm}
              loading={campaignLoading}
              message={campaignMessage}
              result={campaignResult}
              onSubmit={handleCampaignSubmit}
              onFieldChange={updateCampaignField}
              onContactChange={updateContact}
              onAddContact={addContact}
              onRemoveContact={removeContact}
              onDuplicateContact={duplicateContact}
              onClearContacts={clearContacts}
              onApplyTemplate={applyTemplate}
              onSmtpChange={updateSmtpField}
              bulkContactsText={bulkContactsText}
              onBulkContactsTextChange={setBulkContactsText}
              onImportBulkContacts={importBulkContacts}
              onLoadSampleContacts={() => setBulkContactsText(sampleContactsText)}
              showTutorial={showTutorial}
              onToggleTutorial={() => setShowTutorial((current) => !current)}
            />
          ) : (
            <AccountPanel user={user} />
          )}
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
            Autenticacao com React, Node.js, Express, senha criptografada,
            sessao por token JWT e ferramentas protegidas apos o login.
          </p>
        </div>

        <div className="mode-tabs" role="tablist" aria-label="Modo de autenticacao">
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
                placeholder="Minimo de 8 caracteres"
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)}>
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </label>

          {!isLogin && form.password && (
            <div className="password-meter" aria-label={`Forca da senha: ${passwordStrength.label}`}>
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

function getDefaultApiUrl() {
  if (typeof window === 'undefined') {
    return 'http://localhost:5000';
  }

  const { protocol, hostname } = window.location;

  return `${protocol}//${hostname}:5000`;
}

function EmailAutomation({
  form,
  loading,
  message,
  result,
  onSubmit,
  onFieldChange,
  onContactChange,
  onAddContact,
  onRemoveContact,
  onDuplicateContact,
  onClearContacts,
  onApplyTemplate,
  onSmtpChange,
  bulkContactsText,
  onBulkContactsTextChange,
  onImportBulkContacts,
  onLoadSampleContacts,
  showTutorial,
  onToggleTutorial
}) {
  const firstContact = form.contacts[0] || { name: 'Maria Santos', email: 'maria@empresa.com', company: '' };
  const previewCompany = firstContact.company || form.companyName || 'sua empresa';
  const previewSubject = applyPreview(form.subjectTemplate, firstContact, previewCompany);
  const previewMessage = applyPreview(form.messageTemplate, firstContact, previewCompany);
  const validContacts = form.contacts.filter((contact) => (
    contact.name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())
  ));
  const uniqueCompanies = new Set(
    form.contacts
      .map((contact) => contact.company || form.companyName)
      .filter(Boolean)
  ).size;
  const estimatedMinutes = Math.max(1, Math.ceil(validContacts.length * 0.1));

  return (
    <form className="automation-panel" onSubmit={onSubmit}>
      <div className="automation-hero">
        <div>
          <span className="eyebrow">Campanha inteligente</span>
          <h2>Envie emails personalizados em lote</h2>
          <p>Monte os contatos manualmente, cole uma lista inteira ou ajuste templates prontos antes de disparar.</p>
        </div>
        <div className="campaign-metrics">
          <article>
            <span>Destinatarios</span>
            <strong>{validContacts.length}/{form.contacts.length}</strong>
          </article>
          <article>
            <span>Empresas</span>
            <strong>{uniqueCompanies}</strong>
          </article>
          <article>
            <span>Tempo estimado</span>
            <strong>{estimatedMinutes} min</strong>
          </article>
        </div>
      </div>

      <div className="tool-header">
        <div>
          <span className="eyebrow">Projeto integrado</span>
          <h2>Automatizador de email</h2>
        </div>
        <div className="tool-actions">
          <button className="secondary-button compact" type="button" onClick={onToggleTutorial}>
            {showTutorial ? 'Fechar tutorial' : 'Como pegar token'}
          </button>
          <button className="secondary-button compact" type="button" onClick={onAddContact}>
            Adicionar contato
          </button>
        </div>
      </div>

      {showTutorial && <SmtpTutorial />}

      <div className="quick-actions">
        <button type="button" onClick={() => onApplyTemplate('prospeccao')}>
          Prospeccao
        </button>
        <button type="button" onClick={() => onApplyTemplate('entrevista')}>
          Entrevista
        </button>
        <button type="button" onClick={() => onApplyTemplate('followup')}>
          Follow-up
        </button>
      </div>

      <div className="mode-choice" role="radiogroup" aria-label="Modo de envio">
        <button
          className={form.sendMode === 'preview' ? 'active' : ''}
          type="button"
          onClick={() => onFieldChange('sendMode', 'preview')}
        >
          <strong>Preview seguro</strong>
          <span>Monta os emails sem enviar</span>
        </button>
        <button
          className={form.sendMode === 'real' ? 'active danger' : ''}
          type="button"
          onClick={() => onFieldChange('sendMode', 'real')}
        >
          <strong>Enviar real</strong>
          <span>Usa seu token SMTP neste envio</span>
        </button>
      </div>

      {form.sendMode === 'real' && (
        <div className="smtp-panel">
          <div>
            <span className="eyebrow">Credenciais temporarias</span>
            <strong>Esses dados nao sao salvos no banco.</strong>
          </div>
          <div className="campaign-grid smtp-grid">
            <label className="field">
              <span>Email remetente</span>
              <input
                type="text"
                inputMode="email"
                value={form.smtp.user}
                onChange={(event) => onSmtpChange('user', event.target.value)}
                placeholder="seu-email@gmail.com"
              />
            </label>
            <label className="field">
              <span>Senha de app / token SMTP</span>
              <input
                type="password"
                value={form.smtp.pass}
                onChange={(event) => onSmtpChange('pass', event.target.value)}
                placeholder="16 caracteres do Gmail"
              />
            </label>
            <label className="field">
              <span>Servidor SMTP</span>
              <input
                type="text"
                value={form.smtp.host}
                onChange={(event) => onSmtpChange('host', event.target.value)}
                placeholder="smtp.gmail.com"
              />
            </label>
            <label className="field">
              <span>Porta</span>
              <input
                type="number"
                value={form.smtp.port}
                onChange={(event) => onSmtpChange('port', event.target.value)}
                placeholder="587"
              />
            </label>
          </div>
        </div>
      )}

      <div className="campaign-grid">
        <label className="field">
          <span>Empresa padrao</span>
          <input
            type="text"
            value={form.companyName}
            onChange={(event) => onFieldChange('companyName', event.target.value)}
            placeholder="Ex: Tech Solutions"
          />
        </label>

        <label className="field">
          <span>Assunto</span>
          <input
            type="text"
            value={form.subjectTemplate}
            onChange={(event) => onFieldChange('subjectTemplate', event.target.value)}
            placeholder="Use {{nome}} e {{empresa}}"
          />
        </label>
      </div>

      <label className="field">
        <span>Mensagem</span>
        <textarea
          value={form.messageTemplate}
          onChange={(event) => onFieldChange('messageTemplate', event.target.value)}
          rows="8"
          placeholder="Use {{nome}}, {{empresa}} e {{email}} para personalizar"
        />
      </label>

      <div className="live-preview">
        <span className="eyebrow">Preview ao vivo</span>
        <strong>{previewSubject}</strong>
        <p>{previewMessage}</p>
      </div>

      <div className="bulk-import-panel">
        <div className="bulk-copy">
          <span className="eyebrow">Adicionar em massa</span>
          <strong>Cole uma lista no formato nome,email,empresa</strong>
          <p>Uma pessoa por linha. A empresa pode ficar vazia se voce usar a empresa padrao.</p>
        </div>
        <textarea
          value={bulkContactsText}
          onChange={(event) => onBulkContactsTextChange(event.target.value)}
          rows="4"
          placeholder="Ana Oliveira,ana@empresa.com,Cloud Services"
        />
        <div className="bulk-actions">
          <button className="secondary-button compact" type="button" onClick={onLoadSampleContacts}>
            Carregar exemplo
          </button>
          <button className="secondary-button compact" type="button" onClick={onImportBulkContacts}>
            Importar lista
          </button>
          <button className="remove-button compact" type="button" onClick={onClearContacts}>
            Limpar contatos
          </button>
        </div>
      </div>

      <div className="contact-list">
        {form.contacts.map((contact, index) => (
          <div className="contact-row" key={index}>
            <label className="field">
              <span>Nome</span>
              <input
                type="text"
                value={contact.name}
                onChange={(event) => onContactChange(index, 'name', event.target.value)}
                placeholder="Maria Santos"
              />
            </label>
            <label className="field">
              <span>Email</span>
              <input
                type="text"
                inputMode="email"
                value={contact.email}
                onChange={(event) => onContactChange(index, 'email', event.target.value)}
                placeholder="maria@empresa.com"
              />
            </label>
            <label className="field">
              <span>Empresa</span>
              <input
                type="text"
                value={contact.company}
                onChange={(event) => onContactChange(index, 'company', event.target.value)}
                placeholder="Opcional"
              />
            </label>
            <button
              className="remove-button"
              type="button"
              onClick={() => onRemoveContact(index)}
              disabled={form.contacts.length === 1}
            >
              Remover
            </button>
            <button
              className="secondary-button row-action"
              type="button"
              onClick={() => onDuplicateContact(index)}
              disabled={form.contacts.length >= 20}
            >
              Duplicar
            </button>
          </div>
        ))}
      </div>

      <button className="primary-button" disabled={loading} type="submit">
        {loading ? (
          <>
            <span className="spinner" aria-hidden="true"></span>
            Processando
          </>
        ) : (
          form.sendMode === 'real' ? 'Enviar campanha real' : 'Gerar preview'
        )}
      </button>

      {message && (
        <div className={`message ${result || message.includes('importado') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {result && (
        <div className="result-panel">
          <div>
            <strong>{result.previewOnly ? 'Preview sem envio real' : 'Campanha enviada'}</strong>
            <span>{result.recipientsCount} destinatario(s) processado(s)</span>
          </div>
          {result.results.slice(0, 3).map((item) => (
            <article key={`${item.email}-${item.subject}`}>
              <span>{item.name} - {item.email}</span>
              <strong>{item.subject}</strong>
              {item.message && <p>{item.message}</p>}
            </article>
          ))}
        </div>
      )}
    </form>
  );
}

function SmtpTutorial() {
  return (
    <div className="tutorial-panel">
      <div>
        <span className="step-number">1</span>
        <strong>Ative a verificacao em duas etapas</strong>
        <p>No Google, abra seguranca da conta e ative a verificacao em duas etapas.</p>
      </div>
      <div>
        <span className="step-number">2</span>
        <strong>Crie uma senha de app</strong>
        <p>Pesquise por Senhas de app, escolha Email e copie o codigo de 16 caracteres.</p>
      </div>
      <div>
        <span className="step-number">3</span>
        <strong>Cole aqui somente para enviar</strong>
        <p>O token vai para o backend no envio atual e nao e salvo no SQLite.</p>
      </div>
    </div>
  );
}

function AccountPanel({ user }) {
  return (
    <>
      <div className="account-grid">
        <article>
          <span>Email</span>
          <strong>{user.email}</strong>
        </article>
        <article>
          <span>ID do usuario</span>
          <strong>{user.id.slice(0, 8)}</strong>
        </article>
        <article>
          <span>Conta criada</span>
          <strong>{new Date(user.createdAt).toLocaleDateString('pt-BR')}</strong>
        </article>
      </div>

      <div className="feature-list">
        <div>
          <strong>Login protegido</strong>
          <span>O painel so aparece depois de validar o token JWT.</span>
        </div>
        <div>
          <strong>Banco SQLite</strong>
          <span>Usuarios e campanhas ficam registrados no backend.</span>
        </div>
        <div>
          <strong>Automacao integrada</strong>
          <span>O envio de email usa os dados digitados na tela.</span>
        </div>
      </div>
    </>
  );
}

function getPasswordStrength(password) {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { level: 'weak', label: 'Senha fraca' };
  if (score <= 3) return { level: 'medium', label: 'Senha media' };
  return { level: 'strong', label: 'Senha forte' };
}

function applyPreview(template, contact, company) {
  return template
    .replaceAll('{{nome}}', contact.name || 'Maria Santos')
    .replaceAll('{{empresa}}', company)
    .replaceAll('{{email}}', contact.email || 'maria@empresa.com');
}

function parseBulkContacts(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name = '', email = '', company = ''] = line.split(/[,;\t]/).map((part) => part.trim());

      return { name, email, company };
    })
    .filter((contact) => contact.name && contact.email);
}

function mergeContacts(currentContacts, importedContacts) {
  const filledCurrentContacts = currentContacts.filter((contact) => (
    contact.name.trim() || contact.email.trim() || contact.company.trim()
  ));
  const merged = [...filledCurrentContacts, ...importedContacts];
  const seenEmails = new Set();

  return merged.filter((contact) => {
    const email = contact.email.toLowerCase();

    if (seenEmails.has(email)) {
      return false;
    }

    seenEmails.add(email);
    return true;
  });
}

export default App;
