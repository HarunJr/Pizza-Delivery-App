/*
 * Create and export configuration variables
 *
 */

 // Container for all the environments
 var environments = {};

 // Staging (default) environment 
 environments.staging = {
 	'httpPort' : 3000,
 	'httpsPort' : 3001,
 	'envName' : 'staging',
 	'hashingSecret' : 'thisIsASecret',
 	'stripe' : {
        'hostname' : 'api.stripe.com',
        'secretKey' : 'sk_test_51J01KbKRgiXOaOuRPa3aqB6bndQPHdogu1IWxFpyJjLCWjWlP94QQoa3ZOU2akl8WTExy5qHXokNUUYsqXONKS3M00xarTBxmo'
    },
    'mailgun' : {
        'hostname' : 'api.mailgun.net',
        'apiKey' : 'api:key-59755003c28d91a85834742ecc23677d',
        'domain' : 'sandbox24b7b34c894d44ba84ad830ffb288009.mailgun.org'
    }
 };

 // Production environment
 environments.production = {
 	'httpPort' : 5000,
 	'httpsPort' : 5001,
 	'envName' : 'production',
 	'hashingSecret' : 'thisIsAlsoASecret',
 	'stripe' : {
        'hostname' : 'api.stripe.com',
        'secretKey' : ''
 	},
    'mailgun' : {
        'hostname' : 'api.mailgun.net',
        'apiKey' : 'api:key-59755003c28d91a85834742ecc23677d',
        'domain' : 'sandbox24b7b34c894d44ba84ad830ffb288009.mailgun.org'

    }
 };

 // Determine which environment was passed as a command line argument
 var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

 // Check that the current environment is one of the environments above, if not, default to staging
 var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

 // Export the module
 module.exports = environmentToExport;