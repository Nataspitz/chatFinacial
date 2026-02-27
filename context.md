# Contexto Oficial do Projeto

## Objetivo

Aplicacao desktop/web para gestao financeira, com autenticacao, visualizacao de transacoes, calendario mensal e exportacao de relatorio em PDF no ambiente desktop (Electron).

## Stack atual

- React 19 + Vite + TypeScript
- React Router DOM
- Supabase (Auth + tabela `transactions`)
- CSS Modules
- Electron (shell desktop + IPC para exportacao de PDF)
- Jest + Testing Library

## Estrutura principal

- `src/main.tsx`: bootstrap React, define tema inicial (`light|dark`) e registra PWA SW.
- `src/App.tsx`: compoe `AppProviders` + `RouterMain`.
- `src/contexts/AppProviders.tsx`: registra providers globais.
- `src/contexts/AuthContext.tsx`: estado de sessao e funcoes de autenticacao.
- `src/routes/routerConfig.tsx`: definicao das rotas.
- `src/routes/ProtectedRoute.tsx`: guarda de acesso autenticado.
- `src/components/Layout/*` + `src/components/layouts/AppLayout/*`: shell da aplicacao (sidebar + conteudo).
- `src/components/Navbar/*`: navegacao principal e troca de tema.
- `src/services/finance.service.ts`: ponto unico de CRUD financeiro no renderer (Supabase).
- `src/lib/supabase.ts`: client Supabase.
- `src/pages/Login/*`: login/cadastro.
- `src/pages/Formulario/*`: dashboard placeholder (sem form ativo no momento).
- `src/pages/Report/*`: relatorio com CRUD completo + exportacao PDF.
- `src/pages/Calendario/*`: calendario financeiro mensal com agregacoes.
- `electron/main.ts`: janela desktop + handlers IPC.
- `electron/preload.ts`: API segura em `window.api`.

## Rotas atuais e acesso

- `/` -> redireciona para `/dashboard` se autenticado, senao `/login`.
- `/login` -> publica.
- `/dashboard` -> protegida (pagina `Formulario`, hoje como dashboard sem conteudo funcional).
- `/report` -> protegida.
- `/calendario` -> protegida.

## Funcoes globais da aplicacao

### Bootstrap e infraestrutura

- `src/main.tsx`
- `registerSW({ immediate: true })`: ativa service worker da PWA.
- Define tema inicial pelo `localStorage.theme` (fallback `light`).

### Auth (src/contexts/AuthContext.tsx)

- `signUp(email, password)`: cria conta no Supabase Auth.
- `signIn(email, password)`: autentica usuario.
- `signOut()`: encerra sessao.
- `useEffect` inicial:
- `supabase.auth.getSession()`: recupera sessao no load.
- `supabase.auth.onAuthStateChange(...)`: sincroniza estado `user/loading` em mudancas de sessao.
- Estado exposto:
- `user`
- `isAuthenticated`
- `loading`

### Controle de rota

- `RootRedirect` (`src/routes/routerConfig.tsx`): decide destino inicial conforme auth.
- `ProtectedRoute` (`src/routes/ProtectedRoute.tsx`): bloqueia rotas privadas e redireciona para `/login`.

### Navbar e UX global (`src/components/Navbar/Navbar.tsx`)

- `getLinkClassName(...)`: aplica estilo ativo em links.
- `toggleTheme()`: alterna `light/dark` e persiste em `localStorage`.
- `closeMenu()`: fecha drawer mobile.
- `useEffect` de tema: aplica `data-theme` no `html`.
- `useEffect` mobile menu: controla `document.body.style.overflow` com menu aberto.

### Modal base (`src/components/ui/ModalBase/ModalBase.tsx`)

- `useEffect` quando aberto:
- trava scroll do body.
- fecha com tecla `Escape`.
- restaura estado ao desmontar/fechar.
- Clique no overlay fecha modal; clique no conteudo nao propaga.

## Servicos e CRUD geral

### Finance Service (src/services/finance.service.ts)

Funcoes auxiliares:

- `toTransaction(row)`: converte linha Supabase para tipo interno `Transaction`.
- `normalizeDateValue(value)`: normaliza para `YYYY-MM-DD` quando possivel.
- `getAuthenticatedUserId()`: garante usuario autenticado e retorna `user.id`.

CRUD e operacoes:

- `saveTransaction(transaction)` -> **CREATE** em `transactions`.
- `getTransactions()` -> **READ** de `transactions` (ordenado por data desc).
- `updateTransaction(transaction)` -> **UPDATE** por `id`.
- `deleteTransaction(id)` -> **DELETE** por `id`.
- `exportReportPdf(payload)` -> delega para `window.api.exportReportPdf` (apenas desktop).

Observacao importante:

- O CRUD funcional do renderer esta no Supabase.
- A API `window.api` e usada apenas para exportacao de PDF no desktop.

### Outros servicos

- `src/services/db.service.ts`: placeholder (sem implementacao funcional).
- `src/services/report.service.ts`: placeholder com `initialize()`.
- `src/services/api.ts`: cliente Axios base (suporte para futuras integracoes).

## Paginas atuais: funcoes e CRUD

### 1) Login (`src/pages/Login/Login.tsx`)

Funcoes:

- `handleSubmit(event)`:
- valida email/senha obrigatorios.
- executa `signIn` ou `signUp` conforme `authMode`.
- redireciona para rota de origem (`location.state.from`) ou `/dashboard`.
- Trata loading de sessao e redirecionamento automatico se ja autenticado.

CRUD da pagina:

- Nao manipula CRUD de transacoes.
- Opera autenticacao (create de conta e login/logout via contexto).

### 2) Dashboard/Formulario (`src/pages/Formulario/Formulario.tsx`)

Funcoes:

- Componente renderiza somente `PageIntro` com texto de placeholder.

CRUD da pagina:

- **Sem CRUD ativo** atualmente.
- O formulario transacional anterior foi substituido por placeholder nesta tela.

### 3) Report (`src/pages/Report/Report.tsx`)

Funcoes auxiliares:

- `formatCurrency(value)`
- `formatDate(value)`
- `normalizeTransactionDate(value)`
- `getTodayDate()`
- `shouldIncludeMonthlyCostInPeriod(transaction, selectedYear, selectedMonth, selectedDay)`
- `getPeriodLabel()`

Funcoes de estado/acao:

- `loadTransactions()` -> carrega transacoes do servico.
- `handleDelete(id)` -> remove transacao.
- `handleEditStart(transaction)` -> inicia edicao inline.
- `handleEditCancel()` -> cancela edicao.
- `handleEditChange(field, value)` -> altera rascunho de edicao.
- `handleEditSave()` -> valida e salva edicao.
- `handleCreateSubmit()` -> valida e cria nova transacao via modal.
- `handleExportReport()` -> monta payload e exporta PDF.

Derivacoes com `useMemo`:

- `yearOptions`, `filteredTransactions`, `dayOptions`
- `entries`, `outcomes`
- `totalEntries`, `totalOutcomes`, `resultBalance`

CRUD da pagina:

- **CREATE**: `handleCreateSubmit` -> `financeService.saveTransaction`.
- **READ**: `loadTransactions` -> `financeService.getTransactions`.
- **UPDATE**: `handleEditSave` -> `financeService.updateTransaction`.
- **DELETE**: `handleDelete` -> `financeService.deleteTransaction`.
- Extra: exportacao PDF via `financeService.exportReportPdf`.

Subcomponentes relevantes da pagina Report:

- `PageHeader`: dispara abrir modal e exportar.
- `ReportFilters`: altera filtros ano/mes/dia.
- `TransactionsTable`:
- `getMonthlyCostValue(...)`
- `renderActions(...)`
- toggle de expandir/retrair secao.
- suporta edicao em desktop e card mobile.
- `ReportSummary` e `ResultFooter`: exibicao de agregados.

### 4) Calendario (`src/pages/Calendario/Calendario.tsx`)

Funcoes auxiliares:

- `formatCurrency(value)`
- `formatMonthTitle(date)`
- `toDateKey(date)`
- `normalizeTransactionDate(value)`
- `getAvailableYears(transactions, currentYear)`
- `buildDailyTotalsMap(transactions, monthDate)`
- `buildCalendarCells(monthDate, totalsMap)`

Funcoes de estado/acao:

- `goToPreviousMonth()`
- `goToNextMonth()`
- `onYearChange(event)`
- `useEffect` inicial para leitura de transacoes.

Derivacoes com `useMemo`:

- `totalsMap`, `cells`, `availableYears`
- `monthTotalEntrada`, `monthTotalSaida`

Regras de negocio do calendario:

- Soma entradas/saidas por dia.
- Aplica recorrencia para `saida` com `isMonthlyCost=true` no mesmo dia dos meses seguintes.
- Ignora recorrencia quando o dia nao existe no mes (ex.: dia 31 em fevereiro).

CRUD da pagina:

- **READ** apenas: consome `financeService.getTransactions`.
- Nao cria/edita/apaga diretamente.

## Camada desktop (Electron)

### `electron/main.ts`

Funcoes principais:

- `createMainWindow()`
- `formatCurrency(value)`
- `formatDate(value)`
- `escapeHtml(value)`
- `renderRows(transactions)`
- `buildReportHtml(payload)`
- `buildReportPdfFileName()`

Handlers IPC registrados:

- `'finance:exportReportPdf'`

Observacao:

- O fluxo financeiro do renderer usa Supabase para CRUD.
- O handler de exportacao PDF segue ativo e utilizado via `window.api.exportReportPdf`.

### `electron/preload.ts`

API exposta em `window.api`:

- `exportReportPdf(payload)`

## Listagem de CRUD por pagina (resumo rapido)

- Login: autenticacao (`signIn`, `signUp`, `signOut`), sem CRUD de transacao.
- Dashboard/Formulario: sem CRUD ativo.
- Report: CRUD completo de transacao + exportacao PDF.
- Calendario: somente leitura/agregacao.

## Fluxo da aplicacao (listagem)

1. App inicia em `src/main.tsx`, aplica tema e monta React.
2. `AppProviders` sobe `AuthProvider`.
3. `AuthProvider` consulta sessao no Supabase e observa mudancas de auth.
4. Router avalia `/` em `RootRedirect`:

- autenticado -> `/dashboard`
- nao autenticado -> `/login`

5. Em rota privada, `ProtectedRoute` valida auth antes de renderizar layout.
6. `Layout/AppLayout` monta Navbar lateral + area de conteudo.
7. Navegacao entre paginas privadas pela `Navbar` (`/dashboard`, `/report`, `/calendario`).
8. Fluxo de dados financeiro:

- Paginas chamam `financeService`.
- `financeService` valida usuario autenticado via Supabase Auth.
- CRUD de transacoes ocorre na tabela Supabase `transactions`.

9. Fluxo de relatorio:

- Report filtra/transfoma dados locais (ano/mes/dia, totais, entradas/saidas).
- Edicao e criacao ocorrem na propria pagina e persistem via service.

10. Fluxo de exportacao PDF (desktop):

- Report chama `financeService.exportReportPdf`.
- `window.api.exportReportPdf` invoca IPC `finance:exportReportPdf`.
- Electron gera HTML, imprime PDF e salva arquivo em pasta de relatorios local.

11. Logout:

- `Navbar` chama `signOut()`.
- estado de auth muda e usuario retorna ao fluxo de login.

## Convencoes atuais

- TypeScript `strict`.
- Componentes em `PascalCase`.
- CSS Modules por pagina/componente.
- Separacao por camadas: UI, paginas, servicos, contexto, rotas, electron.

## Como rodar

1. `npm install`
2. `npm run dev`

## Build

1. `npm run build`
2. `npm run build:electron`
3. `npm run electron:build`

## Memoria oficial

Este `context.md` deve ser atualizado sempre que houver mudanca de arquitetura, fluxo, rotas, regras de negocio ou contrato de servicos.
