const https = require(“https”);

exports.handler = async function(event, context) {
const icalUrl = “https://cal.runna.com/20b5653689c52dddbf577b3acf9a80bc.ics”;

const body = await new Promise(function(resolve, reject) {
https.get(icalUrl, function(res) {
const chunks = [];
res.on(“data”, function(chunk) { chunks.push(chunk); });
res.on(“end”, function() { resolve(Buffer.concat(chunks).toString(“utf8”)); });
res.on(“error”, reject);
}).on(“error”, reject);
});

return {
statusCode: 200,
headers: {
“Content-Type”: “text/calendar; charset=utf-8”,
“Access-Control-Allow-Origin”: “*”,
“Cache-Control”: “public, max-age=3600”
},
body: body
};
};