import type { RouteLocationNormalized } from 'vue-router'

/**
 * Guard da rota /media: sem mídia em reprodução, redireciona para /albums.
 *
 * Cobre o acesso via URL direta / fresh load (F5 em /media, link compartilhado),
 * onde a sessão do media store ainda não existe. A navegação interna continua
 * sendo tratada pelo MediaView (watch hasSession → router.back), que conhece
 * a rota de origem.
 *
 * A popup de projeção não é afetada: ela usa a rota /popup (PopupHost),
 * nunca /media.
 */
export function createMediaSessionGuard(
  hasSession: () => boolean,
): (to: RouteLocationNormalized) => boolean | { name: string; replace: boolean } {
  return (to) => {
    if (to.name !== 'media') return true
    if (hasSession()) return true
    return { name: 'albums', replace: true }
  }
}
