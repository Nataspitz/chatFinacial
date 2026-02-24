# Contexto Oficial do Projeto

## Objetivo do projeto
Aplicacao desktop para fluxo financeiro com arquitetura modular, separando UI, roteamento, servicos e camada desktop (Electron).

## Stack utilizada
- Electron (main + preload)
- React + Vite + TypeScript
- React Router DOM
- CSS Modules
- better-sqlite3
- Axios
- concurrently
- wait-on
- electron-builder

## Estrutura atual do projeto
- `electron/main.ts`: cria janela desktop e registra IPC de financas.
- `electron/preload.ts`: bridge segura (`window.api`) para salvar/listar/editar/apagar transacoes.
- `electron/services/finance-json.service.ts`: persistencia JSON local de transacoes.
- `electron/types/finance-ipc.types.ts`: contratos tipados de persistencia no IPC.
- `src/routes/routerConfig.tsx`: rotas da aplicacao.
- `src/routes/RouterMain.tsx`: provider de roteamento.
- `src/components/Layout/*`: layout base com `Outlet`.
- `src/components/Navbar/*`: navegacao principal.
- `src/components/ui/*`: biblioteca de componentes base do Design System.
- `src/pages/Formulario/*`: pagina de cadastro.
- `src/pages/Report/*`: pagina de relatorios com leitura, edicao e exclusao.
- `src/pages/Calendario/*`: calendario mensal com somas por dia.
- `src/pages/Formulario/components/*`: componentes menores da pagina de cadastro.
- `src/pages/Report/components/*`: componentes menores da pagina de relatorios.
- `src/pages/Calendario/components/*`: componentes menores da pagina de calendario.
- `src/services/finance.service.ts`: unico ponto de integracao financeira no renderer.
- `src/services/db.service.ts`: placeholder de banco.
- `src/services/report.service.ts`: placeholder de relatorios.
- `src/services/api.ts`: cliente Axios.
- `src/types/transaction.types.ts`: tipos de transacao.
- `src/styles/globals.css`: tokens globais, temas light/dark e estilos base.
- `__tests__/pages/*`: testes das paginas.
- `__tests__/components/*`: testes de componentes/servicos.

## Design System e Tema
- Design System centralizado em `src/styles/globals.css`.
- Tokens globais de:
  - brand scale
  - gray scale
  - feedback colors
  - typography
  - spacing (base 4px)
  - radius
  - shadows
- Suporte a tema `light` e `dark` via atributo `data-theme` no `html`.
- Tema inicial:
  - carregado de `localStorage` (`theme`) em `src/main.tsx`
  - fallback para `light`
- Troca de tema:
  - implementada no `Navbar`
  - persiste em `localStorage`

## Biblioteca UI (reutilizavel)
- Componentes disponiveis em `src/components/ui`:
  - `Button` (`primary`, `secondary`, `danger`, `ghost`)
  - `ButtonLoading`
  - `Input`
  - `Card`
  - `Badge`
  - `Alert`
  - `Spinner`
  - `ModalBase`
  - `ContainerLayout`
  - `SectionWrapper`
- Padrao visual aplicado:
  - gradientes por variante
  - hover/active/disabled/loading
  - sombras por tokens
  - compatibilidade com light/dark
- Uso atual:
  - botoes de `Navbar`, `Formulario`, `Report` e navegacao do `Calendario` usam componentes UI.

## Rotas
- `/formulario`
- `/report`
- `/calendario`

## Feature ativa: Formulario
- Campos:
  - tipo
  - valor
  - data
  - categoria
  - descricao
  - `isMonthlyCost` (somente para `saida`)
- Regra de data:
  - `Hoje`: usa data do dispositivo automaticamente.
  - `Outra data`: habilita data manual.
- Regra de custo mensal:
  - Apenas `saida` pode ser marcada como custo mensal.
  - Para `entrada`, `isMonthlyCost` e sempre `false`.
- Submit chama `finance.service.saveTransaction()`.
- Estrutura interna da pagina foi modularizada em componentes menores (`src/pages/Formulario/components/*`).

## Report
- Busca transacoes no mount via `finance.service.getTransactions()`.
- Separa e renderiza:
  - Entradas
  - Saidas
- Cada linha possui:
  - Editar
  - Apagar
- Edicao inline permite alterar data/categoria/descricao/valor e `isMonthlyCost` (somente saidas).
- Estrutura interna da pagina foi modularizada em componentes menores (`src/pages/Report/components/*`).
- Correcao de data:
  - exibicao da data no relatorio trata `YYYY-MM-DD` como data local (`new Date(year, month - 1, day)`)
  - evita deslocamento de um dia por timezone em datas salvas no formulario.

## Calendario
- Exibe calendario mensal real (grade de 6 semanas).
- Mostra totais de entradas e saídas por dia.
- Exibe totais consolidados do mês atual.
- Permite navegar entre meses (anterior/proximo).
- Regra de recorrência:
  - Transacao `saida` com `isMonthlyCost=true` aparece em todos os meses no mesmo dia.
  - Permanece recorrente ate ser editada ou excluida.
- Estrutura interna da pagina foi modularizada em componentes menores (`src/pages/Calendario/components/*`).

## Persistência Local JSON
- Arquivo salvo em `app.getPath("userData")` com nome `finance.json`.
- Estrutura:
  ```json
  {
    "transactions": [
      {
        "id": "string",
        "type": "entrada | saida",
        "category": "string",
        "amount": 0,
        "description": "string",
        "date": "string",
        "isMonthlyCost": false
      }
    ]
  }
  ```
- Fluxo IPC:
  - Renderer -> `finance.service`
  - `finance.service` -> `window.api.saveTransaction/getTransactions/updateTransaction/deleteTransaction`
  - `preload.ts` -> canais `finance:save/getAll/update/delete`
  - `main.ts` -> `finance-json.service.ts`
- Validacoes no main:
  - `amount` number finito.
  - `type` em `entrada|saida`.
  - `id` garantido (UUID se ausente).
  - `isMonthlyCost` efetivo apenas para `saida`.

## Convencoes
- TypeScript `strict`.
- Componentes/pastas em `PascalCase`.
- Helpers/utilitarios em `camelCase`.
- CSS Modules locais por pagina/componente.
- Testes centralizados na raiz em `__tests__`, separados por dominio (pages/components).

## Como rodar
1. `npm install`
2. `npm run dev`

## Build
1. `npm run build`
2. `npm run electron:build`

## Memoria oficial
Este `context.md` e a memoria oficial do projeto e deve ser atualizado sempre que a arquitetura, estrutura ou features forem alteradas.
