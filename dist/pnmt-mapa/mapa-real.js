/* Mapa com fotos e videos reais de drone. Substitui o 3D na pagina #espacos.
   Midias em ./real/ (fotos/, videos/, base.jpg). Nao usa location.hash: o roteador do site e quem manda no hash. */
const R = new URL('./real/', import.meta.url).href;

// x/y em % da foto base.jpg (1600x540). Para corrigir um ponto, mude so x/y aqui.
const SPACES = [
  { id: 'portico', nome: 'Pórtico de Entrada', cat: 'Chegada', x: 97, y: 38, left: true, page: 'portico-de-entrada',
    txt: 'Os arcos que marcam a chegada ao parque, na avenida de acesso.', v: ['portico'], f: 3, meta: 'Drone a 16–31 m de altura' },
  { id: 'pavilhoes', nome: 'Pavilhões', cat: 'Estrutura', x: 92, y: 25, left: true,
    txt: 'Galpões e estruturas de apoio junto à avenida, com o autódromo ao fundo.', v: ['pavilhoes', 'pavilhoes2'], f: 3, meta: 'Drone a 61–73 m de altura' },
  { id: 'autodromo', nome: 'Autódromo', cat: 'Esportes', x: 55, y: 12, page: 'autodromo',
    txt: 'A pista vista do alto, com o parque inteiro desenhado ao redor.', v: ['autodromo', 'autodromo2'], f: 4, meta: 'Drone a 500 m de altura' },
  { id: 'circular', nome: 'Edifício Circular', cat: 'Arquitetura', x: 70, y: 21, left: true,
    txt: 'Um dos marcos arquitetônicos do parque, entre o canal e o autódromo.', v: [], f: 2, meta: 'Drone a 79–85 m de altura' },
  { id: 'eventos', nome: 'Centro de Eventos', cat: 'Eventos', x: 22, y: 40, obra: true, page: 'centro-de-eventos',
    txt: 'Os pavilhões que vão receber feiras e grandes encontros, em construção na ilha oeste.', v: ['eventos', 'eventos2'], f: 4, meta: 'Drone a 116–429 m de altura' },
  { id: 'familia', nome: 'Parque da Família', cat: 'Família', x: 52.5, y: 42, page: 'parque-da-familia',
    txt: 'Brinquedos, sombra e espaço aberto para todas as idades, de frente para o lago.', v: ['familia', 'familia2'], f: 7, meta: 'Drone a 6–39 m de altura' },
  { id: 'peninsula', nome: 'Península Central', cat: 'Paisagem', x: 57, y: 53, left: true, fp: 'roda',
    txt: 'O domo, o mirante e o desenho colorido do parque vistos de cima.', v: ['roda', 'roda2'], f: 4, meta: 'Drone a 55–107 m de altura' },
  { id: 'vila', nome: 'Vila das Nações', cat: 'Cultura', x: 66, y: 52, page: 'vila-das-nacoes',
    txt: 'Fachadas inspiradas em vários países ao longo do canal, acesas ao cair da noite.', v: ['vila', 'vila2'], f: 6, meta: 'Câmera em solo e drone' },
  { id: 'casa', nome: 'Casa Cuiabana', cat: 'Cultura', x: 63.5, y: 62, page: 'casa-cuiabana',
    txt: 'Arquitetura que homenageia Cuiabá, com arquibancada voltada para a água.', v: ['casa', 'casa2'], f: 3, meta: 'Drone a 6–49 m de altura' },
  { id: 'orla', nome: 'Orla e Lago', cat: 'Paisagem', x: 40, y: 76,
    txt: 'O pôr do sol sobre o lago que abraça o parque.', v: ['orla', 'orla2'], f: 4, meta: 'Drone ao entardecer' }
];
const VOO = { id: 'voo', nome: 'Voo sobre o parque', cat: 'Visão geral',
  txt: 'Um sobrevoo a 340 metros: canais, península e autódromo num só plano.', v: ['voo'], f: 0, meta: 'Drone a 340 m de altura' };

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
.map{position:relative;aspect-ratio:1600/540;max-width:100%;transition:transform .9s cubic-bezier(.6,0,.2,1),filter .9s}
.map img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;user-select:none}
.map.zoom{filter:brightness(.55)}
.pin{position:absolute;width:0;height:0;z-index:2}
.dot{position:absolute;left:-11px;top:-11px;width:22px;height:22px;border-radius:50%;background:var(--green);border:3px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,.5);transition:transform .2s}
.dot::after{content:"";position:absolute;inset:-9px;border-radius:50%;border:2px solid var(--green);animation:pulse 2.4s infinite;opacity:0}
.pin.obra .dot{background:var(--amber)}.pin.obra .dot::after{border-color:var(--amber)}
@keyframes pulse{0%{transform:scale(.6);opacity:.9}100%{transform:scale(1.6);opacity:0}}
.hit{position:absolute;left:-20px;top:-20px;width:40px;height:40px;border-radius:50%}
.lb{position:absolute;left:16px;top:-15px;white-space:nowrap;background:rgba(13,43,77,.94);border:1px solid var(--line);padding:5px 10px;border-radius:6px;font-family:'Barlow Condensed',Arial,sans-serif;font-weight:600;font-size:15px;pointer-events:none;opacity:0;transition:opacity .2s}
.pin.left .lb{left:auto;right:16px}
.pin:hover .lb,.pin:focus-visible .lb,.pin.hl .lb,.labels .lb{opacity:1}
.pin:hover .dot,.pin.hl .dot{transform:scale(1.25)}
.legend{position:absolute;left:12px;bottom:12px;display:flex;gap:14px;font-size:12.5px;background:rgba(7,26,47,.8);padding:7px 12px;border-radius:8px}
.legend i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;background:var(--green)}
.legend i.o{background:var(--amber)}
.tbtn{position:absolute;right:12px;top:12px;height:34px;padding:0 12px;border-radius:17px;background:rgba(7,26,47,.8);font-size:13px;border:1px solid var(--line)}
.tbtn.on{background:var(--green);color:var(--navy);border-color:var(--green)}
@keyframes hintout{to{opacity:0;visibility:hidden}}
.hint{display:none;pointer-events:none;animation:hintout .6s 4s forwards;position:absolute;left:12px;top:12px;font-size:12.5px;background:rgba(7,26,47,.8);padding:6px 12px;border-radius:14px}
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
.mini .m{position:relative;aspect-ratio:1600/540}
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
  <div class="head"><div><div class="k">Imagens reais de drone</div><h2>Explore o parque</h2><p>Toque num ponto do mapa e entre no espaço.</p></div>
    <button class="pill" data-voo>${PLAY}Voo sobre o parque</button></div>
  <div class="col"><div class="stage">
    <div class="scroller"><div class="map"><img src="${R}base.jpg" alt="Vista aérea do Parque Novo Mato Grosso"></div></div>
    <div class="legend"><span><i></i>Espaço</span><span><i class="o"></i>Em obras</span></div>
    <button class="tbtn" data-labels>Nomes</button>
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
    <button class="mini" data-back aria-label="Voltar ao mapa"><div class="m"><img src="${R}base.jpg" alt=""></div><div class="cap"></div></button>
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
      p.className = 'pin' + (s.obra ? ' obra' : '') + (s.left ? ' left' : '');
      p.style.left = s.x + '%'; p.style.top = s.y + '%';
      p.setAttribute('aria-label', s.nome);
      p.innerHTML = `<span class="hit"></span><span class="dot"></span><span class="lb">${s.nome}</span>`;
      this.map.appendChild(p);
      const it = document.createElement('button');
      it.className = 'item';
      it.innerHTML = `<img src="${R}${this.thumb(s)}" alt="" loading="lazy"><span><b>${s.nome}${s.obra ? '<span class="tag">Em obras</span>' : ''}</b><small>${s.cat}</small></span>`;
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
    $('[data-labels]').addEventListener('click', e => { this.map.classList.toggle('labels'); e.currentTarget.classList.toggle('on'); });
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
  thumb(s) { return s.v.length ? `videos/${s.v[0]}.jpg` : `fotos/${s.fp || s.id}-1.jpg`; }
  mediaOf(s) {
    const out = s.v.map(n => ({ t: 'v', src: `${R}videos/${n}.mp4`, poster: `${R}videos/${n}.jpg` }));
    for (let i = 1; i <= s.f; i++) out.push({ t: 'i', src: `${R}fotos/${s.fp || s.id}-${i}.jpg` });
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
