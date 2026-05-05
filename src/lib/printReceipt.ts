export function imprimirReciboHtml(conteudo: string) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>Recibo</title>
<style>
  @page { size: 58mm auto; margin: 0; }
  * { box-sizing: border-box; }
  html, body {
    margin: 0; padding: 0; background: #fff; color: #000;
    width: 58mm;
    font-family: 'Courier New', monospace;
    font-size: 11px; line-height: 1.25;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .wrap { width: 58mm; padding: 2mm; }
  h2 { font-size: 14px; margin: 0 0 2mm; text-align: center; text-transform: uppercase; }
  h3 { font-size: 12px; margin: 2mm 0; text-align: center; letter-spacing: 2px; }
  p { margin: 0; }
  .row { display: flex; justify-content: space-between; align-items: center; gap: 4px; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .sep { border-top: 1px dashed #000; margin: 2mm 0; }
  .total { font-size: 13px; font-weight: bold; border-top: 1px dashed #000; padding-top: 2mm; margin-top: 2mm; }
  .muted { font-size: 10px; }
  .receipt-container > div[style*="backgroundImage"] { display: none !important; }
</style>
</head>
<body>
  <div class="wrap">${conteudo}</div>
  <script>
    window.onload = function() { window.focus(); window.print(); };
  <\/script>
</body>
</html>`);
  doc.close();

  const cleanup = () => {
    setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }, 1000);
  };
  if (iframe.contentWindow) {
    iframe.contentWindow.onafterprint = cleanup;
  }
  setTimeout(cleanup, 10000);
}
