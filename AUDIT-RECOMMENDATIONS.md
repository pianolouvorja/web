# Piano Louvor JA Web -- Recomendacoes de DevOps para Auditoria

Documento para revisao do mantenedor. Cada item explica o PORQUE da perspectiva de auditoria/conformidade.

---

## 1. CI/CD com evidencias auditaveis (GitHub Actions)

**Problema atual:** Builds sao manuais. Nao ha registro de quem buildou, quando, ou se passou.

**Recomendacao:** GitHub Actions com:
- Build + type-check em cada PR (blocker)
- Registro imutavel de cada deploy (commit hash, autor, timestamp)
- Artefatos de build preservados por 90 dias

**Valor de auditoria:** "Esta versao em producao corresponde ao commit X, aprovado por Y, build passou em Z."

---

## 2. Error Tracking em producao (Sentry/Glitchtip)

**Problema atual:** Erros de producao sao invisiveis. Usuario reporta manualmente ou silenciosamente.

**Recomendacao:** Sentry Cloud (gratis 5k errors/mes) ou Glitchtip self-hosted.

**Valor de auditoria:** Rastreio de incidentes com timestamp, stack trace, versao do app, contexto do usuario. Permite responder "quando esse bug apareceu pela primeira vez?" e "quantos usuarios foram afetados?"

---

## 3. Security scanning continuo (CodeQL + Dependabot)

**Problema atual:** SonarQubo roda sob demanda (scans manuais). Vulnerabilidades em dependencias nao sao alertadas.

**Recomendacao:**
- GitHub Dependabot: PR automatico quando npm package tem CVE
- GitHub CodeQL: analise estatica de seguranca em cada PR
- Alertas de seguranca do GitHub habilitados

**Valor de auditoria:** Evidencia continua de que dependencias estao atualizadas e sem CVEs conhecidos. Historico de vulnerabilidades encontradas e remediadas.

---

## 4. SBOM (Software Bill of Materials)

**Problema atual:** Nao existe inventario completo de dependencias transitiveas.

**Recomendacao:** Gerar SBOM (CycloneDX ou SPDX) a cada release.
- npm ls --all ja existe, mas nao e estruturado
- cyclonedx-npm gera formato padrao industria

**Valor de auditoria:** "Esta versao usa exatamente estas 247 dependencias (diretas + transitiveas), nenhuma tem CVE conhecido na data X." Requisito em varias frameworks de compliance (LGPD Art. 46, ISO 27001).

---

## 5. Logs estruturados em producao

**Problema atual:** App e client-side PWA. Erros silenciosos no browser do usuario.

**Recomendacao:** PWA ja captura eventos client-side. Combinar com Sentry para traceabilidade.
- Log de cada sorteio realizado (quem, quando, resultado)
- Log de erros de WebSocket/API
- Retencao de 90 dias minimos

**Valor de auditoria:** Sorteios tem integridade verificavel. "O sorteio do dia X as Y produziu o resultado Z, confirmado por N testemunhas digitais."

---

## 6. Acessibilidade runtime (axe-core no CI)

**Problema atual:** SonarQube pega acessibilidade estatica (role attributes, contraste CSS). Mas nao testa runtime (DOM real, ARIA dinamico, foco trap em modais).

**Recomendacao:** axe-core integrado ao CI ou Lighthouse CI.
- Roda em cada deploy de preview
- Report HTML anexado ao PR

**Valor de auditoria:** Evidencia de conformidade WCAG 2.1 AA em runtime, nao apenas estatico. Importante se o app for publico/governamental (Lei Brasileira de Inclusao 13.146/2015).

---

## 7. Backup e recoverability

**Problema atual:** Repo no GitHub e o unico backup. Se o mantenedor sair, o projeto some.

**Recomendacao:**
- Mirror automatico para segundo remote (ex: GitLab ou Codeberg)
- Release artifacts preservados em storage separado
- Documentacao de como rodar localmente mantida atualizada

**Valor de auditoria:** Continuidade de negocio nao depende de uma unica pessoa ou plataforma.

---

## Resumo de Prioridade (sugestao)

| Prioridade | Item              | Esforco | Impacto Auditoria |
|------------|-------------------|---------|-------------------|
| 1          | CI/CD             | Medio   | Alto              |
| 2          | Error Tracking    | Baixo   | Alto              |
| 3          | Dependabot+CodeQL | Baixo   | Alto              |
| 4          | SBOM              | Baixo   | Medio             |
| 5          | Logs estruturados | Medio   | Medio             |
| 6          | axe-core CI       | Medio   | Medio             |
| 7          | Backup/Mirror     | Baixo   | Baixo             |

---

Decisao do mantenedor necessaria para:
- Escolha do error tracking (Cloud vs self-hosted vs nenhum)
- Nivel de rigor do CI (blocker vs advisory)
- Onde hospedar mirror de backup (se aplicar)
