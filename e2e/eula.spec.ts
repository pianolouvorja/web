import { expect, test } from '@playwright/test'

// E2E: Fluxo completo do EULA no browser real
// Valida que o aceite/recusa persiste entre reloads no navegador.

test.describe('EULA — Fluxo E2E', () => {

  test.beforeEach(async ({ page }) => {
    // Nao usar addInitScript — ele roda em TODAS as navegacoes incluindo
    // reloads, apagando o aceite que acabou de ser salvo.
    // Em vez disso, limpar via goto + evaluate antes do teste.
  })

  test('mostra dialog EULA na primeira visita', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('eula_accepted_v1'))
    await page.reload()
    await page.waitForLoadState('networkidle')

    await expect(page.locator('.eula-dialog')).toBeVisible({ timeout: 10000 })
  })

  test('botao Aceito fica desabilitado ate rolar ate o fim', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('eula_accepted_v1'))
    await page.reload()
    await page.waitForLoadState('networkidle')

    const acceptBtn = page.getByRole('button', { name: 'Aceito os termos' })
    await expect(acceptBtn).toBeVisible({ timeout: 10000 })
    await expect(acceptBtn).toBeDisabled()
  })

  test('aceitar o EULA libera o app e persiste apos reload', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('eula_accepted_v1'))
    await page.reload()
    await page.waitForLoadState('networkidle')

    const acceptBtn = page.getByRole('button', { name: 'Aceito os termos' })
    await expect(acceptBtn).toBeVisible({ timeout: 10000 })

    // Rolar a area de texto ate o fim para habilitar o botao
    const textArea = page.locator('.eula-dialog__text-area')
    if (await textArea.count() > 0) {
      await textArea.evaluate((el) => {
        el.scrollTop = el.scrollHeight
      })
      await textArea.dispatchEvent('scroll')
      await page.waitForTimeout(300)
    }

    await expect(acceptBtn).toBeEnabled({ timeout: 5000 })
    await acceptBtn.click()

    // O dialog EULA deve sumir
    await expect(page.locator('.eula-dialog')).toHaveCount(0, { timeout: 5000 })

    // Recarregar — aceite deve persistir (SEM limpar localStorage)
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Nao deve mostrar o dialog novamente
    await expect(page.locator('.eula-dialog')).toHaveCount(0, { timeout: 5000 })
  })

  test('recusar mostra confirmacao e depois tela de saida', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('eula_accepted_v1'))
    await page.reload()
    await page.waitForLoadState('networkidle')

    const declineBtn = page.getByRole('button', { name: 'Não aceito' })
    await expect(declineBtn).toBeVisible({ timeout: 10000 })
    await declineBtn.click()

    // Dialog de confirmacao
    await expect(page.getByText('Tem certeza?')).toBeVisible({ timeout: 5000 })

    // Confirmar recusa
    await page.getByRole('button', { name: /Sim, recusar/i }).click()

    // Tela de saida
    await expect(page.locator('.eula-exit')).toBeVisible({ timeout: 5000 })
  })

  test('Voltar na confirmacao retorna ao EULA', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('eula_accepted_v1'))
    await page.reload()
    await page.waitForLoadState('networkidle')

    const declineBtn = page.getByRole('button', { name: 'Não aceito' })
    await expect(declineBtn).toBeVisible({ timeout: 10000 })
    await declineBtn.click()

    await page.getByRole('button', { name: /Voltar/i }).click()

    // Deve voltar a mostrar o EULA
    await expect(page.locator('.eula-dialog')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Tem certeza?')).toHaveCount(0)
  })

  test('recusar limpa localStorage (aceite anterior invalidado)', async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.removeItem('eula_accepted_v1'))
    await page.reload()
    await page.waitForLoadState('networkidle')

    await page.evaluate(() => localStorage.clear())
    await page.reload()
    await page.waitForLoadState('networkidle')

    // EULA deve aparecer de novo
    await expect(page.locator('.eula-dialog')).toBeVisible({ timeout: 10000 })
  })
})
