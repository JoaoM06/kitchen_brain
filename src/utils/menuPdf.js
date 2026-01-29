import { Platform } from "react-native";
import * as Print from "expo-print";
import * as FileSystem from "expo-file-system/legacy";

export async function generateMenuPdf(menu) {
  const title = menu.title || "CARDÁPIO SEMANAL";
  const range = menu.dateRange ? ` (${menu.dateRange})` : "";
  const html = buildMenuHtml(title, range, menu.data);
  const safeTitle = title.replace(/[^\w\- ]+/g, "").replace(/\s+/g, "_");
  const filename = `${safeTitle}${menu.dateRange ? "_" + menu.dateRange.replace(/[^\d\-]/g, "") : ""}.pdf`;

  if (Platform.OS === "web") {
    await generateWebPdf(html, filename);
    return { uri: null, name: filename };
  }

  const file = await Print.printToFileAsync({ html });
  const dest = FileSystem.documentDirectory + filename;
  await FileSystem.moveAsync({ from: file.uri, to: dest });
  return { uri: dest, name: filename };
}

function buildMenuHtml(title, range, menuData) {
  const dias = extractMenuDays(menuData);

  const cards = dias
    .map((d) => {
      const refeicoes = Array.isArray(d.refeicoes) ? d.refeicoes : [];
      const blocos = refeicoes
        .map((r) => {
          const itens = Array.isArray(r.itens) ? r.itens : [];
          const li = itens.map((x) => `<li>${escapeHtml(String(x))}</li>`).join("");
          return `
            <div class="meal">
              <div class="meal-title">${escapeHtml(String(r.nome || ""))}</div>
              <ul>${li}</ul>
              ${r.kcal ? `<div class="meal-meta">${r.kcal} kcal</div>` : ""}
              ${
                r.macros && (r.macros.protein_g || r.macros.carbs_g || r.macros.fat_g)
                  ? `<div class="meal-meta">P:${r.macros.protein_g || "-"} C:${r.macros.carbs_g || "-"} G:${r.macros.fat_g || "-"}</div>`
                  : ""
              }
              ${r.observacoes ? `<div class="meal-note">${escapeHtml(String(r.observacoes))}</div>` : ""}
            </div>`;
        })
        .join("");

      return `
        <section class="day-card">
          <header class="day-header">
            <span class="day-label">${escapeHtml(String(d.dia || ""))}</span>
          </header>
          <div class="meals">${blocos}</div>
        </section>`;
    })
    .join("");

  const shopping = Array.isArray(menuData?.shoppingList) ? menuData.shoppingList : [];
  const shoppingBlocks = shopping
    .map(
      (group) => `
        <div class="shopping-card">
          <div class="shopping-title">${escapeHtml(String(group.categoria || ""))}</div>
          <ul>
            ${(group.itens || [])
              .map((item) => `<li>${escapeHtml(item.nome || "")}${item.quantidade ? ` - ${escapeHtml(item.quantidade)}` : ""}</li>`)
              .join("")}
          </ul>
        </div>`
    )
    .join("");

  const assumptions = Array.isArray(menuData?.assumptions) ? menuData.assumptions : [];

  return `
    <!doctype html>
    <html lang="pt-br">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>${escapeHtml(title)}</title>
      <style>
        @page { size: A4 portrait; margin: 20mm; }
        * { box-sizing: border-box; font-family: -apple-system, Roboto, "Segoe UI", Arial, sans-serif; }
        body { color: #1f2937; margin: 0; line-height: 1.5; background: #fff; }
        main { max-width: 780px; margin: 0 auto; padding: 0 4mm 12mm; }
        h1 { margin: 0 0 4px 0; font-size: 24px; color: #064e3b; }
        .range { color: #4b5563; margin-bottom: 20px; font-size: 14px; }
        .day-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 12mm;
        }
        .day-card {
          background: #fff;
          border-radius: 16px;
          padding: 14px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0,0,0,0.08);
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .day-header {
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 12px;
          padding-bottom: 8px;
        }
        .day-label { font-weight: 700; color: #065f46; font-size: 15px; text-transform: uppercase; }
        .meal { margin-bottom: 12px; }
        .meal:last-child { margin-bottom: 0; }
        .meal-title { font-weight: 700; font-size: 14px; margin-bottom: 4px; color: #111827; }
        ul { margin: 0; padding-left: 18px; }
        li { line-height: 1.4; font-size: 13px; margin-bottom: 2px; overflow-wrap: anywhere; }
        .meal-meta { font-size: 11px; color: #6b7280; }
        .meal-note { font-size: 12px; color: #92400e; margin-top: 4px; }
        .section-title { font-size: 18px; font-weight: 700; color: #064e3b; margin: 0 0 12px 0; }
        .shopping-section {
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          page-break-before: always;
        }
        .shopping-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 10px;
          margin-top: 18px;
        }
        .shopping-card {
          border: 1px solid #d1d5db;
          border-radius: 12px;
          padding: 10px;
          page-break-inside: avoid;
        }
        .shopping-title { font-weight: 700; margin-bottom: 6px; }
        .assumptions {
          margin-top: 18px;
          font-size: 12px;
          color: #6b7280;
          page-break-inside: avoid;
        }
        .assumptions ul { padding-left: 16px; margin: 6px 0 0 0; }
      </style>
    </head>
    <body>
      <main>
        <h1>${escapeHtml(title)}</h1>
        ${range ? `<div class="range">${escapeHtml(range)}</div>` : ""}
        <div class="day-grid">${cards}</div>
        ${
          shopping.length
            ? `<section class="shopping-section" data-break-before="true">
                <h2 class="section-title">Lista de compras</h2>
                <div class="shopping-grid">${shoppingBlocks}</div>
              </section>`
            : ""
        }
        ${
          assumptions.length
            ? `<section class="assumptions" data-break-before="true">
                 <h2 class="section-title">Hipóteses</h2>
                 <ul>${assumptions.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
               </section>`
            : ""
        }
      </main>
    </body>
    </html>
  `;
}

async function generateWebPdf(html, filename) {
  const { jsPDF, html2canvas } = await ensurePdfLibraries();

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "794px";
  container.style.minHeight = "1123px";
  container.style.background = "#fff";
  container.style.padding = "0";
  container.style.zIndex = "-1";

  const parser = new DOMParser();
  const parsed = parser.parseFromString(html, "text/html");
  const styles = parsed.querySelectorAll("style");
  styles.forEach((style) => container.appendChild(style.cloneNode(true)));
  Array.from(parsed.body.children).forEach((node) => container.appendChild(node.cloneNode(true)));

  document.body.appendChild(container);
  await new Promise((resolve) => requestAnimationFrame(resolve));

  try {
    await renderPdfUsingCanvas(container, filename, jsPDF, html2canvas);
  } finally {
    document.body.removeChild(container);
  }
}

async function renderPdfUsingCanvas(container, filename, jsPDF, html2canvas) {
  const containerRect = container.getBoundingClientRect();
  const canvas = await html2canvas(container, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
  const pdf = new jsPDF("p", "pt", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const pxPerPt = canvas.width / pageWidth;
  const pageHeightPx = pageHeight * pxPerPt;
  const scaleFactor = containerRect.height ? canvas.height / containerRect.height : 1;
  const forcedBreaks = collectBreakOffsets(container, containerRect, pageHeightPx / (scaleFactor || 1));
  const forcedBreaksPx = forcedBreaks
    .map((offset) => Math.round(offset * scaleFactor))
    .filter((offset) => offset > 0 && offset < canvas.height)
    .sort((a, b) => a - b);

  let positionPx = 0;
  let pageIndex = 0;

  while (positionPx < canvas.height - 1) {
    while (forcedBreaksPx.length && forcedBreaksPx[0] <= positionPx + 1) {
      positionPx = forcedBreaksPx.shift();
    }

    let targetPx = Math.min(positionPx + pageHeightPx, canvas.height);
    if (forcedBreaksPx.length && forcedBreaksPx[0] < targetPx - 1) {
      targetPx = forcedBreaksPx.shift();
    }

    const sliceHeight = Math.max(0, targetPx - positionPx);
    if (sliceHeight <= 0) {
      positionPx += 1;
      continue;
    }

    const sliceCanvas = document.createElement("canvas");
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = sliceHeight;
    const ctx = sliceCanvas.getContext("2d");
    ctx.drawImage(canvas, 0, positionPx, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

    const imgHeight = (sliceHeight * pageWidth) / canvas.width;
    const imgData = sliceCanvas.toDataURL("image/png");
    if (pageIndex > 0) {
      pdf.addPage();
    }
    pdf.addImage(imgData, "PNG", 0, 0, pageWidth, imgHeight);

    pageIndex += 1;
    positionPx += sliceHeight;
  }

  pdf.save(filename);
}

function collectBreakOffsets(container, containerRect, pageHeightDomPx = 0) {
  const offsets = [];

  const markers = Array.from(container.querySelectorAll("[data-break-before='true']"));
  markers.forEach((el) => {
    const rect = el.getBoundingClientRect();
    offsets.push(Math.max(0, rect.top - containerRect.top));
  });

  if (pageHeightDomPx > 0) {
    const cards = Array.from(container.querySelectorAll(".day-card"));
    let nextBoundary = pageHeightDomPx;
    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const top = rect.top - containerRect.top;
      const height = rect.height;
      if (top + height > nextBoundary - 12) {
        offsets.push(Math.max(0, top));
        nextBoundary = top + pageHeightDomPx;
      } else if (top >= nextBoundary) {
        nextBoundary = Math.ceil(top / pageHeightDomPx) * pageHeightDomPx;
      }
    });
  }

  return offsets;
}

let pdfLibrariesPromise = null;
const loadedScripts = new Set();

function ensurePdfLibraries() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("PDF libraries only available em ambiente web"));
  }
  if (window.jspdf?.jsPDF && window.html2canvas) {
    return Promise.resolve({ jsPDF: window.jspdf.jsPDF, html2canvas: window.html2canvas });
  }
  if (!pdfLibrariesPromise) {
    pdfLibrariesPromise = (async () => {
      await Promise.all([
        loadScriptOnce("https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js", "jspdf"),
        loadScriptOnce("https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js", "html2canvas"),
      ]);
      if (!window.jspdf?.jsPDF || !window.html2canvas) {
        throw new Error("Não foi possível carregar bibliotecas de PDF.");
      }
      return { jsPDF: window.jspdf.jsPDF, html2canvas: window.html2canvas };
    })();
  }
  return pdfLibrariesPromise;
}

function loadScriptOnce(src, key) {
  if (loadedScripts.has(key) || typeof window[key] !== "undefined") {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-src="${src}"]`);
    if (existing) {
      existing.addEventListener("load", resolve);
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.src = src;
    script.onload = () => {
      loadedScripts.add(key);
      resolve();
    };
    script.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
    document.body.appendChild(script);
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function extractMenuDays(data) {
  if (!data) return [];
  if (Array.isArray(data?.dias)) return data.dias;
  if (Array.isArray(data?.menu?.dias)) return data.menu.dias;
  return [];
}
