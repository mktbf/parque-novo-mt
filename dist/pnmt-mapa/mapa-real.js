/* Mapa com fotos e videos reais de drone. Substitui o 3D na pagina #espacos.
   Midias em ./real/ (fotos/, videos/, base-aerea.jpg). Nao usa location.hash: o roteador do site e quem manda no hash. */
const R = new URL('./real/', import.meta.url).href;

// x/y em % da foto base-aerea.jpg (1600x540). Para corrigir um ponto, mude so x/y aqui.
const SPACES = [
  {"id": "portico", "nome": "Pórtico de Entrada", "cat": "Estrutura", "x": 38.5, "y": 36, "page": "portico-de-entrada", "txt": "Inspirado no voo do tuiuiú, ave símbolo do Pantanal. A chegada ao parque.", "v": ["portico"], "f": ["portico-1", "portico-2", "portico-3"], "meta": "Drone", "side": "up"},
  {"id": "regimento", "nome": "Regimento de Policiamento Montado", "cat": "Estrutura", "x": 31, "y": 35.5, "txt": "A cavalaria da Polícia Militar reforça a segurança do parque, com presença e tradição.", "v": ["pavilhoes", "pavilhoes2"], "f": ["v-regimento", "pavilhoes-1", "pavilhoes-2", "pavilhoes-3"], "meta": "Drone e vídeo oficial do parque", "left": true},
  {"id": "autodromo", "nome": "Autódromo Internacional de Mato Grosso", "cat": "Esportes", "x": 33, "y": 45, "page": "autodromo", "txt": "Circuito misto, pista de arrancada e circuito externo, com infraestrutura para competições regionais, nacionais e internacionais.", "v": ["autodromo", "autodromo2"], "f": ["v-autodromo", "autodromo-1", "autodromo-2"], "meta": "Drone e vídeo oficial do parque", "side": "down"},
  {"id": "estacionamento", "nome": "Estacionamento", "cat": "Estrutura", "x": 50, "y": 39, "page": "estrutura-e-acesso", "txt": "Vagas distribuídas em pontos estratégicos para receber grandes públicos em eventos simultâneos.", "v": [], "f": ["v-estacionamento"], "meta": "Vídeo oficial do parque", "side": "up"},
  {"id": "arena", "nome": "Arena Show", "cat": "Eventos", "x": 53.5, "y": 60, "page": "arena-show", "txt": "Criada para grandes eventos nacionais e internacionais, com ampla cobertura, cenotécnica, bilheterias, bares e backstage completo.", "v": [], "f": ["v-arena-2", "v-arena-1"], "meta": "Vídeo oficial do parque", "side": "down"},
  {"id": "motocross", "nome": "Motocross", "cat": "Esportes", "x": 65, "y": 43.5, "page": "motocross", "txt": "Pista que já recebeu competições estaduais e internacionais, inclusive corrida noturna.", "v": [], "f": ["v-motocross-1"], "meta": "Vídeo oficial do parque", "side": "up"},
  {"id": "kartodromo", "nome": "Kartódromo", "cat": "Esportes", "x": 70.5, "y": 42.5, "page": "kartodromo", "txt": "Projetado para receber competições regionais, nacionais e internacionais.", "v": [], "f": ["v-kartodromo-1", "v-kartodromo-2"], "meta": "Vídeo oficial do parque", "side": "up"},
  {"id": "bmx", "nome": "Pista de BMX", "cat": "Esportes", "x": 74.5, "y": 45, "page": "bmx", "txt": "Pista moderna para o esporte, o lazer e a formação de novos atletas. Já recebeu o Campeonato Brasileiro de BMX Racing.", "v": [], "f": ["v-bmx"], "meta": "Vídeo oficial do parque", "side": "up"},
  {"id": "skate", "nome": "Skate Park", "cat": "Esportes", "x": 78, "y": 46, "page": "skate-park", "txt": "Já recebeu grandes competições nacionais, como o Campeonato Brasileiro e uma etapa do STU National.", "v": [], "f": ["v-skate"], "meta": "Vídeo oficial do parque"},
  {"id": "roda", "nome": "Roda-Gigante", "cat": "Lazer", "x": 60, "y": 45.5, "obra": true, "page": "roda-gigante", "txt": "Em construção, com cabines panorâmicas.", "v": [], "f": ["v-roda"], "meta": "Vídeo oficial do parque", "left": true},
  {"id": "agroplace", "nome": "AgroPlace", "cat": "Cultura", "x": 67.3, "y": 49.5, "obra": true, "page": "agroplace", "txt": "Exposições interativas sobre a história e a transformação do cerrado mato-grossense.", "v": [], "f": ["v-agroplace", "circular-1", "circular-2"], "meta": "Drone e vídeo oficial do parque"},
  {"id": "casa", "nome": "Casa Cuiabana", "cat": "Cultura", "x": 61.5, "y": 50.5, "page": "casa-cuiabana", "txt": "Por fora, homenagem à arquitetura colonial de Cuiabá. Por dentro, conforto, tecnologia e inovação.", "v": ["casa", "casa2"], "f": ["v-casa", "casa-1", "casa-2", "casa-3"], "meta": "Drone e vídeo oficial do parque", "left": true},
  {"id": "vila", "nome": "Vila das Nações", "cat": "Cultura", "x": 59, "y": 55, "page": "vila-das-nacoes", "txt": "Fachadas temáticas inspiradas nos países que influenciaram a formação da nossa cultura, às margens do lago.", "v": ["vila", "vila2", "orla2"], "f": ["v-vila-1", "v-vila-2", "vila-1", "vila-2", "vila-3", "vila-4", "vila-5", "vila-6"], "meta": "Drone, câmera em solo e vídeo oficial do parque", "left": true},
  {"id": "praca", "nome": "Praça de Alimentação", "cat": "Lazer", "x": 71.5, "y": 57.5, "page": "praca-de-alimentacao", "txt": "Gastronomia e áreas de bem-estar em um ambiente amplo, coberto e acolhedor.", "v": ["roda2"], "f": ["v-praca", "roda-1", "roda-2"], "meta": "Drone e vídeo oficial do parque", "side": "down"},
  {"id": "arvore", "nome": "Árvore da Vida", "cat": "Lazer", "x": 77, "y": 54.5, "obra": true, "page": "arvore-da-vida", "txt": "Torre que será revestida em LED, com mirante de vista panorâmica do parque.", "v": ["orla"], "f": ["v-arvore", "orla-2", "familia-1", "familia-7"], "meta": "Drone e vídeo oficial do parque", "side": "up"},
  {"id": "museus", "nome": "Museus", "cat": "Cultura", "x": 79.5, "y": 56.8, "obra": true, "page": "museus", "txt": "Museu Mato Grosso e Museu Natural: memória e futuro lado a lado.", "v": [], "f": ["v-museus"], "meta": "Vídeo oficial do parque"},
  {"id": "familia", "nome": "Parque da Família", "cat": "Lazer", "x": 75.5, "y": 59.5, "page": "parque-da-familia", "txt": "Brinquedos temáticos e áreas cobertas para diversão em qualquer horário do dia.", "v": ["familia", "familia2"], "f": ["v-familia", "familia-2", "familia-3", "familia-4", "familia-6", "roda-4", "familia-5"], "meta": "Drone e vídeo oficial do parque", "side": "down"},
  {"id": "circo", "nome": "Circo do Futuro", "cat": "Cultura", "x": 84, "y": 59.5, "obra": true, "txt": "Domo preparado para projeções mapeadas, com Teatro de Arena e mirante para o lago.", "v": ["roda"], "f": ["v-circo", "roda-3", "orla-1"], "meta": "Drone e vídeo oficial do parque", "side": "down"},
  {"id": "splash", "nome": "Splash Parque", "cat": "Lazer", "x": 81.5, "y": 51.5, "obra": true, "page": "splash-parque", "txt": "Playground aquático em construção, às margens do lago.", "v": [], "f": ["v-splash"], "meta": "Vídeo oficial do parque", "side": "up"},
  {"id": "wake", "nome": "Wake Park", "cat": "Esportes", "x": 90, "y": 56, "page": "wake-park", "txt": "Cabos suspensos em duas pistas sobre o lago: uma para iniciantes e outra com rampas e obstáculos.", "v": [], "f": ["v-wake"], "meta": "Vídeo oficial do parque", "side": "up"},
  {"id": "eventos", "nome": "Centro de Eventos", "cat": "Eventos", "x": 66, "y": 77, "obra": true, "page": "centro-de-eventos", "txt": "Pavilhões interligados, projetados para usos simultâneos ou independentes.", "v": ["eventos", "eventos2"], "f": ["v-eventos", "eventos-1", "eventos-2", "eventos-3", "eventos-4"], "meta": "Drone e vídeo oficial do parque"}
];
const VOO = {"id": "voo", "nome": "Voo sobre o parque", "cat": "Visão geral", "txt": "O parque inteiro de cima: lagos, península, Centro de Eventos e autódromo.", "v": ["voo"], "f": ["v-geral", "v-geral-2", "autodromo-3", "orla-4", "autodromo-4"], "meta": "Drone e vídeo oficial do parque"};

const CSS = `
:host{display:block;--navy:#0D2B4D;--ink:#071a2f;--green:#58B947;--amber:#F2B33D;--muted:rgba(255,255,255,.7);--line:rgba(255,255,255,.14);font-family:'Barlow',Arial,sans-serif;color:#fff}
*{box-sizing:border-box}
[hidden]{display:none!important}
button{font:inherit;color:inherit;background:none;border:0;cursor:pointer}
.box{max-width:1180px;margin:32px auto;padding:0 16px}
.card{background:var(--ink);border-radius:18px;padding:26px;display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:22px}
.head{grid-column:1/-1;display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap}
.k{font-family:'Barlow Condensed',Arial,sans-serif;font-size:13px;letter-spacing:2.4px;text-transform:uppercase;color:var(--green)}
h2{margin:4px 0 0;font-family:'Barlow Condensed',Arial,sans-serif;font-weight:700;font-size:34px;line-height:1;text-transform:uppercase;color:#fff}
.head p{margin:6px 0 0;color:var(--muted);font-size:15px}
.pill{display:inline-flex;align-items:center;gap:8px;height:40px;padding:0 18px;border-radius:20px;background:var(--green);color:var(--navy);font-family:'Barlow Condensed',Arial,sans-serif;font-weight:700;font-size:16px;letter-spacing:.6px;text-transform:uppercase;white-space:nowrap}
.pill.ghost{background:transparent;color:#fff;border:1px solid var(--line)}
.pill svg{width:13px;height:13px}
.stage{position:relative;border-radius:12px;overflow:hidden;background:#000;min-width:0}
.scroller{overflow:hidden}
.map{position:relative;aspect-ratio:2400/1242;max-width:100%;transition:transform .9s cubic-bezier(.6,0,.2,1),filter .9s}
.map img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;user-select:none}
.map.zoom{filter:brightness(.55)}
.pin{position:absolute;width:0;height:0;z-index:2}
.dot{position:absolute;left:-12px;top:-12px;width:24px;height:24px;border-radius:50%;background:var(--green);border:3px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,.5);transition:transform .2s}
.dot::after{content:"";position:absolute;inset:-9px;border-radius:50%;border:2px solid var(--green);animation:pulse 2.4s infinite;opacity:0}
.pin.obra .dot{background:var(--amber)}.pin.obra .dot::after{border-color:var(--amber)}
@keyframes pulse{0%{transform:scale(.6);opacity:.9}100%{transform:scale(1.6);opacity:0}}
.hit{position:absolute;left:-20px;top:-20px;width:40px;height:40px;border-radius:50%}
.lb{position:absolute;left:16px;top:-15px;white-space:nowrap;background:rgba(13,43,77,.94);border:1px solid var(--line);padding:5px 10px;border-radius:6px;font-family:'Barlow Condensed',Arial,sans-serif;font-weight:600;font-size:15px;pointer-events:none;opacity:0;transition:opacity .2s}
.pin.left .lb{left:auto;right:16px}.pin.up .lb{left:0;top:-46px;transform:translateX(-50%)}.pin.down .lb{left:0;top:16px;transform:translateX(-50%)}
.pin:hover .lb,.pin:focus-visible .lb,.pin.hl .lb,.labels .lb{opacity:1}
.pin:hover .dot,.pin.hl .dot{transform:scale(1.25)}
.legend{position:absolute;left:12px;bottom:12px;display:flex;gap:14px;font-size:12.5px;background:rgba(7,26,47,.8);padding:7px 12px;border-radius:8px}
.legend i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;background:var(--green)}
.legend i.o{background:var(--amber)}
.tbtn{position:absolute;right:12px;top:12px;height:34px;padding:0 12px;border-radius:17px;background:rgba(7,26,47,.8);font-size:13px;border:1px solid var(--line)}
.tbtn.on{background:var(--green);color:var(--navy);border-color:var(--green)}
@keyframes hintout{to{opacity:0;visibility:hidden}}
.hint{display:none;pointer-events:none;animation:hintout .6s 4s forwards;position:absolute;left:12px;top:12px;font-size:12.5px;background:rgba(7,26,47,.8);padding:6px 12px;border-radius:14px}
.chips{grid-column:1/-1;display:flex;gap:8px;flex-wrap:wrap}.chip{height:32px;padding:0 14px;border-radius:16px;border:1px solid var(--line);font-size:14px;color:#fff;background:transparent;cursor:pointer}.chip.on{background:var(--green);color:var(--navy);border-color:var(--green)}.off{display:none!important}
.labels .lb{font-size:13px;padding:3px 7px}
.dot{display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;color:#0D2B4D;font-family:'Barlow',Arial,sans-serif}
.n{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:var(--green);color:#0D2B4D;font-style:normal;font-size:11px;font-weight:700;margin-right:7px;vertical-align:2px}.n.o{background:#F2B33D}
@media (min-width:981px){.list{max-height:720px;overflow-y:auto;padding-right:6px;scrollbar-width:thin}}
.col{min-width:0;display:flex;flex-direction:column;gap:18px}
.feat{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);border-radius:12px;overflow:hidden;background:var(--navy)}
.feat video{width:100%;height:100%;min-height:200px;object-fit:cover;display:block}
.ft{padding:22px;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:8px}
.ft h3{margin:0;font-family:'Barlow Condensed',Arial,sans-serif;font-weight:700;font-size:28px;line-height:1;text-transform:uppercase;color:#fff}
.ft p{margin:0 0 6px;color:var(--muted);font-size:15px;line-height:1.45}
@media (max-width:640px){.feat{grid-template-columns:1fr}}
.list{display:flex;flex-direction:column;gap:4px;min-width:0}
.item{display:flex;gap:12px;align-items:center;text-align:left;padding:6px;border-radius:10px;border:1px solid transparent}
.item:hover,.item.hl{background:rgba(255,255,255,.06);border-color:var(--line)}
.item img{width:68px;height:44px;object-fit:cover;border-radius:6px;flex:none}
.item b{display:block;font-family:'Barlow Condensed',Arial,sans-serif;font-weight:600;font-size:17px}
.item small{color:var(--muted);font-size:12.5px}
.tag{font-size:10.5px;font-weight:600;letter-spacing:.8px;text-transform:uppercase;padding:2px 6px;border-radius:4px;background:rgba(242,179,61,.18);color:var(--amber);margin-left:6px}
.viewer{position:fixed;inset:0;z-index:2000;background:var(--ink);display:grid;grid-template-rows:auto minmax(0,1fr) auto;opacity:0;pointer-events:none;transition:opacity .45s}
.viewer.open{opacity:1;pointer-events:auto}
.vhead{display:flex;align-items:center;gap:12px;padding:calc(10px + env(safe-area-inset-top,0px)) 16px 10px;background:var(--navy)}
.crumb{flex:1;min-width:0;color:var(--muted);font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.crumb b{color:#fff}
.vmain{position:relative;min-height:0;overflow:hidden}
.media{position:absolute;inset:0}
.media img,.media video{width:100%;height:100%;object-fit:cover;display:block}
.media img{animation:kb 14s ease-out both}
@keyframes kb{from{transform:scale(1.06)}to{transform:scale(1)}}
.fade{animation:fadein .5s both}
.media img.fade{animation:fadein .5s both,kb 14s ease-out both}
@keyframes fadein{from{opacity:0}to{opacity:1}}
.shade{position:absolute;left:0;right:0;bottom:0;height:55%;background:linear-gradient(transparent,rgba(7,26,47,.92));pointer-events:none}
.info{position:absolute;left:24px;bottom:26px;max-width:min(560px,calc(100% - 48px))}
.info h3{margin:4px 0 8px;font-family:'Barlow Condensed',Arial,sans-serif;font-weight:700;font-size:clamp(34px,6vw,64px);line-height:.95;text-transform:uppercase;color:#fff}
.info p{margin:0;font-size:17px;line-height:1.45;color:rgba(255,255,255,.9)}
.meta{margin-top:10px;font-size:12.5px;color:var(--muted)}
.info .pill{margin-top:14px;height:36px;font-size:14px;text-decoration:none}
.dots{display:flex;gap:6px;margin-top:14px}
.dots button{width:8px;height:8px;border-radius:4px;background:rgba(255,255,255,.35);transition:.25s}
.dots button.on{width:26px;background:var(--green)}
.nav{position:absolute;top:50%;transform:translateY(-50%);width:54px;height:54px;border-radius:50%;background:rgba(7,26,47,.6);border:1px solid var(--line);display:flex;align-items:center;justify-content:center}
.nav:hover{background:var(--green);color:var(--navy)}
.nav.p{left:16px}.nav.n{right:16px}
.nav svg{width:22px;height:22px}
.mini{position:absolute;right:20px;bottom:24px;width:260px;border-radius:10px;overflow:hidden;border:2px solid rgba(255,255,255,.85);cursor:pointer;padding:0}
.mini .m{position:relative;aspect-ratio:2400/1242}
.mini img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.mini .d{position:absolute;width:6px;height:6px;margin:-3px 0 0 -3px;border-radius:50%;background:#fff;opacity:.7}
.mini .d.cur{width:14px;height:14px;margin:-7px 0 0 -7px;background:var(--green);border:2px solid #fff;opacity:1}
.mini .cap{position:absolute;left:0;right:0;bottom:0;font-size:11px;padding:3px 8px;background:rgba(7,26,47,.8);text-align:left}
.strip{display:flex;gap:8px;overflow-x:auto;padding:12px 16px calc(12px + env(safe-area-inset-bottom,0px));background:var(--navy)}
.th{position:relative;flex:none;width:120px;height:68px;border-radius:7px;overflow:hidden;border:2px solid transparent;opacity:.65;padding:0}
.th img{width:100%;height:100%;object-fit:cover;display:block}
.th.on{border-color:var(--green);opacity:1}
.play{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
.play span{width:26px;height:26px;border-radius:50%;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center}
.play svg{width:10px;height:10px;margin-left:2px}
@media (max-width:980px){
  .card{grid-template-columns:1fr;padding:18px}
  .scroller{overflow-x:auto;-webkit-overflow-scrolling:touch}
  .scroller .map{width:900px;max-width:none}
  .hint{display:block}
  .list{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}
}
@media (max-width:640px){
  h2{font-size:28px}
  .mini{width:150px;bottom:auto;top:12px}
  .nav{width:44px;height:44px;top:auto;bottom:16px;transform:none}
  .nav.p{left:auto;right:68px}
  .info{bottom:78px;left:16px}
  .info p{font-size:15px}
  .th{width:96px;height:56px}
}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
`;

const PLAY = '<svg viewBox="0 0 10 12"><path d="M0 0l10 6-10 6z" fill="currentColor"/></svg>';

class MapaReal extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;
    const root = this.attachShadow({ mode: 'open' });
    root.innerHTML = `<style>${CSS}</style>
<div class="box"><div class="card">
  <div class="head"><div><div class="k">Imagens reais de drone</div><h2>Explore o parque</h2><p>Toque num ponto do mapa e entre no espaço. Nomes e imagens do vídeo oficial do parque e de drone.</p></div>
    <button class="pill" data-voo>${PLAY}Voo sobre o parque</button></div>
  <div class="chips"><button class="chip on" data-g="Todos">Todos</button><button class="chip" data-g="Esportes">Esportes</button><button class="chip" data-g="Eventos">Eventos</button><button class="chip" data-g="Cultura">Cultura</button><button class="chip" data-g="Lazer">Lazer</button><button class="chip" data-g="Estrutura">Estrutura</button></div>
  <div class="col"><div class="stage">
    <div class="scroller"><div class="map"><img src="${R}base-aerea.jpg" alt="Vista aérea do Parque Novo Mato Grosso"></div></div>
    <div class="legend"><span><i></i>Espaço</span><span><i class="o"></i>Em obras</span></div>
    <div class="hint">Arraste o mapa para o lado</div>
  </div>
  <div class="feat"><video src="${R}videos/voo.mp4" poster="${R}videos/voo.jpg" autoplay muted loop playsinline></video>
    <div class="ft"><div class="k">Visão geral</div><h3>Voo sobre o parque</h3><p>Canais, península, Centro de Eventos e autódromo, filmados a 340 metros de altura.</p><button class="pill" data-voo2>Assistir em tela cheia</button></div></div>
  </div>
  <div class="list"></div>
</div></div>
<div class="viewer" aria-hidden="true" role="dialog" aria-label="Espaço do parque">
  <div class="vhead"><button class="pill ghost" data-back><svg viewBox="0 0 12 12"><path d="M8 1L3 6l5 5" stroke="currentColor" stroke-width="2" fill="none"/></svg>Mapa</button><div class="crumb"></div></div>
  <div class="vmain">
    <div class="media"></div><div class="shade"></div><div class="info"></div>
    <button class="nav p" data-step="-1" aria-label="Espaço anterior"><svg viewBox="0 0 24 24"><path d="M15 4l-8 8 8 8" stroke="currentColor" stroke-width="2.4" fill="none"/></svg></button>
    <button class="nav n" data-step="1" aria-label="Próximo espaço"><svg viewBox="0 0 24 24"><path d="M9 4l8 8-8 8" stroke="currentColor" stroke-width="2.4" fill="none"/></svg></button>
    <button class="mini" data-back aria-label="Voltar ao mapa"><div class="m"><img src="${R}base-aerea.jpg" alt=""></div><div class="cap"></div></button>
  </div>
  <div class="strip"></div>
</div>`;
    const $ = s => root.querySelector(s);
    this.$ = $;
    this.map = $('.map');
    this.viewer = $('.viewer');
    const list = $('.list'), mm = $('.mini .m');
    SPACES.forEach(s => {
      const p = document.createElement('button');
      p.className = 'pin' + (s.obra ? ' obra' : '') + (s.left ? ' left' : '') + (s.side ? ' ' + s.side : '');
      p.style.left = s.x + '%'; p.style.top = s.y + '%';
      p.setAttribute('aria-label', s.nome);
      p.innerHTML = `<span class="hit"></span><span class="dot">${SPACES.indexOf(s) + 1}</span><span class="lb">${s.nome}</span>`;
      this.map.appendChild(p);
      const it = document.createElement('button');
      it.className = 'item';
      it.innerHTML = `<img src="${R}${this.thumb(s)}" alt="" loading="lazy"><span><b><i class="n${s.obra ? ' o' : ''}">${SPACES.indexOf(s) + 1}</i>${s.nome}${s.obra ? '<span class="tag">Em obras</span>' : ''}</b><small>${s.cat}</small></span>`;
      list.appendChild(it);
      const d = document.createElement('span'); d.className = 'd'; d.style.left = s.x + '%'; d.style.top = s.y + '%'; mm.appendChild(d);
      s.el = { p, it, d };
      [p, it].forEach(el => {
        el.addEventListener('mouseenter', () => { p.classList.add('hl'); it.classList.add('hl'); });
        el.addEventListener('mouseleave', () => { p.classList.remove('hl'); it.classList.remove('hl'); });
        el.addEventListener('click', () => this.open(s));
      });
    });
    root.querySelectorAll('[data-voo],[data-voo2]').forEach(b => b.addEventListener('click', () => this.open(VOO)));
    root.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => {
      root.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === c));
      const g = c.dataset.g;
      SPACES.forEach(x => { const off = g !== 'Todos' && x.cat !== g; x.el.p.classList.toggle('off', off); x.el.it.classList.toggle('off', off); });
    }));
    root.querySelectorAll('[data-back]').forEach(b => b.addEventListener('click', () => this.close()));
    root.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () => this.step(+b.dataset.step)));
    let sx = null;
    $('.vmain').addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    $('.vmain').addEventListener('touchend', e => {
      if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 50) this.setMedia(this.mi + (dx < 0 ? 1 : -1));
    });
    this.onKey = e => {
      if (!this.viewer.classList.contains('open')) return;
      if (e.key === 'ArrowRight') this.step(1);
      else if (e.key === 'ArrowLeft') this.step(-1);
      else if (e.key === 'ArrowDown') this.setMedia(this.mi + 1);
      else if (e.key === 'ArrowUp') this.setMedia(this.mi - 1);
      else if (e.key === 'Escape') this.close();
    };
    document.addEventListener('keydown', this.onKey);
    requestAnimationFrame(() => {
      const sc = $('.scroller');
      if (sc.scrollWidth > sc.clientWidth) sc.scrollLeft = (sc.scrollWidth - sc.clientWidth) * 0.62;
    });
  }
  disconnectedCallback() {
    if (this.onKey) document.removeEventListener('keydown', this.onKey);
    clearTimeout(this.timer);
    document.documentElement.style.overflow = '';
  }
  thumb(s) { return s.f.length ? `fotos/${s.f[0]}.jpg` : `videos/${s.v[0]}.jpg`; }
  mediaOf(s) {
    const out = s.v.map(n => ({ t: 'v', src: `${R}videos/${n}.mp4`, poster: `${R}videos/${n}.jpg` }));
    s.f.forEach(n => out.push({ t: 'i', src: `${R}fotos/${n}.jpg` }));
    return out;
  }
  open(s) {
    const first = !this.viewer.classList.contains('open');
    if (first && s !== VOO) {
      this.map.style.transformOrigin = `${s.x}% ${s.y}%`;
      this.map.style.transform = 'scale(2.6)';
      this.map.classList.add('zoom');
      clearTimeout(this.zt);
      this.zt = setTimeout(() => this.show(s), 520);
    } else this.show(s);
  }
  show(s) {
    const $ = this.$;
    this.cur = s; this.items = this.mediaOf(s);
    this.viewer.classList.add('open'); this.viewer.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
    const idx = SPACES.indexOf(s);
    $('.crumb').innerHTML = s === VOO ? `<b>${s.nome}</b>` : `<b>${s.nome}</b> · ${idx + 1} de ${SPACES.length}`;
    const link = s.page ? `<a class="pill ghost" href="#espaco/${s.page}">Ver página do espaço</a>` : '';
    const info = $('.info');
    info.innerHTML = `<div class="k">${s.cat}${s.obra ? ' · Em obras' : ''}</div><h3>${s.nome}</h3><p>${s.txt}</p><div class="meta">${s.meta}</div>${link}<div class="dots"></div>`;
    info.classList.remove('fade'); void info.offsetWidth; info.classList.add('fade');
    const a = info.querySelector('a'); if (a) a.addEventListener('click', () => this.close());
    SPACES.forEach(x => x.el.d.classList.toggle('cur', x === s));
    $('.mini .cap').textContent = s === VOO ? 'Visão geral' : 'Você está aqui';
    this.$('.nav.p').hidden = this.$('.nav.n').hidden = (s === VOO);
    const st = $('.strip'), dots = info.querySelector('.dots');
    st.innerHTML = '';
    this.items.forEach((m, i) => {
      const b = document.createElement('button'); b.className = 'th';
      b.innerHTML = `<img src="${m.t === 'v' ? m.poster : m.src}" alt="" loading="lazy">` + (m.t === 'v' ? `<span class="play"><span>${PLAY}</span></span>` : '');
      b.addEventListener('click', () => this.setMedia(i)); st.appendChild(b);
      const d = document.createElement('button'); d.setAttribute('aria-label', 'Mídia ' + (i + 1));
      d.addEventListener('click', () => this.setMedia(i)); dots.appendChild(d);
    });
    this.setMedia(0);
    $('[data-back]').focus({ preventScroll: true });
  }
  setMedia(i) {
    const n = this.items.length; if (!n) return;
    this.mi = (i + n) % n;
    const m = this.items[this.mi], box = this.$('.media');
    clearTimeout(this.timer);
    box.innerHTML = m.t === 'v'
      ? `<video class="fade" src="${m.src}" poster="${m.poster}" autoplay muted loop playsinline></video>`
      : `<img class="fade" src="${m.src}" alt="${this.cur.nome}">`;
    this.shadowRoot.querySelectorAll('.strip .th').forEach((t, k) => t.classList.toggle('on', k === this.mi));
    this.shadowRoot.querySelectorAll('.dots button').forEach((t, k) => t.classList.toggle('on', k === this.mi));
    const on = this.shadowRoot.querySelectorAll('.strip .th')[this.mi];
    if (on) on.scrollIntoView({ block: 'nearest', inline: 'center' });
    if (n > 1) this.timer = setTimeout(() => this.setMedia(this.mi + 1), m.t === 'v' ? 10000 : 6000);
  }
  step(d) {
    if (!this.cur || this.cur === VOO) return;
    const i = SPACES.indexOf(this.cur);
    this.show(SPACES[(i + d + SPACES.length) % SPACES.length]);
  }
  close() {
    clearTimeout(this.timer); clearTimeout(this.zt);
    this.viewer.classList.remove('open'); this.viewer.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    this.$('.media').innerHTML = '';
    this.map.style.transform = ''; this.map.classList.remove('zoom');
    this.cur = null;
  }
}
if (!customElements.get('pnmt-mapa-real')) customElements.define('pnmt-mapa-real', MapaReal);
