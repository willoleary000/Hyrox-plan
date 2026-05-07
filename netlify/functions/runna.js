const https = require(“https”);

exports.handler = async function() {
const url = “https://cal.runna.com/20b5653689c52dddbf577b3acf9a80bc.ics”;

let raw;
try {
raw = await new Promise(function(resolve, reject) {
const req = https.get(url, function(res) {
let s = “”;
res.on(“data”, function(c) { s += c; });
res.on(“end”, function() { resolve(s); });
res.on(“error”, reject);
});
req.on(“error”, reject);
req.setTimeout(8000, function() {
req.destroy();
reject(new Error(“timeout”));
});
});
} catch(e) {
return {
statusCode: 502,
body: “Failed to fetch Runna feed: “ + e.message
};
}

const cutoff = new Date();
cutoff.setDate(cutoff.getDate() - 14);
const cutoffNum = cutoff.getFullYear() * 10000 + (cutoff.getMonth() + 1) * 100 + cutoff.getDate();

function extractDate(line) {
const val = line.split(”:”).pop().trim().substring(0, 8);
const n = parseInt(val, 10);
return isNaN(n) ? 0 : n;
}

const lines = raw.split(”\n”);
const output = [];
let inEvent = false;
let eventLines = [];
let keep = false;

for (let i = 0; i < lines.length; i++) {
const line = lines[i].trim();
if (line === “BEGIN:VEVENT”) {
inEvent = true;
eventLines = [lines[i]];
keep = false;
} else if (line === “END:VEVENT”) {
inEvent = false;
eventLines.push(lines[i]);
if (keep) output.push(eventLines.join(”\n”));
} else if (inEvent) {
eventLines.push(lines[i]);
if (line.startsWith(“DTSTART”)) {
const d = extractDate(line);
if (d >= cutoffNum) keep = true;
}
} else {
output.push(lines[i]);
}
}

return {
statusCode: 200,
headers: {
“Content-Type”: “text/calendar”,
“Access-Control-Allow-Origin”: “*”,
“Cache-Control”: “no-cache”
},
body: output.join(”\n”)
};
};