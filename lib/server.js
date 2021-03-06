/*
 * Pirple Homework Assignment #1
 *
 */

 // Dependencies
 var http = require('http');
 var https = require('https');
 var url = require('url');
 var StringDecoder = require('string_decoder').StringDecoder;
 // Production environment
 var config = require('./config');
 var fs = require('fs');
 var path = require('path');
 var handlers = require('./handlers');
 var helpers = require('./helpers');

 // Instantiate the server module object
 var server = {};

// Instantiating the HTTP server
 server.httpServer = http.createServer(function(req, res){
    server.unifiedServer(req, res);
     
 });

// Instantiating the HTTPS server
 server.httpsServerOptions = {
    'key' : fs.readFileSync(path.join(__dirname,'/../https/key.pem')),
    'cert' : fs.readFileSync(path.join(__dirname,'/../https/cert.pem'))
  };
 server.httpsServer = https.createServer(server.httpsServerOptions, function(req, res){
    server.unifiedServer(req, res);
 
 });


 server.unifiedServer = function(req, res){
 // Get the URL and parse it
    var parsedUrl = url.parse(req.url, true);

    // // Get the path
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

 // Get the query string as an object
    var queryStringObject = parsedUrl.query;

   // Get the HTTP method
    var method = req.method.toLowerCase();

    // Get the headers as an object
    var headers = req.headers;

   // // Get the payload, if any
    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    req.on('data',function(data){
        buffer += decoder.write(data);
    });
    req.on('end',function(){
        buffer += decoder.end();

        // Choose the handler this request should go to. If one is not found, use the not found handler
        var chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

        // Construct the data object to send to the handler
        var data = {
            'trimmedPath' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'method' : method,
            'headers' : headers,
            'payload' : helpers.parseJsonToObject(buffer)
        };

        // Route the request to the handler specifies in the router
        chosenHandler(data, function(statusCode, payload){
            // Use the status code called back by the handler, or default to 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

            // Use the payload called back by the handler, or default to an empty object
            payload = typeof(payload) == 'object' ? payload : {};

            // Convert the payload to a string
            var payloadString = JSON.stringify(payload);

            // Return the response
            res.setHeader('Content-Type', 'application/json')
            res.writeHead(statusCode);
            res.end(payloadString);

            // Log the request/response
            console.log('Returning this response: ',statusCode,payloadString);
        });
    });    
 };


 // Define a request router
 server.router = {
    'hello' : handlers.hello,
    'users' : handlers.users,
    'tokens' : handlers.tokens,
    'menu' : handlers.menu,
    'cart' : handlers.cart,
    'orders' : handlers.orders
 };

 server.init = function (){
// Start the httpServer, and have it listen to a port of my choice
 server.httpServer.listen(config.httpPort, function(){
         console.log("The server is listening on port "+config.httpPort+" in "+config.envName+" mode");
 });
 // Start the httpsServer, and have it listen to a port in config
 server.httpsServer.listen(config.httpsPort, function(){
         console.log("The server is listening on port "+config.httpsPort+" in "+config.envName+" mode");
 });

 };

// Export the module
 module.exports = server;