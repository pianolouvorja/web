# Multi-telas e projeção — Web

> **Documento canônico** do recurso de multi-telas / projeção na versão web.  
> O Electron usa monitores nativos; a Web usa janelas popup no browser.  
> Em qualquer migração que toque neste domínio, **use este documento** — não porte a implementação do Electron.

## 1. Por que é diferente

| Aspecto | Electron (`StackVue/electron`) | Web (`StackVue/web`) |
|---------|--------------------------------|----------------------|
| Detecção de telas | Displays nativos (API Electron / monitores estendidos) | Não há API confiável de monitores no browser |
| UI de configuração | `MultiScreenSelectCard`, seleção de monitores estendidos | `PopupScreensCard` — quantidade de popups (1–N) |
| Abertura de projeção | Janelas/`BrowserWindow` ligadas a displays | `window.open` com slots nomeados |
| Host da projeção | Rotas/views de projeção no shell Electron | `PopupHost.vue` na rota `/popup` |
| Sincronização | IPC / bridge / estado do main | `BroadcastChannel` + `localStorage` + `postMessage` |
| Controles nos módulos | Controles ligados a monitores | `PopupScreenControls` (fechar popups, seletor de quantidade) |

**Regra:** ao migrar um módulo do Electron que “projeta” conteúdo, **não** copiar `MultiScreen*`, lógica de displays estendidos nem IPC de telas. Conectar o módulo à stack web abaixo.

## 2. Stack já pronta (reutilizar)

```
src/shared/
├── views/PopupHost.vue              # Host das janelas /popup?slot=&module=
├── components/
│   ├── PopupScreenControls.vue      # Controles nos módulos (fechar / status)
│   └── PopupCountSelector.vue       # Seletor de quantidade de popups
└── services/
    ├── popup-windows.ts             # openPopupModule, exitPopupModule, sync
    ├── popup-layout.ts              # bounds, slots, Window Management API
    ├── popup-registry.ts            # refs das janelas abertas
    └── projection-preferences.ts    # preferências (ex.: popup count)

src/modules/settings/
├── views/ProjectionView.vue
├── components/PopupScreensCard.vue
├── components/ProjectionOptionsCard.vue
└── composables/useProjectionSettings.ts

src/router/                          # rota name: 'popup' → PopupHost
```

Chaves de storage relevantes: `BROWSER_STORAGE_KEYS` em `src/shared/constants/storage-keys.ts` (`popupLayout`, `popupModule`, `popupCount`, `projectionSettings`).

## 3. Contrato para módulos que projetam

Padrão já usado em `bible`, `clock`, `timer`, `countdown`, `random`:

1. **Abrir / fechar projeção** via `@shared/services/popup-windows`:
   - `openPopupModule('<moduleId>')`
   - `exitPopupModule()` / `isPopupModuleOpen('<moduleId>')`
2. **View de projeção** no módulo: `*ProjectionView.vue` (ex.: `BibleProjectionView.vue`).
3. **Registrar** a view no mapa de módulos de `PopupHost.vue` (lazy import).
4. **Publicar estado** da projeção via storage + canal (`BroadcastChannel` / helpers do módulo, ex.: `bible-runtime.ts`).
5. **Controles de tela** na UI do operador: incluir `PopupScreenControls` (não reinventar).
6. **FAB / ações** de projetar: manter o mesmo padrão de nomes do Electron quando existir (`toggleProjection`, `clearProjection`, `isProjecting`, etc.), mas a implementação chama a stack popup web.

## 4. O que NÃO fazer

- Não portar `MultiScreenSelectCard`, seleção de monitores estendidos ou APIs de display do Electron.
- Não criar IPC / `window.louvorja` para telas.
- Não abrir projeção com outro mecanismo paralelo (`window.open` solto fora de `popup-windows.ts`).
- Não duplicar host de projeção — sempre `PopupHost` + rota `/popup`.
- Não consultar `Legado/` para “como era multi-tela no passado”.

## 5. Stitch / visual

- Referência visual de settings/projeção no Electron: `StackVue/electron/docs/stitch/multi-screen/` (só UI/tokens).
- Na Web, a **comportamento** segue este documento; o visual de settings usa `PopupScreensCard` / `ProjectionView` já existentes.
- Se copiar stitch: adaptar labels/fluxos para **quantidade de popups**, não “monitores estendidos”.

## 6. Checklist rápido (migração de feature com projeção)

- [ ] Localizei o equivalente no Electron (comportamento de *o que* projetar)?
- [ ] Mantive nomes de domínio do módulo (store, `toggleProjection`, etc.)?
- [ ] Usei `popup-windows` / `PopupHost` em vez de multi-screen Electron?
- [ ] Registrei `*ProjectionView` no `PopupHost`?
- [ ] Incluí `PopupScreenControls` onde o operador controla a projeção?
- [ ] Não trouxe `MultiScreen*` nem lógica de displays nativos?
