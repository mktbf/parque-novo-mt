# PNMT — consolidação de localização e apresentação

Versão: `consolidado-20260913-1`.
Base recebida: `PNMT-BASE-ATUAL.zip`, commit informado `4248feb`, versão G04.

## Resultado para o visitante

- Sete estacionamentos identificados individualmente por E1 a E7, com busca, seleção pelo contorno, painel e link direto `?espaco=estacionamento-eN`.
- Filtro “Estacionamentos e entrada”, que reúne os sete bolsões, o pórtico e a página geral de estrutura/acesso.
- Orientações de chegada nos painéis do autódromo, Arena, pórtico e estacionamentos. A alocação dos bolsões e a abertura dos portões continuam dependendo da organização de cada evento.
- Lista de espaços e links diretos continuam utilizáveis quando o navegador não consegue iniciar o 3D.

## Referência e preservação

Os contornos vêm dos mesmos dados geométricos G04 recebidos. Os códigos foram conferidos no texto nativo da planta `GOV_U_ParqueNovoMT_ARQ_Implantação_R84.pdf`, carimbo R83. A tabela de origem está em `origem-estacionamentos.json`.

| Código da planta | Componente G04 | Região |
|---|---:|---|
| E1 | 6 | Conjunto principal junto à entrada |
| E2 | 4 | Conjunto principal junto à entrada |
| E3 | 7 | Conjunto principal junto à entrada |
| E4 | 3 | Conjunto a oeste |
| E5 | 2 | Conjunto a oeste, ao lado de E4 |
| E6 | 0 | Região da Arena |
| E7 | 1 | Região da Arena |

O índice do componente é interno e começa em zero. As coordenadas do modelo são unidades gráficas da implantação; não são medições topográficas em metros.

Os 21 lugares originais mantêm IDs, posições, alturas e contornos. A comparação com a base preserva a geometria final de seus modelos e das camadas de vias, água, circuitos, infraestrutura e vegetação. A correção AUTO1 do autódromo e os dados G04 não foram refeitos.

O mapa de evento permanece uma referência complementar. Sua numeração de estacionamentos não é intercambiável com os códigos da planta: o “Estacionamento 5” do evento fica na região de E7. Não foram inventadas coordenadas de portões, rotas, pontos de trenzinho ou regras operacionais atuais.

## Materiais e processamento

- Água com menor intensidade e repetição do relevo de superfície.
- Terreno de contexto com o mesmo material e fase de textura do terreno registrado.
- Ajuste de tonalidade do asfalto e do piso fotográfico dos estacionamentos. Recortes e coordenadas da fotografia foram preservados; os veículos e sombras dessa imagem continuam sendo parte da fotografia.
- Construções provisórias da cena que eram imediatamente descartadas foram removidas da inicialização. Na comparação em CPU, foram 4.389 geometrias descartadas a menos, sem mudar a geometria final das camadas comparadas. Isso não é uma medição de FPS.
- Pós-processamento de oclusão criado somente quando disponível e utilizado, e suspenso durante a interação com a câmera.

## Conferência realizada e limites

`verificacao-tecnica.json` registra a comparação de geometrias com Three.js real, os testes de busca, as áreas clicáveis e a integridade dos dados. O carregamento de imagens foi simulado nesse teste em CPU. A aparência WebGL, a navegação real e o desempenho em telefone físico não foram certificados aqui.

A conferência de integração no Antigravity usa `validar-no-navegador.mjs`, com três capturas: E2 em 3D, E2 com planta a 55% e E1 em viewport mobile. O teste mobile é emulação de viewport, não um ensaio em aparelho físico. Conferir visualmente essas capturas antes de compartilhar a prévia.

Este pacote melhora a localização, a orientação e a apresentação da maquete existente. Modelos arquitetônicos detalhados, topografia real, circulação interna completa dos bolsões e informação operacional por evento exigem referências específicas. Não representa certificação de obra executada nem uma reconstrução fotorrealista de todos os espaços.
