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
import {Badge,Button,ButtonGroup,OverlayTrigger,Tooltip} from 'react-bootstrap';
import {Container,Card} from 'react-bootstrap';
import {BsXLg} from "react-icons/bs";
import {BsChevronDoubleDown} from "react-icons/bs";
import {BsChevronDoubleRight} from "react-icons/bs";
import {BsQuestionCircle} from 'react-icons/bs';
import {saveAs} from "file-saver";
import {Alert} from 'react-bootstrap';
import {Modal} from 'react-bootstrap';

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
      showBuildSuccess: false,
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
        twoWay: hopObj.twoWay
      }
      model["netHops"][hopKey] = hopJson
    }
    return model;
  };
  // WARNING This function is automatically extracted and
  // converted for use by the CLI tools. Any comment with
  // the string 'EXTRACT' in it should not be removed or
  // modified an any way or the automatic CLI tool build 
  // process will fail or will result in unusable code. 
  // See the AUTOBUILD file in the cli directory for more
  // EXTRACT checkNetModel
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
        if (fromNode) {
          if (netHostKey === fromNode.nodeHost) {
            if (!netHost.ipAddrs.includes(fromIP))
              errors.push("Invalid 'From IP Addr': " + fromIP + " for Net Hop " + hopKey + ".");
          }
        }
        if (toNode) {
          if (netHostKey === toNode.nodeHost) {
            if (!netHost.ipAddrs.includes(toIP))
              errors.push("Invalid 'To IP Addr': " + toIP + " for Net Hop " + hopKey + ".");
          }
        }
      }

      if (!netHop.bpLayer)
        errors.push("Missing BP Layer Protocol CLA for Net Hop " + hopKey + ".");
      if (netHop.bpLayer && !isStandardProtocol(netHop.bpLayer)) 
        errors.push("Unrecognized BP Layer Protocol CLA for Net Hop: "+ hopKey +". Should be one of: tcp, stcp, udp, dccp or ltp.");
    }
    return errors;
  }
  // END EXTRACT
  // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  // Do not delete the comment above, it is used by the build process
  // to extract code common to both the GUI and CLI tools

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

    var newState = Object.assign({},this.state);
    newState.showBuildSuccess = true;
    newState.errMsg = "";
    this.setState (newState);
  }
  // EXTRACT buildIonModel
  // build ion model
  buildIonModel() {
    // translate the net model to a full ion model
    // using best-guess defaults

    // NO EXTRACT
    // ion model objects
    var ion = {};
    var graphs = {};
    var nodes = {};
    var configs = {};
    var commands = {};
    var hosts = {};
    var ipaddrs = {};
    var clones = {};
    // END NO EXTRACT
    var myParams = paramTypes;

    // default values
    const ionName   = this.state.name;
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

      if (netNode.fromDb) {
        nodes[nodeKey].fromDb = true;
        nodes[nodeKey].dbCreatedTime = netNode.dbCreatedTime;
        nodes[nodeKey].dbUpdatedTime = netNode.dbUpdatedTime;
        nodes[nodeKey].dbComment = netNode.dbComment;
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
      var protocols = [];  // init node protocols list
      var netNode = netNodes[nodeKey];
      var ionNode = nodes[nodeKey];
      nodeNum = ionNode.ionNodeNum;

      // See if this node even needs a .ionconfig file
      if (this.netNodeNeedsIonConfig(netNode)) {
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

          // Grab the default value; it might get overridden below
          default_val = eval(varstr);

          // See if a value has already been provided from the node DB
          let objVal = eval("netNode."+ionconfig_parms[i]);

          // Override the default with a computed value if provided from the Node DB
          if (objVal) {
            if (ionconfig_parms[i] === "configFlags") {
              default_val = this.computeConfigFlagValue(objVal);
            } else {
              default_val = objVal;
            }
          }

          vals = [default_val];

          // Make and add the ION command
          cmdKey = this.makeIonCommand(commands,clones,nodeKey,configName,"ionconfig",ionconfig_parms[i],vals);
          this.addCommandKey(configs,configName,cmdKey);
        }
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
        vals = ["bputa"];
        cmdKey = this.makeIonCommand(commands,clones,nodeKey,configName,"cfdprc","start_any",vals);
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
      if (netHop.twoWay) {  // twoWay implies a reverse hop also
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
    var seatUdpKeys = {};   // hold ltp seat udp commands for later (follows spans) per config
    var seatDccpKeys = {};  // hold ltp start dccp commands for later (follows spans) per config 
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
          if (seatUdpKeys.hasOwnProperty(configName) ) {  // already have seat udp?
            continue;                                      // one is the limit
          }
          vals = [toAddr,netHop.portNum];
          cmdKey = this.makeIonCommand(commands,clones,nodeKey,configName,"ltprc","seat_udp",vals);
          seatUdpKeys[configName] = cmdKey;
        };
        if (netHop.ltpLayer === "dccp") {
          if (seatDccpKeys.hasOwnProperty(configName) ) {  // already have seat dccp?
            continue;                                        // one is the limit
          }
          vals = [toAddr,netHop.portNum];
          cmdKey = this.makeIonCommand(commands,clones,nodeKey,configName,"ltprc","seat_dccp",vals);
          seatDccpKeys[configName] = cmdKey;
        };
      };
    };
    console.log("$$$$$ seatUdpKeys: " + JSON.stringify(seatUdpKeys) );
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
    // HACK Alert!  
    // -- only now add the seat commands for LTP over UDP
    // -- see pass 1 for build of seat and commands
    for (configName in seatUdpKeys) {
        this.addCommandKey(configs,configName,seatUdpKeys[configName]);
    }
    // Then add the seat commands for LTP over DCCP
    for (configName in seatDccpKeys) {
      this.addCommandKey(configs,configName,seatDccpKeys[configName]);
    }

    // Now add the start all command for the .ltprc file
    // NOTE: the makeIonCommand function checks for duplicate commands and rejects
    // any attempt to make one. Thus, it is benign if udp and dccp seats are in
    // the same .ltprc file -- only one start command will appear in the config file.
    for (configName in seatUdpKeys) {
      cmdKey = this.makeIonCommand(commands,clones,nodeKey,configName,"ltprc","start_all",[]);
      this.addCommandKey(configs,configName,cmdKey);
    }
    for (configName in seatDccpKeys) {
      cmdKey = this.makeIonCommand(commands,clones,nodeKey,configName,"ltprc","start_all",[]);
      this.addCommandKey(configs,configName,cmdKey);
    }

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
    // NO EXTRACT
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

    // END NO EXTRACT
    return null;
  };
  // END EXTRACT

  // EXTRACT addCommandKey
  // add commmand to a configuration, unless its null
  addCommandKey(configs,configName,cmdKey) {
    if (cmdKey == null) {
      console.log("addCommandKey discarded for configFile: " + configName);
      return;
    }
    configs[configName].cmdKeys.push(cmdKey);
  }
  // END EXTRACT

  // EXTRACT netNodeNeedsIonConfig
  // utility function to determine whether a node
  // should have a .ionconfig file
  netNodeNeedsIonConfig(netNode) {
    // If the netNode IS NOT from the node DB
    // it needs one
    if (!netNode.fromDb) { return true; }

    // If the node IS from the node DB AND
    // any of the node attributes associated
    // with the .ionconfig file are 
    // present, it needs one
    return (netNode.configFlags ||
            netNode.sdrWmSize   ||
            netNode.heapWords   ||
            netNode.wmSize);
  }
  // END EXTRACT

  // EXTRACT makeIonCommand
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
    let tranTime = this.getNow();
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
  // END EXTRACT

  // Utility function. This is different in CLI tools.
  getNow() {
    let now = new Date();
    let tranTime = now.format("YYYY-MM-DDThh:mm");
    return tranTime;
  }

  // EXTRACT assignClones
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
  // END EXTRACT
  // EXTRACT getHostPorts
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
  // END EXTRACT

  // EXTRACT getNodeInduct
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
  // END EXTRACT

  // EXTRACT getNodeLink
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
  // END EXTRACT

  // EXTRACT getNodeOutduct
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
  // END EXTRACT
  
  // EXTRACT computeConfigFlagValue
  // If the sdr_config_flags array has been provided by from the Node DB
  // compute the bitwise OR value and return it
  computeConfigFlagValue(cFlags) {
    var cFlagVals = {};

    // Hex values; see ionconfig(5) for more
    cFlagVals["SDR_IN_DRAM"]    = 0x1
    cFlagVals["SDR_IN_FILE"]    = 0x2
    cFlagVals["SDR_REVERSIBLE"] = 0x4
    cFlagVals["SDR_BOUNDED"]    = 0x8

    // Go through the supplied array and compute the value
    var configFlagVal = 0x0;
    for (var i=0 ; i<cFlags.length ; i++) {
      configFlagVal = configFlagVal | cFlagVals[cFlags[i]];
    }

    return configFlagVal;
  }
  // END EXTRACT

  getDefaultIPforNode(netNode) {
    const netNodes = this.props.netNodes;
    const netHosts = this.props.netHosts;
    if (netNode === "")
      return "";

    var hostForNode = netNodes[netNode].nodeHost;

    if (hostForNode === "") {
      return "";
    }

    var netHostIPs = netHosts[hostForNode].ipAddrs;

    return netHostIPs[0];
  };

  getPortNumForNodeAndProtocol(netNode, protocol) {
    const netNodes = this.props.netNodes;
    var portNum = '';
    if (netNode === "") return"";

    // See if the node was read from the node DB
    if (netNodes[netNode].fromDb) {
       netNodes[netNode].inducts.forEach(induct => {
        if (induct.cl_protocol === protocol) {
          portNum = induct.port_number ? induct.port_number : '';
        }
       });
    }

    // If the node does not have a port
    // number defined for it's induct use
    // default based on protocol
    if (portNum === '') {
      switch (protocol) {
        case "tcp":
        case "stcp":
        case "dccp":
          portNum = 4556;
          break;
        case "ltp":
        case "udp":
          portNum = 1113;
          break;
        default:
          throw new Error("Unrecognized protocol: "+protocol);
      }
    }
    return portNum;
  };

  toggleBuildSuccess(showIon) {
    var newState = !this.state.showBuildSuccess;
    this.setState({
      showBuildSuccess: newState
    });

    if (showIon) {
      const tran = {
        action: "SHOW-TAB",
        tabKey: "ionmodel"
      }
      this.props.dispatch(tran);
    }
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

  // makeNetNodeOptionsForParam
  //
  // Based on the parameter and nodeKey (optional)
  // supplied retrieve values for the options in 
  // a drop down menu.
  makeNetNodeOptionsForParam(param, nodeKey = '') {
    const netNodes = this.props.netNodes;
    var optionItems;
    // No node key, use default behavior based on
    // parameter only
    if (nodeKey === '') {
      return this.props.makeOptionElems(param);
    }

    // If the net node supplied is not from the node
    // DB, use default behavior based on parameter only
    if (!netNodes[nodeKey].fromDb) {
      return this.props.makeOptionElems(param);
    }

    // Set up for making the list of options
    let vals = [];
    let noneVal = {"value": '??', "label": 'None Selected'};
    vals.push(noneVal);

    // Based on parameter and node, build options available
    switch (param) {
      case "bpLayer":
        // Grab protocols from node
        let netNode = netNodes[nodeKey];
        for (var idx in netNode.protocols) {
          let value = netNode.protocols[idx];
          let label = "";
          vals.push({"value": value, "label": label});
        }
        optionItems = this.props.mapOptionElems(vals);
        break;
      default:
        // Default behavior for unknown param is to 
        // build list from default selections
        optionItems = this.props.makeOptionElems(param);
        break;
    } 

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
      if (netNodeHost !== "") {
        var netHostIPs = netHosts[netNodeHost].ipAddrs;

        for (var idx in netHostIPs) {
          let value = netHostIPs[idx];
          let label = netNode;
          vals.push({"value": value, "label": label});
        }
      }
    }
    var optionItems = this.props.mapOptionElems(vals);
    return optionItems;
  };
  makeAlertElem(msg) {
    return (<Alert variant="danger"><b>ERROR: {msg}</b></Alert>);
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
    const makeNetNodeOptionsForParam = this.makeNetNodeOptionsForParam.bind(this);
    const makeNetIPOptions = this.makeNetIPOptions.bind(this);
    const getDefaultIPforNode = this.getDefaultIPforNode.bind(this);
    const getPortNumForNodeAndProtocol = this.getPortNumForNodeAndProtocol.bind(this);

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

        makeNetNodeOptionsForParam = {makeNetNodeOptionsForParam}
        makeNetNodeOptions = {makeNetNodeOptions} // make options list of node keys
        makeNetIPOptions= {makeNetIPOptions}      // make options list of IP addresses
        getDefaultIPforNode= {getDefaultIPforNode} // return first IP address for net node 
        getPortNumForNodeAndProtocol = {getPortNumForNodeAndProtocol}
        dispatch={dispatch}                       // dispatch func for new hosts
      />
    );
  };
  makeNetEditor() {
    //console.log(">>makeModelElems " + JSON.stringify(this.state));
    var modelElems = [];
    const head  = 
      <Row key="head">
        <Col sm={4}><Badge bg="secondary" text="light">Net Model Editor</Badge></Col>
        <Col sm={1}><Button variant="success"  onClick={this.noedit}><BsXLg/></Button></Col>
      </Row>;
    modelElems.push(head);
    const nameElem = this.makeModelElem("name","text",this.state.name,"Net Model Name",2,false,"");
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
    const head  = <Row key="head"><Col sm={2}><Badge bg="secondary" text="light">Network Model Viewer</Badge></Col></Row>;
    modelElems.push(head);
    const nameElem = this.makeModelElem("name","text",this.state.name,"Network Model Name",2,true,"");
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
        <FormControl readOnly={read} bssize="sm" type={type} value={val} onChange={this.handleNetChange.bind(null,prop)} />;
    return (
      <Row key={label}>
        <Col className="text-right" sm={2}><b>{label}</b></Col>
        <Col sm={size} value={val}>{form}</Col>
        <Col sm={2} value={2}>{note}</Col>
      </Row>
    );
  };

  makeBuildSuccessDialog() {
    console.log("Delete Model: popup the modal delete warn");
    return (
      <Modal show={this.state.showBuildSuccess}>
        <Modal.Header closeButton>
          <Modal.Title>Success</Modal.Title>
        </Modal.Header>
        <Modal.Body>ION Model Successfully Built</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" bssize="sm" onClick={ () => this.toggleBuildSuccess(false)}>
            Ok 
          </Button>
          <Button variant="primary" bssize="sm" onClick={ () => this.toggleBuildSuccess(true)}>
            Show ION Model 
          </Button>
        </Modal.Footer>
      </Modal>
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
    const showBuildSuccess = this.state.showBuildSuccess;

    const editLabel  = editMode?   'Submit' : 'Edit';
    const viewLabel  = viewMode?   'Hide' : 'Show';
    const expandIcon = expandMode? <BsChevronDoubleDown/> : <BsChevronDoubleRight/>;

    const dimSaveNet  = false;

    const hostList  = expandMode? this.makeNetHostListElem(name) : "";
    const nodeList  = expandMode? this.makeNetNodeListElem(name) : "";
    const hopList   = expandMode? this.makeNetHopListElem(name)  : "";

    const buildSuccessDialog = showBuildSuccess ? this.makeBuildSuccessDialog() : "";

    let viewPanel = null;
    if (viewMode)
      if (editMode)
        viewPanel = this.makeNetEditor();
      else
        viewPanel = this.makeNetViewer();

    return (
      <>
      <hr />
      <Container fluid>
        <Row>
          <Col className="text-left"  lg={2}><h2><Badge pill bg="light">Net Model</Badge></h2></Col>
          <Col className="text-left"  lg={1}><h5><b>{this.state.name}</b></h5></Col>
          <Col className="text-right" lg={2}><h6>{this.state.desc}</h6></Col>
          <Col lg={6}> 
            <ButtonGroup>
              <Button variant="primary" className="mr-1" onClick={this.edit}>{editLabel}</Button>
              <Button variant="info" className="mr-1" onClick={this.view}>{viewLabel}</Button>
              <Button variant="primary" className="mr-1" onClick={this.makeIonModel.bind(this)}>Build ION Model</Button>
              <Button variant="primary" className="mr-1" disabled={dimSaveNet}  onClick={this.saveModel}>Save Net Model</Button>
              <Button variant="success" onClick={this.expand}>{expandIcon}{' '}</Button>
              <OverlayTrigger
                placement="right"
                overlay={
                  <Tooltip id="tooltip">
                    Expand to view and modify the elements of the Network Model. The Network Model abstraction can be used to create an ION Model to configure ION for use in operations.
                  </Tooltip>
                }
              >
                <div style={{alignItems: "center", display: "flex", marginLeft: "5px"}}>
                <BsQuestionCircle />
                </div>
              </OverlayTrigger>
            </ButtonGroup>
          </Col>
          <Col sm={4}>{alert}</Col>
        </Row>
      </Container>
      {buildSuccessDialog}
      <Container fluid>
        <Card collapsible="true" expanded={viewMode.toString()}>
          {viewPanel}
        </Card>
        {expandMode && (
          <Card>
            {hostList}
            {nodeList}
            {hopList}
          </Card>
        )}
      </Container>
      </>
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
    // Not all browsers support the file picker API
    if ('showSaveFilePicker' in window) {
      this.saveUsingFilePicker();
      return;
    }

    // Fallback for browsers that do not support the file picker API
    const modelObj = this.makeModelObj();
    const modelJson = JSON.stringify(modelObj,null,2);
    const blob = new Blob( [modelJson], {type: "text/plain; charset=utf-8"} );
    const modelName = this.state.name + "-net" + ".json";
    saveAs(blob, modelName);
  };

  saveUsingFilePicker = async () => {
    console.log("save Net model using file picker!");
    const modelObj = this.makeModelObj();
    const modelJson = JSON.stringify(modelObj,null,2);
    const blob = new Blob( [modelJson], {type: "text/plain; charset=utf-8"} );
    const modelName = this.state.name + "-net" + ".json";
    console.log("save Net model to: " + modelName);
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: modelName,
        types: [
          {
            description: 'JSON Files',
            accept: {'text/plain': ['.json']},
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
    } catch (e) {
      if (e.name === 'AbortError') {
        console.log("User cancelled the save file dialog.");
      } else {
        console.error("Error saving file:", e);
      }
    }
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
