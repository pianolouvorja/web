# Gauntlet Loop — Login Social YouTube (PIANO)

## Prompt-mestre (cole pro agente líder)

> **META**: Implementar login social Google/YouTube no PIANO (web + APK) para
> que assinantes YouTube Premium assistam vídeos SEM anúncios dentro do app,
> usando a sessão autenticada do próprio usuário.
>
> **CONTEXTO DO TELEGRAM (pesquisa feita)**:
> - Grupo "Louvor JA - Dev" (2108908408): 3 versões ativas — Violin (clássico
>   Delphi), Flute (em construção até paridade), Piano (nossa, Electron/Flutter)
> - **YouTube Premium login**: NÃO discutido no grupo. Zero menção.
> - **Remoção de anúncios**: Apenas grupo terceirizado "SponsorBlock" + NewPipe
>   (client-side, não login nativo)
> - **Fonte da Bíblia**: JÁ EM ANDAMENTO no Piano (personalização de fontes)
> - **PPTX/OBS/PRISM**: Zero menção — são features NOVAS, não paridade
> - **Ezequias citou "projeto derivado que burla anúncios"**: NÃO é do grupo
>   oficial. Precisa dele apontar qual repo/projeto.
>
> **DIVISÃO (agente líder executa antes de qualquer build)**:
> 1. **P1 — Prova de viabilidade técnica** (BLOQUEIA TUDO): o YouTube IFrame API
>    reproduz sem anúncios quando o usuário está logado numa conta Premium?
>    Testar em browser real (iframe embed + sessão Google via GIS) e documentar
>    com vídeo/prints. Se FALHAR → meta reduzida para "login Google para
>    personalização/futuro, sem garantia de remoção de anúncios" e o usuário
>    (Rafael) decide se continua.
> 2. **P2 — OAuth Google no piano-app** (Electron, ~/piano-app/): fluxo Google
>    Identity Services (GIS), escopo mínimo, cookies de sessão no contexto
>    do player, persistência segura (nunca em localStorage exposto).
> 3. **P3 — OAuth Google no APK Flutter** (~/pianolouvorja-flutter/src/):
>    google_sign_in + WebView/popup para injetar sessão no player de vídeo.
> 4. **P4 — Player autenticado** (piano-web liturgia + piano-app + APK):
>    youtube-nocookie.com + conta Premium → sem anúncios; fallback: player
>    padrão com anúncios (status badge visível).
> 5. **P5 — Testes**: unit (token/session store) + widget (tela de login) +
>    integração E2E (login → play → zero ad-break) — gate de merge.
>
> **BARRA DE QUALIDADE (congelada antes do build, inegociável)**:
> - Login Google 2-cliques (GIS popup), sem digitar senha dentro do app
> - Vídeo Premium roda SEM interrupção de anúncio em 10 vídeos de teste
> - Logout limpa 100% dos cookies/tokens (teste automatizado)
> - Sem token/refresh-token exposto em localStorage/AsyncStorage (auditoria OWASP)
> - Se usuário NÃO é Premium: comportamento idêntico ao atual (zero regressão)
> - Coverage: linhas/branches 100% nos módulos novos (padrão project-excellence)
>
> **CRÍTICOS CEGOS (um por peça, contexto zero)**:
> - Cada crítico recebe SÓ o artefato (código/tela/teste) + a BARRA — nunca
>   a explicação do builder. Julga: passou / falhou + motivo objetivo.
> - Peça reprovada volta pro builder com o feedback; máx 3 rodadas, depois
>   escala pro humano (Rafael).
>
> **STOP**: todas as peças verdes numa única rodada completa.

---

## Prompt-gauntlet (o que faz o agente líder rodar o loop)

```
/gauntlet-loop
meta: Login social Google/YouTube no PIANO (web+APK) para Premium sem anúncios
barra: /docs/gauntlet/youtube-login/BARRA.md (congelar antes de buildar)
pecas: [P1 prova-de-viabilidade, P2 oauth-web, P3 oauth-apk, P4 player-premium, P5 testes-e2e]
ciclos: max 3 por peça, depois escalar pro humano
criticos: cegos (contexto zero), 1 por peça
stop: todas verdes na mesma rodada
```

## Execução (com as skills do projeto)

1. **Spec + plano** (skill: project-excellence + spec-driven-development):
   escrever SPEC.md com contrato executável, decompor em tasks pequenas,
   TDD desde a primeira linha (skill: test-driven-development).
2. **Implementação por peça** (skills: pianolouvorja-web-feature-patterns,
   pianolouvorja-flutter, llm-integration-patterns para OAuth):
   - P1 primeiro: se o teste de viabilidade falhar, parar e relatar —
     NÃO implementar por cima de uma premissa quebrada.
3. **QA gate** (skills: qa-agent, vitest-coverage-workflow,
   playwright-e2e-testing): 7 gates, auto-fix limitado, coverage 100%.
4. **PR** (skills: github-pr-workflow, github-governance): feat → staging →
   main, review do Ezequias antes do merge.

## Pendências a decidir com o Rafael/Ezequias (ANTES de rodar)

- [ ] **CRÍTICO**: O "burlar anúncios" que o Ezequias citou — qual projeto
      derivado? Link/repo/branch? (o grupo oficial NÃO tem isso)
- [ ] Login Google quebra o anonimato atual do app — ok pro público de igreja
      (PC compartilhado entre operadores)? Multi-perfil ou logout manual?
- [ ] Quais escopos OAuth pedir (mínimo: userinfo.email? ou só sessão anônima)?
- [ ] Fonte Bíblia: **já em andamento** no Piano (ver msg 4321 do Telegram) —
      confirmar se precisa ação ou só acompanhar
- [ ] PPTX + OBS/PRISM: quer issues separadas (gauntlets independentes) ou
      tudo num spec só?
- [ ] Telegram dev group link pro site: `t.me/louvorja` (já resolveu)

## Pesquisa já feita (base Delphi louvorja-desktop + Telegram)

- **Base Delphi (Classico)**: Player = iframe YouTube padrão via
  `api.louvorja.com.br/player?v=ID` com WebView2 (Chromium) — SEM login,
  SEM remoção de anúncios, SEM PPTX nativo, SEM integração OBS/PRISM
- **Grupo de devs Telegram**: 3 versões (Violin/Flute/Piano), API própria
  sendo finalizada, fonte da Bíblia **já em implementação** no Piano
- As 3 sugestões do usuário: 1) YouTube Premium = **NOVA**, 2) Fonte Bíblia =
  **EM ANDAMENTO**, 3) PPTX = **NOVA** — não são paridade com o Classico
- OBS/PRISM: citados pelo usuário como "versão base já tem" — mas **não
  estão no código Delphi**. Precisa confirmar se é config externa ou feature
  que o usuário *acha* que tem mas não tem.