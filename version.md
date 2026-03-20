# Historico de versoes do ChatFinacial

Este arquivo foi escrito para usuarios e pessoas comuns entenderem como o ChatFinacial evoluiu ao longo do tempo.

Aqui voce vai encontrar:

- o que cada versao entregou na pratica;
- o que mudou no uso do app;
- o que ainda faltava melhorar em cada etapa;
- qual parece ser o proximo passo natural para o produto.

## Como ler este historico

- As versoes abaixo mostram a evolucao oficial mais confiavel do app.
- O foco aqui nao e explicar codigo, e sim mostrar o que mudou para quem usa o sistema.
- Quando houver algo tecnico importante, ele sera explicado de forma simples.

## Visao rapida

| Versao | Periodo | Situacao | O que ela representou |
| --- | --- | --- | --- |
| `0.1.0` | 20/02/2026 a 27/02/2026 | Primeira base completa do MVP | O app deixou de ser uma ideia solta e virou um produto funcional com login, dashboard, relatorios, calendario e PDF |
| `0.1.1` | 09/03/2026 | Versao oficial atual confirmada | O app ficou mais organizado para distribuir, medir desempenho e apoiar analises com ajuda de IA |

## Versao 0.1.0

### O que essa versao trouxe

A `0.1.0` foi a fase em que o ChatFinacial ganhou forma de verdade. Antes disso, o projeto ainda estava montando estrutura. Nessa etapa, ele passou a funcionar como um MVP real de gestao financeira.

### O que o usuario passou a poder fazer

- entrar no sistema com login;
- navegar entre as areas principais do app;
- cadastrar receitas e despesas;
- editar e apagar transacoes;
- visualizar relatorios financeiros;
- acompanhar um calendario mensal com entradas e saidas;
- usar uma dashboard com indicadores mais executivos;
- organizar categorias de entrada e saida;
- exportar relatorios em PDF;
- usar o app tanto na web quanto em uma versao desktop.

### O que mudou na experiencia

- O app deixou de ter cara de prototipo simples e ganhou uma estrutura mais clara.
- A navegacao ficou melhor, com sidebar, protecao de acesso e fluxo de sessao.
- A dashboard passou a mostrar melhor a saude financeira do negocio.
- O relatorio ficou mais util para o dia a dia, porque passou a reunir operacao, filtros e controle de transacoes.
- O calendario ajudou a visualizar o comportamento financeiro ao longo do mes.

### O que ainda era limitado

- Muitas melhorias grandes ficaram acumuladas dentro da mesma versao.
- Ainda nao existia um historico claro de versoes para usuarios acompanharem.
- O processo de lancamento ainda era pouco organizado.
- O app ja era funcional, mas ainda tinha cara de MVP em varios pontos.

### O que essa versao provou

A `0.1.0` provou que o ChatFinacial conseguia sair do papel e funcionar como um sistema de controle financeiro de verdade, com base suficiente para continuar evoluindo.

### Proximo passo esperado naquela epoca

Deixar o produto mais profissional, com melhor distribuicao, mais confianca nas entregas e melhorias na apresentacao para o usuario final.

## Versao 0.1.1

### O que essa versao trouxe

A `0.1.1` foi uma etapa de amadurecimento. Ela nao reinventou o produto, mas melhorou a forma como ele e entregue, acompanhado e usado no dia a dia.

### O que o usuario percebe nessa versao

- melhor preparo da versao desktop para funcionar com os arquivos visuais corretos;
- novos icones e ajustes visuais de distribuicao;
- uma funcionalidade para montar prompts de analise financeira com ajuda de IA;
- uma base inicial para acompanhar desempenho da aplicacao desktop.

### O que mudou na pratica

- A instalacao desktop ficou mais alinhada com a estrutura do projeto.
- O sistema ganhou um modal que ajuda o usuario a montar um texto pronto para levar seus dados financeiros ao ChatGPT Web.
- Esse recurso organiza periodo, tipo de analise, principais numeros e categorias mais relevantes, facilitando uma conversa mais inteligente sobre os dados.
- O projeto passou a guardar uma referencia inicial de desempenho da versao Electron, o que ajuda a evitar que futuras versoes fiquem mais pesadas sem controle.

### O que ainda faltava melhorar

- O processo de versao e release ainda nao estava totalmente profissionalizado.
- Ainda havia dependencia de etapas manuais para empacotar e acompanhar novas entregas.
- O produto passou a ter um recurso de apoio com IA, mas sem uma comunicacao ainda tao clara para usuarios dentro da documentacao principal.
- Surgiu um desalinhamento entre alguns arquivos locais gerados e a versao oficial registrada do projeto.

### O que essa versao representa

A `0.1.1` representa a passagem de um MVP apenas funcional para um MVP que comeca a se preocupar tambem com distribuicao, qualidade percebida e apoio inteligente ao usuario.

### Proximo passo esperado

Transformar o MVP em um produto mais profissional, com:

- historico de versoes mais claro;
- lancamentos mais organizados;
- mais consistencia entre numero da versao e instaladores gerados;
- mais refinamento na experiencia de uso.

## Sobre arquivos locais que nao entram como versao oficial

Existem alguns itens no projeto que aparecem localmente, mas nao devem ser tratados como versoes oficiais para o publico.

- A pasta `react_APP/` parece ser um material legado ou paralelo, e nao a base oficial atual do produto.
- Existe tambem um instalador `1.2.0` salvo localmente, mas ele nao esta acompanhado pela mesma organizacao de versao que aparece no restante do projeto.

Por isso, a referencia oficial mais segura neste momento continua sendo a `0.1.1`.

## Como atualizar este arquivo no futuro

Quando uma nova versao surgir, o ideal e manter este mesmo estilo:

- explicar o que mudou para o usuario;
- evitar linguagem muito tecnica;
- mostrar o que melhorou;
- apontar o que ainda falta;
- deixar claro qual e a versao oficial do momento.
