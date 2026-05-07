const https = require(“https”);

exports.handler = async function() {
const url = “https://cal.runna.com/20b5653689c52dddbf577b3acf9a80bc.ics”;

const raw = await new Promise(function(resolve, reject) {
https.get(url, function(res) {
let s = “”;
res.on(“data”, function(c) { s += c; });
res.on(“end”, function() { resolve(s); });
}).on(“error”, reject);
});

// Get today’s date as YYYYMMDD number for comparison
const now = new Date();
const today = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();

const lines = raw.split(”\n”);
const filtered = [];
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
if (keep) {
filtered.push(eventLines.join(”\n”));
}
} else if (inEvent) {
eventLines.push(lines[i]);
if (line.startsWith(“DTSTART:”)) {
const ds = line.replace(“DTSTART:”, “”).trim().substring(0, 8);
const eventDate = parseInt(ds, 10);
if (!isNaN(eventDate) && eventDate >= today) {
keep = true;
}
}
} else {
filtered.push(lines[i]);
}
}

return {
statusCode: 200,
headers: {
“Content-Type”: “text/calendar”,
“Access-Control-Allow-Origin”: “*”,
“Cache-Control”: “no-cache”
},
body: filtered.join(”\n”)
};
};
