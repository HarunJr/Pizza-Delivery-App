/*
 * Helpers for various tasks
 *
 */

 // Dependencies
 var crypto = require('crypto');
 var config = require('./config');
 var querystring = require('querystring');
 var https = require('https');
 var StringDecoder = require('string_decoder').StringDecoder;


 // Container for all the helpers
 var helpers = {};

 // Create a SHA256 hash
 helpers.hash = function(str){
 	if (typeof(str) == 'string' && str.length > 0) {
 		var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
 		return hash;
 	} else {
 		return false;
 	}

 };


// Parse JSON string to object in all cases, without throwing 
helpers.parseJsonToObject = function(str){
  try{
   var obj = JSON.parse(str);
   return obj;
}catch(e){
   return {};
}
};

// Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = function(strLength){
  strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
  if (strLength) {
 		// Define all the possible characters that could go into a string
 		var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz!_AMCDEFGHIJKLMNOPQRSTUVWXYZ-0123456789~.';

 		// Start the final string
 		var str = '';
 		for (i = 1; i <= strLength; i++) {
 			// Get a random character from the possibleCharacters string
 			var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));

 			// Append this character to the final string
 			str+=randomCharacter;
 		}

 		return str;

 	} else {
 		return false;
 	}
 }

 //Process payment via stripe
 helpers.processStripePayment = function(orderObject ,callback){
  // Validate parameters
  // var phone = typeof(orderObject.phone) == 'string' && orderObject.phone.trim().length == 10 ? orderObject.phone.trim() : false;
  // var orderId = typeof(orderObject.orderId) == 'string' && orderObject.orderId.trim().length == 20 ? orderObject.orderId.trim() : false;
  if(orderObject){
      var msg = 'Thank you for placing your order of ' + orderObject.name + ' with Pizza App, it will be with you shortly';

    // Configure the request payload
    var stripePayload = {
      'amount' : orderObject.totalPrice *10,
      'currency' : 'usd',
      'description' : msg,
      'source' : 'tok_amex',
      'metadata': orderObject,

  };

  var stringPayload = querystring.stringify(stripePayload);


    // Configure the request details
    var stripeDetails = {
      'protocol' : 'https:',
      'hostname' : config.stripe.hostname,
      'auth': config.stripe.secretKey,
      'method' : 'POST',
      'path' : '/v1/charges',
      'headers' : {
        'Content-Type' : 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringPayload)
        // 'Authorization': "Bearer "+config.stripe.secretKey
    }
};

console.log("stripeDetails  : "+stripeDetails.auth);

    // Instantiate the payment request object
    var req = https.request(stripeDetails,function(res){
        // Grab the status of the sent request
        var status =  res.statusCode;

        var decoder = new StringDecoder('utf-8');
        var responseData  = '';
        res.on('data',function(dataOutcome) {
            responseData  += decoder.write(dataOutcome);
        });
        res.on('end',function() {
            responseData  += decoder.end();
            var parsedResponseData = helpers.parseJsonToObject(responseData);

            // Callback successfully if the request went through
            if(status == 200 || status == 201) {
            // Grab the payment recipt from the post response
            const recieptUrl = parsedResponseData.receipt_url.split("://")[1];
            console.log('recieptUrl: '+recieptUrl);

            callback(false,parsedResponseData);


        } else {
            callback(res.statusCode,parsedResponseData);
        }
    });

    });

    // Bind to the error event so it doesn't get thrown
    req.on('error',function(e){
      callback(e);
  });

    // Add the payload
    req.write(stringPayload);

    // End the request
    req.end();

} else {

    callback('Given parameters were missing or invalid');
}
};

// The reciept printer funciton
//  Callback returns error and html data
helpers.printReceipt = (url, decoder, callback) => {
    let htmlString = "";

    const req = https.request({
        method: "get",
        hostname: "pay.stripe.com",
        path: url.substr(13),
        port: 443,
    },(res) => {
        res.on("data", data => {
            htmlString += decoder.write(data);
        });

        res.on("end", () => {
            htmlString += decoder.end();
            callback(false, htmlString);
        })
    });
    
    req.on("error", err => {
        console.log("Error occured due to: "+err);
        callback("Error occured due to: "+err, false);
    });
    
    req.end();
}


 //Process payment via stripe
 helpers.sendMailgunReceipt  = function(orderObject ,callback){
  // Validate parameters
  // var phone = typeof(orderObject.phone) == 'string' && orderObject.phone.trim().length == 10 ? orderObject.phone.trim() : false;
  // var orderId = typeof(orderObject.orderId) == 'string' && orderObject.orderId.trim().length == 20 ? orderObject.orderId.trim() : false;
  if(orderObject){
    var msg = 'Thank you for placing your order with Sample Pizza App, it will be with you shortly';

    // Configure the request payload
    var mailGunPayload = {
      'from' : "Mailgun Sandbox <postmaster@sandbox24b7b34c894d44ba84ad830ffb288009.mailgun.org>",
      'to' : orderObject.firstName+' '+orderObject.lastName+' <'+orderObject.email+'>',
      'subject' : msg,
      'text' : 'Congratulations '+orderObject.firstName+' '+ orderObject.lastName+', you just sent an email with Mailgun!  BudaBoss Umeweza!!!',

  };

  var stringPayload = querystring.stringify(mailGunPayload);


    // Configure the request details
    var mailGunDetails = {
      'protocol' : 'https:',
      'hostname' : config.mailgun.hostname,
      'auth': config.mailgun.apiKey,
      'method' : 'POST',
      'path' : '/v3/'+config.mailgun.domain+'/messages',
      'headers' : {
        'Content-Type' : 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringPayload)
        // 'Authorization': "Bearer "+config.stripe.secretKey
    }
};

console.log("mailGunDetails  : "+mailGunDetails.auth);

    // Instantiate the payment request object
    var req = https.request(mailGunDetails,function(res){
        // Grab the status of the sent request
        var status =  res.statusCode;
        console.log("mailGunStatus  : "+status);

        var decoder = new StringDecoder('utf-8');
        var buffer = '';
        res.on('data',function(dataOutcome) {
            buffer += decoder.write(dataOutcome);
        });

        res.on('end',function() {
            buffer += decoder.end();
            buffer = helpers.parseJsonToObject(buffer);

            // Callback successfully if the request went through
            if(status == 200 || status == 201) {
                callback(false, buffer);
            } else {
                callback(res.statusCode,buffer);
            }
        });

    });

    // Bind to the error event so it doesn't get thrown
    req.on('error',function(e){
      callback(e);
  });

    // Add the payload
    req.write(stringPayload);

    // End the request
    req.end();

} else {

    callback('Given parameters were missing or invalid');
}
};


 //Export the module
 module.exports = helpers;