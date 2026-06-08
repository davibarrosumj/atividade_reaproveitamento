# Atividade de Reaproveitamento & Segurança de Login

Este projeto é uma aplicação web desenvolvida em Node.js com Express, Sequelize (PostgreSQL) e templates EJS. A plataforma gerencia o reaproveitamento de itens doados através de um sistema de créditos, estendida com recursos avançados de segurança, controle físico de armazém (triagem e estocagem), simulação de sorteios periódicos de créditos com histórico paginado, tratamento centralizado de erros e testes automatizados.

## 🚀 Funcionalidades Implementadas

### 1. Fluxo de Autenticação & Cadastro Seguro
* **Cadastro Completo (`/register`)**: Interface amigável para criação de novas contas com verificação de campos vazios, formato do e-mail, senhas que não coincidem e duplicidade no banco de dados.
* **Política de Senhas Fortes**: Exigência de senhas seguras (mínimo de 8 caracteres, contendo pelo menos 1 letra maiúscula, 1 minúscula e 1 número).
* **Proteção de Rotas & Sessão**: Middlewares de autenticação que impedem acessos não autorizados ao painel e redirecionam usuários logados que tentam acessar as páginas de Login ou Registro.
* **Correção de Vulnerabilidade de Logout**: Garantia de que o cookie do token JWT é devidamente invalidado e limpo ao encerrar a sessão.

### 2. Painel de Controle & Edição de Perfil
* **Editar Perfil**: Opção integrada no Dashboard para alterar Nome, E-mail e Senha.
* **Verificação de Senha Atual**: Por motivos de segurança, qualquer alteração cadastral exige a validação da senha atual.
* **Atualização Dinâmica de Sessão**: Ao salvar as alterações, um novo cookie de token JWT é emitido de forma transparente, atualizando as informações no cabeçalho sem deslogar o usuário.

### 3. Processo de Triagem e Armazenamento (Warehouse Entry)
* **Entrada de Itens e Triagem**: Quando um doador cadastra um produto, este fica oculto na listagem geral e aguarda inspeção física no armazém. O administrador local avalia o item, definindo sua condição (`Perfeito`, `Bom`, `Regular`, `Ruim`, `Quebrado`) e um código de estocagem.
* **Validação do Formato de Estocagem**: O código de estocagem inserido é validado tanto no front-end quanto no back-end seguindo o padrão rígido de localização `Letra+Número-Letra+Número` (ex: `A1-S2`, `F12-B09`).
* **Confirmação ou Cancelamento pelo Doador**: No histórico do usuário doador, o item aparece com o status "Triado". O doador pode ver a classificação atribuída pelo administrador e escolher entre **Confirmar Doação** (tornando o item disponível para resgate público) ou **Cancelar Doação** (retirando o item do fluxo).
* **Controle de Saída Física**: Quando um usuário resgata um produto, o item entra em estado pendente de retirada. O administrador realiza a entrega física no armazém e confirma a saída no sistema alterando o status para `collected`.

### 4. Simulação de Sorteios & Histórico Paginado
* **Painel de Sorteios (`/admin/sorteios`)**: Interface administrativa exclusiva para gerenciar a simulação de sorteios periódicos.
* **Distribuição de Créditos**: O sistema seleciona aleatoriamente um usuário comum cadastrado (não-administrador) e concede um bônus de créditos (R$ 50,00 ou R$ 100,00).
* **Histórico de Sorteios**: Todos os sorteios realizados são persistidos em tabela própria no banco de dados (`Draw`) e exibidos em uma listagem paginada (10 itens por página) detalhando o vencedor (Nome/E-mail), bônus concedido, data/hora e o admin responsável pela simulação.

### 5. Reaproveitamento de Código (EJS Partials)
As views utilizam partials para evitar duplicações de cabeçalhos HTML, importações de CSS (Bootstrap 5/Bootstrap Icons) e componentes comuns:
* `views/partials/head.ejs`: Meta tags de responsividade, descrição e link do Bootstrap 5 (com suporte a título dinâmico).
* `views/partials/navbar.ejs`: Barra de navegação com perfil, saldo em créditos, links de administração visíveis condicionalmente e botão de logout.
* `views/partials/alerts.ejs`: Alertas de sucesso e erro unificados para mensagens flash de validação.
* `views/partials/footer.ejs`: Scripts comuns e bundle do Bootstrap 5.

### 5.1. Reaproveitamento de Código (Utilitário JWT Compartilhado)
A lógica duplicada de geração de tokens JWT e configuração de cookies, que existia tanto no `authController` quanto no `dashController`, foi consolidada em um utilitário compartilhado:
* `utils/token.js`: Exporta `generateToken(user)` para criação padronizada do token JWT e `setTokenCookie(res, token)` para configuração segura do cookie (`httpOnly`, `secure`, `sameSite`).

### 5.2. Padronização Visual (Global CSS)
Todo o estilo das páginas foi unificado em um único arquivo de estilos globais (`public/css/style.css`), eliminando o uso de blocos `<style>` inline nas views e garantindo uma experiência visual consistente (homogênea) em toda a aplicação:
* **Classes Utilitárias Compartilhadas**: Criação de classes como `.app-card`, `.app-tabs` e `.page-header` para que painéis, abas e cabeçalhos de todas as telas possuam a mesma cor, sombra e formato (border-radius).
* **Containers Responsivos**: Uso da classe `.page-container` limitando a largura máxima (`max-width: 960px`) com responsividade atrelada ao framework, garantindo perfeita adaptação no redimensionamento da janela do navegador para todas as abas.
* **Cores e Tema Homogêneos**: Toda a paleta de cores, botões de ação e ícones de cabeçalho foram alinhados visualmente para usar o tema primário do sistema, eliminando discrepâncias entre o dashboard do usuário e o painel de administração.

### 6. Tratamento Centralizado de Erros
* **Error Middleware**: Middleware global do Express registrado após as rotas para interceptar quaisquer exceções inesperadas do servidor.
* **Página de Erro Personalizada (`views/error.ejs`)**: Tela amigável para exibição de erros.
* **Exposição de Stack Trace Condicional**: O stack trace detalhado do erro só é renderizado em tela se a variável de ambiente `NODE_ENV` estiver configurada como `development` (ocultado em produção por motivos de segurança).

### 7. Seeding Automático do Banco de Dados
* Caso a tabela `Users` esteja vazia na inicialização do servidor, o sistema cria automaticamente as contas de teste usando a senha definida na variável de ambiente `PU_PASSWORD`:
  * **Administrador**: `admin@mail.com` (nível administrativo)
  * **Usuário Comum 1**: `user@mail.com` (nível comum)
  * **Usuário Comum 2**: `user2@mail.com` (nível comum)
* Administradores são impedidos de realizar doações, resgatar itens ou participar de sorteios para manter a integridade das regras de negócio.

### 8. Arquitetura Modular de Controllers
O código do servidor segue uma arquitetura de controllers por domínio, onde cada arquivo de rotas importa exclusivamente do seu controller correspondente:
* `controllers/authController.js`: Cadastro, login e logout de usuários.
* `controllers/dashController.js`: Exibição e edição do perfil no dashboard.
* `controllers/donationController.js`: Listagem, criação, resgate de doações e confirmação/cancelamento de triagem pelo doador.
* `controllers/drawController.js`: Simulação de sorteios e exibição do histórico paginado de sorteios.
* `controllers/warehouseController.js`: Painel de armazenagem, confirmação de entrada (triagem) e saída (entrega física) de itens.
* `controllers/historyController.js`: Exibição do histórico de itens doados e recebidos pelo usuário.

---

## 🛠️ Instalação e Execução

### 1. Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto com a seguinte estrutura:

```env
DB_NAME="reaproveitamento"
DB_USER="..."
DB_HOST="localhost"
DB_PASSWORD="..."
SESSION_SECRET="..."
JWT_SECRET="..."
PU_PASSWORD="..."
PORT=3000
```

### 2. Passos para Executar
1. Instale as dependências do projeto:
   ```bash
   npm install
   ```
2. Inicie o servidor da aplicação:
   ```bash
   npm run dev
   # ou usando nodemon diretamente
   npx nodemon app.js
   ```
3. Acesse em seu navegador: `http://localhost:3000`

---

## 🧪 Testes Automatizados

O projeto contém uma suíte completa de testes unitários desenvolvidos sobre o **Node.js Native Test Runner** (zero dependências extras de frameworks de teste) e stubs de banco de dados para testar stubs de forma isolada e performática.

Para executar a suíte completa de testes, utilize o comando:
```bash
npm test
```

### Escopo dos testes (83 casos de testes no total):

Os testes estão organizados em arquivos separados por domínio, espelhando a estrutura dos controllers:

| Arquivo de Teste | Domínio | Nº de Testes |
|---|---|---|
| `tests/auth.test.js` | Autenticação, sessão e middlewares de acesso | 21 |
| `tests/donation.test.js` | Doações, créditos e triagem pelo doador | 29 |
| `tests/warehouse.test.js` | Entrada/saída de itens no armazém | 11 |
| `tests/draw.test.js` | Simulador e histórico de sorteios | 4 |
| `tests/history.test.js` | Página de histórico do usuário | 2 |
| `tests/profile.test.js` | Edição de perfil no dashboard | 9 |
| `tests/seeder.test.js` | Seeder automático do banco de dados | 3 |
| `tests/error.test.js` | Error middleware e ocultação de logs | 4 |
