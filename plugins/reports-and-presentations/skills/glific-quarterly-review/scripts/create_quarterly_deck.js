/**
 * Glific Quarterly Review — PPTX Generator
 * Usage: node create_quarterly_deck.js <deck_data.json> [output.pptx]
 *
 * deck_data.json must match the schema in SKILL.md Step 5.
 */
const fs = require("fs");
const pptxgen = require("pptxgenjs");

// ── CLI args ──────────────────────────────────────────────────────────────────
const dataPath = process.argv[2];
const outName  = process.argv[3] || "glific_quarterly_review.pptx";

if (!dataPath) {
  console.error("Usage: node create_quarterly_deck.js <deck_data.json> [output.pptx]");
  process.exit(1);
}

const D = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const QUARTER_LABEL = `${D.quarter} ${D.fiscalYear}`;

// ── COLOR PALETTE (Glific brand — approved) ───────────────────────────────────
const C = {
  darkGreen:  "063F24",   // body text, section labels, title bg
  midDark:    "11452B",   // header strip
  midGreen:   "23995B",   // left panel bg
  rowAlt:     "1D7A49",   // alternating KPI row
  mint:       "CCE6D0",   // KPI label text on green
  yellow:     "FFCE00",   // accent bar, KPI panel label, highlights
  yellowMid:  "FFD633",   // right panel header divider
  cream:      "FFF6E6",   // right panel bg
  white:      "FFFFFF",
  grey:       "AAAAAA",   // placeholder text for TBD sections
};

// ── LAYOUT CONSTANTS ──────────────────────────────────────────────────────────
const W        = 10;
const H        = 5.625;
const HEADER_H = 0.65;
const PANEL_Y  = HEADER_H;
const PANEL_H  = H - HEADER_H;
const LEFT_W   = 3.2;
const RIGHT_X  = LEFT_W;
const RIGHT_W  = W - LEFT_W;
const PAD      = 0.22;
const FONT     = "Heebo";

const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.title  = `Glific Quarterly Review - ${QUARTER_LABEL}`;

// ── HELPERS ───────────────────────────────────────────────────────────────────

function header(s, title) {
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: W, h: HEADER_H,
    fill: { color: C.midDark }, line: { color: C.midDark }
  });
  s.addText(title, {
    x: PAD, y: 0, w: W - PAD * 2, h: HEADER_H,
    fontSize: 20, bold: true, color: C.white,
    fontFace: FONT, valign: "middle", align: "left", margin: 0
  });
}

function leftPanel(s, label) {
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: PANEL_Y, w: LEFT_W, h: PANEL_H,
    fill: { color: C.midGreen }, line: { color: C.midGreen }
  });
  s.addText(label, {
    x: PAD, y: PANEL_Y + 0.12, w: LEFT_W - PAD * 2, h: 0.38,
    fontSize: 10, bold: true, color: C.yellow,
    fontFace: FONT, valign: "middle", align: "left", charSpacing: 1.5, margin: 0
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: PAD, y: PANEL_Y + 0.52, w: LEFT_W - PAD * 2, h: 0.018,
    fill: { color: C.mint }, line: { color: C.mint }
  });
}

function rightPanel(s, label) {
  s.addShape(pres.shapes.RECTANGLE, {
    x: RIGHT_X, y: PANEL_Y, w: RIGHT_W, h: PANEL_H,
    fill: { color: C.cream }, line: { color: C.cream }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: RIGHT_X, y: PANEL_Y, w: 0.04, h: PANEL_H,
    fill: { color: C.yellow }, line: { color: C.yellow }
  });
  s.addText(label, {
    x: RIGHT_X + 0.12, y: PANEL_Y + 0.12, w: RIGHT_W - 0.2, h: 0.38,
    fontSize: 12, bold: true, color: C.darkGreen,
    fontFace: FONT, valign: "middle", align: "left", charSpacing: 1.5, margin: 0
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: RIGHT_X + 0.12, y: PANEL_Y + 0.52, w: RIGHT_W - 0.24, h: 0.018,
    fill: { color: C.yellowMid }, line: { color: C.yellowMid }
  });
}

function kpiRows(s, kpis, startY) {
  const ROW_H = 0.52;
  kpis.forEach((k, i) => {
    const y = startY + i * ROW_H;
    if (i % 2 === 0) {
      s.addShape(pres.shapes.RECTANGLE, {
        x: 0.08, y, w: LEFT_W - 0.1, h: ROW_H - 0.04,
        fill: { color: C.rowAlt }, line: { color: C.rowAlt }
      });
    }
    const labelOpts = {
      x: PAD, y: y + 0.03, w: LEFT_W - PAD * 2, h: 0.22,
      fontSize: 8, color: C.mint,
      fontFace: FONT, valign: "top", align: "left", margin: 0
    };
    if (k.labelHyperlink) labelOpts.hyperlink = { url: k.labelHyperlink };
    s.addText(k.label, labelOpts);
    const val = k.value != null ? String(k.value) : "—";
    s.addText(val, {
      x: PAD, y: y + 0.24, w: LEFT_W - PAD * 2, h: 0.24,
      fontSize: k.highlight ? 13 : 11, bold: !!k.highlight,
      color: k.highlight ? C.yellow : C.white,
      fontFace: FONT, valign: "top", align: "left", margin: 0
    });
  });
}

function sectionLabel(s, text, y) {
  s.addText(text, {
    x: RIGHT_X + 0.15, y, w: RIGHT_W - 0.3, h: 0.27,
    fontSize: 11, bold: true, color: C.darkGreen,
    fontFace: FONT, valign: "top", align: "left", margin: 0
  });
}

function bullets(s, items, y, h, fontSize) {
  if (!items || !items.length) return;
  s.addText(
    items.map((t, i) => ({
      text: t,
      options: {
        bullet: true,
        breakLine: i < items.length - 1,
        fontSize: fontSize || 11,
        color: C.darkGreen,
        fontFace: FONT,
        paraSpaceAfter: 4
      }
    })),
    { x: RIGHT_X + 0.12, y, w: RIGHT_W - 0.25, h, valign: "top", margin: 0 }
  );
}

// Render a grey italic placeholder when nextQuarter data is null
function tbdPlaceholder(s, y, nextQLabel) {
  const label = nextQLabel || "next quarter";
  s.addText(`To be updated once ${label} data is available`, {
    x: RIGHT_X + 0.18, y: y + 0.05, w: RIGHT_W - 0.35, h: 0.3,
    fontSize: 10, color: C.grey, fontFace: FONT,
    italic: true, valign: "top", align: "left", margin: 0
  });
}

// ══ SLIDE 0 — TITLE ══════════════════════════════════════════════════════════
const nextQ = D.quarter === "Q1" ? "Q2" :
              D.quarter === "Q2" ? "Q3" :
              D.quarter === "Q3" ? "Q4" : "next quarter";

const s0 = pres.addSlide();
s0.background = { color: C.darkGreen };
s0.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 3.65, w: W, h: 0.07,
  fill: { color: C.yellow }, line: { color: C.yellow }
});
s0.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 4.88, w: W, h: 0.745,
  fill: { color: C.midDark }, line: { color: C.midDark }
});
s0.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 0, w: 0.18, h: H,
  fill: { color: C.midGreen }, line: { color: C.midGreen }
});
s0.addText("Glific Quarterly Review", {
  x: 0.5, y: 1.0, w: 9, h: 1.2,
  fontSize: 44, bold: true, color: C.white,
  fontFace: FONT, align: "center", valign: "middle", margin: 0
});
s0.addText(QUARTER_LABEL, {
  x: 0.5, y: 2.35, w: 9, h: 0.7,
  fontSize: 28, color: C.yellow,
  fontFace: FONT, align: "center", valign: "middle", margin: 0
});
if (D.coverageNote) {
  s0.addText(D.coverageNote, {
    x: 0.5, y: 3.1, w: 9, h: 0.4,
    fontSize: 13, color: C.mint, fontFace: FONT,
    align: "center", valign: "middle", margin: 0, italic: true
  });
}
s0.addText("Project Tech4Dev  ·  Glific Platform", {
  x: 0.5, y: 4.93, w: 9, h: 0.38,
  fontSize: 11, color: C.mint,
  fontFace: FONT, align: "center", valign: "middle", margin: 0
});

// ══ SLIDE 1 — OVERALL UPDATE ═════════════════════════════════════════════════
const s1 = pres.addSlide();
header(s1, `Glific Overall Update - ${QUARTER_LABEL}`);
leftPanel(s1, "GOAL KPIs");
rightPanel(s1, "QUARTERLY UPDATES");
kpiRows(s1, D.overall.kpis, PANEL_Y + 0.6);

const HIGHLIGHTS = D.overall.highlights || [];
const LOWLIGHTS  = D.overall.lowlights  || [];

sectionLabel(s1, "Highlights", PANEL_Y + 0.62);
bullets(s1, HIGHLIGHTS, PANEL_Y + 0.88, 1.55);
sectionLabel(s1, "Lowlights", PANEL_Y + 2.56);
bullets(s1, LOWLIGHTS, PANEL_Y + 2.82, 1.55);

// ══ SLIDE 2 — BIZ DEV & MARKETING ═══════════════════════════════════════════
const s2 = pres.addSlide();
header(s2, `Biz Dev & Marketing - ${QUARTER_LABEL}`);
leftPanel(s2, "BIZ DEV KPIs");
rightPanel(s2, "QUARTERLY UPDATES");
kpiRows(s2, D.bizdev.kpis, PANEL_Y + 0.6);

sectionLabel(s2, "This Quarter", PANEL_Y + 0.62);
bullets(s2, D.bizdev.thisQuarter, PANEL_Y + 0.88, 2.2);
sectionLabel(s2, "Next Quarter", PANEL_Y + 3.18);
if (D.bizdev.nextQuarter) {
  bullets(s2, D.bizdev.nextQuarter, PANEL_Y + 3.44, 1.0);
} else {
  tbdPlaceholder(s2, PANEL_Y + 3.18, nextQ);
}

// ══ SLIDE 3 — CS CONSULTING ══════════════════════════════════════════════════
const s3 = pres.addSlide();
header(s3, `Customer Success - Consulting - ${QUARTER_LABEL}`);
leftPanel(s3, "CS CONSULTING KPIs");
rightPanel(s3, `${D.quarter} CONSULTING UPDATES`);
kpiRows(s3, D.csConsulting.kpis, PANEL_Y + 0.6);
bullets(s3, D.csConsulting.quarterUpdates, PANEL_Y + 0.65, PANEL_H - 0.75);

// ══ SLIDE 4 — CS SUPPORT ═════════════════════════════════════════════════════
const s4 = pres.addSlide();
header(s4, `Customer Success - Support - ${QUARTER_LABEL}`);
leftPanel(s4, "CS SUPPORT KPIs");
rightPanel(s4, "DOCUMENTATION UPDATES");
kpiRows(s4, D.csSupport.kpis, PANEL_Y + 0.6);

sectionLabel(s4, "This Quarter", PANEL_Y + 0.62);
bullets(s4, D.csSupport.docUpdates, PANEL_Y + 0.88, 1.85);
sectionLabel(s4, "Next Quarter", PANEL_Y + 2.85);
if (D.csSupport.nextQuarter) {
  bullets(s4, D.csSupport.nextQuarter, PANEL_Y + 3.1, 1.2);
} else {
  tbdPlaceholder(s4, PANEL_Y + 2.85, nextQ);
}

// ══ SLIDE 5 — PLATFORM ═══════════════════════════════════════════════════════
const s5 = pres.addSlide();
header(s5, `Platform - ${QUARTER_LABEL}`);
leftPanel(s5, "PLATFORM KPIs");
rightPanel(s5, "QUARTERLY UPDATES");
kpiRows(s5, D.platformOps.kpis, PANEL_Y + 0.6);

sectionLabel(s5, "This Quarter", PANEL_Y + 0.62);
bullets(s5, D.platformOps.thisQuarter, PANEL_Y + 0.88, 2.2);
sectionLabel(s5, "Next Quarter", PANEL_Y + 3.18);
if (D.platformOps.nextQuarter) {
  bullets(s5, D.platformOps.nextQuarter, PANEL_Y + 3.44, 1.0);
} else {
  tbdPlaceholder(s5, PANEL_Y + 3.18, nextQ);
}

// ── WRITE ─────────────────────────────────────────────────────────────────────
pres.writeFile({ fileName: outName })
  .then(() => console.log("OK: " + outName))
  .catch(err => { console.error("Error:", err); process.exit(1); });
