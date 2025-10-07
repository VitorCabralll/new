# Backend - Assistente Jurídico IA

Este diretório contém o servidor backend para a aplicação, construído com Node.js, Express, e Prisma.

## Visão Geral

O backend é responsável por:
- Fornecer uma API RESTful para gerenciar os "Agentes de IA".
- Interagir com um banco de dados SQLite para persistir os dados dos agentes.

## Stack Tecnológica

- **Framework:** [Express.js](https://expressjs.com/)
- **Banco de Dados:** [SQLite](https://www.sqlite.org/)
- **ORM:** [Prisma](https://www.prisma.io/)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)

## Setup e Comandos Prisma

Este projeto usa Prisma para gerenciar o esquema do banco de dados e as interações. Como o ambiente de desenvolvimento gerencia as dependências, você pode precisar usar `npx` para executar os comandos do Prisma.

1.  **Gerar o Prisma Client:**
    Sempre que você modificar o arquivo `prisma/schema.prisma`, você precisa regenerar o Prisma Client para que o TypeScript reconheça as mudanças.

    ```bash
    npx prisma generate
    ```

2.  **Sincronizar o Schema com o Banco de Dados:**
    Após definir seu modelo de dados no `schema.prisma`, use `db push` para criar as tabelas no seu banco de dados SQLite. Este comando é executado a partir do diretório `backend`.

    ```bash
    npx prisma db push
    ```

> **Nota:** O comando `db push` é ideal para prototipagem e desenvolvimento. Para produção, o Prisma recomenda o uso de `migrate dev` para criar arquivos de migração SQL rastreáveis.

## Estrutura da API

A API segue os padrões RESTful para operações CRUD (Criar, Ler, Atualizar, Excluir) no recurso de Agentes.

## Testes

O projeto utiliza [Vitest](https://vitest.dev/) para testes automatizados.

### Executando os Testes

Para executar a suíte de testes, navegue até o diretório `backend` e rode o seguinte comando:

```bash
npm test
```

O comando executará todos os arquivos de teste que terminam com `.test.ts` dentro do diretório `src`.

### Estrutura de Testes

-   **Arquivos de Teste:** Os testes estão localizados junto ao código fonte que eles testam (por exemplo, `src/services/documentProcessing.test.ts`).
-   **Dados de Teste:** Arquivos usados pelos testes, como PDFs de exemplo, devem ser colocados no diretório `test/data`.