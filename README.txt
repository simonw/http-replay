http-replay
===========

A Node.js tool for executing HTTP activity on a timed basis. 
Useful for e.g. replaying log files to simulate real traffic.

Usage:

    $ node http-replay.js my-config.json

The my-config.json file specifies the requests that should be executed:

    {
        "base_url": "http://simonwillison.net/",
        "requests": [{
            "offset": 0,
            "path": "/about/",
            "method": "GET"
        }, {
            "offset": 3,
            "path": "/",
            "method": "GET"
        }, {
            "offset": 7,
            "path": "http://www.postbin.org/y525h3",
            "method": "POST",
            "data": {"foo": "bar"}
        }]
    }

The "offset" key allows you to time your requests - in the above example, a 
GET request well be made to /about/ as soon as the tool is run, a request to 
/ will take place 3 seconds after launch and a POST to postbin will happen 
4 seconds after that (7 seconds total since the tool was started).

You can monitor the status of the tool at http://127.0.0.1:8123/
