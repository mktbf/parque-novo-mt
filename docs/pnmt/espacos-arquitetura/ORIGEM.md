# Arquitetura dos espaços — lote 02

Versão: `espacos-arquitetura-20260913-2` · 13/09/2026.
Base obrigatória: `arena-arquitetura-20260913-1` (pacote PNMT-Arena-Acabamento-01).

Este lote contém código executável de Pórtico, Kartódromo e Skate, mais correções de enquadramento. A implantação permanece no sistema da prancha de 1600 px, com origem única [-620, 0, -570]. Uma unidade gráfica não foi certificada como um metro. O modelo descreve o projeto; estes renders não comprovam a obra executada.

## Fontes lidas

| Espaço | Fonte | Uso e limite |
|---|---|---|
| Pórtico | [Enscape 24/02/2026, 17:53](https://drive.google.com/file/d/1fRegrsqE-3PjE-PqlEkeFcQugjKCwkAx/view), [17:56](https://drive.google.com/file/d/1jVtEjMITQTtt0xjyJbSqF1UxNRlgR-tH/view), [25/02/2026, 08:48](https://drive.google.com/file/d/1gQ-ch5WM8ioR0PVczEH3JKJqLTlJz-aE/view) | Arcos vazados, faixas de revestimento, travessas e juntas. Renders de projeto, não fotografias da obra. |
| Kartódromo | [Kart 1](https://drive.google.com/file/d/1YPW_PhbWjErkhE3gT-3-L0rF0QiLH23V/view), [Kart 2](https://drive.google.com/file/d/1pRZZV3ru3pCnkcFOG-KLgoHg_J3VNO3k/view), [Kart 3](https://drive.google.com/file/d/1LO8qri98W80kNvMOWXr3Pzga_x6UF0EC/view), [Kart 4](https://drive.google.com/file/d/1HBsvu44nmVeQjQWepfD0iGoyTh6mMXmM/view) | Fachada envidraçada inclinada, faixa de cobertura, marquise, marcação quadriculada e coberturas leves. Volumetria interpretada e adaptada à extensão dos dois blocos existentes. Não foi comprovada a revisão executiva destas imagens. |
| Skate | [Vista 01](https://drive.google.com/file/d/1Jme1x52DVNhZ1OVooX8iEsu5aqT0xGp9/view), [03](https://drive.google.com/file/d/1-i7L7BaKUnNRzLjqsP8R5PlrGo6k2YLz/view), [05](https://drive.google.com/file/d/17LLcNUrSEhnBndNsU2mNQFt5HUNyxbJF/view), [07](https://drive.google.com/file/d/1VvdrjvtZQDqRbE297NTUw2d9ovxOW-ii/view) | Concreto claro, bordas azuis, apoios metálicos, cobertura leve, mesas, bancos e equipamentos de street. |
| Implantação | [PDF oficial R84 / carimbo R83](https://drive.google.com/file/d/1tmTfEGBpxk7W752ftdckDCRuJ3KmFJBo/view) e dados já compatibilizados | Mantém circuitos, vias, lagos, estacionamentos e âncoras existentes. Duas projeções de apoio do Skate foram lidas visualmente na prancha, com a mesma natureza interpretativa dos contornos de Skate da base. |

O mapa de evento não foi usado para reposicionar construções ou vias. Anexo de entrada do Kart, novas árvores, rotas operacionais e vagas não foram inventados para completar a cena.

## Alterações implementadas

- Pórtico: superfície opaca substituída por cinco nervuras por asa, travessas, contraventamentos e juntas. Eixos, envoltórias e função de altura do lote anterior mantidos; largura dos perfis e espessura são parâmetros visuais.
- Kart: preservados os pivôs [379,0,852] e [366,0,849], ambos com rotação 0.12 rad. Edifício com portas de enrolar, caixilhos, mezanino envidraçado, cobertura perfilada, marquise e mureta quadriculada. Arquibancada com degraus apoiados e três coberturas. Não há alegação de número real de boxes ou capacidade.
- Skate: quatro bowls e cinco pisos existentes mantidos. Duas coberturas, mesas e bancos nos apoios identificados na prancha, juntas nas partes planas, bordas azuis e transições no setor street.
- Correção de profundidade: o fundo global em y=-0.3 intersectava os quatro bowls. O fundo agora tem quatro recortes coincidentes com seus contornos. Raios de conferência alcançam as profundidades já modeladas, de aproximadamente -1.18 a -1.33 u.
- Câmeras: nove vistas de detalhe entre Autódromo, Arena, Pórtico, Kart e Skate. Enquadramento usa as projeções reais dos detalhes, desconta painéis e controles e preserva a seleção quando chega uma atualização da integração com o portal.
- Apresentação: neblina começa além da área próxima do parque; raio da oclusão ambiente reduzido para não tratar detalhes de poucos centímetros como volumes de dezenas de unidades. Mesma exposição e gerenciamento de cor da base. O resultado visual WebGL deve ser conferido no navegador do Antigravity; a causa exata do print esbranquiçado não foi reproduzida aqui.

## Coordenadas dos novos apoios do Skate

| Apoio | Projeção na prancha | Altura visual |
|---|---|---|
| Central | [255.375,766.5], [258.75,765], [262.875,772.375], [259.25,774.25] | 2.35 u |
| Sul | [250.375,792.25], [253.875,790.5], [259.625,801], [256.125,803.125] | 2.35 u |

Estas coordenadas são digitalização visual, não extração de cota executiva. O reconhecimento das duas coberturas é suportado pela prancha; número de pilares, mobiliário, espessuras e acabamento são interpretação das imagens do projeto. O modelo atual continua precisando de confirmação arquitetônica antes de ser descrito como idêntico à obra.

## Verificação

Relatórios no diretório `validacao` do pacote:

- Preservação byte a byte das fontes de implantação, autódromo, Arena e informações do visitante.
- Mesma geometria final dos outros 25 espaços e das cinco camadas comuns.
- Mesma pista do Kart e mesmos pisos/bowls/equipamentos anteriores do Skate.
- Raios demonstram que o novo fundo não tampa os quatro bowls e que seis pontos entre as nervuras do Pórtico ficam abertos.
- 18 enquadramentos matemáticos, em desktop e mobile, dentro da área reservada ao mapa.
- Normais da arquitetura nova válidas, coordenadas e UVs finitos. Dois vértices com normal nula já pertenciam à pista CAD do Kart; esse dado legado não foi alterado neste lote.
- Texturas próprias pequenas e determinísticas; materiais compartilhados do autódromo continuam com os mesmos registros.

As imagens de antes/depois foram renderizadas a partir das malhas reais em CPU, em câmeras iguais e sobre um piso neutro de apresentação. Não são fotografias, capturas do site, teste de FPS nem demonstração do shader final WebGL. Para o Skate, esse piso neutro tem os quatro recortes nos dois lados do comparativo, permitindo ver a geometria dos bowls já existente.
