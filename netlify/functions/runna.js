const https = require(“https”);

exports.handler = async function() {
const url = “https://cal.runna.com/20b5653689c52dddbf577b3acf9a80bc.ics”;
const raw = await new Promise(function(res, rej) {
const r = https.get(url, function(response) {
let d = “”;
response.on(“data”, function(c) { d += c; });
response.on(“end”, function() { res(d); });
response.on(“error”, rej);
});
r.on(“error”, rej);
});
const now = new Date();
now.setDate(now.getDate() - 14);
const cut = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
const lines = raw.split(”\n”);
const out = [];
let ev = false;
let buf = [];
let ok = false;
for (let i = 0; i < lines.length; i++) {
const l = lines[i].trim();
if (l === “BEGIN:VEVENT”) { ev = true; buf = [lines[i]]; ok = false; }
else if (l === “END:VEVENT”) { buf.push(lines[i]); if (ok) out.push(buf.join(”\n”)); ev = false; }
else if (ev) {
buf.push(lines[i]);
if (l.startsWith(“DTSTART”)) {
const v = parseInt(l.split(”:”).pop().trim().substring(0, 8), 10);
if (v >= cut) ok = true;
}
} else { out.push(lines[i]); }
}
return { statusCode: 200, headers: { “Content-Type”: “text/calendar”, “Access-Control-Allow-Origin”: “*”, “Cache-Control”: “no-cache” }, body: out.join(”\n”) };
};