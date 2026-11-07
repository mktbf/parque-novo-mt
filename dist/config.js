/* Set real HTTPS endpoints after connecting a backend.
   Expected request: POST JSON {kind, submittedAt, fields};
   response: HTTP 2xx JSON {ok:true, reference?:string}.
   The local prototype never claims a submission occurred without that response. */
window.PNMT_CONFIG = {
  // Formularios enviados por e-mail para a caixa do parque (api/formulario.js).
  formsEndpoint: '/api/formulario',
  newsletterEndpoint: '/api/formulario',
  videoId: 'ZAVSkNOk-bY',
  youtubeId: 'ZAVSkNOk-bY',
  instagram: 'https://www.instagram.com/parquenovomt/',
  facebook: 'https://www.facebook.com/profile.php?id=61591199398539',
  youtube: 'https://www.youtube.com/@ParqueNovoMatoGrosso',
  linkedin: 'https://www.linkedin.com/company/parque-novo-mato-grosso/',
  map: 'https://www.google.com/maps/dir/?api=1&destination=-15.4578,-56.0767',
  kit: 'downloads/kit-pnmt.zip',
  // Videos do canal do YouTube do parque. Para incluir um video novo, copie uma linha e troque o id (o codigo depois de watch?v=) e o titulo.
  // Se o titulo tiver o nome de um espaco (ex.: Autodromo), o video tambem aparece na pagina desse espaco.
  videos: [
    { id: 'ZAVSkNOk-bY', titulo: 'Apresentação - Parque Novo Mato Grosso', duracao: '6:39' },
    { id: 'hc5C0VbU4UY', titulo: 'Presentation – Parque Novo Mato Grosso', duracao: '6:39' },
  ],
};
