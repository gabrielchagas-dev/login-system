# Sistema de Login

Sistema de autenticacao full stack com React no frontend e Node.js/Express no backend.
O projeto demonstra um fluxo completo de cadastro, login, sessao com JWT, rota protegida
e persistencia de usuarios em SQLite.
Depois do login, o usuario acessa um automatizador de email integrado ao painel.

## Funcionalidades

- Cadastro de usuario com nome, email e senha
- Login com validacao de credenciais
- Persistencia dos usuarios em banco SQLite
- Hash de senha com `bcryptjs`
- Autenticacao com token JWT
- Rota protegida `/api/me`
- Validacao de email e senha no frontend e no backend
- Bloqueio de email duplicado
- Rate limit nas rotas de autenticacao
- Painel privado com dados do usuario logado
- Automatizador de email sem CSV, preenchido pela tela
- Importacao em massa por texto colado ou dados de planilha
- Templates com `{{nome}}`, `{{empresa}}` e `{{email}}`
- Modelos prontos de mensagem para prospeccao, entrevista e follow-up
- Preview ao vivo e indicadores de destinatarios, empresas e tempo estimado
- Modo preview seguro antes de enviar
- Envio real pela tela usando email e senha de app/token SMTP
- Tutorial integrado para orientar a criacao do token
- Registro das campanhas no SQLite
- Logout com limpeza da sessao local

## Tecnologias

### Frontend

- React
- CSS responsivo
- Fetch API
- Local Storage para guardar o token da sessao

### Backend

- Node.js
- Express
- SQLite
- bcryptjs
- jsonwebtoken
- helmet
- express-rate-limit
- nodemailer

## Como Rodar

### Pre-requisitos

- Node.js instalado
- npm instalado

### Jeito mais simples

Na pasta raiz do projeto:

```bash
npm install
npm run install:all
npm run dev
```

Depois abra o site em `http://localhost:3000`.

Importante: `http://localhost:5000` e as rotas `/api/...` sao apenas a API do
backend. Elas nao sao paginas do site. O navegador deve abrir o frontend em
`http://localhost:3000`.

### Backend

```bash
cd backend
npm install
npm start
```

A API vai rodar em `http://localhost:5000`.
Na primeira execucao, o backend cria automaticamente o arquivo
`backend/database.sqlite` e as tabelas `users` e `email_campaigns`.

### Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm start
```

O React vai abrir em `http://localhost:3000`.

## Variaveis de Ambiente

O backend funciona sem configuracao extra em modo local, mas em producao defina:

```bash
JWT_SECRET=sua-chave-secreta
CLIENT_URL=http://localhost:3000
PORT=5000
DATABASE_URL=./database.sqlite
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
SMTP_FROM=seu-email@gmail.com
```

Sem `SMTP_USER` e `SMTP_PASS`, o automatizador continua funcionando em modo
preview. Para envio real existem duas opcoes:

- configurar as variaveis SMTP no backend
- informar email remetente e senha de app/token SMTP diretamente na tela

Quando o token e informado na tela, ele e usado apenas naquele envio e nao e
salvo no SQLite.

No frontend, se a API estiver em outro endereco:

```bash
REACT_APP_API_URL=http://localhost:5000
```

## Como o Banco Funciona

O arquivo [backend/database.js](backend/database.js) abre a conexao com o SQLite
e cria a tabela `users` caso ela ainda nao exista.
Tambem cria a tabela `email_campaigns`, usada para registrar as automacoes de
email feitas pelo usuario logado.

A tabela possui estes campos:

| Campo | Funcao |
| --- | --- |
| `id` | Identificador unico do usuario |
| `name` | Nome do usuario |
| `email` | Email unico usado no login |
| `password_hash` | Senha criptografada com bcrypt |
| `created_at` | Data de criacao da conta |

### Tabela `email_campaigns`

| Campo | Funcao |
| --- | --- |
| `id` | Identificador unico da campanha |
| `user_id` | Usuario que executou a automacao |
| `company_name` | Empresa padrao informada na tela |
| `subject_template` | Assunto com placeholders |
| `message_template` | Mensagem com placeholders |
| `recipients_count` | Quantidade de destinatarios |
| `preview_only` | Indica se foi apenas preview |
| `created_at` | Data de criacao da campanha |

O arquivo `backend/database.sqlite` fica fora do Git por seguranca. Assim, o
repositorio guarda o codigo, mas nao guarda dados reais de usuarios.

## Automatizador de Email

O projeto original em Python usava um arquivo CSV com colunas `nome`, `email` e
`empresa`. Nesta versao web, esses dados sao digitados diretamente na tela apos
o login.

O usuario pode:

- informar uma empresa padrao
- adicionar um ou mais contatos manualmente
- colar varios contatos de uma vez no formato `nome,email,empresa`
- importar dados separados por virgula, ponto e virgula ou tabulacao
- duplicar contatos para ganhar tempo
- personalizar assunto e mensagem
- escolher templates prontos
- usar placeholders como `{{nome}}`, `{{empresa}}` e `{{email}}`
- ver um preview ao vivo da primeira mensagem
- abrir um tutorial para gerar senha de app do Gmail
- gerar preview sem enviar nada
- enviar emails reais informando credenciais SMTP temporarias na tela

Para Gmail, normalmente e necessario ativar verificacao em duas etapas e criar
uma senha de app. A senha normal da conta nao deve ser usada.

## Rotas da API

| Metodo | Rota | Descricao |
| --- | --- | --- |
| `GET` | `/api/health` | Verifica se a API esta online |
| `POST` | `/api/register` | Cadastra usuario no SQLite e retorna token |
| `POST` | `/api/login` | Autentica usuario buscando no SQLite |
| `GET` | `/api/me` | Retorna o usuario logado usando Bearer Token |
| `POST` | `/api/email-campaigns` | Processa uma campanha de email protegida por login |

## Proximos Passos

- Criar migrations versionadas para evoluir o banco com seguranca
- Adicionar tela de edicao de perfil
- Adicionar recuperacao de senha
- Adicionar historico visual das campanhas no frontend
- Trocar SQLite por PostgreSQL em producao, se o projeto crescer
