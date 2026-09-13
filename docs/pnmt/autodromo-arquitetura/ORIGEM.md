# Autódromo — arquitetura para integração

Versão: `autodromo-arquitetura-20260913-1`. Base: `consolidado-20260913-1`.

## Implementado

- A arquibancada e os boxes deixam de ser extrusões simples e recebem arquitetura R03.
- Arquibancada: dois níveis, 30 fileiras visuais, 4.530 assentos instanciados, corredores, degraus, corrimãos, pilares, vigas inclinadas, fechamento verde, venezianas, cobertura inclinada, forro, vigas e terças.
- Boxes: 36 módulos visuais, portas nas duas faces, lâminas e puxadores, laje e galeria, pilares, vãos, cobertura leve com abertura para a torre, janelas, guarda-corpos, escadas contidas no footprint e torre com quatro níveis acima da cota da galeria.
- Concreto, metal, telha/forro e portas recebem microtexturas determinísticas. Vidro recebe reflexão pelo ambiente existente, sem refração adicional.
- Três botões no painel: boxes/torre, arquibancada e circuito completo. Links com `?espaco=autodromo&detalhe=boxes` ou `detalhe=stand` abrem diretamente os detalhes. Em fallback sem WebGL os botões ficam indisponíveis e ocultos.

Os números de fileiras, módulos e assentos acima descrevem esta representação visual. **Não são capacidade oficial, levantamento de obra ou contagem certificada.** Alturas e detalhes têm proporções inferidas das imagens, com parâmetros explícitos no código.

## Fontes e escolha arquitetônica

Pasta inspecionada: https://drive.google.com/drive/folders/1KX4WOwDd6jpmuxiNchfT2dmhWr3-dF0m — 39 JPEG/PNG; nenhuma geometria editável entre esses itens.

Referências principais efetivamente vistas:

- `Cópia de AZM - auto-cuiaba_C-5000-Front-R03.jpg`: arquibancada frontal. Corresponde à seleção enviada por Jean (`17da3b9f-e968-47b5-b47b-8d7eb3f5beec.png`). https://drive.google.com/file/d/1TH24G_BDgcGcLJ5MWH4T8DkgcSmC_ZYZ/view
- `Cópia de AZM - auto-cuiaba_C-3000-back_R03.jpg`: fundos da arquibancada.
- `Cópia de AZM - auto-cuiaba_C-Boxes_R03.jpg`: portas, galeria e torre pelo pit lane. https://drive.google.com/file/d/11_ZIDWvNvdvi708QOE2zU-sN_BXoo7bc/view
- `Cópia de AZM - auto-cuiaba_C-Paddock2_R03.jpg`: face do paddock. https://drive.google.com/file/d/1JIjAqIFV3Z1JtwiHcFcDJi2i7ehexI5w/view
- `Cópia de AUT-CUI-CAM07-R00.jpg`: relação entre os edifícios e extremidade da torre.
- Quatro fotos aéreas diurnas/noturnas fornecidas no chat para confrontar o contexto. Datas de captura não informadas.

R03 foi adotado como referência de maquete de projeto pela correspondência com a seleção de Jean. O conjunto `RENDERS GERAIS` mostra outra solução arquitetônica e não foi misturado ao R03. Não afirmar que este pacote reproduz integralmente a revisão executada.

## Registro espacial preservado

Fonte de implantação: `GOV_U_ParqueNovoMT_ARQ_Implantação_R84.pdf`, carimbo R83, projeto básico. SHA-256: `366b5825834fea554ab3794dd71c547f103f66e17608f431ca4b018f6134a39f`.

Origem da maquete `[620,570]`; coordenadas de prancha a 1600 px. O módulo monta seus vértices nas coordenadas CAD e o root existente aplica a origem uma vez. **Unidades gráficas; não converter alturas para metros sem calibração.**

As duas projeções vêm de `registered.autoBuildings` em `implantacao-dados.js`. Todos os vértices foram conferidos dentro dos contornos correspondentes. Nenhum espaço foi reposicionado para coincidir com um rótulo.

Mantidos: traçado AUTO1, G04, vias, lagos, estacionamentos, os outros 27 lugares, IDs, marcadores, descrição dos espaços, filtros, motor de luz/sombra/HDR e funções de comparação da planta.

## Validação e limites

O relatório `validacao/verificacao-geometria.json` documenta os testes com o Three.js real em CPU: geometria e matrizes preservadas fora do autódromo, vértices finitos, normais, UVs, contenção nos footprints, enquadramentos e participação dos novos materiais no carregamento.

O autódromo detalhado usa 19 malhas, incluindo uma malha de assentos instanciados. Essa contagem não mede FPS nem substitui o teste de renderização no navegador.

As imagens de antes/depois são renders de conferência em CPU, produzidos a partir das malhas do pacote. O piso neutro dessas vistas é somente cenário de conferência. Não faz parte de uma nova base implantada no parque. A iluminação dessas imagens não é o resultado WebGL do site.

Executar uma vez `conferir-no-antigravity.mjs` para verificar a renderização real e gerar quatro capturas. O script usa o Puppeteer já instalado. Não instala dependências, não remodela e não publica por conta própria.

Não incluídos nesta etapa: nova geometria de escapes e zebras sem contorno confirmado, passarela/túnel, centro médico, outras arquibancadas, reconstrução do relevo, infraestrutura de evento, pessoas/veículos ou modo noturno. Essas partes não foram inventadas para completar a cena.
