var https = require(“https”);
exports.handler = function(event, context, callback) {
var url = “https://cal.runna.com/20b5653689c52dddbf577b3acf9a80bc.ics”;
https.get(url, function(res) {
var data = “”;
res.on(“data”, function(chunk) { data += chunk; });
res.on(“end”, function() {
var now = new Date();
now.setDate(now.getDate() - 14);
var cut = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
var lines = data.split(”\n”);
var out = [];
var inEv = false;
var buf = [];
var keep = false;
for (var i = 0; i < lines.length; i++) {
var l = lines[i].trim();
if (l === “BEGIN:VEVENT”) { inEv = true; buf = [lines[i]]; keep = false; }
else if (l === “END:VEVENT”) { buf.push(lines[i]); if (keep) { out.push(buf.join(”\n”)); } inEv = false; }
else if (inEv) {
buf.push(lines[i]);
if (l.indexOf(“DTSTART”) === 0) {
var parts = l.split(”:”);
var ds = parts[parts.length - 1].trim().substring(0, 8);
var d = parseInt(ds, 10);
if (!isNaN(d) && d >= cut) { keep = true; }
}
} else { out.push(lines[i]); }
}
callback(null, { statusCode: 200, headers: { “Content-Type”: “text/calendar”, “Access-Control-Allow-Origin”: “*” }, body: out.join(”\n”) });
});
}).on(“error”, function(e) {
callback(null, { statusCode: 500, body: e.message });
});
};