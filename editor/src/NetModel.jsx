//        NetModel.jsx     NetModel React Component
//
//        Copyright (c) 2018, California Institute of Technology.
//        ALL RIGHTS RESERVED.  U.S. Government Sponsorship
//        acknowledged.
//                                                                   
//      Author: Rick Borgen, Jet Propulsion Laboratory         
//                                                               
import React from 'react';
import PropTypes from 'prop-types';
import {FormControl} from 'react-bootstrap';
import {Row,Col} from 'react-bootstrap';
import {Label,Button,ButtonToolbar} from 'react-bootstrap';
import {Panel} from 'react-bootstrap';
import {Glyphicon} from 'react-bootstrap';
import {saveAs} from "file-saver";
import {Alert} from 'react-bootstrap';

import cmdTypes     from './json/cmdTypes.json';
import paramTypes   from './json/paramTypes.json'
import ionVersions  from './json/ionVersions.json'

import NetHostList  from './NetHostList.jsx';
import NetNodeList  from './NetNodeList.jsx';
import NetHopList   from './NetHopList.jsx';

export default class NetModel  extends React.Component {

  constructor (props) {
    super(props);
    // props
    //  name
    console.log("NetModel ctor");
    this.state = {
      name: this.props.name,
      desc: this.props.desc,

      newNode: false,
      newNodeMsg: "",
      editMode: false,
      viewMode: false,
      expandMode: false,
      buildMode: true,
      newNodeId: "",

      errMsg: ""
    }
  }
  setError(msg) {
    console.log("**** setError:"+ msg);
    var newState = Object.assign({},this.state);
    newState.errMsg = msg;
    this.setState (newState);
  };
  makeModelObj() {
    console.log("makeNetModel name:" + this.state.name);

    const netHosts = this.props.netHosts;
    const netNodes = this.props.netNodes;
    const netHops = this.props.netHops;
    var model = {};    // user model built from current state

    model["netModelName"] = this.state.name;
    model["netModelDesc"] = this.state.desc;
    model["netHosts"] = {};
    model["netNodes"] = {};
    model["netHops"]  = {};

    for (var hostKey in netHosts) {
      const hostObj = netHosts[hostKey];
      var hostJson = {
        hostName: hostKey,
        hostDesc: hostObj.hostDesc,
        ipAddrs: hostObj.ipAddrs
      }
      model["netHosts"][hostKey] = hostJson;
    }
    for (var nodeKey in netNodes) {
      const nodeObj = netNodes[nodeKey];
      var nodeJson = {
        nodeName: nodeKey,
        nodeDesc: nodeObj.nodeDesc,
        nodeHost: nodeObj.nodeHost,
        nodeType: nodeObj.nodeType,
        endpointID: nodeObj.endpointID,
        services: nodeObj.services
      }
      model["netNodes"][nodeKey] = nodeJson;
    }
    for (var hopKey in netHops) {
      const hopObj = netHops[hopKey];
      var hopJson = {
        hopName: hopKey,
        hopDesc: hopObj.hopDesc,
        fromNode: hopObj.fromNode,
        fromIP: hopObj.fromIP,
        toNode: hopObj.toNode,
        toIP: hopObj.toIP,
        bpLayer: hopObj.bpLayer,
        ltpLayer: hopObj.ltpLayer,
        portNum: hopObj.portNum,
        maxRate: hopObj.maxRate,
        symmetric: hopObj.symmetric
      }
      model["netHops"][hopKey] = hopJson
    }
    return model;
  };
  // make list of errors in net model
  checkNetModel() {
    var errors = [];   // list of messages (strings)
    const netHosts = this.props.netHosts;
    const netNodes = this.props.netNodes;
    const netHops  = this.props.netHops;
    const isStandardProtocol = this.props.isStandardProtocol;

    // do some sanity checking on net model
    if (!netHosts)  // no host object?
      errors.push("The Net Model has no Host list.")
    if (!Object.keys(netHosts).length)   // no hosts?
      errors.push("The Net Model has no Hosts.");
    if (!netNodes)  // no node object?
      errors.push("The Net Model has no Node list.");
    if (!Object.keys(netNodes).length)   // no nodes?
      errors.push("The Net Model has no Nodes.");
    for (var nodeKey in netNodes) {
      var netNode = netNodes[nodeKey];
      var hostKey = netNode.nodeHost;
      console.log("**** hostKey =" + hostKey);
      var hostObj = netHosts[hostKey];
      if (!hostObj)
        errors.push("Invalid hostKey for node " + nodeKey + ".");
    }
    // sanity checking on each hop
    for (var hopKey in netHops) {
      var netHop = netHops[hopKey];
      var fromNode = netNodes[netHop.fromNode];
      if (!fromNode) 
        errors.push("Invalid From Node Name for Net Hop " + hopKey + ".");
      var toNode = netNodes[netHop.toNode];
      if (!toNode) 
        errors.push("Invalid To Node Name for Net Hop " + hopKey + ".");

      var toIP = netHop.toIP;
      var fromIP = netHop.fromIP;

      for (var netHostKey in netHosts) {
        var netHost = netHosts[netHostKey];
        if (netHostKey === fromNode.nodeHost) {
          if (!netHost.ipAddrs.includes(fromIP))
            errors.push("Invalid 'From IP Addr': " + fromIP + " for Net Hop " + hopKey + ".");
        }

        if (netHostKey === toNode.nodeHost) {
          if (!netHost.ipAddrs.includes(toIP))
            errors.push("Invalid 'To IP Addr': " + toIP + " for Net Hop " + hopKey + ".");
        }
      }


      if (!netHop.bpLayer)
        errors.push("Missing BP Layer Protocol CLA for Net Hop " + hopKey + ".");
      if (netHop.bpLayer && !isStandardProtocol(netHop.bpLayer)) 
        errors.push("Unrecognized BP Layer Protocol CLA for Net Hop: "+ hopKey +". Should be one of: tcp, stcp, udp, dccp or ltp.");
    }
    return errors;
  }
  // if net model is okay, proceed with build
  makeIonModel() {
    console.log("*******makeIonModel name:" + this.state.name);
    var ion = this.props.getIonModel();
    if (ion) {  // existing ion model?
      this.setError("Build stopped.  The ION Model " + ion.name + " already exists. Delete it to allow rebuild.");
      return null;
    }
    var errs = this.checkNetModel();
  
    if (errs.length) {
      console.log("*** net model errors:" + errs);
      this.setError("Build ION Model stopped. " + errs[0]);  // 1st error is enough
      return null;
    }
    this.buildIonModel();
    this.setError("");   // might be a rerun, so clear any prior errors
    return null;
  }
  // build ion model
  buildIonModel() {
    // translate the net model to a full ion model
    // using best-guess defaults

    // ion model objects
    var ion = {};
    var graphs = {};
    var nodes = {};
    var configs = {};
    var commands = {};
    var hosts = {};
    var ipaddrs = {};
    var clones = {};
    var myParams = paramTypes;

    // default values
    const ionName   = this.state.name + "-ion";
    const graphName = this.state.name + "-graph";
    const ionDesc   = "ION " + this.state.desc;
    const graphDesc = "ION " + this.state.desc + " Contacts";
    const graphConfig = graphName + ".cg";
    const nodeFeed  = "unix";
    var   nextNodeNum   = 1000;        // starting next nodeNum 
    // determine latest ion version
    var ionVer    = "4.0.0";
    var highKey   = 10;
    for (var verKey in ionVersions) {
      if (verKey > highKey) {
        ionVer = ionVersions[verKey].ionVersion;
        highKey = verKey;
      } 
    }

    const netHosts = this.props.netHosts;
    const netNodes = this.props.netNodes;
    const netHops  = this.props.netHops;

    const isStandardProtocol = this.props.isStandardProtocol;

    // build ion object
    ion["name"] = ionName;
    ion["desc"] = ionDesc;
    ion["nextNodeNum"] = nextNodeNum;    // to be updated, depending on node defs
    ion["currentContacts"] = graphName;
    var nodeNum = nextNodeNum;

    // build ion hosts
    for (var hostKey in netHosts) {
      let netHost = netHosts[hostKey];
      hosts[hostKey] = { 
        "id" : hostKey, 
        "name" : hostKey, 
        "desc" : netHost.hostDesc, 
        "linefeed" : nodeFeed,
        "ipAddrKeys" : []
      };
      let hostCmdKey = "host_" + hostKey;
      let hostClone = { "id": hostCmdKey, "typeKey": "host_hostkey", "values":[ hostKey ] };
      let cloneVal = this.props.makeCloneVal(hostKey,hostClone);
      clones[hostCmdKey] = cloneVal;

      // build ion ipaddrs
      if (netHost.hasOwnProperty("ipAddrs")) {
        console.log("****** netHost has ipAddrs!! " + hostKey);

        // If host has more than one IP addr, automatically add
        // 0.0.0.0 to IP address list in case a TCP induct 
        // needs to use it.
        if (netHost.ipAddrs.length > 1) {
          let addr = "0.0.0.0"
          let uniqid = this.props.getUniqId();
          let ipAddrKey = "ipAddr_" + uniqid;
          ipaddrs[ipAddrKey] = {
            "id" : ipAddrKey,
            "hostKey" : hostKey,
            "ipAddr" : addr
          };
          hosts[hostKey].ipAddrKeys.push(ipAddrKey);

          let ipClone = { "id": ipAddrKey, "typeKey": "host_ipaddr", "values":[ addr ] };
          cloneVal = this.props.makeCloneVal(hostKey,ipClone);
          clones[ipAddrKey] = cloneVal;
        }

        // Now add in the IP addresses each host has been configured with
        for (let i = 0; i < netHost.ipAddrs.length; i++) {
          let addr = netHost.ipAddrs[i];
          let uniqid = this.props.getUniqId();
          let ipAddrKey = "ipAddr_" + uniqid;
          ipaddrs[ipAddrKey] = {
            "id" : ipAddrKey,
            "hostKey" : hostKey,
            "ipAddr" : addr
          };
          hosts[hostKey].ipAddrKeys.push(ipAddrKey);

          let ipClone = { "id": ipAddrKey, "typeKey": "host_ipaddr", "values":[ addr ] };
          cloneVal = this.props.makeCloneVal(hostKey,ipClone);
          clones[ipAddrKey] = cloneVal;
        }
      }
      // add the possible DNS entry, if no addrs provided
      if (hosts[hostKey].ipAddrKeys.length === 0 && this.props.isGoodName(hostKey)) {
        let uniqid = this.props.getUniqId();
        let ipAddrKey = "ipAddr_" + uniqid;
        ipaddrs[ipAddrKey] = {
          "id" : ipAddrKey,
          "hostKey" : hostKey,
          "ipAddr" : hostKey
        };
        hosts[hostKey].ipAddrKeys.push(ipAddrKey);

        let ipClone = { "id": ipAddrKey, "typeKey": "host_ipaddr", "values":[ hostKey ] };
        cloneVal = this.props.makeCloneVal(hostKey,ipClone);
        clones[ipAddrKey] = cloneVal;
      }; // end of DNS addr block
    };   // end of netHost loop
    console.log("makeIonModel...  hosts:   " + JSON.stringify(hosts));
    console.log("makeIonModel...  ipaddrs: " + JSON.stringify(ipaddrs));
    console.log("makeIonModel...  clones:  " + JSON.stringify(clones));

    // build ion nodes first, to establish all ion node numbers
    for (var nodeKey in netNodes) {
      var protocols = [];  // init node protocols list
      let netNode = netNodes[nodeKey];
      nodeNum = nextNodeNum;   // default
      if (netNode.nodeType === 'ion' && netNode.endpointID !== '') {
        try {
          nodeNum = Number(netNode.endpointID);
        }
        catch (err) {
          nodeNum= nextNodeNum;
        }
      }
      if (nodeNum === nextNodeNum) {  // used nextNodeNum?
        nextNodeNum += 1;
      }
      if (nodeNum > nextNodeNum) {    // higher node num ceiling?
        nextNodeNum = nodeNum + 1;
      }
      nodes[nodeKey] = {
        "id" : nodeKey, 
        "longName" : netNode.nodeDesc, 
        "ionNodeNum" : nodeNum,
        "ionVersion" : ionVer,
        "hostKey" : netNode.nodeHost,
        "configKeys" : []
      };
      // build nodenum & nodekey clone value
      let numCmdKey = "nodeNum_" + nodeKey;
      let nodeClone = { "id": numCmdKey, "typeKey": "node_nodenum", "values":[ nodeNum.toString() ] };
      let cloneVal = this.props.makeCloneVal(nodeKey,nodeClone);
      clones[numCmdKey] = cloneVal;
    };
    ion["nextNodeNum"] = nextNodeNum;   // update based on node loading
    // now build configs and (static) commands per node
    // ...hop-based commands must be done later
    for (nodeKey in netNodes) {
      var netNode = netNodes[nodeKey];
      var ionNode = nodes[nodeKey];
      nodeNum = ionNode.ionNodeNum;
      // build ionconfig 
      var configName = nodeKey + ".ionconfig";
      configs[configName] = {
        "id" : configName,
        "nodeKey": nodeKey,
        "configType" : "ionconfig",
        "cmdKeys" : [] 
      };
      nodes[nodeKey].configKeys.push(configName);
      var ionconfig = configName;

      // The array of ionconfig variables to assume default values
      var ionconfig_parms = ["configFlags", "sdrWmSize", "heapWords", "wmSize"];
      var default_val = "";
      var vals = [];
      var cmdKey = "";
      var needCfdp = false;

      // Loop thru the list of ionconfig variables and build the variable names for default values
      for (i in ionconfig_parms) {

        // Variable string to evaluate
        let varstr = "myParams.ionconfig_"+ionconfig_parms[i]+"_p0.defaultValue;";

        // Grab the default value and place it in the vals array
        default_val = eval(varstr);
        vals = [default_val];

        // Make and add the ION command
        cmdKey = this.makeIonCommand(commands,clones,nodeKey,configName,"ionconfig",ionconfig_parms[i],vals);
        this.addCommandKey(configs,configName,cmdKey);
      }

      // build ionrc 
      configName = nodeKey + ".ionrc";
      configs[configName] = {
        "id" : configName,
        "nodeKey": nodeKey,
        "configType" : "ionrc",
        "cmdKeys" : [] 
      };
      nodes[nodeKey].configKeys.push(configName);
      // build ionrc initialize cmd
      vals = [nodeNum,ionconfig];
      cmdKey = this.makeIonCommand(commands,clones,nodeKey,configName,"ionrc","initialize",vals);
      this.addCommandKey(configs,configName,cmdKey);
      // build ionrc start cmd
      vals = [];
      cmdKey = this.makeIonCommand(commands,clones,nodeKey,configName,"ionrc","start",vals);
      this.addCommandKey(configs,configName,cmdKey);
      // build ipnrc 
      //configName = nodeKey + ".ipnrc";
      //  var ipnrc = configName;  (only needed if building a "r ipnadmin")
      //configs[configName] = {
      //  "id" : configName,
      //  "nodeKey": nodeKey,
      //  "configType" : "ipnrc",
      //  "cmdKeys" : [] 
      //};
      //nodes[nodeKey].configKeys.push(configName);

      // build of plan cmds happens later with hop analysis

      // build bpv7rc 
      configName = nodeKey + ".bpv7rc";
      configs[configName] = {
        "id" : configName,
        "nodeKey": nodeKey,
        "configType" : "bpv7rc",
        "cmdKeys" : [] 
      };
      nodes[nodeKey].configKeys.push(configName);
      // build bpv7rc initialize cmd
      vals = [];
      cmdKey = this.makeIonCommand(commands,clones,nodeKey,configName,"bpv7rc","initialize",vals);
      this.addCommandKey(configs,configName,cmdKey);
      // build bpv7rc scheme cmd
      vals = ["ipn","ipnfw","ipnadminep"];
      cmdKey = this.makeIonCommand(commands,clones,nodeKey,configName,"bpv7rc","scheme",vals);
      this.addCommandKey(configs,configName,cmdKey);
      // build bpv7rc "low" endpoint cmds  [0...6]
      let autoIDs = [];  //keep track of automatically created endpoint IDs
      for (var i=0; i<7; i++) {
        vals = [nodeNum,i,"x",""];
        cmdKey = this.makeIonCommand(commands,clones,nodeKey,configName,"bpv7rc","endpoint",vals);
        this.addCommandKey(configs,configName,cmdKey);

        //storing them as a string array for max flexibility, may need to support alphanumerics
        autoIDs.push(i.toString());
      }
      // provide endpoints per service
      const services = netNode.services;
      for (i=0; i<services.length; i++) {
        var aservice = services[i];
        if (aservice === 'cfdp') {   // CFDP: endpoints 64 & 65
          // Set the flag to indicate the need for a cfdprc file.
          needCfdp = true; 
          autoIDs.push("64","65");
          vals = [nodeNum,64,"x",""];
          cmdKey = this.makeIonCommand(commands,clones,nodeKey,configName,"bpv7rc","endpoint",vals);
          this.addCommandKey(configs,configName,cmdKey);
          vals = [nodeNum,65,"x",""];
          cmdKey = this.makeIonCommand(commands,clones,nodeKey,configName,"bpv7rc","endpoint",vals);
          this.addCommandKey(configs,configName,cmdKey);
        }
        if (aservice === 'ams') {   // AMS: endpoints 71 & 72
          autoIDs.push("71","72");
          vals = [nodeNum,71,"x",""];
          cmdKey = this.makeIonCommand(commands,clones,nodeKey,configName,"bpv7rc","endpoint",vals);
          this.addCommandKey(configs,configName,cmdKey);
          vals = [nodeNum,72,"x",""];
          cmdKey = this.makeIonCommand(commands,clones,nodeKey,configName,"bpv7rc","endpoint",vals);
          this.addCommandKey(configs,configName,cmdKey);
        }
        if (aservice === 'amp') {   // AMS: endpoints 101 & 102
          autoIDs.push("101","102");
          vals = [nodeNum,101,"x",""];
          cmdKey = this.makeIonCommand(commands,clones,nodeKey,configName,"bpv7rc","endpoint",vals);
          this.addCommandKey(configs,configName,cmdKey);
          vals = [nodeNum,102,"x",""];
          cmdKey = this.makeIonCommand(commands,clones,nodeKey,configName,"bpv7rc","endpoint",vals);
          this.addCommandKey(configs,configName,cmdKey);
        }
      }
      // check for user specified endpoint IDs, and create as necessary being careful to not create
      // endpoints for IDs that are the empty string
      if (!autoIDs.includes(netNode.endpointID) && netNode.endpointID !== "") {
        vals = [nodeNum,netNode.endpointID,"x",""];
        cmdKey = this.makeIonCommand(commands,clones,nodeKey,configName,"bpv7rc","endpoint",vals);
        this.addCommandKey(configs, configName, cmdKey);
      }
      // build protocol list for the node
      for (var hKey in netHops) {
        var netHop = netHops[hKey];
        if(nodeKey === netHop.toNode || nodeKey === netHop.fromNode)
          if(!protocols.includes(netHop.bpLayer))
            protocols.push(netHop.bpLayer);
      }
      console.log("protocols: " + JSON.stringify(protocols));
       // build protocol cmds
      for (let i=0; i<protocols.length; i++) {
        var prot = protocols[i];
        vals = [prot,""];
        cmdKey = this.makeIonCommand(commands,clones,nodeKey,configName,"bpv7rc","protocol",vals);
        this.addCommandKey(configs,configName,cmdKey);
      }
      // build of induct cmds happens later with hop analysis

      // build of outduct cmds happens later with hop analysis

      // build bpv7rc run ipnadmin cmd  (NOTE: not needed since included in our start script)
      // var cmd = "ipnadmin " + ipnrc;
      // vals = [cmd];
      // cmdKey = this.makeIonCommand(commands,clones,configName,"bpv7rc","run",vals);
      // configs[configName].cmdKeys.push(cmdKey);

      // build ltprc (if needed)
      var needLtp = protocols.includes("ltp");
      if (needLtp) {
        configName = nodeKey + ".ltprc";
        configs[configName] = {
          "id" : configName,
          "nodeKey": nodeKey,
          "configType" : "ltprc",
          "cmdKeys" : [] 
        };
        nodes[nodeKey].configKeys.push(configName);

        // build ltprc initialize cmd
        vals = [100];
        cmdKey = this.makeIonCommand(commands,clones,nodeKey,configName,"ltprc","initialize",vals);
        this.addCommandKey(configs,configName,cmdKey);

        // build of span cmds happens later with hop analysis

        // build of start link cmds happens later with hop analysis

      };  //end of needLtp loop
      // build ionsecrc (now required to be present by ION)
      configName = nodeKey + ".ionsecrc";
      configs[configName] = {
        "id" : configName,
        "nodeKey": nodeKey,
        "configType" : "ionsecrc",
        "cmdKeys" : []
      };
      nodes[nodeKey].configKeys.push(configName);
      // build ionsecrc initialize command
      vals = [];
      cmdKey = this.makeIonCommand(commands,clones,nodeKey,configName,"ionsecrc","initialize",vals);
      this.addCommandKey(configs,configName,cmdKey);

      //build cfdprc, if necessary
      if (needCfdp) {
        configName = nodeKey + ".cfdprc";
        configs[configName] = {
          "id" : configName,
          "nodeKey" : nodeKey,
          "configType" : "cfdprc",
          "cmdKeys" : []
        };

        nodes[nodeKey].configKeys.push(configName);
        // build cfdprc initialize command
        vals = [];
        cmdKey = this.makeIonCommand(commands,clones,nodeKey,configName,"cfdprc","initialize",vals);
        this.addCommandKey(configs,configName,cmdKey);

        // build cfdprc start bputa command
        vals = [];
        cmdKey = this.makeIonCommand(commands,clones,nodeKey,configName,"cfdprc","start_bputa",vals);
        this.addCommandKey(configs,configName,cmdKey); 
      };

    };  // end of nodes loop

    // Initialize an array by host key to keep track
    // of the number of TCP (or STCP) connections
    // per host.
    let tcpConnCount = [];
    for (hostKey in hosts) {
      tcpConnCount[hostKey] = 0;
    };

    // build hop-related commands in two passes
    // ...this is necessary to ensure the inducts are all defined first 
    // ...so that outducts can be connected properly in 2nd pass

    // build a set of one-way hops for convenience
    var oneWays = {};
    for (hKey in netHops) {
      netHop = netHops[hKey];
      netHop.tcpConnCount = 0;

      // See if we have a TCP or STCP connection and bump
      // the count for that host
      if (netHop.bpLayer === "tcp" || netHop.bpLayer === "stcp") {
        tcpConnCount[nodes[netHop.toNode].hostKey]++;
      }

      oneWays[hKey] = Object.assign({},netHop);
      if (netHop.symmetric) {  // symmetric implies a reverse hop also
        // append -2 to key to indicate reverse hop
        var newKey = hKey + "-2";
        oneWays[newKey] = Object.assign({},netHop);
        var newWay = oneWays[newKey];
        newWay.id = newKey;
        // switch from --> to and to --> from for reverse hop
        newWay.fromNode = netHop.toNode;
        newWay.fromIP = netHop.toIP;
        newWay.toNode = netHop.fromNode;
        newWay.toIP = netHop.fromIP;

        // May need to bump the connection counter for TCP or
        // STCP hops
        if (netHop.bpLayer === "tcp" || netHop.bpLayer === "stcp") {
          tcpConnCount[nodes[newWay.toNode].hostKey]++;
        }
      }
    };
    for (hKey in oneWays )
       console.log("oneWay hop: " + JSON.stringify(oneWays[hKey]) );

    // pass 1 - build inducts
    console.log("@@@@@ building inducts and links!");
    var inductKeys = {};     // record inducts to avoid duplicate inducts per protocol
    var startUdpKeys = {};   // hold ltp start udp commands for later (follows spans) per config
    var startDccpKeys = {};  // hold ltp start dccp commands for later (follows spans) per config 
    for (hKey in oneWays) {
      netHop = oneWays[hKey];
      console.log("processing hop: " + JSON.stringify(netHop));
      var toNode = nodes[netHop.toNode];
      nodeKey = toNode.id;
      var bpLayer = netHop.bpLayer;
      var cli = bpLayer + "cli";
      var toNodeNum = toNode.ionNodeNum;
      var toHostKey = toNode.hostKey;
      var toAddr = netHop.toIP;

      var rate = netHop.maxRate;
      var induct = "induct_" + bpLayer;
      if (bpLayer === "ltp" ||
          bpLayer === "bssp") {
        vals = [toNodeNum,cli]
      } else 
      if (isStandardProtocol(bpLayer)) {  // the other protocols are port-based
        // Special case for net hosts that have more than one TCP (or STCP)
        // connection AND the hop BP Layer is over one of those protocols
        if (tcpConnCount[toHostKey] > 1 && (bpLayer === "tcp" ||
                                            bpLayer === "stcp")) {
          toAddr = "0.0.0.0"
        } 
        var ports = this.getHostPorts(toHostKey,hosts,ipaddrs,commands);

        // If the user has specified a port number, use it. Otherwise, default
        var nextPort = netHop.portNum === "" ? 4556 : netHop.portNum;
        while (ports.includes(nextPort))
          nextPort++;
        vals = [toAddr,nextPort,cli];
      } else {   // non-standard protocol
        induct = "induct_any";
        vals = [bpLayer, "", cli];
      }
      configName = nodeKey + ".bpv7rc";
      var inKey = configName + bpLayer;

      if(!inductKeys.hasOwnProperty(inKey)) {
        cmdKey = this.makeIonCommand(commands,clones,nodeKey,configName,"bpv7rc",induct,vals);
        this.addCommandKey(configs,configName,cmdKey);
        inductKeys[inKey] = cmdKey;   // actual value not important, just know one exists.
      }
      // build ltp links as necessary
      if (bpLayer === "ltp") {    // link candidate?
        configName = nodeKey + ".ltprc";
        toHostKey = toNode.hostKey;
        // if port not specified, use default
        if (netHop.portNum === undefined || netHop.portNum === "") {
          ports = this.getHostPorts(toHostKey,hosts,ipaddrs,commands);

          // If the user has specified a port number, use it. Otherwise, default
          nextPort =  netHop.portNum === "" ? 1113 : netHop.portNum;
          while (ports.includes(nextPort))
            nextPort++;
          netHop.portNum = nextPort;
        };

        var linkName  = toHostKey + ":" + netHop.portNum;
        if (netHop.ltpLayer === "udp") {
          if (startUdpKeys.hasOwnProperty(configName) ) {  // already have start udp?
            continue;                                      // one is the limit
          }
          vals = [toAddr,netHop.portNum];
          cmdKey = this.makeIonCommand(commands,clones,nodeKey,configName,"ltprc","start_udp",vals);
          startUdpKeys[configName] = cmdKey;
        };
        if (netHop.ltpLayer === "dccp") {
          if (startDccpKeys.hasOwnProperty(configName) ) {  // already have start dccp?
            continue;                                        // one is the limit
          }
          vals = [toAddr,netHop.portNum];
          cmdKey = this.makeIonCommand(commands,clones,nodeKey,configName,"ltprc","start_dccp",vals);
          startDccpKeys[configName] = cmdKey;
        };
      };
    };
    console.log("$$$$$ startUdpKeys: " + JSON.stringify(startUdpKeys) );
    // pass 2 - build outducts
    // var toNode;
    console.log("@@@@@ building outducts and spans!");
    for (hKey in oneWays) {
      netHop = oneWays[hKey];
      console.log("processing hop: " + JSON.stringify(netHop));
      var fromNode = nodes[netHop.fromNode];
      nodeKey = fromNode.id;
      toNode = nodes[netHop.toNode];
      toAddr = netHop.toIP;
      var portNum = netHop.portNum;
      rate = netHop.maxRate;
      bpLayer = netHop.bpLayer;
      var outduct = "outduct_" + bpLayer;
      var clo = bpLayer + "clo";
      if (bpLayer === "ltp" ||
          bpLayer === "bssp") {
        toNodeNum = toNode.ionNodeNum;
        vals = [toNodeNum,clo,""]
      //} else if (bpLayer === "udp") {   //old udp promiscuous mode
      //  vals = ["udpclo",""]
      } else 
      if (isStandardProtocol(bpLayer)) {   // assume valid toAddr and portNum
        var outductName = toAddr + ":" + portNum;

        //Bit of a hack -- if the BP layer is TCP, no tcpclo in command
        //since it's been deprecated in ION versions 4 and up
        if (bpLayer === "tcp") {
          vals = [outductName,"''",""];
        } else {
          vals = [outductName,clo,""];
        }
      } else {                       // won't know the induct name here
        outduct = "outduct_any";     // use general format
        vals = [bpLayer,"",clo,""];
      };
      configName = nodeKey + ".bpv7rc";
      cmdKey = this.makeIonCommand(commands,clones,nodeKey,configName,"bpv7rc",outduct,vals);
      this.addCommandKey(configs,configName,cmdKey);
      //configs[configName].cmdKeys.push(cmdKey);
      // build ltp spans as necessary
      if (bpLayer === "ltp") {    // link candidate?
        configName = nodeKey + ".ltprc";
        toHostKey = toNode.hostKey;
        var cloneVal = this.getNodeLink(clones,toNode.id,netHop.ltpLayer);
        console.log ("???? cloneVal: " + JSON.stringify(cloneVal));
        linkName = cloneVal.value;
        if (netHop.ltpLayer === "udp") {
          vals = [toNodeNum,100,100,1482,100000,1,linkName,1]
          cmdKey = this.makeIonCommand(commands,clones,nodeKey,configName,"ltprc","span_udp",vals);
          this.addCommandKey(configs,configName,cmdKey);
        };
        if (netHop.ltpLayer === "dccp") {
          vals = [toNodeNum,100,100,64000,100000,1,linkName,1]
          cmdKey = this.makeIonCommand(commands,clones,nodeKey,configName,"ltprc","span_dccp",vals);
          this.addCommandKey(configs,configName,cmdKey);
        };
      };
    };
    // HACK Alert!  -- only now add the start commands, so span not ignored by ION
    //              -- see pass 1 for build of start commands
    for (configName in startUdpKeys)
      this.addCommandKey(configs,configName,startUdpKeys[configName]);
    for (configName in startDccpKeys)
      this.addCommandKey(configs,configName,startDccpKeys[configName]);

    // pass 3 - build plan cmds
    for (hKey in oneWays) {
      netHop = oneWays[hKey];
      console.log("processing hop: " + JSON.stringify(netHop));
      fromNode = nodes[netHop.fromNode];
      nodeKey = fromNode.id;
      toNode = nodes[netHop.toNode]
      toNodeNum = toNode.ionNodeNum;
      //toHostKey = toNode.hostKey;
      toAddr = netHop.toIP;
      rate = netHop.maxRate;
      bpLayer = netHop.bpLayer;

      configName = nodeKey + ".bpv7rc";
      var planvals = [toNodeNum,rate];      
      cmdKey = this.makeIonCommand(commands,clones,nodeKey,configName,"bpv7rc","ion_plan",planvals);
      this.addCommandKey(configs,configName,cmdKey);

      // determine outduct name
      var outductName = '';  
      if (bpLayer === "ltp" ||
          bpLayer === "bssp") {
        outductName = toNodeNum;
      } else 
      if (bpLayer === "udp") {   //udp depends on induct
        cloneVal = this.getNodeInduct(clones,toNode.id,bpLayer);
        outductName = cloneVal.value;
      } else 
      if (isStandardProtocol(bpLayer)) {
        cloneVal = this.getNodeOutduct(clones,nodeKey,toAddr,bpLayer);
        //console.log ("???? cloneVal: " + JSON.stringify(cloneVal));
        outductName = cloneVal.value;
      };
      // build attach outduct command
      var vals = [toNodeNum,outductName];
      var attach = "attach_outduct_" + bpLayer;
      cmdKey = this.makeIonCommand(commands,clones,nodeKey,configName,"bpv7rc",attach,vals);
      this.addCommandKey(configs,configName,cmdKey);
    };

    // build bpv7rc start cmd, now that the duct cmds are done
    for (nodeKey in netNodes) {
      vals = [];
      configName = nodeKey + ".bpv7rc";
      cmdKey = this.makeIonCommand(commands,clones,nodeKey,configName,"bpv7rc","start",vals);
      this.addCommandKey(configs,configName,cmdKey);
    };
    console.log("makeIonModel...  nodes:   " + JSON.stringify(nodes));
    console.log("makeIonModel...  clones:  " + JSON.stringify(clones));

    // build ion contact graph
    graphs[graphName] = { 
      "id"   : graphName, 
      "name" : graphName, 
      "desc" : graphDesc,
      "ionVersion" :ionVer,
      "configKey" : graphConfig
    };
    configs[graphConfig] = {
      "id" : graphConfig,
      "nodeKey": graphName,
      "configType" : "contacts",
      "cmdKeys" : [] 
    };
    // build range and contact cmds
    var maxSecs = 50000000;
    var ranges = {};
    for (hKey in oneWays) {
      netHop = oneWays[hKey];
      rate = netHop.maxRate;
      fromNode = nodes[netHop.fromNode];
      var fromNodeNum = fromNode.ionNodeNum;
      toNode = nodes[netHop.toNode];
      toNodeNum = toNode.ionNodeNum;

      // range cmd   - build one per link...avoid implicit range for possible reverse link
      vals = [0,maxSecs,fromNodeNum,toNodeNum,1];
      cmdKey = this.makeIonCommand(commands,clones,graphName,configName,"contacts","range_rel_rel_time",vals);
      ranges[hKey] = cmdKey;   // save for later to group range commands
      // contact cmd
      vals = [0,maxSecs,fromNodeNum,toNodeNum,rate,1.0];
      cmdKey = this.makeIonCommand(commands,clones,graphName,configName,"contacts","contact_rel_rel_time",vals);
      this.addCommandKey(configs,graphConfig,cmdKey);
    };
    // add range cmds as a group
    for (hKey in ranges) {
      cmdKey = ranges[hKey];
      this.addCommandKey(configs,graphConfig,cmdKey);
    };
    this.assignClones(commands,clones);   //  map cloneVal to using clones (command params)

    var tran = {
      action: "LOAD-ION-MODEL",
      ionModel: ion,
      hosts: hosts,
      ipaddrs:ipaddrs,
      nodes: nodes,
      graphs: graphs,
      configs: configs,
      commands: commands,
      cloneValues: clones
    };
    this.props.dispatch(tran);

    var newState = Object.assign({},this.state);
    newState.buildMode = false;  // just build once 
    this.setState (newState);
    return null;
  };
  // add commmand to a configuration, unless its null
  addCommandKey(configs,configName,cmdKey) {
    if (cmdKey == null) {
      console.log("addCommandKey discarded for configFile: " + configName);
      return;
    }
    configs[configName].cmdKeys.push(cmdKey);
  }
  // build an ion command object
  makeIonCommand(commands,clones,groupKey,configKey,configType,cmdName,values) {
    // NOTE: the default behavior is to use the latest version of each command type
    // By convention, the latest command is simply the configType + cmdName
    // Prior command versions have _vxx suffix showing the last version supported
    let cmdTypeKey = configType + "_" + cmdName;
    let uniqid = this.props.getUniqId();
    let cmdKey = "cmd_" + uniqid;
    let cmdType = cmdTypes[cmdTypeKey];
    console.log("makeIonCommand ... configType: " + configType + 
                " groupKey: " + groupKey + " cmdName: " + cmdName +
                " cmdKey: " + cmdKey + " values: " + values);
    if (cmdType === null)
      return null;
    // check for duplicate command & exit if dup exists
    for (var cKey in commands) {
      let cmd = commands[cKey];
      if (cmd.configKey === configKey) {     // matching config file?
        if (cmd.typeKey === cmdTypeKey) {    // matching command type
          var match = true;
          for (let i = 0; i < cmd.values.length; i++) {
            if (cmd.values[i] !== values[i])
              match = false;
          }
          if (match) {
            console.log("$$$$$$$ makeIonCommand duplicate command: " + JSON.stringify(cmd));
            return null;
          }
        } // end cmdTypeKey check
      }   // end configKey check
    }     // end commands loop
    let now = new Date();
    let tranTime = now.format("YYYY-MM-DDThh:mm");
    commands[cmdKey] = {
      "id" : cmdKey,
      "configKey" : configKey,
      "typeKey" : cmdTypeKey,
      "typeName" : cmdType.name,
      "order" : cmdType.order,
      "lastUpdate" : tranTime,
      "values" : values
    };
    if (cmdType.isCloned) {
      var cloneVal = this.props.makeCloneVal(groupKey,commands[cmdKey]);
      var cvKey = cloneVal.id;
      clones[cvKey] = cloneVal;
    } 
    return cmdKey;
  };
  // build clone list for each new cloneVal  (a duplicate of the ionModelLoader function)
  assignClones(commands,cloneValues) {
    const findCloneVal = this.props.findCloneVal;

    // identify commands dependent on cloneValues
    // and push them on to the cloneValue list for update notifications
    console.log("=== Identify clones using cloneValues from the network model.");
    for (var cmdKey in commands) {
      let cmd = commands[cmdKey];
      let cmdTypeKey = cmd.typeKey;
      console.log("$$$ cmdKey: " + cmdKey + " has type: " + cmdTypeKey);
      let cmdType = cmdTypes[cmd.typeKey];
      if(cmdType.copyClone  || cmdType.pickClone) {
        for (let i = 0; i < cmdType.paramTypes.length; i++) {
           let paramTypeKey = cmdType.paramTypes[i];
           let paramType = paramTypes[paramTypeKey];
           console.log("$$$ consider paramType " + paramType.id + " for cloning.")
           if (paramType.copyClone || paramType.pickClone) { 
              let val = cmd.values[i];
              let type = paramType.valType;
              console.log("$$$ seeking clone value for type: " + type + " with value of " + val);
              let cloneVal = findCloneVal(cloneValues,type,val);
              if(cloneVal) {
                console.log("=== building clone.");
                let clone = { "cmdKey" : cmdKey, "valIdx" : i };
                console.log ("$$$ created clone key: " + JSON.stringify(clone));
                cloneVal.clones.push(clone);
              }
           }
        }
      }
    }
  };
  // get assigned ports of a host
  getHostPorts (hostKey, hosts, ipaddrs, commands) {
    var ports = [];
    const hostObj = hosts[hostKey];
    const ipAddrs = hostObj.ipAddrKeys;
    for (var i=0; i<ipAddrs.length; i++) {
      var ipAddrKey = ipAddrs[i];
      var ipAddr = ipaddrs[ipAddrKey].ipAddr;
      for (var cmdKey in commands) {
        var cmdObj = commands[cmdKey];        
        if  ( (cmdObj.typeKey.indexOf("induct") >= 0
           && cmdObj.typeKey.indexOf("ltp") < 0 ) 
          || (cmdObj.typeKey.indexOf("start_udp") >= 0) 
          || (cmdObj.typeKey.indexOf("start_dccp") >= 0) ) {
          //console.log( "#### ipAddr: " +ipAddr + "  val[0]: " + cmdObj.values[0]);
          if ( cmdObj.values[0] === ipAddr)    // correct ipAddr?
            ports.push(cmdObj.values[1]);
        }
      }
    }
    console.log("host: " + hostKey + " ports: " + ports.toString() );
    return ports;
  };
  // find an Induct cloneValue based on nodeKey & type (bpLayer)
  getNodeInduct(cloneVals,nodeKey,bpLayer) {
    var cloneType = bpLayer + "Induct";
    for (var key in cloneVals) {
      let cloneVal = cloneVals[key];
      //console.log("$$$ checking cloneVal: " + JSON.stringify(cloneVal));
      if (cloneVal.type=== cloneType && cloneVal.nodeKey === nodeKey) {
        return cloneVal;
      }
    }
    console.log ("!!! failed to get cloneVal for nodeKey: " + nodeKey + " cloneType: " + cloneType);
    return "";
  };
  // find a Link cloneValue based on nodeKey & type (ltpLayer)
  getNodeLink(cloneVals,nodeKey,ltpLayer) {
    var cloneType = ltpLayer + "Link";
    for (var key in cloneVals) {
      let cloneVal = cloneVals[key];
      //console.log("$$$ checking cloneVal: " + JSON.stringify(cloneVal));
      if (cloneVal.type=== cloneType && cloneVal.nodeKey === nodeKey) {
        return cloneVal;
      }
    }
    console.log ("!!! failed to get cloneVal for nodeKey: " + nodeKey + " cloneType: " + cloneType);
    return "";
  };
  // find an Outduct cloneValue based on nodeKey & toHostKey & type (bpLayer)
  getNodeOutduct(cloneVals,nodeKey,toAddr,bpLayer) {
    var cloneType = bpLayer + "Outduct";
    console.log ("!!! seeking cloneVal for nodeKey: " + nodeKey 
                 + " toAddr: " + toAddr + " cloneType: " + cloneType) ;
    for (var key in cloneVals) {
      let cloneVal = cloneVals[key];
      //console.log("$$$ checking cloneVal: " + JSON.stringify(cloneVal));
      if (cloneVal.type === cloneType && cloneVal.nodeKey === nodeKey) {
        if (cloneVal.value.indexOf(toAddr) >= 0)
          return cloneVal;
      }
    }
    console.log ("!!! failed to get cloneVal for nodeKey: " + nodeKey 
                 + " toAddr: " + toAddr + " cloneType: " + cloneType) ;
    return "";
  };
  getDefaultIPforNode(netNode) {
    const netNodes = this.props.netNodes;
    const netHosts = this.props.netHosts;
    if (netNode === "")
      return "";

    var netHostIPs = netHosts[netNode].ipAddrs;

    return netHostIPs[0];
  };
  makeNetHostOptions() {
    const netHosts = this.props.netHosts;
    console.log("makeNetHostOptions " + JSON.stringify(netHosts));
    let vals = [];
    let noneVal = {"value" : '??', "label" : 'None selected'};
    vals.push(noneVal);

    for (var hostKey in netHosts) {
      let value = hostKey;
      let label = netHosts[hostKey].hostDesc;
      vals.push({"value":  value, "label": label });
    }
    console.log(JSON.stringify(vals))
    var optionItems = this.props.mapOptionElems(vals);
    return optionItems;
  };
  makeNetNodeOptions() {
    const netNodes = this.props.netNodes;
    console.log("makeNetNodeOptions " + JSON.stringify(netNodes));
    let vals = [];
    let noneVal = {"value" : '??', "label" : 'None selected'};
    vals.push(noneVal);

    for (var nodeKey in netNodes) {
      let value = nodeKey;
      let label = netNodes[nodeKey].nodeDesc;
      vals.push({"value":  value, "label": label });
    }
    console.log(JSON.stringify(vals))
    var optionItems = this.props.mapOptionElems(vals);
    return optionItems;
  };
  makeNetIPOptions(netNode) {
    const netNodes = this.props.netNodes;
    const netHosts = this.props.netHosts;
    let vals = [];
    let noneVal = {"value" : '??', "label" : 'None selected'};
    vals.push(noneVal);

    // If node not yet selected, nothing to build
    if (netNode !== "") {
      var netNodeHost = netNodes[netNode].nodeHost;
      var netHostIPs = netHosts[netNodeHost].ipAddrs;

      for (var idx in netHostIPs) {
        let value = netHostIPs[idx];
        let label = netNode;
        vals.push({"value": value, "label": label});
      }
    }
    var optionItems = this.props.mapOptionElems(vals);
    return optionItems;
  };
  makeAlertElem(msg) {
    return (<Alert bsStyle="danger"><b>ERROR: {msg}</b></Alert>);
  };
  makeHeadElem(cols) {
    var colElems = cols.map(
      (name,idx) => { return (<th key={idx}>{name}</th>); }
    );
    var headElem = <thead key="head"><tr>{colElems}</tr></thead>;
    return headElem;
  };
  makeRowElem(rowKey,data) {
    var dataElems = data.map(
      (name,idx) => { return (<td key={idx}>{name}</td>); }
    );
    var rowElem = <tr key={rowKey}>{dataElems}</tr>;
    return rowElem;
  };
  makeNetHostListElem(name) {
    console.log("makeNetHostListElem");
    const netHosts = this.props.netHosts;
    const netAddrs = this.props.netAddrs;
    const isGoodName = this.props.isGoodName;
    const isGoodNetHostKey = this.props.isGoodNetHostKey;
    const isValidIPAddr = this.props.isValidIPAddr;
    const dispatch = this.props.dispatch;      // make sure dispatch remembers "this"

    return (
      <NetHostList
        key="nethosts"                 // unique id
        name={name}                    // user model - defaults to model name
        netHosts={netHosts}            // list of Net Hosts
        netAddrs={netAddrs}            // list of Net IP Addrs

        isGoodName={isGoodName}              // verify name string is valid
        isGoodNetHostKey={isGoodNetHostKey}  // verify hostKey not in use
        isValidIPAddr={isValidIPAddr}        // verify IP address is valid
        dispatch={dispatch}                  // dispatch func for new hosts
      />
    );
  };
  makeNetNodeListElem(name) {
    console.log("makeNetNodeListElem");
    const netNodes = this.props.netNodes;
    const isGoodName = this.props.isGoodName;
    const isGoodNetNodeKey = this.props.isGoodNetNodeKey;
    const makeOptions = this.props.makeTypeOptions;
    const makeOptElems = this.props.makeOptionElems;
    const makeNetHostOptions = this.makeNetHostOptions.bind(this);
    const dispatch = this.props.dispatch;      // make sure dispatch remembers "this"

    return (
      <NetNodeList
        key="netnodes"                 // unique id
        name={name}                    // user model - defaults to model name
        netNodes={netNodes}            // list of Net Nodes

        isGoodName={isGoodName}                   // verify name string is valid
        isGoodNetNodeKey={isGoodNetNodeKey}       // verify hostKey not in use
        makeTypeOptions={makeOptions} 
        makeOptionElems={makeOptElems}
        makeNetHostOptions = {makeNetHostOptions} // mak otpions list of host keys
        dispatch={dispatch}                       // dispatch func for new nodes
      />
    );
  };
  makeNetHopListElem(name) {
    console.log("makeNetHopListElem");
    const netHops = this.props.netHops;
    const isGoodName = this.props.isGoodName;
    const isGoodNetHopKey = this.props.isGoodNetHopKey;
    const makeOptions = this.props.makeTypeOptions;
    const makeOptElems = this.props.makeOptionElems;
    const makeNetNodeOptions = this.makeNetNodeOptions.bind(this);
    const makeNetIPOptions = this.makeNetIPOptions.bind(this);
    const getDefaultIPforNode = this.getDefaultIPforNode.bind(this);

    const dispatch = this.props.dispatch;      // make sure dispatch remembers "this"

    return (
      <NetHopList
        key="nethops"                  // unique id
        name={name}                    // user model - defaults to model name
        netHops={netHops}              // list of Net Hops

        isGoodName={isGoodName}              // verify name string is valid
        isGoodNetHopKey={isGoodNetHopKey}    // verify hostKey not in use
        makeTypeOptions={makeOptions} 
        makeOptionElems={makeOptElems}
        makeNetNodeOptions = {makeNetNodeOptions} // make options list of node keys
        makeNetIPOptions= {makeNetIPOptions}      // make options list of IP addresses
        getDefaultIPforNode= {getDefaultIPforNode} // return first IP address for net node 
        dispatch={dispatch}                       // dispatch func for new hosts
      />
    );
  };
  makeNetEditor() {
    //console.log(">>makeModelElems " + JSON.stringify(this.state));
    var modelElems = [];
    const icon = 'remove';
    const head  = 
      <Row key="head">
        <Col sm={4}><Label bsSize="lg" bsStyle="default">Net Model Editor</Label></Col>
        <Col sm={1}><Button bsSize="sm" bsStyle="success"  onClick={this.noedit}><Glyphicon glyph={icon} /></Button></Col>
      </Row>;
    modelElems.push(head);
    const nameElem = this.makeModelElem("name","text",this.state.name,"Net Model Name",1,false,"");
    modelElems.push(nameElem);
    const descElem = this.makeModelElem("desc","text",this.state.desc,"Description",2,false,"");
    modelElems.push(descElem);

    return (
      <div>
        {modelElems}
      </div>
    );
  };
  makeNetViewer() {
    //console.log(">>makeModelElems " + JSON.stringify(this.state));
    var modelElems = [];
    const head  = <Row key="head"><Col sm={2}> <Label bsSize="lg" bsStyle="default">Network Model Viewer</Label></Col></Row>;
    modelElems.push(head);
    const nameElem = this.makeModelElem("name","text",this.state.name,"Network Model Name",1,true,"");
    modelElems.push(nameElem);
    const descElem = this.makeModelElem("desc","text",this.state.desc,"Description",2,true,"");
    modelElems.push(descElem);

    return (
      <div>
        {modelElems}
      </div>
    );
  };
  makeModelElem(prop,type,val,label,size,read,note) {
    //console.log(">>MakeModelElem " + prop + ' ' + type + ' ' + val + ' ' + size);
    const form =
        <FormControl readOnly={read} bsSize="sm" type={type} value={val} onChange={this.handleNetChange.bind(null,prop)} />;
    return (
      <Row key={label}>
        <Col className="text-right" sm={2}><b>{label}</b></Col>
        <Col sm={size} value={val}>{form}</Col>
        <Col sm={2} value={2}>{note}</Col>
      </Row>
    );
  };

  render() {
    //console.log("NetModel render begin. state" +JSON.stringify(this.state));
    console.log("NetModel render begin.");
    // check for alert
    let msg = this.state.errMsg;
    console.log("** errMsg =" + msg);
    var alert = (msg === "")?  "" : this.makeAlertElem(msg);

    const name       = this.props.name;
    const editMode   = this.state.editMode;
    const viewMode   = this.state.viewMode;
    const expandMode = this.state.expandMode;
    const buildMode  = this.state.buildMode;

    const editLabel  = editMode?   'Submit' : 'Edit';
    const viewLabel  = viewMode?   'Hide' : 'Show';
    const expandIcon = expandMode? 'chevron-down' : 'chevron-right';

    const dimBuildIon = buildMode?  false : true;
    const dimSaveNet  = false;

    const hostList  = expandMode? this.makeNetHostListElem(name) : "";
    const nodeList  = expandMode? this.makeNetNodeListElem(name) : "";
    const hopList   = expandMode? this.makeNetHopListElem(name)  : "";

    let viewPanel = null;
    if (viewMode)
      if (editMode)
        viewPanel = this.makeNetEditor();
      else
        viewPanel = this.makeNetViewer();

    console.log("NetModel render return next.")
    return (
      <div>
        <Row>
          <hr/>
          <Col className="text-left"  sm={1}><Label bsSize="sm" bsStyle="default">Net Model</Label></Col>
          <Col className="text-right" sm={1}><b>{this.state.name}</b></Col>
          <Col className="text-left"  sm={2}>{this.state.desc}</Col>
          <Col sm={6}> 
            <ButtonToolbar>
              <Button bsSize="sm" bsStyle="primary" onClick={this.edit}>{editLabel}</Button>
              <Button bsSize="sm" bsStyle="info" onClick={this.view}>{viewLabel}</Button>
              <Button bsSize="sm" bsStyle="primary" disabled={dimBuildIon} onClick={this.makeIonModel.bind(this)}>Build ION Model</Button>
              <Button bsSize="sm" bsStyle="primary" disabled={dimSaveNet}  onClick={this.saveModel}>Save Model</Button>
              <Button bsSize="sm" bsStyle="success" onClick={this.expand}><Glyphicon glyph={expandIcon}/>{' '}</Button>
            </ButtonToolbar>
          </Col>
          <Col sm={4}>{alert}</Col>
        </Row>
        <Panel collapsible expanded={viewMode}>
          {viewPanel}
        </Panel>
        <Panel  collapsible expanded={expandMode}>
          {hostList}
          {nodeList}
          {hopList}
        </Panel>
      </div>
    );
  };
  
  expand = () => { // activated by expand/contract shutter icon
    var newState = Object.assign({},this.state);
    var expandMode = this.state.expandMode;
    if (expandMode)
      console.log("let's close-up network model list!");
    else
      console.log("let's expand network mode list!");
    newState.expandMode = !expandMode;  // toggling flag changes render
    this.setState (newState);
  };
  edit = () => {   // activated by Edit/Submit button
    var newState = Object.assign({},this.state);
    const editMode = this.state.editMode;
    if (editMode)
      this.submit();
    else {
      console.log("let's edit!");
      newState.viewMode = true;   // force viewing
    }
    newState.editMode = !editMode;  // toggle mode
    this.setState (newState);
  };
  noedit = () => {   // activated by Edit/Submit button
    var newState = Object.assign({},this.state);
    newState.editMode = false;   // cancel editing
    newState.viewMode = false;   // cancel viewing
    this.setState (newState);
  };
  submit = () => {    // callable by edit (above)
    console.log("submit net model updates!" + JSON.stringify(this.state.desc));
    var netModel = { 
      "name": this.state.name,
      "desc": this.state.desc,
    };
    var tran = {
      action: "UPDATE-NET-MODEL",
      netModel: netModel
    };
    this.props.dispatch(tran);
  };
  view = () => { // activated by view/hide button
    var newState = Object.assign({},this.state);
    var viewMode = this.state.viewMode;
    if (viewMode)
      console.log("let's hide view panel!");
    else
      console.log("let's show view panel!");
    newState.viewMode = !viewMode;
    this.setState (newState);
  };
  saveModel = () => {
    console.log("save Net model!");
    const modelObj = this.makeModelObj();
    const modelJson = JSON.stringify(modelObj,null,2);
    const blob = new Blob( [modelJson], {type: "text/plain; charset=utf-8"} );
    const modelName = this.state.name + ".json";
    console.log("save Net model to: " + modelName);
    saveAs(blob, modelName, true);   // true = disable autoBOM
  };
  handleNetChange = (prop,e) => {
    console.log("a value change of " + prop +  e);
    var newState = Object.assign({},this.state);
    console.log(">>> param old value = " + newState[prop]);
    newState[prop] = e.target.value;
    this.setState (newState);
    e.preventDefault();
  };
}

NetModel.propTypes = {
  name: PropTypes.string.isRequired,
  desc: PropTypes.string.isRequired,

  netHosts: PropTypes.array.isRequired,
  netNodes: PropTypes.array.isRequired,
  netHops: PropTypes.array.isRequired,
  netAddrs: PropTypes.array.isRequired,

  getIonModel: PropTypes.func.isRequired,      // func to get ion model handle
  isGoodName: PropTypes.func.isRequired,       // func to validate name
  isValidIPAddr: PropTypes.func.isRequired,     // func to validate IP address
  isGoodNetHostKey: PropTypes.func.isRequired, // func to validate hostKey not in use
  isGoodNetNodeKey: PropTypes.func.isRequired, // func to validate nodeKey not in use
  isGoodNetHopKey: PropTypes.func.isRequired,  // func to validate hopKey not in use
  makeTypeOptions: PropTypes.func.isRequired,  // func to get dynamic (cloned) options
  makeOptionElems: PropTypes.func.isRequired,  // func to get static options
  mapOptionElems: PropTypes.func.isRequired,   // func map option elems
  getUniqId: PropTypes.func.isRequired,        // func to make a uniq id
  makeCloneVal: PropTypes.func.isRequired,     // func to make a cloneVal
  findCloneVal: PropTypes.func.isRequired,     // func to find a cloneVal
  isStandardProtocol:  PropTypes.func.isRequired,  // func to check protocol type

  //checkModel: PropTypes.func.isRequired,    // func to check the entire model
  dispatch: PropTypes.func.isRequired,        // func to handle transactions centrally
}
