const https = require(‘https’);

exports.handler = async function() {
const url = ‘https://cal.runna.com/20b5653689c52dddbf577b3acf9a80bc.ics’;

const data = await new Promise(function(resolve, reject) {
https.get(url, function(res) {
let body = ‘’;
res.on(‘data’, function(chunk) { body += chunk; });
res.on(‘end’, function() { resolve(body); });
}).on(‘error’, reject);
});

return {
statusCode: 200,
headers: {
‘Content-Type’: ‘text/calendar; charset=utf-8’,
‘Access-Control-Allow-Origin’: ‘*’,
‘Cache-Control’: ‘public, max-age=3600’
},
body: data
};
};