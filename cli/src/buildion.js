function buildIonModel(netName, netDesc, netHosts, netNodes, netHops) {
    // translate the net model to a full ion model
    // using best-guess defaults

    // default values
    const ionName   = netName + "-ion";
    const graphName = netName + "-graph";
    const ionDesc   = "ION " + netDesc;
    const graphDesc = "ION " + netDesc + " Contacts";
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
      let cloneVal = makeCloneVal(hostKey,hostClone);
      clones[hostCmdKey] = cloneVal;

      // build ion ipaddrs
      if (netHost.hasOwnProperty("ipAddrs")) {
        console.log("****** netHost has ipAddrs!! " + hostKey);

        // If host has more than one IP addr, automatically add
        // 0.0.0.0 to IP address list in case a TCP induct 
        // needs to use it.
        if (netHost.ipAddrs.length > 1) {
          let addr = "0.0.0.0"
          let uniqid = getUniqId();
          let ipAddrKey = "ipAddr_" + uniqid;
          ipaddrs[ipAddrKey] = {
            "id" : ipAddrKey,
            "hostKey" : hostKey,
            "ipAddr" : addr
          };
          hosts[hostKey].ipAddrKeys.push(ipAddrKey);

          let ipClone = { "id": ipAddrKey, "typeKey": "host_ipaddr", "values":[ addr ] };
          cloneVal = makeCloneVal(hostKey,ipClone);
          clones[ipAddrKey] = cloneVal;
        }

        // Now add in the IP addresses each host has been configured with
        for (let i = 0; i < netHost.ipAddrs.length; i++) {
          let addr = netHost.ipAddrs[i];
          let uniqid = getUniqId();
          let ipAddrKey = "ipAddr_" + uniqid;
          ipaddrs[ipAddrKey] = {
            "id" : ipAddrKey,
            "hostKey" : hostKey,
            "ipAddr" : addr
          };
          hosts[hostKey].ipAddrKeys.push(ipAddrKey);

          let ipClone = { "id": ipAddrKey, "typeKey": "host_ipaddr", "values":[ addr ] };
          cloneVal = makeCloneVal(hostKey,ipClone);
          clones[ipAddrKey] = cloneVal;
        }
      }
      // add the possible DNS entry, if no addrs provided
      if (hosts[hostKey].ipAddrKeys.length === 0 && isGoodName(hostKey)) {
        let uniqid = getUniqId();
        let ipAddrKey = "ipAddr_" + uniqid;
        ipaddrs[ipAddrKey] = {
          "id" : ipAddrKey,
          "hostKey" : hostKey,
          "ipAddr" : hostKey
        };
        hosts[hostKey].ipAddrKeys.push(ipAddrKey);

        let ipClone = { "id": ipAddrKey, "typeKey": "host_ipaddr", "values":[ hostKey ] };
        cloneVal = makeCloneVal(hostKey,ipClone);
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
      let cloneVal = makeCloneVal(nodeKey,nodeClone);
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

      // Loop thru the list of ionconfig variables and build the variable names for default values
      for (i in ionconfig_parms) {

        // Variable string to evaluate
        let varstr = "paramTypes.ionconfig_"+ionconfig_parms[i]+"_p0.defaultValue;";

        // Grab the default value and place it in the vals array
        default_val = eval(varstr);
        vals = [default_val];

        // Make and add the ION command
        cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"ionconfig",ionconfig_parms[i],vals);
        addCommandKey(configs,configName,cmdKey);
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
      cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"ionrc","initialize",vals);
      addCommandKey(configs,configName,cmdKey);
      // build ionrc start cmd
      vals = [];
      cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"ionrc","start",vals);
      addCommandKey(configs,configName,cmdKey);
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
      cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"bpv7rc","initialize",vals);
      addCommandKey(configs,configName,cmdKey);
      // build bpv7rc scheme cmd
      vals = ["ipn","ipnfw","ipnadminep"];
      cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"bpv7rc","scheme",vals);
      addCommandKey(configs,configName,cmdKey);
      // build bpv7rc "low" endpoint cmds  [0...6]
      let autoIDs = [];  //keep track of automatically created endpoint IDs
      for (var i=0; i<7; i++) {
        vals = [nodeNum,i,"x",""];
        cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"bpv7rc","endpoint",vals);
        addCommandKey(configs,configName,cmdKey);

        //storing them as a string array for max flexibility, may need to support alphanumerics
        autoIDs.push(i.toString());
      }
      // provide endpoints per service
      const services = netNode.services;
      for (i=0; i<services.length; i++) {
        var aservice = services[i];
        if (aservice === 'cfdp') {   // CFDP: endpoints 64 & 65
          autoIDs.push("64","65");
          vals = [nodeNum,64,"x",""];
          cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"bpv7rc","endpoint",vals);
          addCommandKey(configs,configName,cmdKey);
          vals = [nodeNum,65,"x",""];
          cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"bpv7rc","endpoint",vals);
          addCommandKey(configs,configName,cmdKey);
        }
        if (aservice === 'ams') {   // AMS: endpoints 71 & 72
          autoIDs.push("71","72");
          vals = [nodeNum,71,"x",""];
          cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"bpv7rc","endpoint",vals);
          addCommandKey(configs,configName,cmdKey);
          vals = [nodeNum,72,"x",""];
          cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"bpv7rc","endpoint",vals);
          addCommandKey(configs,configName,cmdKey);
        }
        if (aservice === 'amp') {   // AMS: endpoints 101 & 102
          autoIDs.push("101","102");
          vals = [nodeNum,101,"x",""];
          cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"bpv7rc","endpoint",vals);
          addCommandKey(configs,configName,cmdKey);
          vals = [nodeNum,102,"x",""];
          cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"bpv7rc","endpoint",vals);
          addCommandKey(configs,configName,cmdKey);
        }
      }
      // check for user specified endpoint IDs, and create as necessary being careful to not create
      // endpoints for IDs that are the empty string
      if (!autoIDs.includes(netNode.endpointID) && netNode.endpointID !== "") {
        vals = [nodeNum,netNode.endpointID,"x",""];
        cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"bpv7rc","endpoint",vals);
        addCommandKey(configs, configName, cmdKey);
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
        cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"bpv7rc","protocol",vals);
        addCommandKey(configs,configName,cmdKey);
      }
      // build of induct cmds happens later with hop analysis

      // build of outduct cmds happens later with hop analysis

      // build bpv7rc run ipnadmin cmd  (NOTE: not needed since included in our start script)
      // var cmd = "ipnadmin " + ipnrc;
      // vals = [cmd];
      // cmdKey = makeIonCommand(commands,clones,configName,"bpv7rc","run",vals);
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
        cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"ltprc","initialize",vals);
        addCommandKey(configs,configName,cmdKey);

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
      cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"ionsecrc","initialize",vals);
      addCommandKey(configs,configName,cmdKey);

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
        var ports = getHostPorts(toHostKey,hosts,ipaddrs,commands);

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
        cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"bpv7rc",induct,vals);
        addCommandKey(configs,configName,cmdKey);
        inductKeys[inKey] = cmdKey;   // actual value not important, just know one exists.
      }
      // build ltp links as necessary
      if (bpLayer === "ltp") {    // link candidate?
        configName = nodeKey + ".ltprc";
        toHostKey = toNode.hostKey;
        // if port not specified, use default
        if (netHop.portNum === undefined || netHop.portNum === "") {
          ports = getHostPorts(toHostKey,hosts,ipaddrs,commands);

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
          cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"ltprc","start_udp",vals);
          startUdpKeys[configName] = cmdKey;
        };
        if (netHop.ltpLayer === "dccp") {
          if (startDccpKeys.hasOwnProperty(configName) ) {  // already have start dccp?
            continue;                                        // one is the limit
          }
          vals = [toAddr,netHop.portNum];
          cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"ltprc","start_dccp",vals);
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
      cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"bpv7rc",outduct,vals);
      addCommandKey(configs,configName,cmdKey);
      //configs[configName].cmdKeys.push(cmdKey);
      // build ltp spans as necessary
      if (bpLayer === "ltp") {    // link candidate?
        configName = nodeKey + ".ltprc";
        toHostKey = toNode.hostKey;
        var cloneVal = getNodeLink(clones,toNode.id,netHop.ltpLayer);
        console.log ("???? cloneVal: " + JSON.stringify(cloneVal));
        linkName = cloneVal.value;
        if (netHop.ltpLayer === "udp") {
          vals = [toNodeNum,100,100,1482,100000,1,linkName,1]
          cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"ltprc","span_udp",vals);
          addCommandKey(configs,configName,cmdKey);
        };
        if (netHop.ltpLayer === "dccp") {
          vals = [toNodeNum,100,100,64000,100000,1,linkName,1]
          cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"ltprc","span_dccp",vals);
          addCommandKey(configs,configName,cmdKey);
        };
      };
    };
    // HACK Alert!  -- only now add the start commands, so span not ignored by ION
    //              -- see pass 1 for build of start commands
    for (configName in startUdpKeys)
      addCommandKey(configs,configName,startUdpKeys[configName]);
    for (configName in startDccpKeys)
      addCommandKey(configs,configName,startDccpKeys[configName]);

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
      cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"bpv7rc","ion_plan",planvals);
      addCommandKey(configs,configName,cmdKey);

      // determine outduct name
      var outductName = '';  
      if (bpLayer === "ltp" ||
          bpLayer === "bssp") {
        outductName = toNodeNum;
      } else 
      if (bpLayer === "udp") {   //udp depends on induct
        cloneVal = getNodeInduct(clones,toNode.id,bpLayer);
        outductName = cloneVal.value;
      } else 
      if (isStandardProtocol(bpLayer)) {
        cloneVal = getNodeOutduct(clones,nodeKey,toAddr,bpLayer);
        //console.log ("???? cloneVal: " + JSON.stringify(cloneVal));
        outductName = cloneVal.value;
      };
      // build attach outduct command
      var vals = [toNodeNum,outductName];
      var attach = "attach_outduct_" + bpLayer;
      cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"bpv7rc",attach,vals);
      addCommandKey(configs,configName,cmdKey);
    };

    // build bpv7rc start cmd, now that the duct cmds are done
    for (nodeKey in netNodes) {
      vals = [];
      configName = nodeKey + ".bpv7rc";
      cmdKey = makeIonCommand(commands,clones,nodeKey,configName,"bpv7rc","start",vals);
      addCommandKey(configs,configName,cmdKey);
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
      cmdKey = makeIonCommand(commands,clones,graphName,configName,"contacts","range_rel_rel_time",vals);
      ranges[hKey] = cmdKey;   // save for later to group range commands
      // contact cmd
      vals = [0,maxSecs,fromNodeNum,toNodeNum,rate,1.0];
      cmdKey = makeIonCommand(commands,clones,graphName,configName,"contacts","contact_rel_rel_time",vals);
      addCommandKey(configs,graphConfig,cmdKey);
    };
    // add range cmds as a group
    for (hKey in ranges) {
      cmdKey = ranges[hKey];
      addCommandKey(configs,graphConfig,cmdKey);
    };
    assignClones(commands,clones);   //  map cloneVal to using clones (command params)
    return null;
};
// Special wrapper function for console.log debug messages
function debug_log(msg) {
  if (DEBUG_MODE)
     console.log(msg);
}
