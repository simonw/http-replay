var sys = require('sys'),
    http = require('http'),
    fs = require('fs'),
    url = require('url'),
    querystring = require('querystring')
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
    var data = request_description.data;
    var data_encoded = '';
    if (data) {
        data_encoded = querystring.stringify(data);
    }
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
    var headers = {'Host': hostname};
    if (data_encoded && method == 'POST') {
        headers['Content-Length'] = data_encoded.length;
    }
    var request = client.request(method, pathname, headers);
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
    if (data_encoded && method == 'POST') {
        request.write(data_encoded);
    }
    request.end();
}

sys.puts('Status at http://127.0.0.1:8123/');

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
    var num_made = requests_made.length;
    var num_total = requests_to_make.length;
    var percent = Math.round((num_made / num_total) * 100 * 100) / 100;
    res.write(
        percent + '%: Done ' + num_made + ' out of ' + num_total
    );
    res.end();
}).listen(8123);
