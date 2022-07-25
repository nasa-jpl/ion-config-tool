#!/usr/bin/env node
//
//    ionconfig.js
//
//  generate full set of ion config files based on ion model
//
//  usage:  ionconfig.js -m [ionmodelfile]
//
//  inputs: ion_model.json  (or alternative name)
//
//  outputs: ion_model directory,    (using model name)
//           ion_model/node1 subdir, (per node using node names from model)
//           ion_model/node1/node1.xxxrc,   (per node per config file)
//           ion_model/node1/start_node1.sh, (start script per node)
//           progress messages,
//           error messages
//
//  author: Rick Borgen
//

// module imports
const mm  = require('minimist');
const fs  = require('fs');
const df  = require('date-fns');
const buf = require('buffer');
const zip = require('jszip');

var debugFlag = false

// schema imports (global)
const configTypes = require('../../json/configTypes.json');
const cmdTypes    = require('../../json/cmdTypes.json');
const paramTypes  = require('../../json/paramTypes.json');
const selections  = require('../../json/selections.json');
const patterns    = require('../../json/patterns.json');
const versions    = require('../../json/ionVersions.json');

var uniqId = 0;       // counter used to make unique names

// ion model objects (global)
var ion = {};
var graphs = {};
var nodes = {};
var configs = {};
var commands = {};
var hosts = {};
var ipaddrs = {};
var cloneValues = {}

console.log("Build ION Configurations from an ION Model");

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

// complete initialization of policy objects
// assign cmdTypes list to each configType
for (var cmdType in cmdTypes) {
  let confType = cmdTypes[cmdType].configType;
  configTypes[confType].cmdTypes.push(cmdType);
}
// assign paramTypes list to each cmdType
for (var pType in paramTypes) {
  let cType = paramTypes[pType].cmdType;
  cmdTypes[cType].paramTypes.push(pType);
}

// build hosts, nodes, configs, etc. from model
extractIonModel(json);
console.log("---");
console.log("ION Model summary:");
console.log("hosts:   " + Object.keys(hosts));
console.log("nodes:   " + Object.keys(nodes));
console.log("configs: " + Object.keys(configs));
console.log("ipAddrs: " + ipaddrs);
console.log("---");
console.log("Checking user ion model.");
var errors = checkIonModel();
if (errors.length) {
  console.log("Validation errors.");
  for (let i=0; i<errors.length; i++) {
    error(errors[i]);
  }
} else {
  console.log("Validation successful.");
}
console.log("---");

console.log("ION Model summary:");
console.log("hosts: "  + Object.keys(hosts));
console.log("nodes: "  + Object.keys(nodes));
console.log("graphs: " + Object.keys(graphs));
console.log("config count:  " + Object.keys(configs).length);
console.log("ipaddr count:  " + Object.keys(ipaddrs).length);
console.log("command count: " + Object.keys(commands).length );
console.log("config files:  " + Object.keys(configs));

console.log("---");

console.log("Build and save all configurations.");
saveAllConfigs();

console.log("---");
console.log("Done.");

//----functions---
function warn(s) {
  console.log("Warning: "  + s);
}
function error(s) {
  console.log("Error: "  + s);
}
function debug(s) {
  if (debugFlag) 
    console.log("$$$ " + s);
}
