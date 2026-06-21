var https = require("https");
exports.handler = function(event, context, callback) {
  https.get("https://cal.runna.com/20b5653689c52dddbf577b3acf9a80bc.ics", function(res) {
    var data = "";
    res.on("data", function(c) { data += c; });
    res.on("end", function() {
      callback(null, {
        statusCode: 200,
        headers: { "Content-Type": "text/calendar", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-cache" },
        body: data
      });
    });
  }).on("error", function(e) {
    callback(null, { statusCode: 500, body: e.message });
  });
};
