/* Set real HTTPS endpoints after connecting a backend.
   Expected request: POST JSON {kind, submittedAt, fields};
   response: HTTP 2xx JSON {ok:true, reference?:string}.
   The local prototype never claims a submission occurred without that response. */
window.PNMT_CONFIG = {
  formsEndpoint: '__supabase__',
  newsletterEndpoint: '__supabase__',
  videoId: 'ncTJbHQNq6M',
  youtubeId: 'ncTJbHQNq6M',
  instagram: 'https://www.instagram.com/parquenovomt/',
  facebook: 'https://www.facebook.com/profile.php?id=61591199398539',
  youtube: 'https://www.youtube.com/@ParqueNovoMatoGrosso',
  linkedin: 'https://www.linkedin.com/company/parque-novo-mato-grosso/',
  map: 'https://www.google.com/maps/search/?api=1&query=Parque+Novo+Mato+Grosso+Cuiaba',
  kit: 'downloads/kit-pnmt.zip',
};
