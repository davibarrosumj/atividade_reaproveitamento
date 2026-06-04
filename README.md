# Sistema de Gestao de Estacionamento

Aplicacao web simples em Node.js, Express, EJS, Sequelize e PostgreSQL para evoluir um sistema de estacionamento a partir do backlog documentado em `docs/backlog.md`.

## Status atual

O projeto possui autenticação básica com sessão e JWT, cadastro de usuários com três perfis distintos, controle de ocupação e capacidade, além de painel para entrada e saída de veículos.

Funcionalidades concluídas:

- US01: exibição de vagas disponíveis, porcentagem de ocupação e edição administrativa da capacidade.
- US02: entrada e saída de veículos com controle de vagas em tempo real e validação de placas.
- US05: cadastro de usuários com diferenciação de perfis (simples, super e power).

Funcionalidades em andamento:

- Nenhuma.

Funcionalidades ainda não iniciadas:

- Controle e consumo de tíquetes.
- Relatórios, estatísticas e histórico de uso.

## Perfis de usuário

Os perfis de usuário são definidos pela coluna única `userType`:

- `'simple'`: usuário comum, acessa o dashboard de usuário com visualização de vagas.
- `'super'`: administrador, acessa o dashboard administrativo, edita capacidade e gerencia veículos.
- `'power'`: power user, acessa o dashboard de usuário mas possui atalho exclusivo para criar novos administradores.

O power user é garantido no início da aplicação (`sequelize.sync({ force: true })`):

- **Power User**:
  - Nome: `admin`
  - Email: `admin@mail.com`
  - Senha: definida em `POWER_USER_PASSWORD`

## Configuracao

Variaveis usadas no `.env`:

```env
DB_NAME="estacionamento"
DB_USER="postgres"
DB_HOST="localhost"
DB_PASSWORD="..."
SESSION_SECRET="..."
JWT_SECRET="..."
POWER_USER_PASSWORD="..."
PORT=3000
ESTACIONAMENTO_CAPACIDADE_TOTAL=150
```

`JWT_SECRET` assina as credenciais mantidas na sessao.

## Autenticacao e mensagens

- O login cria uma sessao Express e armazena um JWT assinado em `req.session.authToken`.
- Rotas autenticadas usam `authMiddleware`, que exige JWT valido.
- Rotas que precisam apenas saber o perfil usam `adminStatusMiddleware`, que calcula privilegios sem bloquear acesso publico.
- Mensagens de erro e sucesso usam `connect-flash` e o partial `views/partials/flashMessages.ejs`.

## Rotas principais

- `GET /`: tela de login.
- `GET /cadastro`: tela de cadastro.
- `POST /cadastro`: cria usuario comum ou, se a sessao for do power user, administrador.
- `POST /login`: autentica e redireciona para `/dashboard`.
- `GET /dashboard`: renderiza o dashboard correto conforme o perfil da sessao.
- `POST /dashboard/capacidade`: altera a capacidade total de vagas, apenas para administradores.
- `POST /logout`: encerra a sessao.

No dashboard administrativo, o power user tambem ve um atalho para cadastrar novos administradores.

## Front-end

Arquivos JavaScript de interacao das views ficam em `public/` e sao servidos pelo Express como arquivos estaticos.

## Testes

`npm test` executa `scripts/test.js`, que valida a sintaxe dos arquivos JavaScript principais e renderiza as views EJS com dados minimos.

## Observacao de desenvolvimento

Atualmente `sequelize.sync({ force: true })` ainda recria o banco ao iniciar a aplicacao. Isso ajuda no ciclo inicial de desenvolvimento, mas deve ser substituido por migrations ou sincronizacao nao destrutiva antes de preservar dados reais.
