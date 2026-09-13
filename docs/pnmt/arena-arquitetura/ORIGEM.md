# Arena Show — acabamento 01

Versão: `arena-arquitetura-20260913-1`.
Base: `PNMT-Autodromo-Arquitetura-01`, versão `autodromo-arquitetura-20260913-1`.

## O que foi preparado

- Cobertura: junta longitudinal modelada, material de pintura metálica e textura de rugosidade de 128 × 128 gerada pelo código. A função de altura e o contorno anteriores foram preservados.
- Estrutura inferior: terças secundárias e acabamentos dos apoios. Espaçamento e espessuras são parâmetros visuais.
- Blocos laterais: quatro volumes de sanitários e dois de bares, separados conforme as funções identificadas na planta. A subdivisão e as medidas locais foram interpretadas visualmente; não são cotas extraídas de projeto executivo.
- Bilheteria independente: esquadrias, portas recuadas, puxadores, rodapés e arremates de cobertura. Sua posição, rotação, contorno em U e desenho de piso permanecem os da base.
- Piso do pavilhão: removidas as faixas semicirculares decorativas, sem respaldo nas referências consultadas. O piso permanece aberto para eventos.
- Materiais próprios da Arena, com registro e descarte das texturas na rotina existente. O vidro novo usa reflexão opaca; não acrescenta refração nem nova dependência.

## Fontes e decisões

| Referência | Evidência usada | Limite |
| --- | --- | --- |
| `dist/pnmt-mapa/assets/spaces/arena-show.webp` | Foto aérea: cobertura branca ondulada com borda azul, pavilhão aberto, anexos separados e bilheteria recuada independente | Data da foto não confirmada; alturas não medidas |
| `GOV_U_ParqueNovoMT_ARQ_Implantação_R84.pdf`, carimbo R83; recorte `arena-e-acessos.webp` | Relação entre pavilhão, praça, acesso e blocos identificados como banheiros A/B/C/D e bares A/B | Projeto básico; não é levantamento as-built. Mantida a implantação da base, sem recalibrar metros |
| [Pasta ARENA SHOW no Drive](https://drive.google.com/drive/folders/14mmCNkNZJtjSL0tjfcuLkiK7rMu6F2yh) | Conferidas sete imagens, listadas abaixo | Contém propostas de retrofit que diferem da foto aérea |

Imagens do Drive efetivamente abertas e comparadas nesta etapa:

1. [Enscape 11-15-08](https://drive.google.com/file/d/1d5uP7kaJI65NKyg_60PHMmVrajxyKfIK/view).
2. [Enscape 11-18-50](https://drive.google.com/file/d/13RInn9U7thWwHQttGlZToHNN1b4NkQ-8/view).
3. [Enscape 11-28-25](https://drive.google.com/file/d/1tyJetXB9HkfuScvgRkfuPjHCgvk9wkss/view).
4. [Enscape 12-10-59](https://drive.google.com/file/d/1NS11zbkHeZXOiW99ndtvqUYhUDUuYnoG/view).
5. [Enscape 12-24-37](https://drive.google.com/file/d/1lUe1GKLkkwHs1jQUDpd5UQiqUPsZ307s/view).
6. [BACKSTAGE 01](https://drive.google.com/file/d/1pWbs-_D05dn4DIJ1aEKMN4J9hG6NhccW/view).
7. [RETROFIT BAR 01](https://drive.google.com/file/d/1RWZKeD9Qf7evjrhP2aqH2LaV49jyYf3S/view).

As vistas Enscape mostram uma proposta com escultura, letreiro, publicidade e desenho curvo na praça. Esses elementos não foram transferidos para a implantação existente. O revestimento perfurado proposto para o backstage também não foi aplicado como se já estivesse construído. A data no nome do render e a data de armazenamento no Drive não confirmam a execução da obra.

## Implantação e precisão

Mantidos `arenaLayout.pavilion` e `arenaLayout.ticketOffice`, origem `[620,570]`, parâmetros de contorno e altura da cobertura. A origem é subtraída apenas pelo grupo raiz existente.

As juntas da cobertura seguem a mesma superfície. As malhas superior e inferior são transformadas para coordenadas da Arena antes do agrupamento, para conservar os UVs sem deslocamento duplo. A subdivisão dos anexos permanece dentro dos limites horizontais ocupados pelo conjunto anterior.

Isso é um refinamento arquitetônico para navegação no site. Não constitui projeto executivo, medição de campo, certificação de acessibilidade ou comprovação de fotorealismo. Posição geral preservada não comprova precisão métrica do modelo anterior.

## Validação

`validacao/verificacao-geometria.json`: Three.js real em CPU, geometria finita, normais, índices, UVs, âncoras, cobertura e preservação dos outros 27 espaços e cinco camadas. Inclui o registro de materiais do autódromo.

`validacao/verificacao-pacote.json`: integridade, compatibilidade da base, instalação, idempotência, recusa de divergência e resolução dos imports.

`Arena-Antes-Depois.png`: render de conferência em CPU das malhas deste pacote, com mesmas câmeras, luz e chão neutro no antes/depois. Não é captura do site. Esse chão não é inserido no projeto.

O script `conferir-arena-no-antigravity.mjs` deve rodar no ambiente com WebGL. Ele ainda não foi executado aqui. Não foram medidos FPS em aparelho físico.
