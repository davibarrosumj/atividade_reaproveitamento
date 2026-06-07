# Introdução

Sistema web criado para facilitar o compartilhamento de materiais e equipamentos através de doações. 

Qualquer usuário cadastrado pode registrar um item para doação ou receber um item disponibilizado por outro usuário. 

O sistema busca incentivar a reutilização de materiais, reduzir desperdícios e fortalecer a colaboração dentro da comunidade. 

# Objetivos 

- Facilitar a doação de materiais.
- Facilitar o recebimento de materiais.
- Reduzir desperdícios.
- Promover reutilização de equipamentos.
- Incentivar a colaboração comunitária.

# Atores

## Usuário

Único ator do sistema.

### O que ele deseja?

- Criar uma conta.
- Fazer login.
- Registrar uma doação.
- Visualizar doações disponíveis.
- Fazer uma troca.
- Consultar seu histórico.

# Objetos do Sistema

## Usuário

Representa uma pessoa cadastrada.

### O que faz?

- Autentica-se no sistema.
- Registra doações.
- Troca de itens.

### Atributos

- id  
- nome  
- email  
- senha  

## Doação

Representa um item disponibilizado.

### O que faz?

- Armazena informações do item.
- Disponibiliza o item para outros usuários.

### Atributos

- id
- nome
- descricao
- categoria
- foto
- dataCadastro
- usuarioId

# Relacionamentos

- Um usuário pode ter muitas doações.
- Uma doação pertence a um usuário.

# Requisitos funcionais

## RF01 – Cadastro de Usuário

### Objetivo

Permitir que pessoas criem uma conta. 

### Entradas

- Nome
- E-mail
- Senha

### Processamento

- O sistema valida os dados e cria o cadastro.

### Saída

- Usuário registrado.

## RF02 – Login

### Objetivo

Permitir acesso ao sistema.

### Entradas

- E-mail
- Senha

### Processamento

- O sistema valida as credenciais.

### Saída

- Acesso liberado.

## RF03 – Registrar Doação

### Objetivo

Permitir cadastrar um item para doação. 

### Entradas

- Nome do item
- Categoria
- Descrição
- Foto

### Processamento

- O sistema registra a doação.

### Saída

- Doação disponível na listagem.

## RF04 – Consultar Doações

### Objetivo

Permitir visualizar as doações disponíveis.

### Processamento

- O sistema exibe todas as doações cadastradas.

### Saída

- Lista de doações.

## RF05 – Receber Doação

### Objetivo

Permitir receber uma doação.

### Entradas

- Item selecionado

### Processamento

- O sistema remove a doação da listagem.

### Saída

- Doação concluída.

## RF06 – Histórico

### Objetivo

Permitir visualizar as doações registradas e recebidas.

### Saída

- Lista de movimentações do usuário.

# Requisitos não-funcionais

## Desempenho

- O sistema deve responder em até 2 segundos.
- O sistema deve suportar até 100 usuários simultâneos.

## Disponibilidade

- O sistema deve estar disponível 24/7.

## Usabilidade

- O sistema deve ser fácil de usar.
- O sistema deve ser intuitivo.

## Segurança

- O sistema deve validar as credenciais.
- O sistema deve validar os dados.
- O sistema deve validar os dados.

## Manutenibilidade

- O código deve ser fácil de entender.
- O código deve ser fácil de modificar.
- O código deve ser fácil de testar.

## Portabilidade

- O sistema deve funcionar em Chrome, Edge, Firefox e Opera
