/**
 * Module dependencies.
 */
 // Load env
 require('dotenv').load();
var express = require('express'),
    routes = require('./routes'),
    user = require('./routes/user'),
    http = require('http'),
    path = require('path'),
    fs = require('fs');

const requestAPI = require('request');
var app = express();


var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var logger = require('morgan');
var errorHandler = require('errorhandler');
var multipart = require('connect-multiparty')
var multipartMiddleware = multipart();
var htmlToText = require('html-to-text');

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(logger('dev'));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/style', express.static(path.join(__dirname, '/views/style')));

// development only
if ('development' == app.get('env')) {
    app.use(errorHandler());
}



var myMap = new Map();
myMap.set("Pod", "box");
myMap.set("Cluster", "ellipse");
myMap.set("Container", "diamond");
myMap.set("Node", "triangle");
myMap.set("Service", "star");
myMap.set("PhysicalServer", "box");
myMap.set("Application", "dot");
myMap.set("pvc", "box");

var myColorMap = new Map();
myColorMap.set("Pod", "royalblue");
myColorMap.set("Cluster", "#FFFF00");
myColorMap.set("Container", "#FB7E81");
myColorMap.set("Node", "#7BE141");
myColorMap.set("Service", "#6E6EFD");
myColorMap.set("PhysicalServer", "#FFA807");
myColorMap.set("Application", "#8B0000");
myColorMap.set("pvc", "orchid");

var servicesDomain = process.env.SERVICES_DOMAIN || ""
if(servicesDomain!="" )
{
	servicesDomain = "."+servicesDomain
}



app.get('/', routes.index);

function createResponseData(id, url,document_detail,rev, attachments) {

    var responseData = {
        id: id,
        url:sanitizeInput(url),
        document_detail:document_detail,
        rev:rev,
        attachements: []
    };
    return responseData;
}



app.get('/api/search', function(request, response) {
    console.log("get the data...")
    let url = "http://cluster-insight"+servicesDomain+":5555/cluster"

    console.log(url);
    var namespaceMap = new Map();
    var topic = request.query.topic;
    var filterEnabled= false;
    var filterNamespace="all"
    console.log("..."+topic+"...");
    if(topic!="" && topic!="all")
    {
      filterEnabled= true;
      filterNamespace=topic
    }

    requestAPI(
      {
        url : url,
        "Content-Type": "application/json; charset=utf8"
      }, function (error, restresponse, body) {
      console.log('error:'+ error); // Print the error if one occurred
      console.log('statusCode:'+ restresponse && restresponse.statusCode); // Print the response status code if a response was received
      var items=[];
      if(!error)
      {

        jsonobj = JSON.parse(body)
        var result = {}
        result.nodes = [];
        DIR = "/images/";
        EDGE_LENGTH_MAIN = 150;
        EDGE_LENGTH_SUB = 50;
        // Create a data table with links.


        result.edges = [];


        jsonobj.resources.forEach(element => {
          var nodeLabel = (element.annotations.label.length>25)?element.annotations.label.substring(0, 25):element.annotations.label
          if(nodeLabel=="_unknown_")
          {
            nodeLabel="MyClusterICP"
          }
          if(!element.id.includes("Image:"))
          {
            if( element.properties.metadata &&  (element.properties.metadata.namespace))
            {
              namespaceMap.set(element.properties.metadata.namespace,"true");
              if(filterEnabled )
              {
                if (element.properties.metadata.namespace==filterNamespace)
               {
                 result.nodes.push({id: element.id, label: nodeLabel,  shape: lookupShape(element.id), color:lookupColorCode(element.id)});
               }
              }
              else {
                result.nodes.push({id: element.id, label: nodeLabel,  shape: lookupShape(element.id), color:lookupColorCode(element.id)});
              }


            }
            else {
              if(!element.id.includes("Container:"))
              {
                result.nodes.push({id: element.id, label: nodeLabel,  shape: lookupShape(element.id), color:lookupColorCode(element.id)});
              }
           }


          }
          if(!filterEnabled && element.id.includes("Pod:") )
          {


            if(element.properties.spec.volumes)
            {
              element.properties.spec.volumes.forEach(volume => {
                if(volume.persistentVolumeClaim)
                {

                    result.nodes.push({id: "pvc:"+volume.persistentVolumeClaim.claimName, label: volume.persistentVolumeClaim.claimName,  shape: lookupShape("pvc:"+volume.persistentVolumeClaim.claimName), color:lookupColorCode("pvc:"+volume.persistentVolumeClaim.claimName)});
                    result.edges.push({from: "pvc:"+volume.persistentVolumeClaim.claimName, to: element.id, length: EDGE_LENGTH_SUB});

                 }
                });
              }
          }



        });

        jsonobj.relations.forEach(element => {
          if(!(element.source.includes("Image:")||element.target.includes("Image:")))
          {
            result.edges.push({from: element.source, to: element.target, length: EDGE_LENGTH_SUB});
          }
        });

        //Readfrom configMap
        console.log('Reading Static Content');
        fs.readFile('/etc/serverinfo-config/config.json', function(err, data) {
            console.log(data);

            jsonStaticobj = JSON.parse(data)
            jsonStaticobj.Servers.forEach(element => {
              console.log("Element:"+element);
              result.nodes.push({id: element.id, label: element.id,  shape: lookupShape(element.id), color:lookupColorCode(element.id)});
              element.relations.forEach(edgeelement => {
                result.edges.push({from: element.id, to: edgeelement.id, length: EDGE_LENGTH_SUB});

              });
            });
            jsonStaticobj.Applications.forEach(element => {
              console.log("Element:"+element);
              result.nodes.push({id: element.id, label: element.id,  shape: lookupShape(element.id), color:lookupColorCode(element.id)});
              element.relations.forEach(edgeelement => {
                result.edges.push({from: element.id, to: edgeelement.id, length: EDGE_LENGTH_SUB});

              });
            });

            result.namespaces = [];
            result.namespaces.push(filterNamespace);
            for (var key of namespaceMap.keys()) {
              console.log(key);
              result.namespaces.push(key)
            }
            response.json(result);
            console.log('ending response...');
            response.end();

        });

        // result.nodes.push({id: "Application:FintechApplication", label: "FintechApplication",  shape: lookupShape("Application:FintechApplication"), color:lookupColorCode("Application:FintechApplication")});
        // result.edges.push({from: "Application:FintechApplication", to: "Service:fintechsolution", length: EDGE_LENGTH_SUB});
        // result.edges.push({from: "Application:FintechApplication", to: "Service:aadharapi-service", length: EDGE_LENGTH_SUB});
        // result.edges.push({from: "Application:FintechApplication", to: "Service:aggregation-service", length: EDGE_LENGTH_SUB});
        //
        // result.nodes.push({id: "PhysicalServer:10.19.1.4", label: "Server-169.38.98.35",  shape: lookupShape("PhysicalServer:10.19.1.4"), color:lookupColorCode("PhysicalServer:10.19.1.4")});
        // result.edges.push({from: "PhysicalServer:10.19.1.4", to: "Node:169.38.98.35", length: EDGE_LENGTH_SUB});
        // result.edges.push({from: "PhysicalServer:10.19.1.4", to: "Node:169.38.98.41", length: EDGE_LENGTH_SUB});



      }

    });

});
function lookupShape (elementid)
{
  var key = elementid.split(":")[0];
  return myMap.get(key);
}
function lookupColorCode(elementid)
{
  var key = elementid.split(":")[0];
  return myColorMap.get(key);
}


http.createServer(app).listen(app.get('port'), '0.0.0.0', function() {
    console.log('Express server listening on port.............. ' + app.get('port'));
});
