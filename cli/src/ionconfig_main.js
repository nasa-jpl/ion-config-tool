#!/usr/bin/env node
//
//    ionconfig.js
//
//  generate full set of ion config files based on ion model
//
//  usage:  ionconfig.js -m [ionmodelfile] [-w configfiles]
//
//  inputs: ion_model.json  (or alternative name)
//
//  options:
//           -w configfiles  configs files is a list of the config file types
//                           for which the watch flag should be set to enable
//                           watch characters in ION. Valid values are:
//                           all - set the watch in all config files that 
//                                 support it.
//                           bp - set the watch in all versions of bprc
//                           bssp - set the watch in bssprc
//                           cfdp - set the watch in cfdprc
//                           dtpc - set the watch in dtpcrc
//                           ltp - set the watch in ltprc
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

var DEBUG_MODE = false;  // No debug messages to the console is default.

var watchables = ["all", "cfdp", "ltp", "bp", "bssp", "dtpc"];
// watch flag initialization, passed in on command line

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


// process any requests to set watch flags
var wflags = {};
var w = argv.w 

if (w) {
  var wflags = w.split(" ");

  // exit on unrecognized watch flag, no guessing what user wants
  for (i = 0; i < wflags.length; i++) {
    if (!watchables.includes(wflags[i])) {
      console.log("Unrecognized watch flag request: " + wflags[i]);
      process.exit();
    }
  }

  // Set up the watch commands object for easy access later
  if (wflags.includes("all")) {
    wflags.cfdprc={"type":"cfdprc_watch_all","lastUpdate":"2000-01-01T00:00","parameters":[]};
    wflags.ltprc={"type":"ltprc_watch_all","lastUpdate":"2000-01-01T00:00","parameters":[]};
    wflags.bpv7rc={"type":"bpv7rc_watch_all","lastUpdate":"2000-01-01T00:00","parameters":[]};
    wflags.bpv6rc={"type":"bpv6rc_watch_all","lastUpdate":"2000-01-01T00:00","parameters":[]};
    wflags.bssprc={"type":"bssprc_watch_all","lastUpdate":"2000-01-01T00:00","parameters":[]};
    wflags.dtpcrc={"type":"dtpcrc_watch_all","lastUpdate":"2000-01-01T00:00","parameters":[]};
    wcfgs = ["cfdprc","ltprc","bpv6rc","bpv7rc","bssprc","dtprc"];
  } else {
    if (wflags.includes("cfdp")) {
      wflags.cfdprc={"type":"cfdprc_watch_all","lastUpdate":"2000-01-01T00:00","parameters":[]};
    }
    if (wflags.includes("ltp")) {
      wflags.ltprc={"type":"ltprc_watch_all","lastUpdate":"2000-01-01T00:00","parameters":[]};
    }
    if (wflags.includes("bp")) {
      wflags.bpv7rc={"type":"bpv7rc_watch_all","lastUpdate":"2000-01-01T00:00","parameters":[]};
      wflags.bpv6rc={"type":"bpv6rc_watch_all","lastUpdate":"2000-01-01T00:00","parameters":[]};
    }
    if (wflags.includes("bssp")) {
      wflags.bssprc={"type":"bssprc_watch_all","lastUpdate":"2000-01-01T00:00","parameters":[]};
    }
    if (wflags.includes("dtpc")) {
      wflags.dtpcrc={"type":"dtpcrc_watch_all","lastUpdate":"2000-01-01T00:00","parameters":[]};
    }
  }
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
