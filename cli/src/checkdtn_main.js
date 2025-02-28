//
//    checkdtn.js 
//
//  check the validity of syntax and content of a dtnmodel
//
//  usage:  checkdtn.js -m [netmodelfile]
//
//  inputs: net_model.json  (or alternative name)
//
//  outputs: progress messages,
//           error messages
//
//  author: Rick Borgen
//

const mm = require('minimist');
const fs = require('fs');
console.log("DTN Network Model Validation");

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
console.log("Object: " + JSON.stringify(json) );
console.log("---");
var netHosts = {};
var netNodes = {};
var netHops  = {};
var netAddrs = {};

////////////////////////
// In netloader.js
[netHosts,netNodes,netHops,netAddrs] = extractModel(json);
////////////////////////

console.log("---");
console.log("Ingestion summary:");
console.log("netHosts: " + Object.keys(netHosts));
console.log("netNodes: " + Object.keys(netNodes));
console.log("netHops: "  + Object.keys(netHops));
console.log("netAddrs: " + netAddrs);
console.log("---");
console.log("Checking user net model.");

///////////////////////
// In checknet.js
var errors = checkNetModel(netHosts,netNodes,netHops);
///////////////////////


if (errors.length) {
  console.log("Validation errors.");   
  for (let i=0; i<errors.length; i++) {
    error(errors[i]);
  }
} else {
  console.log("Validation successful.");   
}
console.log("Done.");

//----functions---
function warn(s) {
  console.log("Warning: "  + s);
}
function error(s) {
  console.log("Error: "  + s);
}

