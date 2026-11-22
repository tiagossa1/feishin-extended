# Biblioteca Viva UI Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `subagent-driven-development` or `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Do not begin implementation until the user reviews this plan and selects the execution method.

**Goal:** Renovar a UI/UX do Feishin Extended segundo a direção Biblioteca viva, dando prioridade a playlists e faixas sem retirar funcionalidades atuais.

**Architecture:** Evolução dos componentes existentes do renderer, usando os wrappers Mantine, CSS Modules, temas, stores, rotas e controllers atuais. Não transportar a implementação HTML para React nem reescrever tabelas virtualizadas, filas ou motores áudio. A única alteração funcional intencional é disponibilizar ordenação através dos cabeçalhos, reutilizando os filtros existentes.

**Tech Stack:** React 19, TypeScript 5.9, Mantine 9 através de wrappers, React Router 7, TanStack Query 5, Zustand 5, CSS Modules/PostCSS, Electron/Vite. Testes de lógica com `node:test` e TypeScript já instalado; aceitação UI no browser e na app desktop, sem nova dependência obrigatória.

**Spec:** [Design aprovado](#design-aprovado) neste documento. Referência visual complementar: `C:\Users\Tiago\AppData\Local\Temp\opencode\feishin-ui\index.html`. Este ficheiro temporário não é uma especificação técnica nem uma dependência de execução.

**Baseline:** `main` em `fb043b7173b69b432127d1aef89d526c4423400b`, analisada através de `git show`. O workspace atual continua em `feature/live-reverb`, com alterações do utilizador que não devem ser movidas, revertidas ou incluídas automaticamente.

## Global Constraints

- Mudar apenas UI/UX e manter tudo o que a app consegue fazer de momento.
- Playlists e faixas têm prioridade; não fixar nem privilegiar uma playlist específica.
- Imagem personalizada da playlist quando existir; composição de capas quando esse for o comportamento atual.
- Ações frequentes por ícones com tooltips traduzidos e nomes acessíveis; navegação e conteúdo continuam legíveis em texto.
- Ordenação nos cabeçalhos de tabela, sem perder opções que não correspondam a colunas visíveis.
- Blur nas superfícies de apoio e fundo do leitor; texto, capas principais e listas permanecem nítidos.
- Preservar definições guardadas: ordem/visibilidade de navegação, secções do início, fontes, temas, colunas, densidade, filtros e preferências do leitor.
- Não modificar motores em `src/renderer/features/player/audio-player/`, controllers, normalização, contratos IPC, nem `src/main/`, `src/preload/` ou `src/remote/` nesta renovação.
- Não adicionar bibliotecas, fontes remotas nem pedidos diretos a serviços para fins estéticos.
- Usar `/@/shared/components`, `/@/shared/hooks`, `Icon`, `ActionIcon`, CSS Modules e `--theme-*`, conforme `docs/agents/frontend.md`.
- Todo o texto novo usa i18n; o idioma do utilizador continua configurável. Não impor PT-PT na app.
- Não usar o carácter em dash. Não fazer staging, `pnpm lint:staged` ou commits sem pedido explícito de commit.
- Não executar typecheck local; a validação de tipos fica em CI, conforme `AGENTS.md`. Evitar `pnpm lint`, que também invoca typecheck.
- Implementar num worktree isolado criado a partir da `main`, após confirmar se a baseline deve incluir trabalho entretanto integrado. Não fazer checkout no workspace sujo.

## Review Focus

1. Playlist com faixas repetidas: seleção, edição e remoção mantêm identidade por ocorrência (`playlistItemId`), não apenas `song.id`; coberto na tarefa 4.
2. Lista grande, paginada ou parcialmente carregada: ordenar a biblioteca inteira através da query, não só os elementos montados; coberto na tarefa 4.
3. Definições antigas e temas personalizados: não repor configurações nem forçar a nova paleta/ordem sobre preferências guardadas; coberto nas tarefas 2 e 3.
4. Artwork ausente, inválido ou alterado: placeholder estável, imagem personalizada prioritária e blur sem perder contraste nem reutilizar imagem de outro servidor; coberto nas tarefas 2, 3 e 5.
5. Motores e superfícies especiais: MPV/web/DLNA/jukebox, rádio, visualizadores e controlo remoto continuam a funcionar com os mesmos limites de suporte; coberto nas tarefas 5 e 6.

---

## Design aprovado

- **Início:** pesquisa visível, pequena grelha de playlists e acesso a todas; nenhuma playlist fixa. Álbuns são secundários. Sem destaque obrigatório para random, Auto DJ ou recomendações, mas estas funcionalidades permanecem disponíveis.
- **Navegação:** para instalações novas, Início, Playlists e Faixas primeiro; restantes destinos preservados. Respeitar navegação personalizada existente.
- **Playlists:** cabeçalho compacto com imagem real, nome, descrição e metadados. Toolbar mais curta com ícones; faixas como conteúdo principal. Preservar upload/remoção de imagem, edição, guardar/substituir, smart playlists, filtros e menus.
- **Faixas:** mesma linguagem das playlists, com pesquisa e cabeçalhos ordenáveis. Preservar vistas alternativas, seleção múltipla, colunas configuráveis, paginação e agrupamento.
- **Leitor inferior:** persistente e compacto; acesso claro ao leitor expandido e a todos os controlos existentes.
- **Leitor expandido:** capa e informação da faixa de um lado, módulo ativo do outro. Fila e Letras são visíveis, mas Relacionadas e Visualizador não desaparecem. Usar o overlay atual, não um novo modal com estado áudio paralelo.
- **Blur:** translucidez contida na sidebar/playerbar e fundo do leitor. Ligado por defeito para a nova preferência de chrome; opção para desligar. Respeitar preferências de transparência e movimento reduzidos e suporte do browser. Não animar intensidade do filtro.
- **Identidade:** conteúdo musical dá personalidade à app. Sem cartões para cada linha, gradientes decorativos ou cores fixas que ignorem o tema.
- **Escala visual de partida, decisão de implementação:** sidebar 205 px quando expandida, área útil com espaçamento 24-38 px, cabeçalho 32-38 px no desktop/27-28 px no mobile, texto de faixas 14 px. Usar fontes e zoom configurados, não forçar `Segoe UI` do mockup.
- **Cor:** obter fundo, superfície, texto, texto secundário e acento dos tokens atuais. O azul profundo do mockup é referência, não substituição das paletas existentes.
- **Blur de partida, decisão de implementação:** chrome 22 px, backdrop do leitor 8 px; transparência da superfície com opacidade equivalente a 82%. O fundo de artwork do leitor continua a usar `dynamicImageBlur`, `dynamicBackground`, `dynamicIsImage` e `opacity` já existentes.
- **Não aprovado:** novos serviços de recomendação, alterações à geração do Explo, motores áudio, alteração de clique simples para reprodução imediata ou remoção de funcionalidades não desenhadas no mockup.

## Estrutura e contratos a reutilizar

| Área | Ficheiros existentes | Responsabilidade preservada |
|---|---|---|
| Shell | `src/renderer/layouts/default-layout.tsx`, `default-layout.module.css`, `default-layout/left-sidebar.module.css`, `default-layout/player-bar.module.css`, `mobile-layout/mobile-layout.module.css` | Split panes, scroll, overlays, playerbar e layout responsivo |
| Navegação | `src/renderer/features/sidebar/components/sidebar.tsx`, `sidebar.module.css`, `sidebar-playlist-list.tsx`, `playlist-folder-tree.tsx` | Destinos, pastas e personalização |
| Início | `src/renderer/features/home/routes/home-route.tsx`, `components/playlist-infinite-carousel.tsx` | Secções configuráveis, query paginada e cards de playlists |
| Pesquisa | `src/renderer/features/search/components/search-header.tsx`, `search-content.tsx`, `routes/search-route.tsx` | Pesquisa existente e vistas por entidade |
| Cards/imagens | `src/renderer/components/item-card/item-card.tsx`, `item-card.module.css`, `item-image/item-image.tsx` | Imagens reais, placeholders, ações e navegação |
| Playlist | `src/renderer/features/playlists/components/playlist-detail-song-list-header.tsx`, `playlist-detail-song-list-header-filters.tsx`, `playlist-detail-song-list-table.tsx`, `playlist-detail-song-list-content.tsx` | Header, filtros, vistas e edição |
| Faixas | `src/renderer/features/songs/components/song-list-header.tsx`, `song-list-header-filters.tsx`, `song-list-infinite-table.tsx`, `song-list-paginated-table.tsx` | Toolbar, queries e listas |
| Tabela | `src/renderer/components/item-list/types.ts`, `item-table-list/item-table-list.tsx`, `item-table-list-column.tsx`, `item-table-list-column.module.css`, `memoized-cell-router.tsx` | Virtualização, sticky/pinned headers, resize/reorder e controlo de linhas |
| Ordenação | `src/renderer/features/shared/hooks/use-sort-by-filter.ts`, `use-sort-order-filter.ts`, `use-list-filter-persistence.ts` | URL e persistência por servidor/lista |
| Player | `src/renderer/features/player/components/playerbar.tsx`, `playerbar.module.css`, `left-controls.tsx`, `center-controls.tsx`, `right-controls.tsx`, `full-screen-player.tsx`, `full-screen-player.module.css`, `full-screen-player-image.tsx`, `full-screen-player-queue.tsx`, `full-screen-player-queue.module.css`, `shared-full-screen-player-settings.tsx` | Controlos, overlays, módulos e background existentes |
| Configuração | `src/renderer/store/settings.store.ts`, `src/renderer/features/settings/components/general/theme-settings.tsx`, `home-settings.tsx` | Preferências guardadas e defaults |

Ficheiros novos, apenas quando indicados nas tarefas:

- `src/renderer/features/home/components/home-search-entry.tsx` e `.module.css`: entrada de pesquisa do início.
- `src/renderer/features/home/routes/home-route.module.css`: composição específica do início.
- `src/renderer/features/shared/components/library-header.module.css`: ficheiro existente a modificar; não criar uma segunda implementação do header.
- `src/renderer/components/item-list/helpers/table-sort.ts`: lógica pura de estado de ordenação e mapa de colunas.
- `src/renderer/features/shared/hooks/use-table-sort.ts`: ligação de cabeçalhos aos filtros existentes.
- `scripts/ui-refresh/load-typescript.mjs`: carregamento mínimo de helpers sem imports runtime, usando `typescript.transpileModule` e import de data URL; rejeitar imports runtime em vez de inventar um loader geral.
- `scripts/ui-refresh/table-sort.test.mjs`: testes `node:test` para o helper.
- `docs/agents/ui-refresh-acceptance.md`: matriz de paridade e aceitação manual com evidência da baseline e da renovação.

Não inventar um novo sistema de imagens de playlists. `PlaylistDetailSongListHeader` já usa `useItemImageUrl`, `imageId`, `imageUrl`, `uploadedImage`, `blurHash`, `thumbHash` e `dominantColor`, com mutations para upload/remoção. A composição pode ser fornecida pelo servidor: seguir essa origem antes de implementar qualquer mosaico client-side.

## Verificação comum e política de commits

Por tarefa: correr testes nativos quando aplicáveis, `pnpm lint-code` e `pnpm lint-styles`; estas duas verificações não chamam typecheck nem fazem staging. Aceitação visual em 1440x900, 1024x768 e 390x844, com temas claro, escuro, Glassy e alto contraste, além de um tema JSON desktop.

Testes UI não existem como suite na baseline. Não apresentar os testes do HTML temporário como prova da app real. Cada cenário manual abaixo tem precondição, ação e resultado esperado e deve ser registado em `ui-refresh-acceptance.md`; se surgir runner UI existente na baseline atualizada, automatizar nele antes de alterar o comportamento, sem instalar outro por conveniência.

Cada tarefa é uma unidade candidata a commit, mas os commits ficam pendentes até pedido explícito. Quando autorizado: `git add <ficheiros da tarefa>`, `pnpm lint:staged`, rever auto-fixes, repetir testes afetados e `git commit -m <mensagem indicada>`. Não incluir o trabalho `live-reverb` nem documentos preexistentes de outras tarefas.

### Task 1: Fixar a matriz de paridade e o ambiente de comparação

**Files:** criar `docs/agents/ui-refresh-acceptance.md`; ler os ficheiros da tabela anterior e `docs/agents/architecture.md`, `frontend.md`, `api.md`, `logging.md` e `CUSTOM_THEMES.md` conforme a área tocada.

**Interfaces:** consome a baseline e o design aprovado; produz cenários identificados `UI-01` a `UI-06`, snapshots e lista de ações existentes por superfície. Nenhuma API de produto nova.

- [ ] **Step 1:** Criar worktree isolado `ui/biblioteca-viva` a partir da `main` escolhida, usando `using-git-worktrees`. Verificar `git status --short --branch` nos dois workspaces: original intacto e novo limpo.
- [ ] **Step 2:** Registar rotas/ações do início, playlists, faixas, playerbar e fullscreen. Incluir filtros, vistas, seleção/drag, imagens, menus, smart playlists, Rádio, Relacionadas, visualizadores, casting, sleep timer e controlos de pitch/velocidade/EQ disponíveis na baseline.
- [ ] **Step 3:** Capturar a baseline e executar os cenários existentes antes de alterações. Usar biblioteca/playlist de teste para operações destrutivas, nunca a playlist real do Explo. Registar indisponibilidade de backend/dispositivo como não testado, não como PASS.
- [ ] **Step 4:** Registar `UI-01` para o novo início: pesquisa visível, grelha de playlists, nenhuma playlist fixa. Na baseline este cenário deve falhar visualmente; funcionalidades já existentes devem passar.
- [ ] **Step 5:** Executar `pnpm lint-code` e `pnpm lint-styles` e guardar falhas preexistentes. Commit candidato, apenas quando autorizado: `docs(ui): record refresh parity checks`.

### Task 2: Aplicar a linguagem visual e o blur ao shell

**Files:** modificar CSS Modules de shell/sidebar/playerbar acima, `src/renderer/store/settings.store.ts`, `src/renderer/features/settings/components/general/theme-settings.tsx`, `src/i18n/locales/en.json`. Alterar `default-layout.tsx` apenas para aplicar classe baseada na preferência, sem alterar montagem de players. Ler as ligações de export/import de settings antes de tocar na persistência.

**Interfaces:** adicionar `general.uiBlurEnabled: boolean`, schema `z.boolean().default(true)`, default `true`, selector `useUiBlurEnabled(): boolean`; escrever através de `useSettingsStoreActions().setSettings({ general: { uiBlurEnabled } })`. Classe no shell controla CSS; não criar store paralelo.

- [ ] **Step 1:** Definir `UI-02`: abrir perfil antigo, tema custom e blur desligado; esperar preferências intactas, superfícies opacas e texto legível. Antes de implementar, o controlo novo está ausente.
- [ ] **Step 2:** Adicionar preferência com fallback para settings antigos e opção traduzida na secção de aparência. Verificar export/import e overrides por ambiente sem alterar os restantes valores. Não mudar a versão do store só por adicionar campo com default; se o merge atual exigir migration, documentar e testar essa necessidade antes.
- [ ] **Step 3:** Aplicar chrome do design com tokens atuais. `backdrop-filter: blur(22px)` apenas em superfícies grandes de apoio, não em cada linha; usar `@supports` e `prefers-reduced-transparency` para fallback opaco. `prefers-reduced-motion` não anima filtros nem fundos.
- [ ] **Step 4:** Executar `UI-02`: toggle on/off, reload, export/import, imagem quebrada, temas claros/escuros/Glassy/high-contrast/custom, zoom 125% e ausência de suporte a backdrop-filter. Esperar zero resets, recortes ou redução de legibilidade.
- [ ] **Step 5:** Correr verificações comuns. Commit candidato: `feat(theme): refresh chrome with optional blur`.

### Task 3: Renovar o início e dar acesso direto a playlists e faixas

**Files:** modificar `home-route.tsx`, `playlist-infinite-carousel.tsx`, cards e CSS Modules listados; criar `home-search-entry.tsx`, `.module.css`, `home-route.module.css`; modificar defaults e, se necessário, apresentação de `home-settings.tsx` e `settings.store.ts`. Reutilizar `AppRoute` e a pesquisa existente.

**Interfaces:** `HomeSearchEntry(): ReactElement`, sem estado de pesquisa global duplicado. Submeter texto para `generatePath(AppRoute.SEARCH, { itemType: LibraryItem.SONG })` com query string `query=<texto>`; resultado inicial são faixas. `PlaylistInfiniteCarousel` conserva props atuais e ganha `showAllLink?: boolean`, default `false`, para acesso a `AppRoute.PLAYLISTS`.

- [ ] **Step 1:** Executar `UI-01` com perfil novo: pesquisa, grelha de playlists e link para todas devem ainda estar ausentes na nova composição.
- [ ] **Step 2:** Implementar entrada de pesquisa e secção de playlists usando queries/cards atuais. Não selecionar por nome, frequência de reprodução ou Explo; manter ordenação existente da query. Grelha visível com número de cards responsivo; não carregar a biblioteca inteira para o início.
- [ ] **Step 3:** Defaults de instalação nova: `homeFeature=false`, secção Playlists primeiro, exploração random desativada por defeito; restantes secções continuam configuráveis. Navegação nova: Home, Playlists habilitada, Tracks, depois os restantes destinos existentes. Não aplicar isto através de migration a perfis existentes; estes podem usar os controlos atuais para reconfigurar.
- [ ] **Step 4:** Verificar `UI-01`: pesquisar `Teardrop`, Enter abre resultados de faixas; ver todas abre playlists; abrir card navega à playlist certa. Verificar zero playlists, servidor indisponível/retry, nomes compridos, pastas, mudança de servidor, imagem personalizada/mosaico/placeholder. Respeitar secção Playlists desativada pelo utilizador.
- [ ] **Step 5:** Verificar perfil antigo com ordem personalizada, random habilitado, home feature e navegação configurada: nenhum valor é sobrescrito e todas as funcionalidades continuam acessíveis. Correr verificações comuns. Commit candidato: `feat(library): refresh playlist-first home`.

### Task 4: Partilhar ordenação por cabeçalhos e compactar playlists/faixas

**Files:** criar `table-sort.ts`, `use-table-sort.ts`, loader/teste nativos; modificar `item-list/types.ts`, `item-table-list.tsx`, `item-table-list-column.tsx`, CSS e memoização do router; modificar componentes playlist/faixas listados e seus filtros/header. Confirmar variantes paginadas e grid antes de remover qualquer dropdown.

**Interfaces:**

```ts
// table-sort.ts, importações de tipos apenas; sem React, stores ou enums runtime.
export function getNextTableSort<T extends string>(
    current: { sortBy: T; sortOrder: 'ASC' | 'DESC' }, requested: T,
): { sortBy: T; sortOrder: 'ASC' | 'DESC' };
export function getSongSortForColumn(columnId: string): string | undefined;
// Mapa literal de TableColumn: name/titleArtist/titleCombined -> name;
// artists -> artist; album -> album; duration -> duration; rowIndex -> id.

// Prop opcional em ItemTableListProps/TableItemProps, transmitida a headers sticky/pinned.
export interface ItemTableSort {
    activeColumnId?: TableColumn;
    direction: SortOrder;
    disabled?: boolean;
    onSort: (columnId: TableColumn) => void;
    sortableColumnIds: readonly TableColumn[];
}
// Acrescentar `sort?: ItemTableSort` a ItemTableListProps e TableItemProps.
// use-table-sort.ts, usa os hooks/persistência existentes.
export function useTableSort(options: {
    listKey: ItemListKey; defaultSortBy: SongListSort; disabled?: boolean;
}): ItemTableSort;
```

- [ ] **Step 1:** Criar teste nativo e loader restrito. `node --test scripts/ui-refresh/table-sort.test.mjs` deve falhar porque `table-sort.ts` não existe. Asserts mínimos:

```js
assert.deepEqual(getNextTableSort({ sortBy: 'name', sortOrder: 'ASC' }, 'name'), { sortBy: 'name', sortOrder: 'DESC' });
assert.deepEqual(getNextTableSort({ sortBy: 'name', sortOrder: 'DESC' }, 'name'), { sortBy: 'name', sortOrder: 'ASC' });
assert.deepEqual(getNextTableSort({ sortBy: 'name', sortOrder: 'DESC' }, 'album'), { sortBy: 'album', sortOrder: 'ASC' });
assert.equal(getSongSortForColumn('album'), 'album');
assert.equal(getSongSortForColumn('name'), 'name');
assert.equal(getSongSortForColumn('titleArtist'), 'name');
assert.equal(getSongSortForColumn('titleCombined'), 'name');
assert.equal(getSongSortForColumn('artists'), 'artist');
assert.equal(getSongSortForColumn('duration'), 'duration');
assert.equal(getSongSortForColumn('rowIndex'), 'id');
assert.equal(getSongSortForColumn('imageUrl'), undefined);
assert.equal(getSongSortForColumn('__layoutFill'), undefined);
```

- [ ] **Step 2:** Implementar helpers e prop opcional. Estado desativado em edição da playlist e em listas não elegíveis. Colunas não ordenáveis não recebem botão. Click/Enter/Space ordenam; seta e `aria-sort` indicam estado. Separar hit area de sort dos handles resize/reorder; drag não ordena. Auditar comparadores memoizados para sort não ficar visualmente desatualizado.
- [ ] **Step 3:** Ligar a `useSortByFilter`, `useSortOrderFilter` e persistência por servidor/lista. Atualizar os dois valores atomicamente na mesma transição de URL através de `setMultipleSearchParams`; não emitir duas alterações independentes que possam perder filtros. Persistir ambos através de `useListFilterPersistence` e converter o resultado literal do helper por `SortOrder[next.sortOrder]` no hook. Preservar defaults `SongListSort.ID/ASC` para playlist e `NAME/ASC` para faixas. `#` repõe ordem original ASC quando outra coluna está ativa; cliques seguintes alternam direção.
- [ ] **Step 4:** Aplicar à tabela de playlists e às duas tabelas de faixas. Ordenação da biblioteca vai para a query existente, incluindo paginação. Playlist ordena dados completos em memória, mantém `playlistItemId` e nunca dispara mutation de reorder por clique em header. Ordenar também resultados filtrados sem alterar critérios ou relevância da pesquisa global; se isto modificar comportamento atual, limitar a alteração explicitamente às tabelas destas duas superfícies.
- [ ] **Step 5:** Compactar header/toolbar com `ActionIcon` e tooltips; preservar descrição, metadados, imagem custom, upload/delete/drop de imagem, ações de edição e save/replace. Guardar filtros e opções de ordenação sem coluna visível num menu; manter dropdown em grid/detalhe/headers desativados. Não converter ações destrutivas ambíguas em ícones sem confirmação.
- [ ] **Step 6:** Executar testes nativos e `UI-04`: title ASC/DESC, artista, álbum, duração e ordem original; resize/drag de colunas não altera sort; filtros e sort persistem após reload e isolam servidores; lista com 10 000 faixas ordena através da query; playlist com duas ocorrências da mesma faixa mantém seleção/remoção por ocorrência; entrar em edição desativa sort; cancelar não grava ordem. Testar menus, teclado, context menu, rating/favorite, vistas grid/detalhe e agrupamento de álbum.
- [ ] **Step 7:** Correr verificações comuns. Commit candidato: `feat(library): add sortable headers and compact actions`.

### Task 5: Renovar playerbar e leitor expandido sem alterar playback

**Files:** modificar os componentes/CSS de player listados, `default-layout/full-screen-overlay.tsx` apenas se necessário para layout/foco, componentes mobile correspondentes. Reutilizar `src/renderer/store/full-screen-player.store.ts` sem alterar defaults guardados nem criar estado de reprodução novo.

**Interfaces:** conservar `FullScreenPlayer`, `FullScreenPlayerImage`, `FullScreenPlayerQueue`, `FullScreenPlayerControls`, `LeftControls`, `CenterControls`, `RightControls`, `usePlayer()` e `useFullScreenPlayerStoreActions().setStore(...)`. `expanded` e `activeTab` continuam nos stores atuais. Preferência `uiBlurEnabled` controla apenas chrome/backdrop novo; `dynamicBackground` e `dynamicImageBlur` continuam a controlar artwork.

- [ ] **Step 1:** Definir `UI-05` com todas as ações do leitor inventariadas na tarefa 1; capturar baseline de fila, letras, related e visualizador, com webAudio on/off e rádio.
- [ ] **Step 2:** Ajustar composição e CSS, mantendo controlos atuais. Capa/título/transport de um lado, módulo ativo do outro. Sem módulo ativo, respeitar modo de capa expandida. Ícones e tooltips para ações; títulos de módulos legíveis. Relacionadas e Visualizador continuam disponíveis mesmo não estando no HTML aprovado.
- [ ] **Step 3:** Aplicar blur respeitando stores atuais, `uiBlurEnabled`, reduced transparency/motion e temas. Reutilizar carregamento/resolução/cor de artwork atual; nenhum pedido ou canvas extra por frame. Respeitar tratamento atual de rádio e evitar usar capa de faixa anterior quando não existe artwork.
- [ ] **Step 4:** Executar `UI-05`: abrir/fechar/voltar ao leitor, teclado e foco, seek/volume/mute/device, fila e Up Next, filtros áudio, pitch/velocidade, shuffle/repeat, sleep timer, favoritos/rating, letras, similar songs, visualizador expandir/reduzir. Esperar mesma chamada de player e mesmos limites por motor; entrar/sair da vista nunca reinicia áudio, contexto ou fila.
- [ ] **Step 5:** Testar artwork custom/ausente/quebrado, alternância rápida de faixa/servidor, rádio, nomes longos, volume com menu de dispositivos, mobile e 125% zoom. Foco e captura de teclado não interferem com input de pesquisa ou atalhos globais.
- [ ] **Step 6:** Correr verificações comuns. Commit candidato: `feat(player): refresh player surfaces and layout`.

### Task 6: Fechar paridade visual e funcional da app

**Files:** atualizar `docs/agents/ui-refresh-acceptance.md`; corrigir apenas componentes UI/CSS tocados ou outras superfícies renderer que demonstrem regressão provocada por estas alterações. Não aproveitar esta tarefa para redesign de domínios não aprovados.

**Interfaces:** produz checklist final com PASS/FAIL/NOT TESTED, capturas, comandos e limitações; nenhuma nova API de produto.

- [ ] **Step 1:** Executar `UI-06` em desktop e web com os servidores disponíveis: Navidrome, Jellyfin e OpenSubsonic. Registar os não disponíveis. Exercitar autenticação/troca de servidor, listas, smart playlists, filtros, upload/delete artwork em playlist descartável, rádio, casting, queue e busca global.
- [ ] **Step 2:** Comparar inventário da tarefa 1 com a nova UI: cada ação tem destino acessível, não apenas handler ainda presente no código. Testar routes Álbum/Artista/Género/Pastas/Favoritos/Settings, command palette, atalhos, context menus, share/download/tag editor e import/export conforme capacidades.
- [ ] **Step 3:** Verificar MPV, web, DLNA e jukebox conforme suporte e hardware disponível; controlo remoto mantém estado e comandos. Não executar mudanças em engines para fazer a UI passar. Caso seja preciso tocar IPC/remote, parar e pedir expansão do âmbito, lendo `architecture.md`.
- [ ] **Step 4:** Correr `node --test scripts/ui-refresh/table-sort.test.mjs`, `pnpm lint-code`, `pnpm lint-styles`, `pnpm build:electron`, `pnpm build:web` e `pnpm build:remote`. Esperado exit 0; erros da baseline são separados. Typecheck é confirmado através de CI, não executado localmente.
- [ ] **Step 5:** Comparar scroll/renderização de lista grande com e sem blur em hardware real. Esperar virtualização intacta, sem filtro por célula, sem renders de linhas por cada evento de progresso e sem piora evidente de scroll. Se blur prejudicar desempenho, reduzir superfícies ou usar fallback opaco; não alterar áudio.
- [ ] **Step 6:** Rever o diff contra a baseline: sem motores/controllers/IPC modificados, sem remoções de opções, sem dados ilustrativos do HTML em produção. Confirmar que trabalho `live-reverb` permanece intacto; integrar só por autorização e repetir checks UI/áudio se entretanto entrar na baseline.
- [ ] **Step 7:** Atualizar aceitação com capturas desktop/mobile e temas, falhas e limitações. Commit candidato: `test(ui): record refresh acceptance evidence`. Entregar apenas quando os cenários aplicáveis passarem; hardware/backend indisponível fica explicitamente não validado.

## Auto-revisão do plano

- Design aprovado coberto: início/navegação na tarefa 3, playlists/faixas/ícones/sort na tarefa 4, leitor na tarefa 5, blur/temas na tarefa 2, paridade na tarefa 6.
- Nenhum componente novo substitui o core de tabela, a resolução de artwork ou os motores áudio.
- Contratos novos são opcionais na tabela e explícitos no helper/hook; tipos `SortOrder` usam `ASC`/`DESC`, não os valores minúsculos do mockup.
- Não tratar imagens compostas pelo servidor como ausência de imagem personalizada; seguir `useItemImageUrl` e mutations atuais.
- Testes UI manuais são uma limitação conhecida da baseline, não são rotulados como testes automatizados. O único runner novo usa dependências já presentes e destina-se ao helper puro de sorting.
- Os commits são pontos de corte recomendados, não autorização para fazer staging ou commits.

## Handoff

### Estado da execução Native

Implementação presente em `ui/biblioteca-viva`, baseada na baseline `main` indicada acima. Inventário, shell/blur, início, cabeçalhos ordenáveis e leitor foram implementados e verificados com testes nativos e browser da app real com fixture API externa. ESLint, Stylelint e builds Electron/web/remote passam. A revisão independente encontrou dois problemas de precedência CSS para preferências de acessibilidade; ambos foram reproduzidos, corrigidos e verificados.

A playlist de 10000 faixas e os temas JSON/import-export desktop foram validados com dados e perfis isolados. A aceitação funcional integral continua pendente de servidores/dispositivos reais e edição/remoção de ocorrências repetidas. Os cenários não executados não são PASS. Ver `docs/agents/ui-refresh-acceptance.md` para resultados e limitações. O utilizador autorizou apenas um commit local, sem push nem integração na `main`. O workspace `feature/live-reverb` permanece separado e intacto.

Rever este plano antes de implementar. Escolher:

- **Native:** implementar tarefa a tarefa na mesma sessão, com uma revisão independente no fim se autorizada. Recomendado: alterações de shell, headers e player partilham componentes e beneficiam de contexto contínuo.
- **Subagent-driven:** implementar e rever cada tarefa com agentes separados, seguido de revisão global; mais contextos e mais custo, com gates independentes.

Recomendação: Native, worktree isolado baseado na `main`, com a matriz de paridade a bloquear qualquer perda de funcionalidade.
