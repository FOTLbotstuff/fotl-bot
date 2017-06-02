process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var path = require('path');

var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpoint at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
    module.exports = { default: connector.listen() }
}

var request = require('request');
var api = 'https://api.einstein.ai/v1/vision';
var token = 'ec1140166476f857a6131c02c7678d2106cf93ab';

var client = request.defaults({
	baseUrl: api,
	headers: {
		'Authorization': `Bearer ${token}`,
		'Cache-Control': 'no-cache',
		'Content-Type': 'multipart/form-data'
	},
	pool: {
		maxSockets: Infinity
	}
});

var bot = new builder.UniversalBot(connector);
bot.localePath(path.join(__dirname, './locale'));

bot.dialog('/', function (session) {
    session.send('You said ' + session.message.text);
    
    
    client.post({ uri: '/predict', formData }, (err, response, body) => {

    	if (err) { session.send(err); } //throw error
    	
    	var data = new Buffer(body).toString('base64');
        let formData = { //form data
            modelId: 'V5HTCHTZYKNC5JFMFQ2SAHZKRY', //trained model w/ breathable mens and womens brands
            sampleBase64Content: data //the function's input is the base64value
        };
    
    	console.log('status code: '+response.statusCode); //log statuscode of response
    	console.log(body); //log body of response
    });
});