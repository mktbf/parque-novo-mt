import http from 'http';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.hdr': 'application/octet-stream',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml'
};

const baseDir = path.resolve('dist');
const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(baseDir, reqPath);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const mime = mimeTypes[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime, 'Access-Control-Allow-Origin': '*' });
  fs.createReadStream(filePath).pipe(res);
});

const PORT = 8124;
server.listen(PORT, async () => {
  console.log(`Test server running on port ${PORT}`);
  const artifactsDir = 'C:/Users/jean.marques/.gemini/antigravity/brain/3e1921f0-c528-43a6-b350-a25ea1465d9f';
  
  const browser = await puppeteer.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));

  console.log('Navigating to map page...');
  await page.goto(`http://localhost:${PORT}/pnmt-mapa/index.html`, { waitUntil: 'networkidle2', timeout: 30000 });

  try {
    await page.waitForFunction(() => {
      const el = document.getElementById('loading');
      return !el || el.hidden || el.classList.contains('fade-out');
    }, { timeout: 15000 });
    console.log('Map loaded successfully.');
  } catch (e) {
    console.log('Loading wait timed out, proceeding anyway...');
  }

  await new Promise(r => setTimeout(r, 2000));

  // 1. Perspective overview
  await page.screenshot({ path: path.join(artifactsDir, 'view_3d_overview.png') });
  console.log('Saved view_3d_overview.png');

  // 2. Click collapse sidebar
  const sidebarBtn = await page.$('#sidebar-toggle');
  if (sidebarBtn) {
    await sidebarBtn.click();
    await new Promise(r => setTimeout(r, 500));
    await page.screenshot({ path: path.join(artifactsDir, 'view_3d_fullscreen.png') });
    console.log('Saved view_3d_fullscreen.png');
    await sidebarBtn.click(); // restore
    await new Promise(r => setTimeout(r, 500));
  }

  // 3. Switch to Planta Técnica (Plan view)
  const planBtn = await page.$('[data-view="plan"]');
  if (planBtn) {
    await planBtn.click();
    await new Promise(r => setTimeout(r, 2500));
    await page.screenshot({ path: path.join(artifactsDir, 'view_planta_tecnica.png') });
    console.log('Saved view_planta_tecnica.png');
  }

  // 4. Focus on Roda-gigante (Pilot Sector)
  await page.evaluate(() => {
    const btn = document.querySelector('[data-locate="roda-gigante"]');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(artifactsDir, 'view_focus_roda_gigante.png') });
  console.log('Saved view_focus_roda_gigante.png');

  // 5. Focus on Arena Show
  await page.evaluate(() => {
    const btn = document.querySelector('[data-locate="arena-show"]');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(artifactsDir, 'view_focus_arena_show.png') });
  console.log('Saved view_focus_arena_show.png');

  // 6. Focus on Autódromo
  await page.evaluate(() => {
    const btn = document.querySelector('[data-locate="autodromo"]');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(artifactsDir, 'view_focus_autodromo.png') });
  console.log('Saved view_focus_autodromo.png');

  // 7. Focus on Pórtico de Entrada
  await page.evaluate(() => {
    const btn = document.querySelector('[data-locate="portico-de-entrada"]');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(artifactsDir, 'view_focus_portico.png') });
  console.log('Saved view_focus_portico.png');

  await browser.close();
  server.close();
  console.log('Validation screenshots completed successfully!');
  process.exit(0);
});
