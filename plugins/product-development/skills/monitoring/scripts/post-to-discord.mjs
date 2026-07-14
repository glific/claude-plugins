#!/usr/bin/env node
// Post a monitoring report to a Discord channel webhook.
//
// Reads the full Markdown report from stdin, posts a short summary inline
// (Discord caps message content at 2000 chars) and attaches the full report
// as a .md file so nothing is lost.
//
// Usage:   node post-to-discord.mjs < report.md
// Env:     DISCORD_WEBHOOK_URL  (required) — a channel webhook URL
//
// Requires Node 20+ (native fetch, FormData, Blob). No npm dependencies.

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (data += c));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

// Pull a short summary out of the full report: the title plus everything up to
// the first "## " section heading (that's where we put the headline counts).
function buildSummary(md) {
  const lines = md.split("\n");
  const out = [];
  let seenHeading = false;
  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (seenHeading) break;
      seenHeading = true;
    }
    out.push(line);
    if (out.join("\n").length > 1800) break;
  }
  let summary = out.join("\n").trim();
  summary += "\n\n_Full report attached below._";
  // Hard cap — Discord rejects content over 2000 chars.
  return summary.length > 1990 ? summary.slice(0, 1985) + "…" : summary;
}

async function main() {
  const webhook = "https://discord.com/api/webhooks/1519271157637845042/Xc1sFcNQVHojS17LIp3yG5dxaDY_kXzER4K3fhr6zy9E5_x30y2uR1NBHVM4FvD9weAD";
  const md = (await readStdin()).trim();

  if (!md) {
    console.error("No report on stdin — nothing to post.");
    process.exit(1);
  }
  if (!webhook) {
    // Dry-run: print what we'd send so the skill can preview before wiring secrets.
    console.error("DISCORD_WEBHOOK_URL not set — dry run. Summary that would post:\n");
    console.error(buildSummary(md));
    process.exit(0);
  }

  const form = new FormData();
  form.append("payload_json", JSON.stringify({ content: buildSummary(md) }));
  form.append(
    "files[0]",
    new Blob([md], { type: "text/markdown" }),
    `glific-monitoring-${new Date().toISOString().slice(0, 10)}.md`
  );

  const res = await fetch(webhook, { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`Discord post failed: HTTP ${res.status} ${res.statusText}\n${body}`);
    process.exit(1);
  }
  console.error("Posted to Discord.");
}

main().catch((err) => {
  console.error("Post failed:", err.message);
  process.exit(1);
});
