# P1 — Resultado da prova de viabilidade (12/09/2026)

**VERDE** (com amostragem; 10/10 completos fica pro E2E do P5)

## Método
- Harness: página standalone com YouTube IFrame API (docs/gauntlet/youtube-login, servida em localhost:8899), rodando no Chrome do Rafael com sessão Google ativa.
- Status Premium confirmado pela página oficial youtube.com/premium: "Você já tem o YouTube Premium."
- Vídeos testados (todos ad-heavy, gravadoras grandes): dQw4w9WgXcQ, kJQP7kiw5Fk (Despacito), 9bZkp7q19f0 (Gangnam Style), RgKAFK5djSk (Uptown Funk), OPf0YbXqDm0 (See You Again), fJ9rUzIMcZQ (Bohemian Rhapsody).

## Evidência
- Todos os 6: onReady → BUFFERING → PLAYING direto (0,5s), SEM ad-cycle, SEM UI de anúncio.
- Screenshots auditados por visão: nenhum "Pular anúncio", contador, badge amarelo ou overlay.
- Playback contínuo 20s no Bohemian Rhapsody: legenda em ~1:34 (posição correta da música) = reprodução ininterrupta do conteúdo.
- log de estados completo no harness (onStateChange instrumentado).

## Ressalvas (registradas, não escondidas)
- Amostragem de 5s/vídeo + 1 vídeo 20s — não substitui B2 (10 vídeos completos). Ad-breaks mid-roll longos não foram observados, mas o E2E do P5 precisa cobrir.
- O harness "Estado de login: verificando…" nunca resolvia (label estático meu) — a confirmação de Premium veio da aba /premium, não do harness.
- Teste em Chrome desktop; Electron (piano-app) e WebView do APK (P2/P3) ainda precisam validar que a sessão Google persiste no contexto do embed.

## Conclusão
A premissa NÃO está quebrada: YouTube IFrame embed reproduz sem anúncios quando o
browser tem sessão Premium ativa. Gauntlet pode prosseguir para P2/P3/P4/P5.
