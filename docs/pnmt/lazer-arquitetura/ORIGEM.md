# Origem geométrica e visual — Espaços / Acabamento 03

Versão `espacos-acabamento-20260914-3`, preparada em 14/09/2026.
Base recebida da sequência: `autodromo-acabamento-20260913-2`.

## Hierarquia das referências

1. Implantação R84, carimbo R83, e o sistema de coordenadas já aplicado ao mapa.
2. Renders das pastas de projeto do Google Drive, consultados e baixados nesta etapa.
3. Imagens já presentes em `assets/spaces/` para fachada e visão de conjunto.

As imagens do Drive são perspectivas renderizadas do projeto. Não tratá-las como fotografia de obra concluída ou levantamento métrico. Não foram utilizados elementos de trânsito temporário do mapa de evento para reposicionar os modelos.

Planta: `GOV_U_ParqueNovoMT_ARQ_Implantação_R84.pdf`.
SHA-256 do PDF utilizado: `366b5825834fea554ab3794dd71c547f103f66e17608f431ca4b018f6134a39f`.
Raster de trabalho já pertencente à base: `assets/referencias/prancha-completa.webp`, 3370 × 2384.

## Sistema e posições

Os pontos estão no desenho normalizado para **1600 unidades de largura**. O mapa existente aplica a origem `[-620, 0, -570]` uma única vez no root. Essas unidades **não estão calibradas em metros**. Altura e largura não devem ser usadas como dimensões executivas.

| Modelo | Registro aplicado | Limite de evidência |
|---|---|---|
| Roda-gigante | Centro `[508,738]`, rotação Y `0.74`, raio `24.5` e eixo a `30`, da base | Não altera o centro ou orientação. A forma dos apoios, pavilhão e cabines é interpretada dos renders |
| Passarela da roda | Eixo `[500,727]` a `[472,709]` digitalizado; conector curto para o pavilhão | Ajusta a passarela para o lado noroeste da ilha. Alturas, torre, patamares e escada são interpretação; não certificam circulação acessível |
| Praça da roda | Piso de raio `21.5`, dentro da ilha | Canteiros e árvores são aproximações visuais, sem modificar a rotatória |
| BMX | Centro `[311,858]`, rotação Y `0.4`; quatro eixos locais `[-13.5,-4.5,4.5,13.5]`; largura `5.7` | Arranjo em planta aproximado à R84/R83. Sem CAD executivo da pista |
| Curvas BMX | Centros locais `[-9,22]`, `[0,-25]`, `[9,16]` | Os saltos, inclinações e alturas não possuem cotas verificadas |
| Casa Cuiabana | Quinas `[[455.5,646],[466,650.5],[459,666.8],[448.5,662.3]]` | Corrige largura e orientação do volume genérico anterior. Fachada, cobertura e degraus interpretados |

Na Casa, a fachada longa é o segmento `[455.5,646]` → `[448.5,662.3]`; o corpo do prédio avança para o interior do polígono, as escadas para a praça. A diferença calculada entre o retângulo e as quinas digitalizadas é de aproximadamente `0.011` unidade gráfica; **isso não mede a precisão real da planta ou da obra**. A tolerância de trabalho da leitura do raster foi estimada em `1.2` unidade gráfica.

No BMX, a disposição anterior dos retornos não acompanhava o desenho. As três curvas foram reposicionadas e as torres colocadas no início das retas. A segunda rampa, visível nos renders, une-se à primeira reta em uma faixa plana; a trajetória dessa união é uma aproximação visual que requer CAD detalhado para certificação.

## Referências consultadas no Drive

Pasta de fotos de projeto: https://drive.google.com/drive/folders/1ZKfeJlHnsNSLr9gzChjMPKjcYwIjtF1O

| Espaço | Arquivo | Uso |
|---|---|---|
| Roda | [Enscape 2025-01-17 / fachada posterior](https://drive.google.com/file/d/1aXvm_u2e8Y4UaFw_NBTfPaKyZPGNbHMK/view) | Vidros, envoltória em arco, praça, canteiros e conexão superior |
| Roda | [Enscape 2026-02-26 / 16-04-31](https://drive.google.com/file/d/17H5wt1cYl8ppznCZDqoMNmzuLUe4SiHS/view) | Torre lateral, treliças e escada |
| Roda | [Enscape 2026-02-26 / 16-31-33](https://drive.google.com/file/d/1jta6geIqF1u8O4fIKEahQ66g5osW7m-U/view) | Vão da passarela, guarda-corpos e cobertura |
| BMX | [Imagem 13/05/2026 / 14-22-49](https://drive.google.com/file/d/1CwnMsszxjrCtEVP9xt4zleXKW_GBqZZY/view) | Torres em alturas diferentes, painéis azuis e brancos, pista e taludes |
| BMX | [Imagem 13/05/2026 / 14-50-33](https://drive.google.com/file/d/13zZbEcXmU1HzNOop5IU1fu5MmnoNkQBA/view) | Duas rampas de largada, aberturas e laterais |
| Casa | [Enscape 2026-04-27 / cena 4](https://drive.google.com/file/d/1hx8Vxqg3cGYHeaRya3dGhaSL4Hpgmo_2/view) | Fachada amarela, patamares, escadas e mureta |
| Casa | [Enscape 2026-04-27 / cena 7](https://drive.google.com/file/d/1Ql8P4O1ts9HOEb_OTGoSelXzdxtVBC8m/view) | Corrimãos, balaustrada, granito e paginação avermelhada |

Imagens da base: `assets/spaces/roda-gigante.webp`, `bmx.webp`, `casa-cuiabana.webp`. A Casa usa a organização de nove vãos da vista frontal e a paleta amarela/clara dos renders de abril de 2026; não mantém o salmão do render anterior.

## Implementação e limites

- `lazer-arquitetura.js` substitui somente os três modelos selecionados, depois da aplicação dos módulos de implantação e arquitetura já existentes.
- Os grupos são consolidados por material. Cabines e detalhes não criam centenas de draw calls. O objeto consolidado mantém `placeId` para raycast e UVs para materiais.
- A geometria da roda é estática, inclusive as 42 cabines. Não foi adicionada rotação, animação física ou entrada navegável no edifício.
- Sete novos detalhes de câmera são adicionados à navegação já existente.
- Material iridescente usa `MeshPhysicalMaterial`; os demais usam `MeshStandardMaterial`. Normal e roughness maps pequenos são gerados deterministicamente em memória, sem chamadas à internet.
- Não há reconstrução fotogramétrica, definição de alturas a partir de topografia, cálculo estrutural, render final offline ou medição de FPS de aparelho físico.
- O pacote herda iluminação e pós-processamento da base do autódromo. Não altera `rendering.js` ou o modo de luz do autódromo.

## Preservação comprovada em CPU

A conferência compara a geometria consolidada antes e depois. Os outros **25 espaços**, as **cinco camadas globais** e o grupo de acabamento do autódromo têm as mesmas assinaturas de geometria. Os arquivos de dados de implantação, traçado, acessos, Arena, arquitetura dos outros espaços e acabamento do autódromo não foram alterados.

Os hashes de base do instalador impedem sobrescrever silenciosamente outra evolução do projeto. As imagens de conferência são projeções em CPU das malhas do código, com sombras e cores aproximadas. Não são screenshots da Vercel. O executor de navegador acompanha a entrega para verificação no Antigravity.
