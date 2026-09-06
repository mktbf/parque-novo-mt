/**
 * Parque Novo Mato Grosso — Base de Pontos do Mapa Interativo (Implantação R81)
 * Coordenadas normalizadas em porcentagem (0 a 100%) da imagem oficial.
 * Status: 'conferido' (localização visualmente validada na R81) | 'pendente' (aguardando demarcação detalhada)
 */
window.PNMT_MAP_POINTS = [
  {
    id: 'autodromo',
    name: 'Autódromo Internacional',
    category: 'Esportes',
    x: 53.5,
    y: 22.0,
    status: 'conferido',
    highlight: true,
    badge: '90 Hectares · Iluminado',
    summary: 'Primeiro autódromo iluminado do Brasil, com mais de 4 km de circuito misto padrão FIA.'
  },
  {
    id: 'kartodromo',
    name: 'Cartódromo',
    category: 'Esportes',
    x: 77.0,
    y: 31.0,
    status: 'conferido',
    highlight: false,
    badge: 'Normas FIA',
    summary: 'Infraestrutura de ponta projetada para competições regionais e internacionais.'
  },
  {
    id: 'motocross',
    name: 'Pista de Motocross',
    category: 'Esportes',
    x: 34.5,
    y: 24.5,
    status: 'conferido',
    highlight: false,
    badge: 'Palco MXGP Brasil',
    summary: 'Maior pista de motocross da América Latina, sede histórica de etapas noturnas.'
  },
  {
    id: 'arena-show',
    name: 'Arena Show',
    category: 'Eventos',
    x: 38.0,
    y: 47.0,
    status: 'conferido',
    highlight: true,
    badge: 'Capacidade: 120 mil',
    summary: 'Ampla cobertura curva, telas cênicas e infraestrutura completa de backstage para megaeventos.'
  },
  {
    id: 'centro-de-eventos',
    name: 'Centro de Eventos',
    category: 'Eventos',
    x: 17.5,
    y: 56.5,
    status: 'conferido',
    highlight: true,
    badge: '5 Pavilhões · 26 mil pessoas',
    summary: 'Pavilhões modulares interligados para congressos, feiras nacionais e internacionais.'
  },
  {
    id: 'skate-park',
    name: 'Complexo de Skate',
    category: 'Esportes',
    x: 64.0,
    y: 53.0,
    status: 'conferido',
    highlight: false,
    badge: 'Maior da América Latina',
    summary: 'Complexo olímpico de skate de nível global, palco de etapas do STU National.'
  },
  {
    id: 'bmx',
    name: 'Pista de BMX',
    category: 'Esportes',
    x: 69.5,
    y: 49.0,
    status: 'conferido',
    highlight: false,
    badge: 'BMX Racing',
    summary: 'Pista funcional e veloz para formação de novos atletas e campeonatos nacionais.'
  },
  {
    id: 'roda-gigante',
    name: 'Roda-Gigante',
    category: 'Família',
    x: 58.5,
    y: 48.0,
    status: 'conferido',
    highlight: true,
    badge: '108 metros · Maior da AL',
    summary: 'Vista panorâmica espetacular de todo o complexo e do cerrado mato-grossense.'
  },
  {
    id: 'arvore-da-vida',
    name: 'Árvore da Vida',
    category: 'Família',
    x: 53.0,
    y: 57.0,
    status: 'conferido',
    highlight: true,
    badge: '65m de Altura em LED',
    summary: 'Maior árvore artificial do mundo, com mirante panorâmico no centro do parque.'
  },
  {
    id: 'circo-do-futuro',
    name: 'Circo do Futuro / Teatro de Arena',
    category: 'Cultura',
    x: 48.5,
    y: 60.5,
    status: 'conferido',
    highlight: false,
    badge: 'Domo Imersivo',
    summary: 'Domo imersivo com projeções mapeadas e teatro de arena ao ar livre para até 400 pessoas.'
  },
  {
    id: 'wake-park',
    name: 'Splash Park e Wake Park',
    category: 'Esportes',
    x: 42.0,
    y: 69.0,
    status: 'conferido',
    highlight: false,
    badge: 'Esportes Aquáticos',
    summary: 'Cabos suspensos no lago e parque aquático infantil com toboágua gigante.'
  },
  {
    id: 'arenas-beach',
    name: 'Quadras de Areia',
    category: 'Esportes',
    x: 61.5,
    y: 59.0,
    status: 'conferido',
    highlight: false,
    badge: '5 Quadras à Beira do Lago',
    summary: 'Beach tennis, vôlei de areia e futevôlei com arquibancadas e vista para o pôr do sol.'
  },
  {
    id: 'agroplace',
    name: 'Agroplace',
    category: 'Cultura',
    x: 21.0,
    y: 42.0,
    status: 'conferido',
    highlight: false,
    badge: '10.000 m² Interativos',
    summary: 'Celebração e tecnologia da produção agropecuária que posiciona Mato Grosso no mundo.'
  },
  {
    id: 'vila-das-nacoes',
    name: 'Vila das Nações',
    category: 'Cultura',
    x: 55.5,
    y: 68.5,
    status: 'pendente',
    highlight: false,
    badge: 'Gastronomia & Cultura',
    summary: 'Fachadas temáticas inspiradas em sete nações que influenciaram a cultura de Mato Grosso.'
  },
  {
    id: 'casa-cuiabana',
    name: 'Casa Cuiabana',
    category: 'Cultura',
    x: 50.5,
    y: 65.0,
    status: 'pendente',
    highlight: false,
    badge: 'Tradição & Inovação',
    summary: 'Arquitetura colonial típica por fora com ambiente tecnológico e acolhedor por dentro.'
  },
  {
    id: 'parque-da-familia',
    name: 'Parque da Família',
    category: 'Família',
    x: 66.5,
    y: 63.0,
    status: 'conferido',
    highlight: false,
    badge: '40+ Brinquedos',
    summary: 'Espaço com áreas cobertas e mais de 40 atrações lúdicas para todas as idades.'
  },
  {
    id: 'portico-de-entrada',
    name: 'Pórtico de Entrada',
    category: 'Convivência',
    x: 82.5,
    y: 77.0,
    status: 'conferido',
    highlight: false,
    badge: 'Acesso Principal MT-251',
    summary: 'Inspirado no voo do tuiuiú, ave símbolo do Pantanal, dando as boas-vindas ao visitante.'
  },
  {
    id: 'praca-de-alimentacao',
    name: 'Praça de Alimentação',
    category: 'Convivência',
    x: 46.0,
    y: 53.5,
    status: 'pendente',
    highlight: false,
    badge: '3 mil m² Cobertos',
    summary: 'Gastronomia regional e conforto em ponto estratégico de circulação do parque.'
  },
  {
    id: 'museus',
    name: 'Museu Mato Grosso e Museu Natural',
    category: 'Cultura',
    x: 29.0,
    y: 49.0,
    status: 'pendente',
    highlight: false,
    badge: 'Acervo & Memória',
    summary: 'História, ecossistemas e cultura viva de Mato Grosso reunidos em arquitetura singular.'
  },
  {
    id: 'estrutura-e-acesso',
    name: 'Estacionamento e Apoio',
    category: 'Convivência',
    x: 85.0,
    y: 43.0,
    status: 'conferido',
    highlight: false,
    badge: 'Vagas & Cavalaria PM',
    summary: 'Estacionamento setorizado e base do Regimento de Policiamento Montado.'
  }
];
