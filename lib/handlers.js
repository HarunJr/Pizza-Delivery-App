 /*
  *Request handlers
  *
  */

 //Dependencies
 var _data = require('./data');
 var helpers = require('./helpers');

 // Define the handlers
 var handlers = {};

 // Users
 handlers.users = function(data, callback){
 	// Callback a http status code and a payload object
 	var acceptableMethods = ['post', 'get', 'put', 'delete'];
 	if (acceptableMethods.indexOf(data.method) > -1) {
 		handlers._users[data.method](data, callback);
 	} else {
 		callback(405);

 	}
 };

 // Container for the users submethods
 handlers._users = {};

 // Users - post
 // Required fields: firstName, lastName, phone, email, password, tosAgreement
 // optional data : none
 handlers._users.post = function(data, callback){
 	// Check that all required fields are filled out
 	console.log('firstName '+firstName+'\n lastName '+lastName+'\n phone '+phone+'\n email '+email+'\n password '+password+'\n address '+address+' tosAgreement '+tosAgreement);

 	var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
 	var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
 	var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
 	var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 ? data.payload.email.trim() : false;
 	var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
 	var address = typeof(data.payload.address) == 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
 	var tosAgreement = typeof(data.payload.tosAgreement) === 'boolean' && data.payload.tosAgreement == true ? true : false;

 	console.log('firstName '+firstName+'\n lastName '+lastName+'\n phone '+phone+'\n email '+email+'\n password '+password+'\n address '+address+' tosAgreement '+tosAgreement);


 	if (firstName && lastName && phone && email && password && address && tosAgreement) {
	 	//TODO: Validate phone, email and password (if necessary)

 		// Make sure that the user doesn't already exist
 		_data.read('users', phone, function(err, data){
 			if (err) {
 				// Hash the password
 				var hashedPassword = helpers.hash(password);

 				if (hashedPassword) {
 			 		// Create the user object
 			 		var userObject = {
 			 			'firstName' : firstName,
 			 			'lastName' : lastName,
 			 			'phone' : phone,
 			 			'email' : email,
 			 			'password' : hashedPassword,
 			 			'address' : address,
 			 			'tosAgreement' : true
 			 		}

 					// Store the user
 					_data.create('users', phone, userObject, function(err){
 						if (!err) {
 							callback(200);
 						} else {
 							console.log(err);
 							callback(500, {'Error' : 'Could not create the new user'});
 						}
 					});		
 				} else {
 					callback(500, {'Error' : 'Could not hash the user\'s password'});
 				}


 			} else {
 				// User already exists
 				callback(400, {'Error':'A user with that phone number already exists'});
 			}
 		});

 	} else {
 		callback(400,{'Error': 'Missing required fields'});
 	}

 };

 // Users - get
 // Required data: phone
 // Optional data: none
 handlers._users.get = function(data, callback){
 	// Check that phone number provided is valid
 	var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
 	if (phone) {
 		// Get the token from the headers
 		var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
 		// Verify that the given token is valid for the phone number
 		handlers._tokens.verifyToken(token,phone, function(tokenIsValid){
 			if (tokenIsValid) {
		 		//Lookup the user
		 		_data.read('users', phone, function(err,data){
		 			if (!err && data) {
		 				// Remove the hashed password from the user object before returning it to the requester
		 				delete data.hashedPassword;
		 				callback(200, data);
		 			} else {
		 				callback(404);
		 			}
		 		});

		 	} else {
		 		callback(403, {'Error':'Missing required token in header, or token is invalid'});
		 	}
		 }); 

 	} else {
 		callback(400, {'Error':'Missing required field'});
 	}
 };

 // Users - put
 // Required data: phone
 // Optional data: firstName, lastName, password (at least one must be specified)
 handlers._users.put = function(data, callback){
 	// Check for the required field
 	var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

 	// Check for the optional fields
 	var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
 	var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
 	var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false; 

 	// Error if the phone is invalid
 	if (phone) {
 		// Error if nothing is sent to update
 		if (firstName || lastName || password) {
 			var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
 			// Verify that the given token is valid for the phone number
 			handlers._tokens.verifyToken(token,phone, function(tokenIsValid){
 				if (tokenIsValid) {
					// Lookup user
					_data.read('users', phone, function(err, userData){
						if (!err && userData) {
		 					// Update the necessary fields
		 					if (firstName) {
		 						userData.firstName = firstName;
		 					}
		 					if (lastName) {
		 						userData.lastName = lastName;
		 					}
		 					if (password) {
		 						userData.hashedPassword = helpers.hash(password);
		 					}

		 					// Store the new updates
		 					_data.update('users', phone, userData, function(err){
		 						if (!err) {
		 							callback(200);
		 						} else {
		 							console.log(err);
		 							callback(500,{'Error': 'Could not update the user'});
		 						}
		 					});

		 				} else {
		 					callback(400, {'Error':'The specified user does not exist'});		
		 				}
		 			});
				} else {
					callback(403, {'Error':'Missing required token in header, or token is invalid'});
				}
			});
 		} else {
 			callback(400, {'Error':'Missing fields to update'});
 		}
 	} else {
 		callback(400, {'Error':'Missing required field'});
 	}	
 };

 // Users - delete
 // Required data: phone
 // @TODO: Only let an authenticated user delete their own object. Don't let them delete anyone elses'
 // @TODO: Cleanup (delete) any other data files associated with this user 
 handlers._users.delete = function(data, callback){
 	// Check that the phone number is valid
 	var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
 	if (phone) {

 		// Get the token from the headers
 		var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

 		// Verify that the given token is valid for the phone number
 		handlers._tokens.verifyToken(token,phone, function(tokenIsValid){
 			if (tokenIsValid) {
      			//Lookup the user
      			_data.read('users', phone, function(err,userData){
      				if (!err && userData) {
      					_data.delete('users', phone, function(err){
      						if (!err) {
		 							// Delete each of the checks associated with the user
		 							var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
		 							var checksToDelete = userChecks.length;
		 							if (checksToDelete > 0) {
		 								var checksDeleted = 0;
		 								var deletionErrors = false;
 										// Loop through the checks
 										userChecks.forEach(function(checkId){
 											// Delete the check
 											_data.delete('checks', checkId, function(err){
 												if (err) {
 													deletionErrors = true;
 												}
 												checksDeleted++;
 												if (checksDeleted == checksToDelete) {
 													if (!deletionErrors) {
 														callback(200);
 													} else {
 														callback(500,{'Error' : 'Errors encountered while attempting to delete all of the user\'s checks. All checks may not have been deleted from the system successfully'})
 													}
 												}
 											});
 										});
 									} else {
 										callback(200);
 									}

 								} else {
 									callback(500,{'Error' : 'Could not delete the specified user'});
 								}
 							});
      				} else {
      					callback(400,{'Error' : 'Could not find the specified user'});
      				}
      			});
      		} else {
      			callback(403, {'Error':'Missing required token in header, or token is invalid'});
      		}
      	});

 	} else {
 		callback(400, {'Error':'Missing required field'});
 	} 	
 };

 // Tokens
 handlers.tokens = function(data, callback){
 	// Callback a http status code and a payload object
 	var acceptableMethods = ['post', 'get', 'put', 'delete'];
 	if (acceptableMethods.indexOf(data.method) > -1) {
 		handlers._tokens[data.method](data, callback);
 	} else {
 		callback(405);

 	}
 };

 // Container for the tokens submethods
 handlers._tokens = {};

 // Tokens - post
 // Required data: phone, password
 // Optional data: none
 handlers._tokens.post = function(data, callback){
 	var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
 	var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
 	if (phone && password) {
 		// Lookup the user who matches that phone number
 		_data.read('users', phone, function(err, userData){
 			if (!err && userData) {
 				// Hash the sent password, and compare it to the password stored in the user userObject
 				var hashedPassword = helpers.hash(password);
 				if (hashedPassword == userData.password) {
 					// If valid create a new token with a random name. Set expiration date 1 hour in the future
 					var tokenId = helpers.createRandomString(170);
 					console.log(phone, tokenId);

 					var expires = Date.now() + 1000 * 60 * 60;
 					var tokenObject = {
 						'phone' : phone,
 						'id' : tokenId,
 						'expires' :expires
 					};

 					// Store the token
 					_data.create('tokens', tokenId, tokenObject, function(err){
 						if (!err) {
 							callback(200, tokenObject);
 						}else {
 							callback(500, {'Error':'Could not create the new token'});
 						}
 					});
 				} else {
 					callback(400, {'Error':'password did not match the specified user\'s stored password'});
 				}
 			} else {
 				callback(400,{'Error':'Could not find the specified user'});
 			}
 		});
 	} else {
 		callback(400, {'Error' : 'Missing required fields'});
 	}
 };

 // Tokens - get
 // Required data: id
 // Optional data: none
 handlers._tokens.get = function(data, callback){
 // Check that the id is valid
 var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 170 ? data.queryStringObject.id.trim() : false;
 console.log('queryStringObject: ',data.queryStringObject.expires);

 if (id) {
 		//Lookup the token
 		_data.read('tokens', id, function(err,tokenData){
 			if (!err && tokenData) {
 				callback(200, tokenData);
 			} else {
 				callback(404);
 			}
 		});

 	} else {
 		callback(400, {'Error':'Missing required field'});
 	}
 };

 // Tokens - put
 // Required data: id, extend
 // Optional data: none
 handlers._tokens.put = function(data, callback){
 	var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 170 ? data.payload.id.trim() : false;
 	var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
 	if (id && extend) {
 		// Lookup the token
 		_data.read('tokens', id, function(err, tokenData){
 			if (!err && tokenData) {
 				// Check to make sure the token isn't already expired
 				if (tokenData.expires > Date.now()) {
 						// Set the expiration an hour from now
 						tokenData.expires = Date.now() + 1000 * 60 * 60;

 						// Store the new updates
 						_data.update('tokens',id, tokenData, function(err){
 							if (!err) {
 								callback(200);
 							} else {
 								callback(500, {'Error':'Could not update the token\'s expiration'});
 							}
 						});

 					}else {
 						callback(400, {'Error':'The token has already expired, cannot extend it'});
 					}
 				} else {
 					callback(400,{'Error':'Specified token does not exist'});
 				}
 			});
 	} else {
 		callback(400,{'Error':'Missing required field(s) or field(s) are invalid'});
 	}
 };

 // Tokens - delete
 // Required data: id
 // Optional data: none 
 handlers._tokens.delete = function(data, callback){
 	// Check that the id is valid
 	var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 170 ? data.queryStringObject.id.trim() : false;
 	if (id) {
	 		//Lookup the token
	 		_data.read('tokens', id, function(err,data){
	 			if (!err && data) {
	 				_data.delete('tokens', id, function(err){
	 					if (!err) {
	 						callback(200);
	 					} else {
	 						callback(500,{'Error' : 'Could not delete the specified token'});
	 					}
	 				});
	 			} else {
	 				callback(400,{'Error' : 'Could not find the specified token'});
	 			}
	 		});

	 	} else {
	 		callback(400, {'Error':'Missing required field'});
	 	} 	
	 };

 // Verify if a given token is currently valid for a given user
 handlers._tokens.verifyToken = function(id, phone, callback){
 	// Lokup the token
 	_data.read('tokens', id, function(err, tokenData){
 		if (!err) {
 			// Check that the token is for the given user and has not expired
 			if (tokenData.phone == phone && tokenData.expires > Date.now()) {
 				callback(true);
 			} else {
 				callback(false);
 			}
 		} else {
 			callback(false);
 		}
 	});
 };

 //Menu
 handlers.menu = function(data,callback){
 	var acceptableMethods = ['get'];
 	if(acceptableMethods.indexOf(data.method) > -1){
 		handlers._menu[data.method](data,callback);
 	} else {
 		callback(405);
 	}
 };

 //Container for all the menu methods
 handlers._menu = {};

 // Menu - get
 // Required data: phone
 // Optional data: none
 handlers._menu.get = function(data, callback){
 	// Check that phone number provided is valid
 	var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
 	if (phone) {
 		// Get the token from the headers
 		var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
 		// Verify that the given token is valid for the phone number
 		handlers._tokens.verifyToken(token,phone, function(tokenIsValid){
 			if (tokenIsValid) {
		 		//Lookup the menu
		 		_data.read('menu', 'menu', function(err,data){
		 			if (!err && data) {
		 				callback(200, data);
		 			} else {
		 				callback(404, {'Error': 'Could not read menu file'});
		 			}
		 		});

		 	} else {
		 		callback(403, {'Error':'Missing required token in header, or token is invalid'});
		 	}
		 }); 

 	} else {
 		callback(400, {'Error':'Missing required field'});
 	}
 };

//Shopping cart
handlers.cart = function(data,callback){
	var acceptableMethods = ['post','get','put','delete'];
	if(acceptableMethods.indexOf(data.method) > -1){
		handlers._cart[data.method](data,callback);
	} else {
		callback(405);
	}
};

//Container for all the cart methods
handlers._cart = {};


// Cart - post
// Required data: phone, id
// Optional data: none
handlers._cart.post = function(data,callback){
  // Check that phone number and item id is valid
  var userPhone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  var itemId = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim() !='' ? data.queryStringObject.id.trim() : false;
  console.log("itemId: "+ itemId);
  
  if(userPhone && itemId){

    // Get token from headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    // Verify that the given token is valid for the phone number
    handlers._tokens.verifyToken(token,userPhone,function(tokenIsValid){
    	if(tokenIsValid){

 		// Lookup the user data
 		_data.read('users',userPhone,function(err,userData){
 			if (!err && userData){
 				var userCartItems = typeof(userData.cart) == 'object' && userData.cart instanceof Array ? userData.cart : [];

            // Lookup the menu
            _data.read('menu','menu',function(err,menuData){
            	var menuItems = typeof(menuData) == 'object' && menuData instanceof Object && Object.getOwnPropertyNames(menuData).length ? menuData : false;

            	if (!err && menuItems && menuData) {
              	//Loop through the menu data
              	Object.getOwnPropertyNames(menuData).forEach(function(menuItems){
              		var itemDetail = menuData[menuItems];
              		if (itemDetail.id == itemId) {
	              		// Create a random id for the cart item
	              		var cartItemId = helpers.createRandomString(20);

										// Create a cart object and include the user's phone 
										var cartObject = {
											'cartItemId' : cartItemId,
											'userPhone' : userPhone,
											'id' : itemDetail.id,
											'name' : itemDetail.name,
											'price' : itemDetail.price
										};

										console.log("Menu Items: "+ itemDetail);

 									 // Save the object
 									 _data.create('cart', cartItemId, cartObject, function(err){
 									 	if (!err) {
													// Add the cartId to the user's object
													userData.cart = userCartItems;
													userData.cart.push(cartItemId);

												// Update user data with cart items
												_data.update('users', userPhone, userData, function(err){
													if (!err) {
														// Return the data  about the new cart item
														callback(200, cartObject);
													} else {
														callback(500, {'Error' : 'Could not update the user with the new menu item id'});
													}
												});
												
											} else {
												callback(500, {'Error' : 'Could not create the new cart'});
											}
										});
 									}  	
 								});
              	
              } else {
              	callback(403,"Invalid token");
              };

            });
          } else {
          	callback(400, {'Error':'Could not read the user\'s file'});
          }
        });
 	} else {
 		callback(403,{"Error" : "Missing required token in header, or token is invalid."});
 	}
 });
  } else {
  	callback(400,{'Error' : 'Missing required field'});
  }
};

 // Carts - get
 // Required data: id
 // Optional data: none 
 handlers._cart.get = function(data, callback){
 // Check that the id is valid
 var userPhone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
//  var cartItemId = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;

if (userPhone) {
		  //Lookup the user
		  _data.read('users', userPhone, function(err,userData){
		  	if (!err && userData) {
				// Get the token from the headers
				var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
 				// Verify that the given token is valid and belongs to the user who created the check
 				handlers._tokens.verifyToken(token,userData.phone, function(tokenIsValid){
 					if (tokenIsValid) {
 						var userCartItems = typeof(userData.cart) == 'object' && userData.cart instanceof Array ? userData.cart : [];
 						var cartItemsToDisplay = userCartItems.length;
 						console.log("userCartItems: "+ userCartItems.length);

 						if (cartItemsToDisplay > 0) {

 							handlers._cart.loopCart(userData, userCartItems, function(cartData){
 								if (cartData) {
 									callback(200, cartData);		

 								} else{
 									callback(404, {'Error':'Could not loop through cart file'});		


 								}
 							});


 						}
 					} else {
 						callback(403, {"Error" : "Missing required token in header, or token is invalid."});
 					}
 				}); 

 			} else {
 				callback(404, {'Error': 'Could not read user\'s file'});
 			}
 		});


		} else {
			callback(400, {'Error':'Missing required field'});
		}
	};

	 // Verify if a given token is currently valid for a given user
	 handlers._cart.loopCart = function(userData, userCartItems, callback){
	 	var itemArray =[];
	 	var totalPrice = 0;
	// Lokup the token
	userCartItems.forEach(function(cartItemId){
		console.log("cartId: "+ cartItemId);	

		_data.read('cart', cartItemId, function(err, cartData){					   			

			if (!err && cartData) {
				console.log("cartData: "+ cartData.price);
 				//itemArray++;
 				totalPrice += cartData.price;
 				itemArray.push(cartData);
 				// console.log("itemArray: "+ itemArray.length);

 				if (itemArray.length === userCartItems.length) {
 					var orderId = helpers.createRandomString(20);

 					var orderObject = {
 						'orderId' : orderId,
 						'firstName' : userData.firstName,
 						'lastName' : userData.lastName,
 						'email' : userData.email,
 						'phone' : userData.phone,
 						'totalPrice' : totalPrice,
 						'items' : itemArray
 					};

 					console.log("totalPrice	: "+ totalPrice);
			 		// Save the object
			 		_data.create('orders', orderId, orderObject, function(err){
			 			if (!err) {
			 				callback(orderObject);
			 				
			 			} else {
			 				callback(500, {'Error' : 'Could not create the new order'});
			 			}
			 		});
			 	}


			 } else {
			 	callback(404, {'Error':'Could not read cart file'});		
			 }

			});
	});				
};


//Orders
handlers.orders = function(data,callback){
	var acceptableMethods = ['post','get','put','delete'];
	if(acceptableMethods.indexOf(data.method) > -1){
		handlers._orders[data.method](data,callback);
	} else {
		callback(405);
	}
};

//Container for all the order methods
handlers._orders = {};

//Orders - post
//Required - phone,id
//Get items from user's cart and create an order
handlers._orders.post = function(data, callback){
	var userPhone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
	// Check that the id is valid
	var orderId = typeof(data.queryStringObject.orderId) == 'string' && data.queryStringObject.orderId.trim().length == 20 ? data.queryStringObject.orderId.trim() : false;
	if(userPhone && orderId){

		// Get token from headers
		var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

		// Verify that the given token is valid for the phone number
		handlers._tokens.verifyToken(token, userPhone, function(tokenIsValid){
			if(tokenIsValid){
				console.log("tokenIsValid	: ");

			// Lookup the order data
			_data.read('orders', orderId, function(err,orderData){

				if (!err && orderData) {
          	//Loop through the menu data
          	console.log("orderData	: "+orderData);

          	helpers.processStripePayment(orderData, function(err, stripeData){
          		if (!err && stripeData) {
          			helpers.sendMailgunReceipt(orderData, function(err, mailData){
          				if (!err && mailData) {
          					callback(200,mailData);		
          				} else {
          					callback(404, {'Error':'Error processing mail'});

          				}
          				
          			});
          		} else{
          			callback(404, {'Error':'Error processing payment'});		
          		}
          	});

          }else{
          	callback(403,"Invalid token");

          };    
        });
		} else {
			callback(403,{"Error" : "Missing required token in header, or token is invalid."});
		}
	});
	} else {
		callback(400,{'Error' : 'Missing required field'});
	}
};


handlers.hello = function(data, callback){
	// Callback a http status code and a payload object
	callback(200,{'message': 'Hello World!'});
};

// Not found handler
handlers.notFound =  function(data, callback){
	Callback(404);
};

// Export the module
module.exports = handlers;
