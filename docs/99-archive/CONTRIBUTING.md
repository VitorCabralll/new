# Guia de Contribuição

Primeiramente, obrigado por considerar contribuir para o projeto **Assistente Jurídico IA**! Sua ajuda é muito bem-vinda.

Este guia estabelece as diretrizes para garantir que o processo de contribuição seja o mais claro e eficiente possível para todos.

## Código de Conduta

Este projeto e todos que participam dele são regidos pelo nosso [Código de Conduta](CODE_OF_CONDUCT.md). Ao participar, você concorda em seguir seus termos.

## Como Posso Contribuir?

### Reportando Bugs

-   **Verifique se o bug já não foi reportado:** Pesquise nas [Issues](https://github.com/usuario/repositorio/issues) para garantir que você não está criando um ticket duplicado.
-   **Seja claro e descritivo:** Forneça um título claro e uma descrição detalhada, incluindo passos para reproduzir o bug, o comportamento esperado e o que realmente aconteceu.

### Sugerindo Melhorias

-   Abra uma nova issue com a sua sugestão.
-   Explique claramente a melhoria proposta e por que ela seria útil para o projeto. Inclua exemplos de código, mockups de UI ou qualquer outra informação que ajude a ilustrar a ideia.

### Sua Primeira Contribuição de Código

1.  **Faça o Fork do repositório:** Crie uma cópia do projeto na sua conta do GitHub.
2.  **Clone o seu fork localmente:**
    ```bash
    git clone https://github.com/SEU_USUARIO/assistente-juridico-ia.git
    ```
3.  **Crie uma nova branch:** Crie uma branch descritiva para a sua alteração.
    ```bash
    git checkout -b feature/nome-da-sua-feature
    ```
    ou
    ```bash
    git checkout -b fix/correcao-do-bug
    ```
4.  **Faça as suas alterações:** Escreva o código, os testes (se aplicável) e a documentação.
5.  **Faça o commit das suas alterações:** Use mensagens de commit claras e descritivas (veja a seção "Padrão de Mensagens de Commit").
    ```bash
    git commit -m "feat: Adiciona funcionalidade de exportação para PDF"
    ```
6.  **Envie as alterações para o seu fork:**
    ```bash
    git push origin feature/nome-da-sua-feature
    ```
7.  **Abra um Pull Request:** Acesse a página do repositório original e abra um Pull Request da sua branch para a branch `main` do projeto.

## Padrões de Código

-   **Consistência:** Mantenha a consistência com o estilo de código existente no projeto.
-   **TypeScript:** Use TypeScript sempre que possível para garantir a tipagem e a segurança do código.
-   **Comentários:** Comente partes complexas do código, mas prefira um código claro e autoexplicativo sempre que possível.

## Padrão de Mensagens de Commit

Adotamos o padrão [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/). Isso nos ajuda a manter um histórico de commits legível e a automatizar a geração de changelogs.

A estrutura básica é: `<tipo>[escopo opcional]: <descrição>`

-   **Tipos comuns:**
    -   `feat`: Uma nova funcionalidade.
    -   `fix`: Uma correção de bug.
    -   `docs`: Alterações apenas na documentação.
    -   `style`: Alterações que não afetam o significado do código (espaçamento, formatação, etc.).
    -   `refactor`: Uma alteração de código que não corrige um bug nem adiciona uma funcionalidade.
    -   `test`: Adicionando testes ou corrigindo testes existentes.
    -   `chore`: Alterações em processos de build, ferramentas auxiliares, etc.

**Exemplos:**
-   `feat: Adiciona login com e-mail e senha`
-   `fix: Corrige erro de renderização no ResultPanel`
-   `docs: Atualiza o README com instruções de setup`
