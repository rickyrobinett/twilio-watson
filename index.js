var Hapi = require('hapi'),
    request = require('request'),
    twilio = require('twilio');;

// The IP address of the Cloud Foundry DEA (Droplet Execution Agent) that hosts this application:
var host = (process.env.VCAP_APP_HOST || 'localhost');
// The port on the DEA for communication with the application:
var port = (process.env.VCAP_APP_PORT || 3000);

var service_url, service_username, service_password;
if (process.env.VCAP_SERVICES) {
  console.log('Parsing VCAP_SERVICES');
  var services = JSON.parse(process.env.VCAP_SERVICES);
  //service name, check the VCAP_SERVICES in bluemix to get the name of the services you have
  var service_name = 'question_and_answer';
    
  if (services[service_name]) {
    console.log('here 1');
    var svc = services[service_name][0].credentials;
    service_url = svc.url;
    service_username = svc.username;
    service_password = svc.password;
  } else {
    console.log('The service '+service_name+' is not in the VCAP_SERVICES, did you forget to bind it?');
  }
}

// Create a server with a host and port
var server = new Hapi.Server();
server.connection({ 
    host: host, 
    port: port 
});

// Add the route
server.route({
    method: 'GET',
    path:'/hello', 
    handler: function (request, reply) {
       reply('hello world');
    }
});

server.route({
  method: 'POST',
  path: '/question',
  handler: function(req, reply) {
    var question = req.payload.Body;
    var options = {
        url: service_url + '/v1/question/healthcare/',
        method: 'POST',
        headers: {
          'X-synctimeout' : '30'
        },
        auth: {
          'user': service_username,
          'password': service_password
        },
        json: {
        'question': {
          'evidenceRequest': {
            'items': 1 // the number of answers
          },
          'questionText': question
        }
      }
    };

    request(options, function(error, response, body) {
      var resp = new twilio.TwimlResponse();
      resp.message(body[0].question.evidencelist[0].text);
      reply(resp.toString()).type('text/xml');
    });
  }
});

// Start the server
server.start();
