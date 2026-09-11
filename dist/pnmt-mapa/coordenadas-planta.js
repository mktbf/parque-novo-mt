/**
 * Apoio para alinhar uma prancha 2D ao plano X/Z da cena 3D.
 * Converte estritamente via transformação uniforme (rotação, translação e escala uniforme)
 * sem distorção anisotrópica entre X e Y.
 *
 * @typedef {{ xPx: number, yPx: number }} PontoPlanta
 * @typedef {{ x: number, z: number }} PontoMundo
 * @typedef {{ id: string, planta: PontoPlanta, mundo: PontoMundo }} Controle
 * @typedef {{ x0: number, y0: number, x1: number, y1: number, larguraImagemPx: number, alturaImagemPx: number }} Recorte
 * @typedef {{ readonly escalaMetrosPorPixel: number, readonly rotacaoRad: number, paraMundo: (p: PontoPlanta) => PontoMundo, paraPlanta: (p: PontoMundo) => PontoPlanta }} Transformacao
 */

function conferir(...valores) {
  if (!valores.every(Number.isFinite)) {
    throw new TypeError('Coordenadas devem ser números finitos.');
  }
}

/**
 * Ajusta translação, rotação e escala UNIFORME por dois pontos de controle conhecidos.
 * Inverte Y da imagem antes do ajuste (imagem: Y para baixo; plano 3D: Z).
 * @param {Controle} a
 * @param {Controle} b
 * @returns {Transformacao}
 */
export function calibrar(a, b) {
  conferir(
    a.planta.xPx, a.planta.yPx, b.planta.xPx, b.planta.yPx,
    a.mundo.x, a.mundo.z, b.mundo.x, b.mundo.z
  );
  const dx = b.planta.xPx - a.planta.xPx;
  const dy = -(b.planta.yPx - a.planta.yPx);
  const wx = b.mundo.x - a.mundo.x;
  const wz = b.mundo.z - a.mundo.z;
  const norma = dx * dx + dy * dy;
  const normaMundo = wx * wx + wz * wz;
  if (!Number.isFinite(norma) || !Number.isFinite(normaMundo) || norma <= 1e-12 || normaMundo <= 1e-12) {
    throw new RangeError('Controles devem ser distintos e ter magnitude numérica válida.');
  }
  const c = (wx * dx + wz * dy) / norma;
  const s = (wz * dx - wx * dy) / norma;
  const tx = a.mundo.x - c * a.planta.xPx - s * a.planta.yPx;
  const tz = a.mundo.z - s * a.planta.xPx + c * a.planta.yPx;
  const det = c * c + s * s;
  if (!Number.isFinite(det) || det <= Number.MIN_VALUE) {
    throw new RangeError('Escala inválida. Conferir unidades e pontos de controle.');
  }
  return Object.freeze({
    escalaMetrosPorPixel: Math.sqrt(det),
    rotacaoRad: Math.atan2(s, c),
    paraMundo(ponto) {
      conferir(ponto.xPx, ponto.yPx);
      return {
        x: c * ponto.xPx + s * ponto.yPx + tx,
        z: s * ponto.xPx - c * ponto.yPx + tz
      };
    },
    paraPlanta(ponto) {
      conferir(ponto.x, ponto.z);
      const x = ponto.x - tx;
      const z = ponto.z - tz;
      return {
        xPx: (c * x + s * z) / det,
        yPx: (s * x - c * z) / det
      };
    }
  });
}

/**
 * Converte pixels de um recorte para o espaço da prancha completa (3370 x 2384), sem perder a origem.
 * @param {PontoPlanta} p
 * @param {Recorte} r
 * @returns {PontoPlanta}
 */
export function recorteParaPrancha(p, r) {
  conferir(p.xPx, p.yPx, r.x0, r.y0, r.x1, r.y1, r.larguraImagemPx, r.alturaImagemPx);
  if (r.x1 <= r.x0 || r.y1 <= r.y0 || r.larguraImagemPx <= 0 || r.alturaImagemPx <= 0) {
    throw new RangeError('Retângulo e dimensões do recorte devem ser positivos.');
  }
  if (p.xPx < 0 || p.yPx < 0 || p.xPx > r.larguraImagemPx || p.yPx > r.alturaImagemPx) {
    throw new RangeError('Ponto fora dos limites do recorte.');
  }
  return {
    xPx: r.x0 + (p.xPx / r.larguraImagemPx) * (r.x1 - r.x0),
    yPx: r.y0 + (p.yPx / r.alturaImagemPx) * (r.y1 - r.y0)
  };
}

/**
 * Mede o erro residual (RMSE e maior erro em metros) em controles INDEPENDENTES dos dois usados para calibrar.
 * @param {Transformacao} t
 * @param {readonly Controle[]} controles
 */
export function avaliar(t, controles) {
  if (controles.length < 3) {
    throw new RangeError('Forneça ao menos três controles adicionais para verificação.');
  }
  if (new Set(controles.map(p => p.id)).size !== controles.length) {
    throw new RangeError('Identificadores de controles devem ser únicos.');
  }
  const pontos = controles.map(p => {
    conferir(p.mundo.x, p.mundo.z);
    const calculado = t.paraMundo(p.planta);
    const erroMetros = Math.hypot(calculado.x - p.mundo.x, calculado.z - p.mundo.z);
    return { id: p.id, erroMetros, calculado, esperado: p.mundo };
  });
  const rmseMetros = Math.sqrt(
    pontos.reduce((sum, p) => sum + p.erroMetros ** 2, 0) / pontos.length
  );
  return {
    quantidade: pontos.length,
    rmseMetros,
    maiorErroMetros: Math.max(...pontos.map(p => p.erroMetros)),
    pontos
  };
}
