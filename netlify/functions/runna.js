const https = require("https");
exports.handler = async function() {
  const data = await new Promise(function(res, rej) {
    https.get("https://cal.runna.com/20b5653689c52dddbf577b3acf9a80bc.ics", function(r) {
      let s = "";
      r.on("data", function(c) { s += c; });
      r.on("end", function() { res(s); });
    }).on("error", rej);
  });
  return { statusCode: 200, headers: { "Content-Type": "text/calendar", "Access-Control-Allow-Origin": "*" }, body: data };
};