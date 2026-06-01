/** Barcode reference generation and rendering */

import { padSeatId } from './config.js';

export function buildBarcodeRef(dateStr, seatId, code6) {
  const ymd = dateStr.replace(/-/g, '');
  const seat = padSeatId(seatId);
  return `EL-${ymd}-${seat}-${code6}`;
}

export function renderBarcode(svgOrCanvasId, value) {
  const el = document.getElementById(svgOrCanvasId);
  if (!el || typeof JsBarcode === 'undefined') return;
  try {
    JsBarcode(el, value, {
      format: 'CODE128',
      width: 2,
      height: 60,
      displayValue: true,
      fontSize: 14,
      margin: 10,
      lineColor: '#0A1931',
    });
  } catch (e) {
    console.warn('Barcode render failed', e);
  }
}
