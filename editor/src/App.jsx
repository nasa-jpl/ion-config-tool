//        App.jsx     Main App JSX for IonConfig Tool
//
//        Copyright (c) 2018, California Institute of Technology.
//        ALL RIGHTS RESERVED.  U.S. Government Sponsorship
//        acknowledged.
//                                                                   
//      Author: Rick Borgen, Jet Propulsion Laboratory         
//                                                               
import React from 'react';

// custom component imports
import IonModelLoader from './IonModelLoader.jsx';
import NetModelLoader from './NetModelLoader.jsx';
import IonModel  from './IonModel.jsx';
import NetModel  from './NetModel.jsx';

// 3rd-party component imports
import {Navbar} from 'react-bootstrap';
import {FormControl} from 'react-bootstrap';
import {Button,ButtonToolbar} from 'react-bootstrap';
import {Grid,Row,Col} from 'react-bootstrap';
import {Glyphicon} from 'react-bootstrap';
import "date-format-lite";

// schema imports
import configTypes from './configTypes.json';
import cmdTypes    from './cmdTypes.json';
import paramTypes  from './paramTypes.json';
import selections  from './selections.json';

 // non-render state
 var uniqId = 0;       // counter used to make unique names

export default class App extends React.Component {
  constructor(props) {
    super(props);
    console.log("App ctor");
    var myConfigs = JSON.stringify(configTypes);
    console.log('configTypes:' + myConfigs);
    var myCmds = JSON.stringify(cmdTypes);
    console.log('cmdTypes:' + myCmds);
    var myParams = JSON.stringify(paramTypes);
    console.log('paramTypes:' + myParams);
    var mySelect = JSON.stringify(selections);
    console.log('selections:' + mySelect);

    var cloneValues = {};

    // future state objects based on network model
    var netNodes = {};
    var netHosts = {};
    var netHops  = {};
    var netAddrs = [];

    // future state objects based on ion model
    var graphs = {};
    var nodes = {};
    var configs = {};
    var commands = {};
    var hosts = {};
    var ipaddrs = {};

    // catch errors and alert
    window.onerror = function(msg,url,lineno) {
      alert('Error message: '+msg+'\nURL: '+url+'\nLine Number: '+lineno)
      return true
    }

    // assign cmdTypes list to each configType
    for (var cmdType in cmdTypes) {
      let confType = cmdTypes[cmdType].configType;
      configTypes[confType].cmdTypes.push(cmdType);
      let isCloned = cmdTypes[cmdType].isCloned;
      if (isCloned) 
        console.log("*** cmdType: " + cmdType + " has a cloned property.");
    }
    console.log("=== cmdTypes now mapped into configTypes.");
    for (var conType in configTypes) {
      console.log("configType: " + conType + " has: " + JSON.stringify(configTypes[conType].cmdTypes)); 
    }
    // assign paramTypes list to each cmdType
    for (var pType in paramTypes) {
      console.log("ingest paramType: " + pType);
      let cType = paramTypes[pType].cmdType;
      cmdTypes[cType].paramTypes.push(pType);
    }
    console.log("=== paramTypes now mapped into cmdTypes.");
    for (var cmType in cmdTypes) {
      console.log("cmdType: " + cmType + " has: " + JSON.stringify(cmdTypes[cmType].paramTypes)); 
    }
     
    // the master state atom
    this.state = {
       loadIonModel: false,
       makeNewIonModel: false,
       ionModelActive: false,
       makeNewModelName: "",
       loadNetModel: false,
       makeNewNetModel: false,
       newNetModel: false,
       netModelActive: false,      
       newNetModelName: "",   

       netModel: null,             // netModel object
       netNodes: netNodes,         // net model nodes
       netHosts: netHosts,         // net model hosts
       netHops: netHops,           // net model hops
       netAddrs: netAddrs,         // net model ip addrs

       ionModel: null,             // ionModel object
       hosts: hosts,               // model
       ipaddrs: ipaddrs,           // model
       graphs: graphs,             // model
       nodes: nodes,               // model
       configs: configs,           // model
       commands: commands,         // model

       cloneValues: cloneValues    // derived
    };
  };
  // generate next uniq id...used by all types
  getUniqId() {
     let nextId = uniqId + 1;
     uniqId = nextId;
     return nextId;
  }
  // get Ion Model handle
  getIonModel() {
     return this.state.ionModel;
  }
  // fetch the owning nodeKey of a command
  getNodeKey(cmdKey) {
     let cmd = this.state.commands[cmdKey];
     let configKey = cmd.configKey;
     let config = this.state.configs[configKey];
     let nodeKey = config.nodeKey;
     return nodeKey;
  }
  // fetch values for a cmdKey
  getValues(cmdKey) {
    //console.log("===getValues for cmd: " + cmdKey);
    let cmds = this.state.commands;
    let cmd = cmds[cmdKey];
    return cmd.values;
  }
  // fetch the cmdType object based on a command
  getCmdType(cmdKey) {
     let cmd = this.state.commands[cmdKey];
     let cmdTypeKey = cmd.typeKey;
     let cmdType = cmdTypes[cmdTypeKey];
     return cmdType;
  }
  // check if a new name is valid
  isGoodName(name) {
  console.log("isGoodName ?? " + name);
    if (name === '')
      return false;
    if (name.indexOf(' ') >= 0)
      return false;
    return true;
  }
  // check if a new node name is valid
  isGoodNodeKey(newNodeKey) {
    console.log("isGoodNodeKey ?? " + newNodeKey);
    for (var nodeKey in this.state.nodes)
       if (nodeKey === newNodeKey)
         return false;
    return true;
  }
  // check if a new node name is valid
  isGoodNetNodeKey(newNodeKey) {
    console.log("isGoodNetNodeKey ?? " + newNodeKey);
    for (var nodeKey in this.state.netNodes)
       if (nodeKey === newNodeKey)
         return false;
    return true;
  }
  // check if a new net host name is valid
  isGoodNetHostKey(newHostKey) {
    console.log("isGoodNetHostKey ?? " + newHostKey);
    for (var hostKey in this.state.netHosts)
       if (hostKey === newHostKey)
         return false;
    return true;
  }
  // check if a new net hop name is valid
  isGoodNetHopKey(newHopKey) {
    console.log("isGoodNetHopKey ?? " + newHopKey);
    for (var hopKey in this.state.netHops)
       if (hopKey === newHopKey)
         return false;
    return true;
  }
  // check if a new nodeNum is valid
  isGoodNodeNum(myNodeKey, nodeNum) {
    console.log("isGoodNodeNum ?? " + myNodeKey + ' ' + nodeNum);
    for (var nodeKey in this.state.nodes) {
      //console.log("checking node: " + nodeKey);
      if (Number(nodeNum) === Number(this.state.nodes[nodeKey].ionNodeNum) 
            && myNodeKey !== nodeKey )
        return false;
    }
    return true;
  }
  //check if protocol has a standard ION CLI
  isStandardProtocol(protocol) {
    if (protocol === "tcp"  ||
        protocol === "stcp" ||
        protocol === "udp"  ||
        protocol === "dccp" ||
        protocol === "bssp" ||
        protocol === "ltp") 
      return true;
    else
      return false;
  }
  // check if a candidate nodeKey exists
  usedNodeKey(myNodeKey) {
    console.log("usedNodeKey ?? " + myNodeKey);
    if (this.state.nodes.hasOwnProperty(myNodeKey))
      return true;
    return false;
  }
  // make a clone-able value object (or expression) based on special command types
  makeCloneVal(nodeKey,cmd) {
    var cloneVal = {};
    // first assign properties not dependent on type
    cloneVal["id"] = cmd.id;
    cloneVal["nodeKey"] = nodeKey;
    cloneVal["clones"] = []     // a list for clone id objects (cmdKey & valIdx)
    cloneVal["value"] = this.makeComboValue(cmd,cmd.typeKey);
    // then check specific type for other init rules
    if (cmd.typeKey === "node_nodenum") {    /// special model command (not ion)
      cloneVal["type"] = "nodeNum";
      cloneVal["label"] = nodeKey;
    } else
    if (cmd.typeKey === "node_nodekey") {    /// special model command (not ion)
      cloneVal["type"] = "nodeKey";
      cloneVal["label"] = nodeKey;
    } else
    if (cmd.typeKey === "host_hostkey") {    /// special model command (not ion)
      cloneVal["type"] = "hostKey";
      cloneVal["label"] = 'Host:' + cmd.values[0];
    } else
    if (cmd.typeKey === "host_ipaddr") {         /// special model command (not ion)
      cloneVal["type"] = "ipAddr";
      cloneVal["label"] = 'Host: ' + nodeKey + ' IpAddr:' + cmd.values[0];
    } else
    if (cmd.typeKey === "bpv6rc_endpoint" ||
        cmd.typeKey === "bpv7rc_endpoint") {
      cloneVal["type"] = "ionEndpoint";
      // should annotate endpoint purpose in the the label
      let suffix = '';
      if (cmd.values[3] !== "")
        suffix = ' [' + cmd.values[3] + ']';
      cloneVal["label"] = 'node:' + nodeKey + ' servNum:' + cmd.values[1] + suffix;
    } else
    if (cmd.typeKey === "bpv6rc_induct_ltp" ||
        cmd.typeKey === "bpv7rc_induct_ltp") {
      cloneVal["type"] = "ltpInduct";
      cloneVal["label"] = 'toNode: ' + nodeKey + ' ltpInductName: ' + cloneVal.value;
    } else
    if (cmd.typeKey === "bpv6rc_induct_udp" ||
        cmd.typeKey === "bpv7rc_induct_udp") {
      cloneVal["type"] = "udpInduct";
      cloneVal["label"] = 'toNode: ' + nodeKey + ' udpInductName: ' + cloneVal.value;
    } else 
    if (cmd.typeKey === "bpv6rc_induct_stcp" ||
        cmd.typeKey === "bpv7rc_induct_stcp") {
      cloneVal["type"] = "stcpInduct";
      cloneVal["label"] = 'toNode:' + nodeKey + ' stcpInductName: ' + cloneVal.value; 
    } else 
    if (cmd.typeKey === "bpv6rc_induct_tcp" ||
        cmd.typeKey === "bpv7rc_induct_tcp") {
      cloneVal["type"] = "tcpInduct";
      cloneVal["label"] = 'toNode: ' + nodeKey + ' tcpInductName: ' + cloneVal.value;
    } else 
    if (cmd.typeKey === "bpv6rc_induct_dccp" ||
        cmd.typeKey === "bpv7rc_induct_dccp") {
      cloneVal["type"] = "dccpInduct";
      cloneVal["label"] = 'toNode: ' + nodeKey + ' dccpInductName: ' + cloneVal.value; 
    } else
    if (cmd.typeKey === "bpv6rc_induct_bssp" ||
        cmd.typeKey === "bpv7rc_induct_bssp") {
      cloneVal["type"] = "bsspInduct";
      cloneVal["label"] = 'toNode: ' + nodeKey + ' bsspInductName: ' + cloneVal.value;
    } else 
    if (cmd.typeKey === "bpv6rc_outduct_ltp" ||
        cmd.typeKey === "bpv7rc_outduct_ltp") {
      cloneVal["type"] = "ltpOutduct";
      cloneVal["label"] = 'fromNode: ' + nodeKey + ' ltpOutductName: ' + cloneVal.value;
    } else
    if (cmd.typeKey === "bpv6rc_outduct_udp" ||
        cmd.typeKey === "bpv7rc_outduct_udp") {
      cloneVal["type"] = "udpOutduct";
      cloneVal["label"] = 'fromNode: ' + nodeKey + ' udpOutductName: ' + cloneVal.value;
    } else 
    if (cmd.typeKey === "bpv6rc_outduct_stcp" ||
        cmd.typeKey === "bpv7rc_outduct_stcp") {
      cloneVal["type"] = "stcpOutduct";
      cloneVal["label"] = 'fromNode:' + nodeKey + ' stcpOutductName: ' + cloneVal.value; 
    } else 
    if (cmd.typeKey === "bpv6rc_outduct_tcp" ||
        cmd.typeKey === "bpv7rc_outduct_tcp") {
      cloneVal["type"] = "tcpOutduct";
      cloneVal["label"] = 'fromNode: ' + nodeKey + ' tcpOutductName: ' + cloneVal.value;
    } else 
    if (cmd.typeKey === "bpv6rc_outduct_dccp" ||
        cmd.typeKey === "bpv7rc_outduct_dccp") {
      cloneVal["type"] = "dccpOutduct";
      cloneVal["label"] = 'fromNode: ' + nodeKey + ' dccpOutductName: ' + cloneVal.value; 
    } else 
    if (cmd.typeKey === "ltprc_start_udp") {
      cloneVal["type"] = "udpLink";
      cloneVal["label"] = 'toNode: ' + nodeKey + ' udpLinkName: ' + cloneVal.value;
    } else 
    if (cmd.typeKey === "ltprc_start_dccp") {
      cloneVal["type"] = "dccpLink";
      cloneVal["label"] = 'toNode: ' + nodeKey + ' dccpLinkName: ' + cloneVal.value;
    } else
    if (cmd.typeKey === "bpv6rc_outduct_bssp" ||
        cmd.typeKey === "bpv7rc_outduct_bssp") {
      cloneVal["type"] = "bsspOutduct";
      cloneVal["label"] = 'fromNode: ' + nodeKey + ' bsspOutductName: ' + cloneVal.value;
    } else {
      console.log("!!! nodeKey: " + nodeKey + " is not clone type!! ");
      return null;
    }
    console.log("$$$ new cloneVal = " + JSON.stringify(cloneVal));
    return cloneVal;
  }
  // make a combined value used for cloning (duct names, endpoints, etc.)
  makeComboValue(cmd,type) {
    console.log("$$$ makeComboVal = " + type + ' ' + cmd.values[0]);
    let combo = "";
    if (type === "node_nodenum") 
      combo = cmd.values[0];
    else if (type === "node_nodekey") 
      combo = cmd.values[0];
    else if (type === "host_hostkey") 
      combo = cmd.values[0];
    else if (type === "host_ipaddr") 
      combo = cmd.values[0];
    else if (type === "bpv6rc_endpoint"
          || type === "bpv7rc_endpoint")
      combo = "ipn:" + cmd.values[0] + '.' + cmd.values[1];
    else if (type === "bpv6rc_induct_ltp"
          || type === "bpv6rc_induct_bssp"
          || type === "bpv7rc_induct_ltp"
          || type === "bpv7rc_induct_bssp")
      combo = cmd.values[0];
    else if (type === "bpv6rc_induct_udp"
          || type === "bpv6rc_induct_stcp"
          || type === "bpv6rc_induct_tcp"
          || type === "bpv6rc_induct_dccp" 
          || type === "bpv7rc_induct_tcp"
          || type === "bpv7rc_induct_stcp"
          || type === "bpv7rc_induct_tcp"
          || type === "bpv7rc_induct_dccp" )
      combo = cmd.values[0] + ':' + cmd.values[1];
    else if (type === "bpv6rc_outduct_ltp"
          || type === "bpv6rc_outduct_bssp"
          || type === "bpv7rc_outduct_ltp"
          || type === "bpv7rc_outduct_bssp")
      combo = cmd.values[0];
    else if (type === "bpv6rc_outduct_stcp"
          || type === "bpv6rc_outduct_tcp"
          || type === "bpv6rc_outduct_dccp" 
          || type === "bpv6rc_outduct_udp"
          || type === "bpv7rc_outduct_stcp"
          || type === "bpv7rc_outduct_tcp"
          || type === "bpv7rc_outduct_dccp" 
          || type === "bpv7rc_outduct_udp")
      combo = cmd.values[0];
    else if (type === "ltprc_start_udp"
          || type === "ltprc_start_dccp" )
      combo = cmd.values[0] + ':' + cmd.values[1];
    return combo;
  }
  // find a cloneValue based on type & value
  findCloneVal(cloneVals,type,value) {
    if (value === '??')   // just a fake default value
      return null;
    let target = String(value);  // force string compare, avoid num issues
    for (var key in cloneVals) {
      let cloneVal = cloneVals[key];
      //console.log("$$$ checking cloneVal: " + JSON.stringify(cloneVal));
      if (cloneVal.type === type && String(cloneVal.value) === target) 
        return cloneVal;
    }
    console.log ("!!! failed to find cloneVal for type: " + type + "  value: " + value);
    return null;
  }
  // find any cloneValue based on type (defaults for new commands)
  getAnyCloneVal(cloneVals,type) {
    for (var key in cloneVals) {
      let cloneVal = cloneVals[key];
      //console.log("$$$ finding any cloneVal: " + JSON.stringify(cloneVal));
      if (cloneVal.type === type)
        return cloneVal.value;
    }
    console.log ("!!! found no cloneVal for type: " + type);
    return "";
  }
  // find a cloneValue based on type & value
  getCloneVal(cloneVals,cmdKey) {
    for (var key in cloneVals) {
      let cloneVal = cloneVals[key];
      //console.log("$$$ checking cloneVal: " + JSON.stringify(cloneVal));
      if (cloneVal.id === cmdKey) {
        return cloneVal;
      }
    }
    console.log ("!!! failed to get cloneVal for cmdKey: " + cmdKey);
    return null;
  }
  // delete cloneVals for a deleted Command
  deleteCloneVals(cloneVals,cmdKey) {
    console.log ("!!! deleting cloneVals for cmd: " + cmdKey);
    for (var key in cloneVals) {
      let cloneVal = cloneVals[key];
      if (cloneVal.id === cmdKey)
        delete cloneVals[key];
    }
  }
  //remove configKey from Node
  removeConfigKey(nodes,nodeKey,configKey) {
    console.log ("!!! removing node configKey: " + configKey);
    let node = nodes[nodeKey];
    let idx = node.configKeys.indexOf(configKey);
    node.configKeys.splice(idx,1);
  }
  //remove cmdKey from Config
  removeCmdKey(configs,configKey,cmdKey) {
    console.log ("!!! removing config cmdKey: " + cmdKey);
    let config = configs[configKey];
    let idx = config.cmdKeys.indexOf(cmdKey);
    config.cmdKeys.splice(idx,1);
  }
  //remove ipAddrKey from Host
  removeIpAddrKey(hosts,hostKey,ipAddrKey) {
    console.log ("!!! removing ipAddrKey: " + ipAddrKey);
    let host = hosts[hostKey];
    let idx = host.ipAddrKeys.indexOf(ipAddrKey);
    host.ipAddrKeys.splice(idx,1);
  }
  // use list of value objects to build selector option elements
  mapOptionElems(values) {
    console.log("makeOptionElems " + JSON.stringify(values))
    var optionItems = values.map( 
      (val) => {
        var option = val.value;
        var text   = val.label;
        return <option key={option} value={option}>{option}    == {text}</option>;
      }
    );
    return optionItems;
  }
  // make a dynamic option selection based on one type of
  // cloneVals
  makeTypeOptions(type,localNodeKey,matchType) {
    console.log("makeTypeOptions for type: " + type + " localNodeKey:" + localNodeKey + " matchType: " + matchType);
    // NOTE: matchType is with respect to local node key
    //    "match"    must match local node key
    //    "exclude"  must exclude local node key
    //    "all"      match all nodes
    let typeVals = [];
    let cloneVals = this.state.cloneValues;
    for (var cmdKey in cloneVals) {
      let cloneVal = cloneVals[cmdKey];
      let cloneNodeKey = cloneVal.nodeKey; 
      console.log("makeTypeOptions check " + cmdKey + " nodeKey: " + cloneNodeKey);
      // exclude local clones...want external clones only 
      if (matchType === "exclude" && cloneNodeKey === localNodeKey)  
        continue;
      // include only local clones
      if (matchType === "match" && cloneNodeKey !== localNodeKey)  
        continue;
      if (cloneVal.type === type) 
        typeVals.push(cloneVal);
    }
    // sort values in ascending order
    typeVals = typeVals.sort( function(a,b) {return (a.value > b.value) ? 1 : ((b.value > a.value) ? -1 : 0); } );
    console.log("makeTypeOptions typeVals: " + JSON.stringify(typeVals) );
    var optionItems = typeVals.map( 
      (typeVal) => {
        var option = typeVal.value;
        var text = typeVal.label;
        console.log("makeTypeOptions option= " + option + " text= " + text);
        return <option key={option} value={option}>{option}    == {text}</option>;
      } 
    );
    // the first item is not selectable, so this is a placeholder comment
    optionItems.unshift(<option key="none" value="none">(Select)</option>);
    return optionItems;
  }
  // make static options from selections json
  makeOptionElems(paramId) {
    console.log("makeOptionElems paramId: " + paramId);
    const sels = selections[paramId];
    var optionItems = sels.map( 
      (selection,idx) => {
        var option = Object.keys(selection)[0];   // get the first & only key
        var text = selection[option];
        return <option key={idx} value={option}>{option}    == {text}</option>;
      } 
    );
    optionItems.unshift(<option key="none" value="none">(Select)</option>);
    return optionItems;
  }
  // get option's text from selections json
  getOptionText(paramId,option) {
    const sels = selections[paramId];
    //console.log("getOptionText paramId:" + paramId + " option: " + option);
    for (var i = 0; i < sels.length; i++) {
      var select = sels[i];
      if(Object.keys(select)[0] === option) {
        return select[option];
      }
    }
    return "";
  }
  // make Model Load Buttons elem
  makeModelButtonsElem() {
    var dimNetBtns = false;
    if (this.state.makeNewNetModel ||
        this.state.loadNetModel)
      dimNetBtns = true;
    var dimIonBtns = false;
    if (this.state.makeNewIonModel ||
        this.state.loadIonModel)
      dimIonBtns = true;
  	return (
  	  <Row>
        <Col className="text-right" sm={2}><h4><b>Net Model File</b></h4></Col>
        <Col sm={2}>
          <ButtonToolbar>
            <Button  bsSize="sm" bsStyle="primary" disabled={dimNetBtns} onClick={this.loadNetModel.bind(this)}>Load</Button>
            <Button  bsSize="sm" bsStyle="primary" disabled={dimNetBtns} onClick={this.newNetModel.bind(this)}>New</Button>
          </ButtonToolbar>
        </Col>
        <Col sm={2}>
          <h4><b>...can initialize a new...</b></h4>
        </Col>
        <Col className="text-right" sm={2}><h4><b>ION Model File</b></h4></Col>
        <Col sm={2}>
          <ButtonToolbar>
            <Button  bsSize="sm" bsStyle="primary" disabled={dimIonBtns} onClick={this.loadIonModel.bind(this)}>Load</Button>
            <Button  bsSize="sm" bsStyle="primary" disabled={dimIonBtns} onClick={this.newIonModel.bind(this)}>New</Button>
          </ButtonToolbar>
        </Col>
      </Row>
    );
  }

  // make Ion Model Loader element
  makeIonModelLoaderElem() {
  	console.log("++++makeIonModelLoaderElem");
    const getUniqId = this.getUniqId.bind(this);

    const makeCloneVal = this.makeCloneVal.bind(this);
    const findCloneVal = this.findCloneVal.bind(this);
    const noLoadIonModel = this.noLoadIonModel.bind(this);
  	const dispatch = this.dispatch.bind(this);  // make sure dispatch remembers "this"
  	return (
      <IonModelLoader
        key="ionmodel" 
        getUniqId={getUniqId}           // function
        makeCloneVal={makeCloneVal}     // function
        findCloneVal={findCloneVal}     // function
        noLoadIonModel={noLoadIonModel} // function
        dispatch={dispatch}             // function
      /> );
  }
  // build and return a IonModel element
  makeIonModelElem() {
    console.log("makeIonModelElem ionModel:" +JSON.stringify(this.state.ionModel));
    const name = this.state.ionModel.name;
    const desc = this.state.ionModel.desc;
    const nextNodeNum = this.state.ionModel.nextNodeNum;
    const current = this.state.ionModel.currentContacts;
    const graphs = this.state.graphs;
    const hosts = this.state.hosts;
    const ipaddrs = this.state.ipaddrs;
    const nodes = this.state.nodes;
    const configs = this.state.configs;
    const commands = this.state.commands;
    const cloneVals = this.state.cloneValues;

    const getNodeKey = this.getNodeKey.bind(this);
    const isGoodName = this.isGoodName.bind(this);
    const usedNodeKey = this.usedNodeKey.bind(this);
    const isGoodNodeKey = this.isGoodNodeKey.bind(this);
    const isGoodNodeNum = this.isGoodNodeNum.bind(this);
    const getValues = this.getValues.bind(this);
    const makeOptElems = this.makeOptionElems.bind(this);
    const makeTypeOpts = this.makeTypeOptions.bind(this); 
    const getOptText = this.getOptionText.bind(this);
    const dispatch = this.dispatch.bind(this);  // make sure dispatch remembers "this"

    return (
      <IonModel
        key={name}                // unique id

        name={name}               // state
        desc={desc}               // state
        nextNodeNum={nextNodeNum} // state
        currentContacts={current} // state
        graphs={graphs}           // state
        hosts={hosts}             // state
        ipaddrs={ipaddrs}         // state
        nodes={nodes}             // state
        configs={configs}         // state
        commands={commands}       // state
        cloneValues={cloneVals}   // state

        isGoodName={isGoodName}           // verify name string is valid
        usedNodeKey={usedNodeKey}         // used as a node key?
        isGoodNodeKey={isGoodNodeKey}     // verify nodeKey not in use
        isGoodNodeNum={isGoodNodeNum}     // verify node num not in use
        getNodeKey={getNodeKey}           // find nodeKey from cmdKey
        getValues={getValues}             // get command value list
        makeOptionElems={makeOptElems}    // options selector
        makeTypeOptions={makeTypeOpts}    // make type options
        getOptionText={getOptText}        // get opt text
        dispatch={dispatch}               // dispatch func for new configs
      />
    );  
  }
  // make Net Model Loader element
  makeNetModelLoaderElem() {
    console.log("++++makeNetModelLoaderElem");
    const netAddrs=this.state.netAddrs  // state
    const noLoadNetModel = this.noLoadNetModel.bind(this);
    const dispatch = this.dispatch.bind(this);  // make sure dispatch remembers "this"
    return (
      <NetModelLoader
        key="netmodel" 
        netAddrs={netAddrs}             // state
        noLoadNetModel={noLoadNetModel} // function
        dispatch={dispatch}             // function
      /> );
  }
  // build and return a NetModel element
  makeNetModelElem(netElems) {
    console.log("makeNetModelElem netModel:" +JSON.stringify(this.state.netModel));
    const name = this.state.netModel.name;
    const desc = this.state.netModel.desc;
    const netHosts = this.state.netHosts;
    const netNodes = this.state.netNodes;
    const netHops = this.state.netHops;
    const netAddrs = this.state.netAddrs;
    const getIonModel = this.getIonModel.bind(this);
    const isGoodName = this.isGoodName.bind(this);
    const isGoodNetHostKey = this.isGoodNetHostKey.bind(this);
    const isGoodNetNodeKey = this.isGoodNetNodeKey.bind(this);
    const isGoodNetHopKey = this.isGoodNetHopKey.bind(this);
    const makeOptElems = this.makeOptionElems.bind(this);
    const mapOptElems = this.mapOptionElems.bind(this);
    const makeTypeOpts = this.makeTypeOptions.bind(this);
    const getUniqId = this.getUniqId.bind(this);
    const makeCloneVal = this.makeCloneVal.bind(this); 
    const findCloneVal = this.findCloneVal.bind(this); 
    const isStandProt = this.isStandardProtocol.bind(this);

    const dispatch = this.dispatch.bind(this);  // make sure dispatch remembers "this"

    return (
      <NetModel
        key={name}                // unique id

        name={name}               // state
        desc={desc}               // state
        netHosts={netHosts}       // state
        netNodes={netNodes}       // state
        netHops={netHops}         // state
        netAddrs={netAddrs}       // state
  
        getIonModel={getIonModel}            // get ion model handle
        isGoodName={isGoodName}              // verify name string is valid
        isGoodNetHostKey={isGoodNetHostKey}  // verify hostKey not in use
        isGoodNetNodeKey={isGoodNetNodeKey}  // verify nodeKey not in use
        isGoodNetHopKey={isGoodNetHopKey}    // verify hopKey not in use
        dispatch={dispatch}                  // dispatch func for new configs
        makeOptionElems={makeOptElems}       // make static options 
        mapOptionElems={mapOptElems}         // map options elems
        makeTypeOptions={makeTypeOpts}       // make type options
        getUniqId={getUniqId}                // function
        makeCloneVal={makeCloneVal}          // function
        findCloneVal={findCloneVal}          // function
        isStandardProtocol={isStandProt}     // check protocol
      />
    );  
  }
  makeNewNetElem() {
    console.log("makeNewNetElem");
    const id = this.state.newNetModelName;
    var form =
      <FormControl bsSize="sm" type="text" value={id} spellCheck="false" onChange={this.handleNewNet}/>;
    const icon = 'remove';
    return (
      <div>
        <hr />
        <Col className="text-right" sm={2}><b>New Net Model Name:</b></Col>
        <Col sm={1}>{form}</Col>
        <Col sm={1}>(no spaces)</Col>
        <Col sm={2}>
          <ButtonToolbar>
            <Button bsSize="sm" bsStyle="primary" onClick={this.submitNewNet}>Submit</Button>
            <Button bsSize="sm" bsStyle="success" onClick={this.noNewNetModel.bind(this)}><Glyphicon glyph={icon} /></Button>
          </ButtonToolbar>
        </Col>
      </div>
    );
  }
  makeNewIonElem() {
    console.log("makeNewIonElem");
    const id = this.state.newIonModelName;
    var form =
      <FormControl bsSize="sm" type="text" value={id} spellCheck="false" onChange={this.handleNewIon}/>;
    const icon = 'remove';
    return (
      <div>
        <hr />
        <Col className="text-right" sm={2}><b>New ION Model Name:</b></Col>
        <Col sm={1}>{form}</Col>
        <Col sm={1}>(no spaces)</Col>
        <Col sm={2}>
          <ButtonToolbar>
            <Button bsSize="sm" bsStyle="primary" onClick={this.submitNewIon}>Submit</Button>
            <Button bsSize="sm" bsStyle="success" onClick={this.noNewIonModel.bind(this)}><Glyphicon glyph={icon} /></Button>
          </ButtonToolbar>
        </Col>
      </div>
    );
  }
  // upon any parameter UPDATE transaction
  // check if a clone entry must be updated 
  //  ... and therfore cloning is needed 
  // (command value is already changed)
  updateClones(cmds,cloneVals,nodeKey,cmdObj,tranTime) {
    let cmdKey = cmdObj.id;
    let cmdTypeKey = cmdObj.typeKey;
    let isCloned = false;
    if (cmdTypeKey === "node_nodenum")    // special model commands (non-ion)
      isCloned = true;
    else
    if (cmdTypeKey === "host_ipaddr")    // special model commands (non-ion)
      isCloned = true;
    else {
      let cmdType = cmdTypes[cmdTypeKey];
      isCloned = cmdType.isCloned;
    }
    console.log("=== updateClones().  type: " + cmdKey + " isCloned: " + isCloned);
    if (isCloned) {
      // the clone source is command-centric & presumes exactly one clone-able value is possible
      //  ... that clone-able value may be complex, like endpoints or duct names
      //  and complex values must be built from the full command value list

      let cloneVal = this.getCloneVal(cloneVals,cmdKey);
      if (cloneVal){
        console.log("=== updating cloneVal.");
        let newCloneVal = this.makeCloneVal(nodeKey,cmdObj);  // build new cloneVal
        newCloneVal.clones = cloneVal.clones;              //recapture clones list
        cloneVal = newCloneVal;             // replace the cloneVal object
        cloneVals[cmdKey] = newCloneVal;    // update the cloneVals array

        // then update each dependent clone command
        for (let i = 0; i < cloneVal.clones.length; i++) {
          let clone = cloneVal.clones[i]
          console.log("$$$updating clone cmd: " + clone.cmdKey + " value #:" + clone.valIdx);
          let clonedCmd = cmds[clone.cmdKey];
          let vals = clonedCmd.values;
          vals[clone.valIdx] = cloneVal.value;
          this.updateCommand(cmds,clone.cmdKey,tranTime,vals);
          // now check for recursive cloning!
          let cloneCmdType = cmdTypes[clonedCmd.typeKey];
          // now check if we just updated a clone-able command...causing a chain reaction
          if (cloneCmdType.isCloned) {
            this.updateClones(cmds,cloneVals,nodeKey,clonedCmd,tranTime);
          }
        }
      }
    }
    // console.log("=== Review updated cloneVals. ");
    //for (let key in cloneVals) {
      //let cloneVal = cloneVals[key];
      //console.log("$$$ checking cloneVal: " + JSON.stringify(cloneVal));
    //}
    return null;
  }
  // function to update one command 
  //  (may be many from one transaction due to cloning)
  updateCommand(cmds,cmdKey,tranTime,values) {
    console.log("updating cmdKey:" + cmdKey + " to " + JSON.stringify(values));
    cmds[cmdKey].values = values;
    cmds[cmdKey].lastUpdate = tranTime;
    return null;
  }
  // check if this commmand has a cloned parameter
  cmdIsCloned (cmdKey) {
    const cmdType = this.getCmdType(cmdKey);
    if (cmdType.copyClone || cmdType.pickClone)
      return true;
    return false;
  }
  getCmdCloneType (cmdKey) {
    let cmdType = this.getCmdType(cmdKey);
    for (let i = 0; i < cmdType.paramTypes.length; i++) {
      let paramTypeKey = cmdType.paramTypes[i];
      let paramType = paramTypes[paramTypeKey];
      if (paramType.pickClone || paramType.copyClone)
        return paramType.valType;
    }
    console.log("getCmdCloneType found none.");
    return "";
  }
  // get cloned value from parameter list
  getCmdClonedValue (cmdKey) {
    const cmd = this.state.commands[cmdKey];
    let cmdType = this.getCmdType(cmdKey);
    for (let i = 0; i < cmdType.paramTypes.length; i++) {
      let paramTypeKey = cmdType.paramTypes[i];
      let paramType = paramTypes[paramTypeKey];
      if (paramType.pickClone || paramType.copyClone)
        return cmd.values[i];
    }
    console.log("getCmdClonedValue found none.");
    return "";
  }
  // an update to a "picked" cloneValue requires updates to clone lists
  switchCloneVal(cloneVals, cmdKey, values, initValues) {
    console.log("switchCloneVals was:" + JSON.stringify(initValues));
    console.log("switchCloneVals  is:" + JSON.stringify(values));
    let cmdType = this.getCmdType(cmdKey);
    for (let i = 0; i < cmdType.paramTypes.length; i++) {
      let paramTypeKey = cmdType.paramTypes[i];
      let paramType = paramTypes[paramTypeKey];
      if (paramType.pickClone) {  // this might need a switch
        if(values[i] !== initValues[i]) {
          console.log("+++ switchCloneVals found value change for param:" + i);
          this.removeClone(cloneVals,cmdKey,paramType.valType,initValues[i]);
          this.addClone(cloneVals,cmdKey,paramType.valType,values[i],i);
        }
      }
    }
    console.log("=== Review updated cloneVals.");
    //for (let key in cloneVals) {
      //let cloneVal = cloneVals[key];
      //console.log("$$$ checking cloneVal: " + JSON.stringify(cloneVal));
    //}
    return null;
  }
  removeClone(cloneVals,cmdKey,type,value) {
    console.log("removeClone cmdKey:"+ cmdKey + " type: " + type + " value: " + value);
    if (value === '??')   // just a fake default value
      return null;
    let cloneVal = this.findCloneVal(cloneVals,type,value);
    if (cloneVal !== null) {
      for (let i=0; i<cloneVal.clones.length; i++) {
        let cloneObj = cloneVal.clones[i];
        if (cmdKey === cloneObj.cmdKey) {
          console.log("deleting clone entry no: " + i);
          cloneVal.clones.splice(i,1);
          break;
        }
      }
    }
  }
  addClone(cloneVals,cmdKey,type,value,valIdx) {
    console.log("addClone cmdKey:"+ cmdKey + " type: " + type + " value: " + value);
    let cloneVal = this.findCloneVal(cloneVals,type,value);
    if (cloneVal === null) {
      console.log("!!! Failed to addClone for " + cmdKey + " value: " + value);
      return;
    }
    let clone = { "cmdKey" : cmdKey, "valIdx" : valIdx };
    cloneVal.clones.push(clone);
    console.log("$$$ checking add to  cloneVal: " + JSON.stringify(cloneVal));
  }
  // special case of nodeNum clone
  getNodeNum(nodeKey) {
    console.log("getNodeNum nodeKey: " + nodeKey);
    let nodes = this.state.nodes;
    let node = nodes[nodeKey];
    return node.ionNodeNum;
  }
  setNodeNum(nodeKey,nodeNum) {
    console.log("setNodeNum nodeKey: " + nodeKey + " nodeNum =" + nodeNum);
    let nodes = this.state.nodes;
    let node = nodes[nodeKey];
    node.ionNodeNum = nodeNum;
    return null;
  }
  // all transactions are handled centrally with the combined state (REDUX-style)
  dispatch(transaction) {
    console.log("====dispatch called with transaction: "+ JSON.stringify(transaction));
    const now = new Date();
    const tranTime = now.format("YYYY-MM-DDThh:mm");
    // containers for new state
    var newIonModel;
    var newNetModel; 
    var newNodes;
    var newHosts;
    var newIpAddrs;
    var newNetHosts;
    var newNetNodes;
    var newNetHops;
    var newGraphs;
    var newConfigs;
    var newCommands;
    var newCloneVals;
    var graphKey;
    var nodeKey;
    var hostKey;
    var hopKey;
    var ipAddr;
    var configKey;
    var cmdKey;
    var cmdObj;
    var cloneVal;
    var cmdType;
    var configType;
    var desc;
    var initVals;
    var numCmdKey;
    var nodeCmdKey;
    var nodeHost;
    var nodeType;
    var endpointID;
    var ipAddrKey;
    var services;


    switch(transaction.action) {
      case "UPDATE-COMMAND":
        console.log("dispatch UPDATE called!");
        newCommands = Object.assign( {}, this.state.commands);
        newCloneVals = Object.assign( {}, this.state.cloneValues);
        // first update primary command
        nodeKey = transaction.nodeKey;
        cmdKey = transaction.cmdKey;
        cmdType = this.getCmdType(cmdKey);
        console.log("UPDATE cmdType=" + JSON.stringify(cmdType));
        if (cmdType.pickClone) {  // could this command be choosing a different clone value?
           //  a change of selection must notify the cloneVals
          initVals = this.getValues(cmdKey);
          console.log("+++ A better init vals??:"+ JSON.stringify(initVals));
          this.switchCloneVal(newCloneVals,cmdKey,transaction.values,transaction.initValues);
        } 
        this.updateCommand(newCommands,cmdKey,tranTime,transaction.values);
        // now look for cloning
        cmdObj = newCommands[cmdKey];
        this.updateClones(newCommands,newCloneVals,nodeKey,cmdObj,tranTime);
        this.setState({ 
          "commands" : newCommands, 
          "cloneValues" : newCloneVals
        });
        console.log("new values of cmd: " + cmdKey + " are " + JSON.stringify(this.state.commands[cmdKey].values));
        console.log("new commands (all):" + JSON.stringify(this.state.commands));
        console.log("=== Review updated cloneVals.");
        let cloneVals = this.state.cloneValues;
        for (let key in cloneVals) {
          let cloneVal = cloneVals[key];
          console.log("$$$ checking cloneVal: " + JSON.stringify(cloneVal));
        }
        break;

      case "DELETE-COMMAND":
        console.log("dispatch DELETE-COMMAND called!");
        newConfigs = Object.assign( {}, this.state.configs); 
        newCommands = Object.assign( {}, this.state.commands);
        newCloneVals = Object.assign( {}, this.state.cloneValues);
        // first update primary command
        nodeKey = transaction.nodeKey;
        cmdKey = transaction.cmdKey;
        configKey = transaction.configKey;
        if (this.cmdIsCloned(cmdKey)) {
          let cloneType = this.getCmdCloneType(cmdKey);
          let cloneVal = this.getCmdClonedValue(cmdKey);
          console.log("$$$ call removeClone " + cmdKey + " " + cloneType + " " + cloneVal);
          this.removeClone(newCloneVals,cmdKey,cloneType,cloneVal);
        }
        this.deleteCloneVals(newCloneVals,cmdKey);
        this.removeCmdKey(newConfigs,configKey,cmdKey);
        delete newCommands[cmdKey];
        console.log("=== Review updated cloneVals. ");
        for (let key in newCloneVals) {
          let cloneVal = newCloneVals[key];
          console.log("$$$ checking cloneVal: " + JSON.stringify(cloneVal));
        }
        this.setState({ 
          "commands" : newCommands, 
          "cloneValues" : newCloneVals
        });
        break;

      case "NEW-COMMAND":
        console.log("dispatch NEW-COMMAND called!");
        console.log("NEW-COMMAND state.commands cnt: " + Object.keys(this.state.commands).length);
        newConfigs = Object.assign( {}, this.state.configs);        
        newCommands = Object.assign( {}, this.state.commands);
        newCloneVals = Object.assign( {}, this.state.cloneValues);
        configKey = transaction.configKey;
        const cmdTypeKey = transaction.cmdTypeKey;
        nodeKey = transaction.nodeKey;
        cmdType = cmdTypes[cmdTypeKey];
        const cmdName = cmdType.name;
        cmdKey = "cmd_" + this.getUniqId();
        const valCnt = cmdType.paramCnt;
        const order = cmdType.order;
        const values = [];
 
        for (var i=0; i<valCnt; i++) { 
          let paramTypeKey = cmdType.paramTypes[i];
          let paramType = paramTypes[paramTypeKey];
          console.log("NEW-COMMAND paramType: " + JSON.stringify(paramType));
          let copyClone = false;
          let pickClone = false;
          if (paramType.hasOwnProperty("copyClone"))  // 1st check for existence
            copyClone = paramType.copyClone;
          if (paramType.hasOwnProperty("pickClone"))  // 1st check for existence
            pickClone = paramType.pickClone;
          if (copyClone && paramType.valType === "nodeNum") {
            let nodeNum = this.getNodeNum(nodeKey);
            values.push(nodeNum);
            this.addClone(newCloneVals,cmdKey,"nodeNum",nodeNum,i);
          }
          else if (copyClone && paramType.valType === "nodeKey") {
            values.push(nodeKey);
            this.addClone(newCloneVals,cmdKey,"nodeKey",nodeKey,i);
          }
          else if (pickClone) {
            //let pickVal = this.getAnyCloneVal(newCloneVals,paramType.valType);
            //values.push(pickVal);
            values.push("??");
          }
          else if (paramType.showDefault)
            if (paramType.hasOwnProperty('defaultValue'))
              values.push(paramType.defaultValue);
            else
              alert("No defaultValue provided for: " + paramTypeKey);
          else
            values.push("");
        };
        console.log("NEW-COMMAND old cmds cnt: " + Object.keys(newCommands).length);
        newCommands[cmdKey] = { 
            "id": cmdKey, 
            "configKey" : configKey,
            "typeKey" : cmdTypeKey,
            "typeName" : cmdName,
            "order" : order,
            "lastUpdate" : tranTime,
            "values" : values
        };
        console.log("NEW-COMMAND new cmds cnt: " + Object.keys(newCommands).length);
        let cmdKeyList = newConfigs[configKey].cmdKeys;
        let idx = 0;
        for (idx = 0; idx < cmdKeyList.length; idx++) {
          let cmdKey = cmdKeyList[idx];
          let cmd = newCommands[cmdKey];
          let next = cmd.order;
          console.log("checking order: " + order + " vs. next: " + next);
          if (order < next)
            break;
        }
        console.log("NEW-COMMAND splicing at: " + idx);
        cmdKeyList.splice(idx,0,cmdKey);
        console.log("NEW-COMMAND cmdList: " + JSON.stringify(cmdKeyList));
        // if cloned, build object with clone-able value
        // yes, even if required values are un-specified!
        if (cmdType.isCloned) {
          cloneVal = this.makeCloneVal(nodeKey,newCommands[cmdKey]);
          var cvKey = cloneVal.id;
          newCloneVals[cvKey] = cloneVal;
        }
        this.setState({ 
          "configs" : newConfigs,
          "commands" : newCommands,
          "cloneValues" : newCloneVals
        });
        console.log("new command idx: " + idx + "  command: " + cmdName + " params:" + values);
        break;

      case "NEW-CONFIG":
        console.log("dispatch NEW-CONFIG called!");
        newNodes = Object.assign( {}, this.state.nodes);
        newConfigs = Object.assign( {}, this.state.configs);
        nodeKey = transaction.nodeKey;
        configType = transaction.configType;
        configKey = nodeKey + "." + configType;
        newConfigs[configKey] = {
          "id" : configKey,
          "nodeKey": nodeKey,
          "configType" : configType,
          "cmdKeys" : [] 
        };
        newNodes[nodeKey].configKeys.push(configKey);
        this.setState({ 
          nodes: newNodes,
          configs: newConfigs
        });
        break;

      case "DELETE-CONFIG":
        console.log("dispatch DELETE-CONFIG called!");
        newNodes = Object.assign( {}, this.state.nodes);
        newConfigs = Object.assign( {}, this.state.configs); 
        // first update primary command
        nodeKey = transaction.nodeKey;
        configKey = transaction.configKey;
        this.removeConfigKey(newNodes,nodeKey,configKey);
        delete newConfigs[configKey];
        this.setState({ 
          "nodes" : newNodes, 
          "configs" : newConfigs
        });
        break;

      case "NEW-NODE":
        console.log("dispatch NEW-NODE called!");
        newIonModel  = Object.assign( {}, this.state.ionModel);
        console.log("newionModel: " + JSON.stringify(newIonModel));
        newNodes = Object.assign( {}, this.state.nodes);
        newCloneVals = Object.assign( {}, this.state.cloneValues);
        nodeKey = transaction.nodeKey;
        var nextNodeNum = +this.state.ionModel.nextNodeNum;
        var topVersion = selections.node_version[0];    // get topmost node_version selection object
        var latestIonVer = Object.keys(topVersion)[0];  // first item assumed to be latest version
        while (!this.isGoodNodeNum(nodeKey,nextNodeNum))  // if not good, increment
          nextNodeNum += 1;
        // artificially create cloneVal for nodeNum  & nodeKey (not directly based on a on ion command)
        numCmdKey = "nodeNum_" + nodeKey;
        cmdObj = { "id": numCmdKey, "typeKey": "node_nodenum", "values":[nextNodeNum]}
        cloneVal = this.makeCloneVal(nodeKey,cmdObj);
        newCloneVals[numCmdKey] = cloneVal;
        nodeCmdKey = "node_" + nodeKey;
        cmdObj = { "id": nodeCmdKey, "typeKey": "node_nodekey", "values":[nodeKey]}
        cloneVal = this.makeCloneVal(nodeKey,cmdObj);
        newCloneVals[nodeCmdKey] = cloneVal;
        console.log("New cloneVals: " + JSON.stringify(newCloneVals));
        newNodes[nodeKey] = {
          "id" : nodeKey,
          "name" : nodeKey, 
          "ionNodeNum" : nextNodeNum,
          "ionVersion" : latestIonVer,
          "hostKey" : "",
          "configKeys" : []
        };
        nextNodeNum += 1;
        newIonModel.nextNodeNum = nextNodeNum;
        this.setState({ 
          ionModel: newIonModel,
          nodes: newNodes,
          cloneValues: newCloneVals
        });
        console.log("New state cloneValues: " + JSON.stringify(this.state.cloneValues));
        break;

      case "UPDATE-NODE":
        console.log("dispatch UPDATE-NODE called!");
        newNodes = Object.assign( {}, this.state.nodes);
        newCommands = Object.assign( {}, this.state.commands);
        newCloneVals = Object.assign( {}, this.state.cloneValues);
        nodeKey = transaction.nodeKey;
        newNodes[nodeKey]["longName"] = transaction.desc;
        newNodes[nodeKey]["ionNodeNum"] = transaction.nodeNum;
        newNodes[nodeKey]["ionVersion"] = transaction.version;
        newNodes[nodeKey]["hostKey"] = transaction.hostKey;
        numCmdKey = "nodeNum_" + nodeKey;
        cmdObj = { "id": numCmdKey, "typeKey": "node_nodenum", "values":[transaction.nodeNum]}
        this.updateClones(newCommands,newCloneVals,nodeKey,cmdObj,tranTime);
        console.log("$$$ updated clones for:" + transaction.nodeNum);
        this.setState({ 
          nodes: newNodes,
          commands: newCommands,
          cloneValues: newCloneVals
        });
        break;

      case "NEW-HOST":
        console.log("dispatch NEW-HOST called!");
        newHosts = Object.assign( {}, this.state.hosts);
        newCloneVals = Object.assign( {}, this.state.cloneValues);
        hostKey = transaction.hostKey;
        newHosts[hostKey] = {
          id: hostKey,
          desc: "",          // default
          linefeed: "unix",  // default
          ipAddrKeys: []
        };
        // create new clone value
        var hostCmdKey = "host_" + hostKey;
        cmdObj = { "id": hostCmdKey, "typeKey": "host_hostkey", "values":[hostKey] };
        cloneVal = this.makeCloneVal("network",cmdObj);
        newCloneVals[hostCmdKey] = cloneVal;
        this.setState({ 
          hosts: newHosts,
          cloneValues: newCloneVals
        });
        console.log("New state cloneValues: " + JSON.stringify(newCloneVals));
        console.log("New state hosts: " + JSON.stringify(newHosts));
        break;

      case "UPDATE-HOST":
        console.log("dispatch UPDATE-HOST called!");
        newHosts = Object.assign( {}, this.state.hosts);
        hostKey = transaction.hostKey;
        newHosts[hostKey]["desc"] = transaction.desc;
        newHosts[hostKey]["linefeed"] = transaction.linefeed;
        // ipAddrs are created/edited/deleted separately
        // no affect on clone values
        this.setState({ 
          hosts: newHosts
        });
        break;

      case "NEW-IPADDR":
        console.log("dispatch NEW-IPADDR called!");
        newHosts = Object.assign( {}, this.state.hosts);
        newIpAddrs = Object.assign( {}, this.state.ipaddrs);
        newCloneVals = Object.assign( {}, this.state.cloneValues);
        hostKey = transaction.hostKey;
        ipAddr = transaction.ipAddr;

        // set up clone value
        ipAddrKey = "ipAddr_" + this.getUniqId();
        cmdObj = { "id": ipAddrKey, "typeKey": "host_ipaddr", "values":[ipAddr] };
        cloneVal = this.makeCloneVal(hostKey,cmdObj);
        newCloneVals[ipAddrKey] = cloneVal;

        newHosts[hostKey].ipAddrKeys.push(ipAddrKey);
        newIpAddrs[ipAddrKey] = {
          "id" : ipAddrKey,
          "hostKey" : hostKey,
          "ipAddr" : ipAddr
        }
        this.setState({ 
          hosts: newHosts,
          ipaddrs: newIpAddrs,
          cloneValues: newCloneVals
        });
        console.log("New state cloneValues: " + JSON.stringify(newCloneVals));
        console.log("New state hosts: " + JSON.stringify(newHosts));
        console.log("New state ipaddrs: " + JSON.stringify(newIpAddrs));
        break;

      case "CHANGE-IPADDR":
        console.log("dispatch CHANGE-IPADDR called!  host: " + transaction.hostKey + " addr: " + transaction.ipAddr);
        // nothing will change in Hosts...the ipAddrKey is unchanged
        newCommands = Object.assign( {}, this.state.commands);   // cloning might change commands
        newIpAddrs = Object.assign( {}, this.state.ipaddrs);
        newCloneVals = Object.assign( {}, this.state.cloneValues);
        hostKey = transaction.hostKey;
        ipAddrKey = transaction.ipAddrKey;
        ipAddr = transaction.ipAddr;  
        newIpAddrs[ipAddrKey].ipAddr = ipAddr;  // update state object
        // update cloneVals and clones
        cmdObj = { "id": ipAddrKey, "typeKey": "host_ipaddr", "values":[ ipAddr ] };
        this.updateClones(newCommands,newCloneVals,hostKey,cmdObj,tranTime);

        this.setState({ 
          ipaddrs: newIpAddrs,
          commands: newCommands,
          cloneValues: newCloneVals
        });
        console.log("New state cloneValues: " + JSON.stringify(newCloneVals));
        console.log("New state hosts: " + JSON.stringify(newIpAddrs));
        break;

      case "DELETE-IPADDR":
        console.log("dispatch DELETE-IPADDR called!" + transaction.index + " " + transaction.ipAddr);
        newHosts = Object.assign( {}, this.state.hosts);
        newIpAddrs = Object.assign( {}, this.state.ipaddrs);
        newCloneVals = Object.assign( {}, this.state.cloneValues);
        hostKey = transaction.hostKey;
        ipAddrKey = transaction.ipAddrKey;
        this.removeIpAddrKey(newHosts,hostKey,ipAddrKey);
        delete newIpAddrs[ipAddrKey];
        this.deleteCloneVals(newCloneVals,ipAddrKey);
        this.setState({ 
          hosts: newHosts,
          ipaddrs: newIpAddrs,
          cloneValues: newCloneVals
        });
        console.log("New state cloneValues: " + JSON.stringify(newCloneVals));
        console.log("New state hosts: " + JSON.stringify(newHosts));
        break;

      case "NEW-NET-HOST":
        console.log("dispatch NEW-NET-HOST called! " + transaction.hostKey);
        newNetHosts = Object.assign( {}, this.state.netHosts);
        hostKey = transaction.hostKey;
        newNetHosts[hostKey] = {
          "id" : hostKey,
          "hostDesc" : "",
          "ipAddrs" : []
        };
        this.setState({ 
          netHosts: newNetHosts
        });
        console.log("New state netHosts: " + JSON.stringify(this.state.netHosts));
        break;

      case "UPDATE-NET-HOST":
        console.log("dispatch UPDATE-NET-HOST called!");
        newNetHosts = Object.assign( {}, this.state.netHosts);
        hostKey = transaction.hostKey;
        newIpAddrs = newNetHosts[hostKey].ipAddrs   // just carry old addrs over
        newNetHosts[hostKey] = {
          "id" : hostKey,
          "hostDesc": transaction.desc,
          "ipAddrs" : newIpAddrs
        };
        this.setState({ 
          netHosts: newNetHosts
        });
        console.log("New state netHosts: " + JSON.stringify(newNetHosts));
        break;

      case "DELETE-NET-HOST":
        hostKey = transaction.hostKey;
        console.log("dispatch DELETE-NET-HOST called! " + hostKey);
        newNetHosts = Object.assign( {}, this.state.netHosts);
        delete newNetHosts[hostKey];
        this.setState({ 
          netHosts: newNetHosts
        });
        console.log("New state netHosts: " + JSON.stringify(this.state.netHosts));
        break;

      case "NEW-NETADDR":
        console.log("dispatch NEW-NETADDR called!"+ transaction.hostKey + " addr: " + transaction.ipAddr);
        newHosts = Object.assign( {}, this.state.netHosts);
        newIpAddrs = this.state.netAddrs;
        hostKey = transaction.hostKey;
        ipAddr = transaction.ipAddr;

        newIpAddrs.push(ipAddr);
        newHosts[hostKey].ipAddrs.push(ipAddr);
  
        this.setState({ 
          netHosts: newHosts,
          netAddrs: newIpAddrs,
        });
        console.log("New state net hosts: " + JSON.stringify(newHosts));
        console.log("New state net ipaddrs: " + JSON.stringify(newIpAddrs));
        break;

      case "CHANGE-NETADDR":
        console.log("dispatch CHANGE-NETADDR called!  host: " + transaction.hostKey + " addr: " + transaction.isIpAddr);
        newHosts = Object.assign( {}, this.state.netHosts);
        newIpAddrs = this.state.netAddrs;
        hostKey = transaction.hostKey;
        var isIpAddr = transaction.isIpAddr;
        var wasIpAddr = transaction.wasIpAddr;
        var hostAddrs = newHosts[hostKey].ipAddrs;
        for (i=0; i<newIpAddrs.length; i++) 
          if (newIpAddrs[i] === wasIpAddr) {
            newIpAddrs[i] = isIpAddr;
            break;
          }
        for (i=0; i<hostAddrs.length; i++) 
          if (hostAddrs[i] === wasIpAddr) {
            hostAddrs[i] = isIpAddr;
            break;
          }

        this.setState({ 
          netHosts: newHosts,
          netAddrs: newIpAddrs
        });
        console.log("New state net hosts: " + JSON.stringify(newHosts));
        console.log("New state net addrs: " + JSON.stringify(newIpAddrs));
        break;

      case "DELETE-NETADDR":
        console.log("dispatch DELETE-NETADDR called! " + transaction.hostKey + " " + transaction.ipAddr);
        newHosts = Object.assign( {}, this.state.netHosts);
        newIpAddrs = this.state.netAddrs;
        hostKey = transaction.hostKey;
        ipAddr = transaction.ipAddr;
        for (i=0; i<newIpAddrs.length; i++) 
          if (newIpAddrs[i] === ipAddr) {
            newIpAddrs.splice(i,1);
            break;
          }
        hostAddrs = newHosts[hostKey].ipAddrs;
        for (i=0; i<hostAddrs.length; i++) 
          if (hostAddrs[i] === ipAddr) {
            hostAddrs.splice(i,1);
            newHosts[hostKey].ipAddrs = hostAddrs;
            break;
          }
        this.setState({ 
          netHosts: newHosts,
          netAddrs: newIpAddrs,
        });
        console.log("New state net hosts: " + JSON.stringify(newHosts));
        console.log("New state net addrs: " + JSON.stringify(newIpAddrs));
        break;

      case "NEW-NET-NODE":
        console.log("dispatch NEW-NET-NODE called! " + transaction.nodeKey);
        newNetNodes = Object.assign( {}, this.state.netNodes);
        nodeKey = transaction.nodeKey;
        newNetNodes[nodeKey] = {
          "id" : nodeKey,
          "nodeDesc": "",
          "nodeHost": "",
          "nodeType"  : "",
          "endpointID" : "",
          "services" : []
        };
        this.setState({ 
          netNodes: newNetNodes
        });
        console.log("New state netNodes: " + JSON.stringify(this.state.netNodes));
        break;

      case "UPDATE-NET-NODE":
        console.log("dispatch UPDATE-NET-NODE called!");
        newNetNodes = Object.assign( {}, this.state.netNodes);
        nodeKey = transaction.nodeKey;
        desc = transaction.desc;
        nodeHost = transaction.nodeHost;
        nodeType = transaction.nodeType;
        endpointID = transaction.endpointID;
        services = transaction.services;
        newNetNodes[nodeKey] = {
          "id" : nodeKey,
          "nodeDesc" : desc,
          "nodeHost"  : nodeHost,
          "nodeType"  : nodeType,
          "endpointID" : endpointID,
          "services" : services
        };
        this.setState({ 
          netNodes: newNetNodes
        });
        break;

      case "DELETE-NET-NODE":
        nodeKey = transaction.nodeKey;
        console.log("dispatch DELETE-NET-NODE called! " + nodeKey);
        newNetNodes = Object.assign( {}, this.state.netNodes);
        delete newNetNodes[nodeKey];
        this.setState({ 
          netNodes: newNetNodes
        });
        console.log("New state netNodes: " + JSON.stringify(this.state.netNodes));
        break;

      case "NEW-NET-HOP":
        console.log("dispatch NEW-NET-HOP called! " + transaction.hopKey);
        newNetHops = Object.assign( {}, this.state.netHops);
        hopKey = transaction.hopKey;
        newNetHops[hopKey] = {
          "id" : hopKey,
          "hopDesc": "",
          "toNode": "",
          "fromNode": "",
          "bpLayer" : "",
          "ltpLayer" : "",
          "maxRate" : 0,
          "symmetric" : false
        };
        this.setState({ 
          netHops: newNetHops
        });
        console.log("New state netHops: " + JSON.stringify(this.state.netHops));
        break;

      case "UPDATE-NET-HOP":
        console.log("dispatch UPDATE-NET-HOP called!");
        newNetHops = Object.assign( {}, this.state.netHops);
        hopKey = transaction.hopKey;
        newNetHops[hopKey] = {
          "id" : hopKey,
          "hopDesc": transaction.desc,
          "toNode": transaction.toNode,
          "fromNode": transaction.fromNode,
          "bpLayer" : transaction.bpLayer,
          "ltpLayer" : transaction.ltpLayer,
          "maxRate" : transaction.maxRate,
          "symmetric" : transaction.symmetric
        };
        this.setState({ 
          netHops: newNetHops
        });
        break;

      case "DELETE-NET-HOP":
        hopKey = transaction.hopKey;
        console.log("dispatch DELETE-NET-HOP called! " + hopKey);
        newNetHops = Object.assign( {}, this.state.netHops);
        delete newNetHops[hopKey];
        this.setState({ 
          netHops: newNetHops
        });
        console.log("New state netHops: " + JSON.stringify(this.state.netHops));
        break;

      case "NEW-GRAPH":
        console.log("dispatch NEW-GRAPH called!");
        newGraphs = Object.assign( {}, this.state.graphs);
        newConfigs = Object.assign( {}, this.state.configs);
        graphKey = transaction.graphKey;
        configType = "contacts";
        configKey = graphKey + ".cg";
        console.log("NEW-GRAPH key:" + graphKey + " configKey:" + configKey);
        newConfigs[configKey] = {
          "id" : configKey,
          "nodeKey": graphKey,
          "configType" : configType,
          "cmdKeys" : [] 
        };
        topVersion = selections.node_version[0];    // get topmost node_version selection object
        latestIonVer = Object.keys(topVersion)[0];  // first item assumed to be latest version
        newGraphs[graphKey] = {
          "id" : graphKey,
          "name" : graphKey, 
          "desc" : "",
          "ionVersion" : latestIonVer,
          "configKey" : configKey
        };
        console.log("newGraph: " + JSON.stringify(newGraphs[graphKey]) );
        this.setState({ 
          graphs: newGraphs,
          configs: newConfigs
        });
        break;

      case "UPDATE-GRAPH":
        console.log("dispatch UPDATE-GRAPH called!");
        newGraphs = Object.assign( {}, this.state.graphs);
        graphKey = transaction.graphKey;
        newGraphs[graphKey]["desc"] = transaction.desc;
        newGraphs[graphKey]["ionVersion"] = transaction.version;
        this.setState({ 
          graphs: newGraphs
        });
        break;

      case "LOAD-NET-MODEL":
        console.log("dispatch LOAD-NET-MODEL called!");
        // a loaded net model initilizes these objects completely
        newNetModel = transaction.netModel;
        newNetHosts = transaction.netHosts;
        newNetNodes = transaction.netNodes;
        newNetHops = transaction.netHops;  
        console.log("newNetModel: " + JSON.stringify(newNetModel));
        this.setState ({
          loadNetModel: false,
          netModelActive: true,
          netModel: newNetModel,
          netHosts: newNetHosts,
          netNodes: newNetNodes,
          netHops: newNetHops
        });
        break;

      case "NEW-NET-MODEL":
        console.log("dispatch LOAD-NET-MODEL called!");
        newNetModel = transaction.netModel;
        console.log("newNet:" + JSON.stringify(newNetModel));
        this.setState ({
          newNetModel: false,
          netModelActive: true,
          netModel: newNetModel,
        });
        break;

      case "NEW-ION-MODEL":
        console.log("dispatch LOAD-ION-MODEL called!");
        newIonModel = transaction.ionModel;
        console.log("newIon:" + JSON.stringify(newIonModel));
        this.setState ({
          newIonModel: false,
          ionModelActive: true,
          ionModel: newIonModel,
        });
        break;

      case "LOAD-ION-MODEL":
        console.log("dispatch LOAD-ION-MODEL called!");
        // a loaded ion model initilizes these objects completely
        newIonModel = transaction.ionModel;
        newHosts = transaction.hosts;
        newIpAddrs = transaction.ipaddrs;
        newNodes = transaction.nodes;
        newGraphs = transaction.graphs;  
        newConfigs = transaction.configs;     
        newCommands = transaction.commands;
        newCloneVals = transaction.cloneValues;
        console.log("newIonModel: " + JSON.stringify(newIonModel));
        this.setState ({
          loadIonModel: false,
          ionModelActive: true,
          ionModel: newIonModel,
          hosts: newHosts,
          ipaddrs: newIpAddrs,
          graphs: newGraphs,
          nodes: newNodes,
          configs: newConfigs,
          commands: newCommands,
          cloneValues: newCloneVals
        });
        break;

      case "UPDATE-ION-MODEL":
        console.log("dispatch UPDATE-ION-MODEL called!");
        newIonModel = transaction.ionModel;
        console.log("newIon:" + JSON.stringify(newIonModel));
        this.setState ({
          ionModel: newIonModel,
        });
        break;

      default:
        console.log("dispatch action unknown!!");
        break;
    }
  }
  //  HANDLERS --------
  loadIonModel() {
    console.log("load ION model!");
    this.setState ({ 
      "loadIonModel": true
    });
  };
  noLoadIonModel() {
    console.log("load ION model!");
    this.setState ({ 
      "loadIonModel": false
    });
  };
  newIonModel() {
    console.log("new ION model!");
    this.setState ({ 
      "makeNewIonModel": true
    });
  };
  noNewIonModel() {
    console.log("cancel add a new Ion Model!");
    this.setState({
      makeNewIonModel: false
    });
  };

  loadNetModel() {
    console.log("load Network model!");
    this.setState ({ 
      "loadNetModel": true
    });
  };
  noLoadNetModel() {
    console.log("load Network model!");
    this.setState ({ 
      "loadNetModel": false
    });
  };
  newNetModel() {
    console.log("new Network model!");
    this.setState ({ 
      makeNewNetModel: true
    });
  };
  noNewNetModel() {
    console.log("cancel add a new Network Model!");
    this.setState({
      makeNewNetModel: false
    });
  };

  render() {
    console.log("$$$$$$$$$$$$$$$ App render start");
    //const modelBtnsElem  = this.state.ionModelActive?   "" : this.makeModelButtonsElem();
    const modelBtnsElem  = this.makeModelButtonsElem();
    const ionLoader = this.state.loadIonModel?          this.makeIonModelLoaderElem() : "";
    const ionModelElem  = this.state.ionModelActive?    this.makeIonModelElem() : "";
    const netLoader = this.state.loadNetModel?          this.makeNetModelLoaderElem() : "";
    const netModelElem  = this.state.netModelActive?    this.makeNetModelElem() : "";

    console.log("$$$$$$$$$$$$$$$ App render done");
    const newIon = this.state.makeNewIonModel? this.makeNewIonElem() : "";
    const newNet = this.state.makeNewNetModel? this.makeNewNetElem() : "";
    
    return (
      <div>
        <Navbar>
          <h3>ION Configuration Editor  4.6.1</h3>
        </Navbar>
        <Grid fluid>
          {modelBtnsElem}
          <Row>{newNet}</Row>
          <Row>{netLoader}</Row>
          {netModelElem}
          <Row>{newIon}</Row>
          <Row>{ionLoader}</Row>
          {ionModelElem}
          <hr />
        </Grid>
      </div>
    );
  };
  handleNewNet =(e) => {
    const val = e.target.value;
    console.log("a new network model name! " + val);
    var newState = Object.assign({},this.state);
    newState.newNetModelName = val;
    this.setState (newState);
    e.preventDefault();
  };
  submitNewNet = () => {
    console.log("a new network model tran submitted!");
    const val = this.state.newNetModelName;
    var netObj = { "name": val, "desc": "" };
    const tran = {
      action: "NEW-NET-MODEL",
      netModel: netObj
    };
    this.dispatch(tran);
    this.setState({
      makeNewNetModel: false
    });
  };
  handleNewIon =(e) => {
    const val = e.target.value;
    console.log("a new ion model name! " + val);
    var newState = Object.assign({},this.state);
    newState.newIonModelName = val;
    this.setState (newState);
    e.preventDefault();
  };
  submitNewIon = () => {
    console.log("a new ion model tran submitted!");
    const val = this.state.newIonModelName;
    var ionObj = { "name": val, "desc": "", "nextNodeNum": 1 };
    const tran = {
      action: "NEW-ION-MODEL",
      ionModel: ionObj
    };
    this.dispatch(tran);
    this.setState({
      makeNewIonModel: false
    });
  };
}
