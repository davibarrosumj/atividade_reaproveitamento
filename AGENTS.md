# Agent Development Notes

Estas praticas devem orientar as proximas features deste projeto.

## Arquitetura

- Manter MVC estrito:
  - `app.js` ve apenas configuracao Express e `routes`.
  - `routes` ve apenas `controllers` e `middlewares`.
  - `controllers` podem ver `models`.
  - `models` representam dados e persistencia via Sequelize.
- Evitar colocar regras de dominio diretamente em `app.js`.
- Evitar criar novas camadas ou bibliotecas sem necessidade clara.
- `app.js` pode configurar middlewares globais de infraestrutura, como sessao, flash, arquivos estaticos e `routes`.
- Helpers compartilhados de autenticacao podem ficar em `middlewares` quando servirem aos middlewares, sem virar uma nova camada de dominio.

## Estilo de implementacao

- Priorizar simplicidade acima de tudo.
- Seguir o padrao de codigo existente: CommonJS, controllers pequenos, EJS e Bootstrap via CDN.
- Fazer fatias pequenas e funcionais do backlog.
- Manter a stack atual: Node.js, Express, EJS, Sequelize e PostgreSQL.
- Evitar refatoracoes amplas que nao sejam necessarias para a feature atual.
- Manter JavaScript de interacao de views em `public/`, servido pelo Express com `express.static`.
- Evitar scripts inline nas views quando a interacao puder viver em arquivo JS pequeno e especifico da tela.
- Usar partials EJS para elementos repetidos de interface, como mensagens flash.
- Usar mensagens de formulario com `connect-flash` em fluxos server-rendered, redirecionando apos POST quando fizer sentido.
- Atualizar `README.md` quando uma mudanca estrutural alterar configuracao, rotas, autenticacao, front-end ou testes.

## Autenticacao e sessao

- `SESSION_SECRET` protege a sessao Express.
- `JWT_SECRET` assina o JWT guardado em `req.session.authToken`; nao usar fallback para `SESSION_SECRET`.
- O login deve assinar no JWT apenas dados essenciais do usuario: `id`, `name`, `email` e `userType`.
- `authMiddleware` representa autenticacao obrigatoria: sem JWT valido, a rota deve redirecionar para login.
- `adminStatusMiddleware` calcula permissões sem bloquear rotas: define `req.isAdmin`, `req.isPowerUser` e `req.canCreateAdmin` a partir de `userType`.
- `authorize` é o middleware único de autorização que restringe acesso a rotas baseado nos perfis fornecidos (ex: `authorize(['super'])`).
- `cadastroAccessMiddleware` protege a rota de cadastro de administrador limitando o acesso a usuários do tipo `'power'`.

## Usuarios e privilegios

- `User` e o model Sequelize base. A flag `isPowerUser` foi descontinuada.
- Os perfis são definidos estritamente na coluna `userType` com os valores:
  - `'simple'`: Usuário comum, acessa o painel de vagas básico.
  - `'super'`: Administrador, gerencia entrada/saída de veículos e altera capacidade total.
  - `'power'`: Power User, acessa o painel básico mas tem acesso exclusivo a criar novos administradores.
- O power user inicial continua garantido durante a inicializacao.
- `isAdmin` deriva de `userType === 'super'`.
- `canCreateAdmin` deriva de `userType === 'power'`.

## Dashboards

- A rota publica do painel deve permanecer `/dashboard` (usando o prefixo `/dashboard` registrado globalmente no `app.js`).
- A escolha entre `dashboardUser` e `dashboardManager` deve ser feita no controller baseando-se no `req.isAdmin`.
- O dashboard do power user (que renderiza `dashboardUser.ejs` porque ele possui `userType === 'power'`) deve exibir o atalho para cadastrar novos administradores se `canCreateAdmin` for verdadeiro.

## Backlog

- Atualizar `docs/backlog.md` sempre que uma historia avancar.
- Usar status simples: `Nao iniciado`, `Em andamento`, `Concluido`.
- Registrar observacoes curtas sobre o que foi entregue e o que falta.

## Testes

- `npm test` deve executar algo efetivo.
- O teste atual em `scripts/test.js` deve continuar cobrindo sintaxe dos principais arquivos JavaScript e renderizacao basica das views EJS.
- Ao adicionar novo arquivo JavaScript relevante ou view EJS principal, atualizar `scripts/test.js`.

## Progresso recente

- US01 concluida: dashboards exibem vagas disponiveis/ocupacao e administrador pode editar a capacidade total de vagas.
- US02 concluida: página dedicada `/veiculos/registro` para entrada e saída de veículos, com controle de vagas e validação rígida de placas brasileiras.
- US05 concluida: cadastro com diferenciação de usuários consolidada no campo único `userType` ('simple', 'super', 'power').
- Separação de rotas concluída: rotas divididas em arquivos específicos (`authRoutes.js`, `dashboardRoutes.js`, `veiculoRoutes.js`) e prefixadas a partir do `app.js`.
- Introdução de middleware de autorização único (`authorize.js`) para proteção de rotas por perfis.
