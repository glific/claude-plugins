/**
 * Glific Monthly Review — PPTX Generator
 * Usage: node create_deck.js <data.json> [output.pptx]
 *
 * data.json must match the schema documented in SKILL.md Step 3.
 */

const fs   = require("fs");
const path = require("path");
const pptxgen = require("pptxgenjs");

// ─── CLI args ────────────────────────────────────────────────────────────────
const dataPath = process.argv[2];
const outName  = process.argv[3] || "glific_monthly_review.pptx";

if (!dataPath) {
  console.error("Usage: node create_deck.js <data.json> [output.pptx]");
  process.exit(1);
}

const D = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const MONTH_YEAR = `${D.month} ${D.year}`;

// ─── COLOR PALETTE ───────────────────────────────────────────────────────────
const C = {
  teal:     "028090",
  darkTeal: "01535D",
  deepTeal: "00404A",
  white:    "FFFFFF",
  offWhite: "F4FAFB",
  lightTeal:"D0EBEE",
  accent:   "02C39A",
  textDark: "1A2E32",
  textMid:  "374649",
  textLight:"6B8F93",
  headerBg: "013C45",
};

// ─── LAYOUT CONSTANTS ────────────────────────────────────────────────────────
const W        = 10;
const H        = 5.625;
const HEADER_H = 0.65;
const PANEL_Y  = HEADER_H;
const PANEL_H  = H - HEADER_H;
const LEFT_W   = 3.2;
const RIGHT_X  = LEFT_W;
const RIGHT_W  = W - LEFT_W;
const PAD      = 0.22;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function addHeader(slide, title) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: W, h: HEADER_H,
    fill: { color: C.headerBg }, line: { color: C.headerBg }
  });
  slide.addText(title, {
    x: PAD, y: 0, w: W - PAD * 2, h: HEADER_H,
    fontSize: 20, bold: true, color: C.white,
    fontFace: "Calibri", valign: "middle", align: "left", margin: 0
  });
}

function addLeftPanel(slide, label) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: PANEL_Y, w: LEFT_W, h: PANEL_H,
    fill: { color: C.darkTeal }, line: { color: C.darkTeal }
  });
  slide.addText(label, {
    x: PAD, y: PANEL_Y + 0.12, w: LEFT_W - PAD * 2, h: 0.38,
    fontSize: 10, bold: true, color: C.accent,
    fontFace: "Calibri", valign: "middle", align: "left",
    charSpacing: 1.5, margin: 0
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: PAD, y: PANEL_Y + 0.52, w: LEFT_W - PAD * 2, h: 0.018,
    fill: { color: C.teal }, line: { color: C.teal }
  });
}

function addRightPanel(slide, label) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: RIGHT_X, y: PANEL_Y, w: RIGHT_W, h: PANEL_H,
    fill: { color: C.offWhite }, line: { color: C.offWhite }
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: RIGHT_X, y: PANEL_Y, w: 0.04, h: PANEL_H,
    fill: { color: C.teal }, line: { color: C.teal }
  });
  slide.addText(label, {
    x: RIGHT_X + 0.12, y: PANEL_Y + 0.12, w: RIGHT_W - 0.2, h: 0.38,
    fontSize: 12, bold: true, color: C.teal,
    fontFace: "Calibri", valign: "middle", align: "left",
    charSpacing: 1.5, margin: 0
  });
  slide.addShape(pres.shapes.RECTANGLE, {
    x: RIGHT_X + 0.12, y: PANEL_Y + 0.52, w: RIGHT_W - 0.24, h: 0.018,
    fill: { color: C.lightTeal }, line: { color: C.lightTeal }
  });
}

function addKpiRows(slide, kpis, startY) {
  const ROW_H  = 0.52;
  const labelX = PAD;
  const labelW = LEFT_W - PAD * 2;
  kpis.forEach((kpi, i) => {
    const y = startY + i * ROW_H;
    if (i % 2 === 0) {
      slide.addShape(pres.shapes.RECTANGLE, {
        x: 0.08, y: y, w: LEFT_W - 0.1, h: ROW_H - 0.04,
        fill: { color: "013843" }, line: { color: "013843" }
      });
    }
    const labelOpts = {
      x: labelX, y: y + 0.03, w: labelW, h: 0.22,
      fontSize: 8, color: C.lightTeal,
      fontFace: "Calibri", valign: "top", align: "left", margin: 0
    };
    if (kpi.labelHyperlink) labelOpts.hyperlink = { url: kpi.labelHyperlink };
    slide.addText(kpi.label, labelOpts);
    const val      = kpi.value != null ? String(kpi.value) : "—";
    const valColor = kpi.highlight ? C.accent : C.white;
    slide.addText(val, {
      x: labelX, y: y + 0.24, w: labelW, h: 0.24,
      fontSize: kpi.highlight ? 13 : 11, bold: !!kpi.highlight,
      color: valColor, fontFace: "Calibri",
      valign: "top", align: "left", margin: 0
    });
  });
}

function bulletRuns(items, fontSize) {
  return items.map((text, i) => ({
    text,
    options: {
      bullet: true,
      breakLine: i < items.length - 1,
      fontSize: fontSize || 12,
      color: C.textDark,
      fontFace: "Calibri",
      paraSpaceAfter: 3
    }
  }));
}

function addSectionLabel(slide, text, y) {
  slide.addText(text, {
    x: RIGHT_X + 0.15, y, w: RIGHT_W - 0.3, h: 0.27,
    fontSize: 12, bold: true, color: C.teal,
    fontFace: "Calibri", valign: "top", align: "left", margin: 0
  });
}

function addBullets(slide, items, y, h) {
  if (!items || items.length === 0) return;
  slide.addText(bulletRuns(items), {
    x: RIGHT_X + 0.12, y, w: RIGHT_W - 0.25, h,
    valign: "top", margin: 0
  });
}

// ─── PRESENTATION ────────────────────────────────────────────────────────────
const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.title  = `Glific Monthly Review - ${MONTH_YEAR}`;

// ══════════════════════════════════════════════════════════
// SLIDE 1 — TITLE
// ══════════════════════════════════════════════════════════
const s0 = pres.addSlide();
s0.background = { color: C.deepTeal };

s0.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 3.7, w: W, h: 0.06,
  fill: { color: C.accent }, line: { color: C.accent }
});
s0.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 4.9, w: W, h: 0.725,
  fill: { color: C.headerBg }, line: { color: C.headerBg }
});
s0.addShape(pres.shapes.RECTANGLE, {
  x: 0, y: 0, w: 0.18, h: H,
  fill: { color: C.teal }, line: { color: C.teal }
});
s0.addText("Glific Monthly Review", {
  x: 0.5, y: 1.1, w: 9, h: 1.2,
  fontSize: 44, bold: true, color: C.white,
  fontFace: "Calibri", align: "center", valign: "middle", margin: 0
});
s0.addText(MONTH_YEAR, {
  x: 0.5, y: 2.5, w: 9, h: 0.7,
  fontSize: 28, bold: false, color: C.accent,
  fontFace: "Calibri", align: "center", valign: "middle", margin: 0
});
s0.addText("Project Tech4Dev  ·  Glific Platform", {
  x: 0.5, y: 4.95, w: 9, h: 0.38,
  fontSize: 11, color: C.lightTeal,
  fontFace: "Calibri", align: "center", valign: "middle", margin: 0
});

// ══════════════════════════════════════════════════════════
// SLIDE 2 — OVERALL UPDATE
// ══════════════════════════════════════════════════════════
const s1 = pres.addSlide();
addHeader(s1, `Glific Overall Update — ${MONTH_YEAR}`);
addLeftPanel(s1, "GOAL KPIs");
addRightPanel(s1, "MONTHLY UPDATES");
addKpiRows(s1, D.overall.kpis, PANEL_Y + 0.6);
addBullets(s1, D.overall.updates, PANEL_Y + 0.62,
  PANEL_H - 0.62 - 0.1);

// ══════════════════════════════════════════════════════════
// SLIDE 3 — BIZ DEV & MARKETING
// ══════════════════════════════════════════════════════════
const s2 = pres.addSlide();
addHeader(s2, `Biz Dev & Marketing — ${MONTH_YEAR}`);
addLeftPanel(s2, "BIZ DEV KPIs");
addRightPanel(s2, "MONTHLY UPDATES");
addKpiRows(s2, D.bizdev.kpis, PANEL_Y + 0.6);

addSectionLabel(s2, "This Month", PANEL_Y + 0.62);
addBullets(s2, D.bizdev.thisMonth, PANEL_Y + 0.89, 1.7);
addSectionLabel(s2, "Next Month", PANEL_Y + 2.7);
addBullets(s2, D.bizdev.nextMonth, PANEL_Y + 2.97, 1.7);

// ══════════════════════════════════════════════════════════
// SLIDE 4 — CUSTOMER SUCCESS - CONSULTING
// ══════════════════════════════════════════════════════════
const s3 = pres.addSlide();
addHeader(s3, `Customer Success - Consulting — ${MONTH_YEAR}`);
addLeftPanel(s3, "CS CONSULTING KPIs");
addRightPanel(s3, "MONTHLY UPDATES");
addKpiRows(s3, D.csConsulting.kpis, PANEL_Y + 0.6);

addSectionLabel(s3, "This Month", PANEL_Y + 0.62);
addBullets(s3, D.csConsulting.thisMonth, PANEL_Y + 0.89, 1.7);
addSectionLabel(s3, "Next Month", PANEL_Y + 2.7);
addBullets(s3, D.csConsulting.nextMonth, PANEL_Y + 2.97, 1.7);

// ══════════════════════════════════════════════════════════
// SLIDE 5 — CUSTOMER SUCCESS - SUPPORT
// ══════════════════════════════════════════════════════════
const s4 = pres.addSlide();
addHeader(s4, `Customer Success - Support — ${MONTH_YEAR}`);
addLeftPanel(s4, "CS SUPPORT KPIs");
addRightPanel(s4, "DOCUMENTATION UPDATES");
addKpiRows(s4, D.csSupport.kpis, PANEL_Y + 0.6);

addBullets(s4, D.csSupport.docUpdates, PANEL_Y + 0.62, PANEL_H - 0.72);

// ══════════════════════════════════════════════════════════
// SLIDE 6 — PLATFORM
// ══════════════════════════════════════════════════════════
const s5 = pres.addSlide();
addHeader(s5, `Platform — ${MONTH_YEAR}`);
addLeftPanel(s5, "PLATFORM KPIs");
addRightPanel(s5, "MONTHLY UPDATES");
addKpiRows(s5, D.platformOps.kpis, PANEL_Y + 0.6);

addSectionLabel(s5, "Monthly Updates", PANEL_Y + 0.62);
addBullets(s5, D.platformOps.monthlyUpdates, PANEL_Y + 0.89, 1.9);
addSectionLabel(s5, "Next Month", PANEL_Y + 2.9);
addBullets(s5, D.platformOps.nextMonth, PANEL_Y + 3.17, 1.7);

// ─── WRITE FILE ──────────────────────────────────────────────────────────────
pres.writeFile({ fileName: outName })
  .then(() => console.log(`✅  Created: ${outName}`))
  .catch(err => { console.error("❌  Error:", err); process.exit(1); });
