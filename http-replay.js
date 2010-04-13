var sys = require('sys'),
    http = require('http'),
    fs = require('fs'),
    url = require('url')
;

function getTimestamp() {
    var timestamp_ms = (new Date()).getTime();
    return Math.floor(timestamp_ms / 1000);
}

var requests_to_make = [];
var requests_to_make_index = 0;
var requests_made = [];
var startTime = null;
var baseUrl = 'http://localhost/'

function sendRequestsIfScheduled() {
    if (startTime === null) {
        return;
    }
    var offset = (getTimestamp() - startTime);
    var toSend = [];
    
    if (requests_to_make_index >= requests_to_make.length) {
        sys.puts('NO MORE REQUESTS TO MAKE');
        clearInterval(timer);
        return;
    }
    
    // Find all requests that should have been sent by now
    while (requests_to_make_index < requests_to_make.length) {
        var request = requests_to_make[requests_to_make_index];
        if (request.offset <= offset) {
            toSend.push(request);
            requests_to_make_index += 1;
        } else {
            break;
        }
    }
    //sys.puts('Offset = ' + offset + ', ' + toSend.length + ' to send');
    toSend.forEach(function(request) {
        sendRequest(baseUrl, request);
        requests_made.push(request);
    });
}

function start() {
    startTime = getTimestamp();
}

var timer = setInterval(sendRequestsIfScheduled, 1000);

var args = process.argv;

function sendRequest(base_url, request_description) {
    var full_url = url.resolve(base_url, request_description.path);
    var method = request_description.method.toUpperCase();
    var bits = url.parse(full_url);
    var port = 80;
    if (bits.port) {
        port = parseInt(bits.port, 10);
    }
    var hostname = bits.hostname;
    var pathname = bits.pathname;
    if (bits.search) {
        pathname += bits.search;
    }
    var client = http.createClient(port, hostname);
    var request = client.request(method, pathname, {'host': hostname});
    request.addListener('response', function (response) {
        var statusCode = response.statusCode;
        response.setEncoding('utf8');
        var body = '';
        response.addListener('data', function (chunk) {
            body += chunk;
        });
        response.addListener('end', function() {
            sys.puts(
                method + ' ' + full_url + ' : ' + statusCode + 
                ' len = ' + body.length
            );
        });
    });
    request.end();
}

sys.puts('Server running at http://127.0.0.1:8123/');

var jsonfile = process.argv[process.argv.length - 1];
fs.readFile(jsonfile, encoding='utf8', 
    function(err, content) {
        var json = JSON.parse(content);
        baseUrl = json.base_url;
        requests_to_make = json.requests;
        start();
    }
);

http.createServer(function (req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello World\n');
}).listen(8123);
