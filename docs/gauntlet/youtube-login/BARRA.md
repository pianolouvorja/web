# BARRA — Login YouTube Premium (congelada ANTES do build)

## Funcional
- B1. Login Google ≤ 2 cliques (GIS popup), sem digitar senha dentro do app
- B2. Vídeo Premium: 10/10 vídeos de teste SEM interrupção publicitária
- B3. Não-Premium: comportamento idêntico ao player atual (zero regressão, 0 novos bugs)
- B4. Logout remove 100% cookies/tokens (verificado por teste automatizado)
- B5. Sessão sobrevive a restart do app (re-login silencioso via refresh token)

## Segurança (OWASP A07/A10)
- B6. Zero tokens em localStorage/AsyncStorage inspectionáveis
- B7. Escopo OAuth mínimo documentado no SPEC
- B8. PKCE obrigatório no fluxo (não client_secret em cliente público)

## Qualidade
- B9. Coverage 100% linhas/branches nos módulos novos (vitest/flutter test)
- B10. E2E: login → play → terminar vídeo sem ad-break (Playwright + integration_test)
- B11. Sem warning novo no analyze/lint do flutter e do web

## Crítico cego julga: PASSOU só se TODAS as B1-B11 verificáveis passarem.
