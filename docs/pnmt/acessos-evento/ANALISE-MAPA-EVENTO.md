# Uso do mapa de acesso do evento

Decisão: a referência agrega informação para orientar o visitante. A implantação técnica continua governando a geometria.

O mapa permite registrar as seguintes relações:

| Informação do evento | Uso no portal | Tratamento nesta etapa |
|---|---|---|
| Estacionamentos 1–2–3 | Identificar o conjunto ao sul | Correspondência com E1/E2/E3 da planta |
| Estacionamento 4 | Identificar uma área de estacionamento a oeste | Associar ao bolsão correto antes de inserir marcador |
| Estacionamento 5 | Identificar área ao sul da Arena | A planta identifica E7 nessa região; manter como alias de evento a conferir |
| Estacionamento 6 | Identificar área ao norte/leste da Arena | Região compatível com E6 da planta |
| Portão 2 | Acesso à arquibancada sul | Função documentada no evento; posição a conferir na implantação |
| Portão 3 | Acesso aos boxes para pilotos/equipes | Não apresentar como entrada geral do visitante |
| Portão 4 | Acesso ao túnel de pedestres | Função documentada; posição a conferir na implantação |
| Portão 5 | Acesso à arquibancada oeste | Função documentada; posição a conferir na implantação |
| Três pontos do trenzinho | Informar transporte interno | Não há horário, trajeto completo ou funcionamento atual informados |

A fonte não identifica o evento nem sua data. Também não demonstra abertura atual, sentido de circulação ou capacidade de vagas. O Portão 1 não aparece entre os rótulos visíveis e não foi criado por dedução.

## Como incorporar depois da revisão do piso

Conserve IDs estáveis para cada lugar físico. Números e nomes usados em eventos devem ser aliases ligados a esse lugar. Assim, uma troca de número em outro evento não move o objeto 3D nem altera sua geometria.

Associe cada portão ao acesso físico comprovado na planta ou em referência atual de campo. Só então crie o marcador. O trenzinho deve pertencer à configuração do evento, com paradas, horários e disponibilidade definidos para aquela operação.

No mapa do visitante, a informação útil é o destino: “Arquibancada sul”, “Boxes — pilotos/equipes”, “Túnel de pedestres” ou “Estacionamentos”. A marcação de acesso ativo deve seguir a operação publicada do evento.

O arquivo acessos-evento.json contém esse levantamento pronto para integração posterior. Coordenadas desconhecidas ficaram nulas. Nenhum trecho da ilustração foi usado para redesenhar o parque.
