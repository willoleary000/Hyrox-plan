var https = require("https");

exports.handler = function(event, context, callback) {
  var headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
  };

  // Handle preflight
  if(event.httpMethod === "OPTIONS") {
    return callback(null, {statusCode: 200, headers: headers, body: ""});
  }

  var body = {};
  try { body = JSON.parse(event.body || "{}"); } catch(e) {}

  var token = body.token || "";
  var repo = body.repo || "willoleary000/Hyrox-plan";
  var action = body.action || "restore";
  var path = "backups/training-data.json";

  var apiHost = "api.github.com";
  var apiPath = "/repos/" + repo + "/contents/" + path;

  if(action === "restore") {
    // GET the file
    var options = {
      hostname: apiHost,
      path: apiPath,
      method: "GET",
      headers: {
        "Authorization": "Bearer " + token,
        "Accept": "application/vnd.github+json",
        "User-Agent": "HyroxApp"
      }
    };
    var req = https.request(options, function(res) {
      var data = "";
      res.on("data", function(c) { data += c; });
      res.on("end", function() {
        callback(null, {
          statusCode: res.statusCode,
          headers: headers,
          body: data
        });
      });
    });
    req.on("error", function(e) {
      callback(null, {statusCode: 500, headers: headers, body: JSON.stringify({error: e.message})});
    });
    req.end();

  } else if(action === "backup") {
    var content = body.content || "";
    var sha = body.sha || null;
    var message = body.message || "Training backup";

    // First get SHA if not provided
    function doUpload(sha) {
      var payload = JSON.stringify({
        message: message,
        content: content,
        sha: sha || undefined
      });
      var options = {
        hostname: apiHost,
        path: apiPath,
        method: "PUT",
        headers: {
          "Authorization": "Bearer " + token,
          "Accept": "application/vnd.github+json",
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
          "User-Agent": "HyroxApp"
        }
      };
      var req = https.request(options, function(res) {
        var data = "";
        res.on("data", function(c) { data += c; });
        res.on("end", function() {
          callback(null, {statusCode: res.statusCode, headers: headers, body: data});
        });
      });
      req.on("error", function(e) {
        callback(null, {statusCode: 500, headers: headers, body: JSON.stringify({error: e.message})});
      });
      req.write(payload);
      req.end();
    }

    // Get existing SHA first
    var getOpts = {
      hostname: apiHost,
      path: apiPath,
      method: "GET",
      headers: {
        "Authorization": "Bearer " + token,
        "Accept": "application/vnd.github+json",
        "User-Agent": "HyroxApp"
      }
    };
    var getReq = https.request(getOpts, function(res) {
      var data = "";
      res.on("data", function(c) { data += c; });
      res.on("end", function() {
        var existingSha = null;
        try { existingSha = JSON.parse(data).sha; } catch(e) {}
        doUpload(existingSha);
      });
    });
    getReq.on("error", function() { doUpload(null); });
    getReq.end();
  }
};
