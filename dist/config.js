/* Set real HTTPS endpoints after connecting a backend.
   Expected request: POST JSON {kind, submittedAt, fields};
   response: HTTP 2xx JSON {ok:true, reference?:string}.
   The local prototype never claims a submission occurred without that response. */
window.PNMT_CONFIG = {
  formsEndpoint: '__supabase__',
  newsletterEndpoint: '__supabase__',
  videoId: 'plKmM21Rh0Q',
  youtubeId: 'plKmM21Rh0Q',
  instagram: 'https://www.instagram.com/parquenovomt/',
  map: 'https://www.google.com/maps/search/?api=1&query=Parque+Novo+Mato+Grosso+Cuiaba',
  kit: 'downloads/kit-pnmt.zip',
};
