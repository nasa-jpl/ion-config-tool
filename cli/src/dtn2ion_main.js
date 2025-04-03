//
//    dtn2ion.js
//
//  generate an ion model from a dtn network model
//
//  usage:  dtn2ion.js -m [netmodelfile]
//
//  inputs: net_model.json  (or alternative name)
//
//  outputs: net_model-ion.json,  [related to input name]
//           progress messages,
//           error messages
//
//  author: Rick Borgen
//

// module imports
const mm = require('minimist');
const fs = require('fs');
const df = require('date-fns');
const buf = require('buffer');

var debugFlag = false

// schema imports (global)
const configTypes = require('../../json/configTypes.json');
const cmdTypes    = require('../../json/cmdTypes.json');
const paramTypes  = require('../../json/paramTypes.json');
const selections  = require('../../json/selections.json');
const patterns    = require('../../json/patterns.json');
const ionVersions = require('../../json/ionVersions.json');

var uniqId = 0;       // counter used to make unique names

// ion model objects (global)
var ion = {};
var graphs = {};
var nodes = {};
var configs = {};
var commands = {};
var hosts = {};
var ipaddrs = {};
var clones = {}

console.log("Build ION Model from a DTN Network Model");

var argv = mm(process.argv.slice(2));
var long = argv.l;
if (long)
  console.log("long mode");
var fname = argv.m;
console.log("Model file: " + fname);  
var json;
try {
  json = JSON.parse(fs.readFileSync(fname,'utf8'));
} catch (err) {
  error("Cannot process file: " + fname);
  console.log("" + err);
  process.exit();
}
console.log("JSON parsing successful.");
console.log("---");
var net = {};
var netHosts = {};
var netNodes = {};
var netHops  = {};
var netAddrs = {};

///////////////////
// In netloader.js
[net,netHosts,netNodes,netHops,netAddrs] = extractModel(json);
///////////////////

console.log("---");
console.log("DTN Network Model summary:");
console.log("netHosts: " + Object.keys(netHosts));
console.log("netNodes: " + Object.keys(netNodes));
console.log("netHops: "  + Object.keys(netHops));
console.log("netAddrs: " + netAddrs);
console.log("---");
console.log("Checking user net model.");

///////////////////
// In checknet.js
var errors = checkNetModel(netHosts,netNodes,netHops);
//////////////////

if (errors.length) {
  console.log("Validation errors.");
  for (let i=0; i<errors.length; i++) {
    error(errors[i]);
  }
} else {
  console.log("Validation successful.");
}
console.log("---");
console.log("Building user ion model components.");

////////////////////
// In buildion.js
buildIonModel(net.name,net.desc,netHosts,netNodes,netHops);
////////////////////

console.log("ION Model summary:");
console.log("hosts: "  + Object.keys(hosts));
console.log("nodes: "  + Object.keys(nodes));
console.log("graphs: " + Object.keys(graphs));
console.log("config count:  " + Object.keys(configs).length);
console.log("ipaddr count:  " + Object.keys(ipaddrs).length);
console.log("command count: " + Object.keys(commands).length );
console.log("config files:  " + Object.keys(configs));

console.log("---");
console.log("Combining single ion model object.");
var modelObj = makeModelObj();

console.log("---");
const modelName = ion.name + ".json";
console.log("Writing json model to " + modelName);
saveModel(modelName,modelObj);

console.log("---");
console.log("Done.");


