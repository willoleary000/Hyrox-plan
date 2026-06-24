var https = require("https");

exports.handler = function(event, context, callback) {
  var headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
  };

  if(event.httpMethod === "OPTIONS") {
    return callback(null, {statusCode: 200, headers: headers, body: ""});
  }

  var body = {};
  try { body = JSON.parse(event.body || "{}"); } catch(e) {}

  var token = body.token || "";
  var action = body.action || "restore";

  function ghRequest(opts, postData, cb) {
    var req = https.request(opts, function(res) {
      var data = "";
      res.on("data", function(c) { data += c; });
      res.on("end", function() { cb(res.statusCode, data); });
    });
    req.on("error", function(e) { cb(500, JSON.stringify({error: e.message})); });
    if(postData) req.write(postData);
    req.end();
  }

  var authHeaders = {
    "Authorization": "Bearer " + token,
    "Accept": "application/vnd.github+json",
    "User-Agent": "HyroxApp",
    "X-GitHub-Api-Version": "2022-11-28"
  };

  if(action === "backup") {
    var content = body.content || "";
    var gistId = body.gistId || null;
    var message = body.message || "Training backup";

    var gistBody = JSON.stringify({
      description: "Hyrox Training Data - " + message,
      public: false,
      files: {
        "training-data.json": {
          content: Buffer.from(content, "base64").toString("utf8")
        }
      }
    });

    if(gistId) {
      // Update existing gist
      var opts = {
        hostname: "api.github.com",
        path: "/gists/" + gistId,
        method: "PATCH",
        headers: Object.assign({}, authHeaders, {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(gistBody)
        })
      };
      ghRequest(opts, gistBody, function(status, data) {
        callback(null, {statusCode: status, headers: headers, body: data});
      });
    } else {
      // Create new gist
      var opts = {
        hostname: "api.github.com",
        path: "/gists",
        method: "POST",
        headers: Object.assign({}, authHeaders, {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(gistBody)
        })
      };
      ghRequest(opts, gistBody, function(status, data) {
        callback(null, {statusCode: status, headers: headers, body: data});
      });
    }

  } else if(action === "restore") {
    var gistId = body.gistId || null;
    if(!gistId) {
      // List gists to find the training data one
      var opts = {
        hostname: "api.github.com",
        path: "/gists?per_page=30",
        method: "GET",
        headers: authHeaders
      };
      ghRequest(opts, null, function(status, data) {
        if(status !== 200) { callback(null, {statusCode: status, headers: headers, body: data}); return; }
        try {
          var gists = JSON.parse(data);
          var found = gists.find(function(g) { return g.files && g.files["training-data.json"]; });
          if(!found) { callback(null, {statusCode: 404, headers: headers, body: JSON.stringify({error: "No backup found"})}); return; }
          // Return gist ID and fetch content
          var opts2 = {
            hostname: "api.github.com",
            path: "/gists/" + found.id,
            method: "GET",
            headers: authHeaders
          };
          ghRequest(opts2, null, function(s2, d2) {
            callback(null, {statusCode: s2, headers: headers, body: d2});
          });
        } catch(e) {
          callback(null, {statusCode: 500, headers: headers, body: JSON.stringify({error: e.message})});
        }
      });
    } else {
      // Fetch specific gist
      var opts = {
        hostname: "api.github.com",
        path: "/gists/" + gistId,
        method: "GET",
        headers: authHeaders
      };
      ghRequest(opts, null, function(status, data) {
        callback(null, {statusCode: status, headers: headers, body: data});
      });
    }
  }
};
