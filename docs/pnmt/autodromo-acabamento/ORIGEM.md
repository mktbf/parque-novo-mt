# PNMT — Autódromo: acabamento da pista e do entorno

Versão `autodromo-acabamento-20260913-2`.

Este pacote complementa os boxes e a arquibancada R03 já integrados. Inclui código pronto, superfícies registradas, instalador com conferência de versão e um roteiro de teste no navegador. O Antigravity deve integrar os arquivos, sem redesenhar os modelos.

## Instalação

A base esperada é **PNMT-Espacos-Acabamento-02**, versão `espacos-arquitetura-20260913-2`. Ela inclui o autódromo, Arena e Pórtico/Kart/Skate. Finalize essa integração antes deste pacote.

Na pasta extraída deste pacote, usando a raiz do projeto (a pasta que contém `dist/`):

```bash
node instalar-autodromo-acabamento.mjs "CAMINHO_DO_PROJETO"
node instalar-autodromo-acabamento.mjs "CAMINHO_DO_PROJETO" --apply
node conferir-autodromo-acabamento.mjs "CAMINHO_DO_PROJETO"
```

O primeiro comando confere tudo sem alterar arquivos. O segundo aplica o conjunto inteiro com backup temporário fora de `dist`. Uma divergência interrompe a aplicação antes da escrita. Não remova essas verificações. O terceiro utiliza o Puppeteer que já existe no projeto; não instala dependências.

**`dist/` continua sendo a fonte.** A prévia deve ser publicada no projeto Vercel já existente `parque-novo-mt`. Não criar outro projeto chamado `dist` e não promover a produção.

## O que muda

- Material próprio do asfalto, sem compartilhar os ajustes do circuito com as avenidas ou o Kart.
- Faixas nas bordas derivadas dos contornos CAD existentes; marcação visual de largada na reta e delimitação do piso frontal dos boxes.
- Zebras verdes e claras em trechos curvos selecionados; faixas de borda e um estudo de área azul junto ao retorno interno.
- Pisos do paddock, da faixa dos boxes e das imediações das duas construções, com recortes que respeitam a pista e os volumes existentes.
- Guardrails com perfil em W e tela em losangos diante da arquibancada.
- Gramado com mapas de material e variação de cor, confinado ao setor do autódromo.
- Postes e refletores, alternância **Dia / Entardecer iluminado**, céu de entardecer, emissão dos refletores e luz de piso pré-calculada. Até quatro focos dinâmicos iluminam volumes próximos.
- Acessos rápidos **Reta e arquibancada**, **Vista aérea**, **Boxes** e **Arquibancada**. Os links antigos continuam funcionando.

Exemplos de caminhos a usar no endereço da nova prévia:

```text
/pnmt-mapa/index.html?espaco=autodromo&detalhe=reta
/pnmt-mapa/index.html?espaco=autodromo&detalhe=aerea
/pnmt-mapa/index.html?espaco=autodromo&detalhe=aerea&atmosfera=entardecer
/pnmt-mapa/index.html?espaco=autodromo&detalhe=boxes
```

## Fidelidade e limites

O traçado do circuito e a geometria dos 28 espaços anteriores permanecem iguais. O módulo acrescenta acabamento sobre a implantação; não substitui os dados oficiais. Todos os registros continuam em unidades gráficas da prancha de 1600 px, com origem `[620,570]`.

A implantação R84/carimbo R83 é um projeto básico; os renders R03 e os prints mostram referências distintas. Paddock, zebras, pintura azul, repetição de guardrails, marcações, distribuição de postes e alturas de proteção contêm interpretação visual. **Não são um levantamento da obra nem um projeto executivo de sinalização ou iluminação.** O contorno azul foi limitado a um estudo local; a extensão exata exige validação com foto superior registrada. Não foi alterado o relevo do terreno sem levantamento altimétrico.

As 144 posições de refletores do estudo são parâmetros de representação. Não declarar essa quantidade como inventário oficial. A luz de piso não calcula lux, sombras de oclusão noturna completas ou homologação esportiva. Ao selecionar outro espaço, o mapa retorna ao dia.

## Validação

`validacao/verificacao-geometria.json`: geometria Three.js conferida em CPU; posições, normais, índices, UVs, materiais e oito enquadramentos matemáticos. `validacao/superficies.json`: exclusão entre pista, pisos, zebras e obstáculos dos postes. `validacao/verificacao-pacote.json`: integridade, instalação, reaplicação e imports.

As imagens comparativas são **projeções CPU da geometria**, com iluminação aproximada e mesmas câmeras antes/depois. Não são capturas do site, não certificam o shader WebGL e não antecipam desempenho de um celular físico.

O teste fornecido para o Antigravity verifica oito enquadramentos, alternância dia/entardecer, persistência do link, WebGL e console. Gera **12 capturas** e um JSON em uma pasta temporária. Conferir visualmente pelo menos a reta, paddock, área azul, gramado, tela da arquibancada, visibilidade das marcações e a vista de entardecer. O teste funcional não substitui essa inspeção.

Na revisão mobile, confirmar que o painel permite chegar aos controles de iluminação por rolagem e que os gestos do mapa continuam utilizáveis. Confirmar fluidez no aparelho disponível; não apresentar a emulação como teste em iPhone físico.
