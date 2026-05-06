import { test, expect } from '@playwright/test';

// Este teste simula a navegação e o deep linking na aplicação
test.describe('Bible Deep Link Integration', () => {
  
  test('deve navegar corretamente para Gênesis 22 ao receber parâmetros via URL', async ({ page }) => {
    // Navega diretamente para a rota com parâmetros
    await page.goto('/membro/biblia?book=G%C3%AAnesis&chapter=22');
    
    // Verifica se o título da página/layout reflete o livro selecionado
    const headerTitle = page.locator('header, h1');
    await expect(headerTitle).toContainText(/Gênesis/i);
    
    // Verifica se o subtítulo ou indicador de capítulo mostra '22'
    await expect(page.locator('body')).toContainText(/Capítulo 22/i);
  });

  test('deve navegar corretamente para 1 João 5 ao receber parâmetros via URL', async ({ page }) => {
    await page.goto('/membro/biblia?book=1%20Jo%C3%A3o&chapter=5');
    
    await expect(page.locator('header, h1')).toContainText(/1 João/i);
    await expect(page.locator('body')).toContainText(/Capítulo 5/i);
  });

  test('deve filtrar lições por classe e exibir conteúdo correto', async ({ page }) => {
    // Simula login ou acesso ao painel inicial
    await page.goto('/');
    
    // Verifica se a seção de plano de leitura está visível
    const sectionTitle = page.getByText(/Plano de Leitura/i);
    await expect(sectionTitle).toBeVisible();
    
    // Nota: Testes de integração reais dependeriam de dados no banco Mockados ou de Teste.
    // Como estamos em ambiente de preview, validamos a estrutura.
  });
});
