# Sistema de Gestao de Estacionamento

Aplicacao web simples em Node.js, Express, EJS, Sequelize e PostgreSQL para evoluir um sistema de estacionamento a partir do backlog documentado em `docs/backlog.md`.

## Status atual

O projeto possui autenticação básica com sessão e JWT, cadastro de usuários com três perfis distintos, controle de ocupação e capacidade, painel para entrada e saída de veículos com validação de placas, e controle e consumo de tíquetes (devedores/pagamentos).

Funcionalidades concluídas:

- US01: exibição de vagas disponíveis, porcentagem de ocupação e visualização da capacidade total de vagas.
- US02: entrada e saída de veículos com controle de vagas em tempo real e validação de placas.
- US03: controle e consumo de tíquetes com geração automática de código único (`TK-XXXXXX`), suporte a pagamento pré-pago/pós-pago, validação de reentrada de devedores, quitação de débitos, registro de saídas indevidas e auditoria.
- US05: cadastro de usuários com diferenciação de perfis (simples, super e power).

Funcionalidades em andamento:

- Nenhuma.

Funcionalidades ainda não iniciadas:

- Relatórios, estatísticas e histórico de uso.

## Perfis de usuário

Os perfis de usuário são definidos pela coluna única `userType`:

- `'super'`: Super User, acessa o dashboard contendo atalho exclusivo para criar novos operadores (`'simple'`).
- `'simple'`: Simple User (operador), acessa o dashboard administrativo para gerenciar entrada/saída de veículos, tíquetes e devedores.

O Super User é garantido no início da aplicação (`sequelize.sync({ force: true })`):

- **Super User**:
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
TIQUETE_VALOR_PADRAO=4.00
```

`JWT_SECRET` assina as credenciais mantidas na sessao.

## Autenticacao e mensagens

- O login cria uma sessao Express e armazena um JWT assinado em `req.session.authToken`.
- Rotas autenticadas usam `authMiddleware`, que exige JWT valido.
- Rotas que precisam apenas saber o perfil usam `adminStatusMiddleware`, que calcula privilegios sem bloquear acesso publico.
- Mensagens de erro e sucesso usam `connect-flash` e o partial `views/partials/flashMessages.ejs`.

## Rotas principais

- `GET /`: tela de login.
- `GET /cadastro`: tela de cadastro (restrito a Super Users).
- `POST /cadastro`: cria novo operador (tipo `'simple'`) (restrito a Super Users).
- `POST /login`: autentica e redireciona para `/dashboard`.
- `GET /dashboard`: renderiza o dashboard correto conforme o perfil da sessao.
- `POST /logout`: encerra a sessao.
- `GET /veiculos/registro`: painel de entrada e saída de veículos (apenas administradores).
- `POST /veiculos/registro/entrada`: registra a entrada de um veículo e gera o tíquete correspondente.
- `POST /veiculos/registro/saida/:id`: registra a saída regular de um veículo (apenas se o tíquete correspondente estiver pago).
- `POST /veiculos/registro/saida-indevida/:id`: registra a saída indevida de um veículo (libera a vaga e insere na lista de devedores).
- `GET /tiquetes`: lista e histórico de todos os tíquetes emitidos.
- `GET /tiquetes/devedores`: lista de veículos devedores com débito pendente.
- `POST /tiquetes/pagar/:id`: liquida a dívida de um tíquete (quitação/pagamento).

No dashboard do Super User, há um atalho para cadastrar novos operadores.

## Front-end

Arquivos JavaScript de interacao das views ficam em `public/` e sao servidos pelo Express como arquivos estaticos.

## Testes

`npm test` executa `scripts/test.js`, que valida a sintaxe dos arquivos JavaScript principais e renderiza as views EJS com dados minimos.

## Observacao de desenvolvimento

Atualmente `sequelize.sync({ force: true })` ainda recria o banco ao iniciar a aplicacao. Isso ajuda no ciclo inicial de desenvolvimento, mas deve ser substituido por migrations ou sincronizacao nao destrutiva antes de preservar dados reais.
