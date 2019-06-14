// index.js

var REST_DATA = 'api/search';
var REST_GET_DOCUMENT = 'api/getDocument';
var KEY_ENTER = 13;
var defaultItems = [

];

var clusterIndex = 0;
var clusters = [];
var lastClusterZoomLevel = 0;
var clusterFactor = 0.9;


function loadItems() {
  showLoadingMessage();


    var selectedNamespace = document.getElementById("selectNameSpace").value;
    xhrGet(REST_DATA+"?topic="+selectedNamespace, function(result) {
        // create a network
        var container = document.getElementById('myImage');
        var data = {
          nodes: result.nodes,
          edges: result.edges
        };
        var options = {
          layout: {
              hierarchical: {
                  direction: "LR",
                  sortMethod: "directed",
                  levelSeparation: 300
              }
          },
            edges: {
                arrows: {
                    to: {
                        enabled: true
                    }
                },
                smooth: {
                    enabled: false,
                    type: 'continuous'
                }
            },
            physics: {
                adaptiveTimestep: true,
                barnesHut: {
                    gravitationalConstant: -8000,
                    springConstant: 0.04,
                    springLength: 95
                },
                stabilization: {
                    iterations: 987
                }
            },
            layout: {
                randomSeed: 191006,
                improvedLayout: false
            }
        };

        network = new vis.Network(container, data, options);
        var selectOption = document.getElementById("selectNameSpace");
        selectOption.innerHTML = "<option value='all'>All</option>";
        var selected = result.namespaces[0];
        var pos =0
        for (var value of result.namespaces) {
          if(pos>0)
          {
            var option = document.createElement("option");
            option.text = value;
            option.value = value;
            if(value==selected)
            {
              option.selected = true
            }
            selectOption.appendChild(option);
          }
          pos++;


        }
        stopLoadingMessage();

    }, function(err) {
        console.error(err);
    });

}
function showLoadingMessage() {
    document.getElementById('loadingImage').style.display = '';
    document.getElementById('loadingImage').innerHTML = "Loading data " + "<img height=\"100\" width=\"100\" src=\"images/loading.gif\"></img>";
}

function stopLoadingMessage() {
    document.getElementById('loadingImage').innerHTML = "";
}
