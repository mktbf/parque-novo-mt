# Parque Novo Mato Grosso — layout conforme Proposta site pnmt aa.pdf

## Abrir e editar
Abra `dist/index.html` no navegador. Layout, fontes, imagens, páginas e interações locais não exigem instalação nem internet. Links externos e o vídeo do YouTube precisam de conexão.

Para continuar no Antigravity, extraia o ZIP e abra a pasta `parque-novo-mt`. O projeto é HTML, CSS e JavaScript, sem framework nem dependências de execução.

O arquivo avulso `Parque-Novo-MT.html` reúne o mesmo site com fontes, imagens e kit de imprensa incorporados.

Para servir localmente com origem HTTP (recomendado para o player YouTube), execute no diretório `dist`:

```bash
python -m http.server 8000
```

Abra `http://localhost:8000`. Alguns ambientes bloqueiam o player a partir de `file://` (inclusive erro 153); todos os pontos de vídeo incluem a alternativa “Abrir diretamente no YouTube”.

## Referência visual vigente
A referência principal é `reference/Proposta-site-PNMT.pdf` (anexo Proposta site pnmt aa.pdf). Home e Quem Somos reproduzem sua composição e suas frases. As demais páginas e funções existentes foram mantidas e usam o mesmo sistema Barlow. Não redesenhe a Home ao integrar ao repositório.

Fontes identificadas nos recursos incorporados do PDF por `pdffonts`:
- Barlow Regular 400: corpo, descrições e frase institucional.
- Barlow Bold 700: menu, títulos, destaques e nomes dos valores.
- Barlow ExtraBold 800: número 500.
- Barlow Condensed SemiBold 600: chamadas estreitas, nomes nos cartões e títulos espaçados.

As fontes web locais são dessas mesmas famílias e pesos, com subconjunto de caracteres latinos e portugueses. Manrope foi removida.

Home: foto aérea sem escurecimento global, tarjas com as frases originais, faixa sobreposta de 500 hectares, carrossel com cartões inclinados e os seis itens iniciais da proposta, frase institucional entre linhas de gradiente, bloco do vídeo e rodapé com os elementos originais. As setas e o deslize dão acesso aos 21 espaços. Em telas estreitas, os blocos se reorganizam para leitura e toque.

Quem Somos: faixa de título, texto institucional completo, mapa de Mato Grosso, imagem da roda-gigante, valores em duas colunas e foto aérea final. No celular, a estrutura passa a uma coluna.

## Arquivos principais
- `dist/index.html`: estrutura principal, navegação e diálogos.
- `dist/styles.css`: componentes e estilos das páginas de serviço.
- `dist/reference-layout.css`: reprodução da referência visual e regras responsivas; é carregado por último.
- `dist/fonts.css`: fontes locais.
- `dist/content.js`: textos das 21 páginas, valores, notícias e dados iniciais.
- `dist/config.js`: vídeo, redes sociais, mapa, download e endpoints dos formulários.
- `dist/app.js`: navegação por hash, filtros, busca, agenda, galeria, vídeo e formulários.
- `dist/assets`: marcas extraídas do manual, imagens fornecidas e fotos pesquisadas.
- `dist/downloads/kit-pnmt.zip`: logos extraídos, ficha e créditos.
- `REVISAO-EDITORIAL.md`: pontos que o próprio PDF manda confirmar.
- `FONTES-E-CREDITOS.md`: procedência das fotos e conteúdo pesquisado.

## Páginas
Início, O parque/Quem somos, catálogo de Espaços, as 21 páginas individuais, Agenda, Imprensa, Galeria, Quero visitar, Contato, Outros assuntos e Créditos. Cada espaço permite iniciar uma solicitação de evento com o espaço pré-selecionado. Links internos utilizam `#espaco/autodromo`, por exemplo, e funcionam localmente e com o histórico do navegador.

## Funções implementadas
- Busca sem distinção de acentos nos espaços e nas páginas.
- Catálogo com busca e filtro por categoria; contagem de resultados e estados vazios.
- Agenda filtrável por categoria, distinguindo próximos eventos e registros passados. Não há eventos futuros inventados. Existe um registro histórico da Stock Car. Quando um evento futuro é cadastrado, o site habilita download de calendário `.ics`.
- Notícias com filtro, fontes e datas explícitas.
- Galeria com filtros, ampliação das imagens, legendas, crédito e indicação de perspectivas.
- Download do kit de imprensa.
- Vídeo YouTube em player após clique, sem reprodução automática ao abrir a página.
- Formulários de evento, visita, imprensa, outros assuntos e interesse em avisos. Validação nativa, campos obrigatórios, datas e confirmação de consentimento.
- Sem endpoint, formulário prepara cópia para copiar ou baixar, com aviso explícito de que nada foi enviado. Não grava dados pessoais em armazenamento local.
- Com endpoint, faz POST JSON, mostra confirmação somente após HTTP 2xx com `{ok:true}` e mantém dados em caso de falha. Visitas sempre são solicitações sujeitas à confirmação.
- Menu móvel, foco visível, Escape/fechamento de diálogos, redução de movimento e campos de 16px para celular.

## Ativar recebimento real
O material não informa e-mail de atendimento nem servidor de formulários. Configure `formsEndpoint` e `newsletterEndpoint` em `config.js` com URLs HTTPS sob controle do parque. O endpoint deve aceitar:

```json
{"kind":"visita","submittedAt":"ISO date","fields":{"nome":"...","email":"..."}}
```

E responder com HTTP 2xx e JSON `{ "ok": true }` somente quando a solicitação foi recebida e registrada. O backend precisa implementar validação, proteção contra abuso, entrega ao atendimento e as rotinas de envio de avisos. Chaves de serviços não devem ser colocadas no frontend.

Para cadastrar eventos e notícias, edite os arrays em `content.js` e o registro histórico adicionado em `app.js`. Cadência de atualização semanal é texto editorial, não uma atualização automática implementada.

## Design e conteúdo
Paleta hexadecimal do manual: Navy #0D2B4D, Azul Royal #1261A0, Verde Médio #1B8F3A, Verde Limão #58B947 e Cinza #6B6B6B, além de branco e neutros de interface. Gradiente usa as cores oficiais. As famílias e os pesos tipográficos agora correspondem aos recursos incorporados no PDF de layout: Barlow 400, 700 e 800; Barlow Condensed 600. Logo completo e submarca são renderizados diretamente do PDF sem redesenho.

O documento de textos é de lapidação/aprovação. Números conflitantes e pontos marcados “CONFIRMAR” não são tratados como fatos aprovados. Demais textos foram revisados a partir do material do usuário. Áreas sem fotografia específica usam apresentação tipográfica, sem atribuir imagem de outro lugar ao espaço.

## Verificação e limites
Sintaxe JavaScript, rotas, referências de imagens/fontes e fluxos de filtragem são verificados antes da entrega. O player depende do YouTube, de conexão e das regras da origem de reprodução. Não foi realizado teste visual em navegador. Envio real de formulários e avisos depende de integração do backend; fotos em alta resolução e autorização editorial final devem ser conferidas antes da publicação.
