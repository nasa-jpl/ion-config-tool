//        IonModelLoader.jsx     IonModelLoader React Component
//
//        Copyright (c) 2018, California Institute of Technology.
//        ALL RIGHTS RESERVED.  U.S. Government Sponsorship
//        acknowledged.
//                                                                   
//      Author: Rick Borgen, Jet Propulsion Laboratory         
//                                                               
import React from 'react';
import {FormControl} from 'react-bootstrap';
import {Col} from 'react-bootstrap';
import {Button, ButtonToolbar} from 'react-bootstrap';
import {Glyphicon} from 'react-bootstrap';
import {Alert} from 'react-bootstrap';

import cmdTypes     from './cmdTypes.json';
import paramTypes   from './paramTypes.json';

export default class IonModelLoader extends React.Component {
  propTypes: {
    getUniqId: React.PropTypes.func.isRequired,     // func to make a uniq id
    makeCloneVal: React.PropTypes.func.isRequired,  // func to make a cloneVal
    findCloneVal: React.PropTypes.func.isRequired,  // func to find a cloneVal
    noLoadIonModel: React.PropTypes.func.isRequired,// func to cancle load of model
    dispatch: React.PropTypes.func.isRequired       // func to handle transactions centrally
  };

  constructor (props) {
    super(props);
    console.log("IonModelLoader ctor");
    var ionObj = { "name": "test", "desc": "Test ION Model", "nextNodeNum": 1, "currentContacts": ""};
    this.state = {
      ion: ionObj,         // model attributes
      modelFile: "",       // File object
      modelJson: {},       // JSON object
      hosts: {},
      ipaddrs: {},
      graphs: {},
      nodes: {},
      configs: {},
      commands: {},
      cloneValues: {},

      errMsg: ""
    };
    console.log("IonModelLoader ctor done.");
  }
  setError(msg) {
    console.log(msg);
    var newState = Object.assign({},this.state);
    newState.errMsg = msg;
    this.setState (newState);
  };
  extractModel () {
    // extract the Ion config JSON structure &
    // flatten the data structures for efficient access

    // make short names for state objects
    const modelObj = this.state.modelJson;
    var ion = this.state.ion;
    var hosts = this.state.hosts;
    var ipaddrs = this.state.ipaddrs;
    var nodes = this.state.nodes;
    var graphs = this.state.graphs;
    var cloneValues = this.state.cloneValues;

    console.log("=== Ingesting user ion model.  ion: " + JSON.stringify(ion));
    console.log("ion WAS: " + JSON.stringify(ion));
    if(modelObj.hasOwnProperty("ionModelName"))
      ion.name = modelObj["ionModelName"];
    else {
       this.setError("The json file is not an Ion Model.");
       return false;
    }
    if(modelObj.hasOwnProperty("ionModelDesc"))
      ion.desc = modelObj["ionModelDesc"];
    if(modelObj.hasOwnProperty("nextNodeNum"))
      ion.nextNodeNum = modelObj["nextNodeNum"];
    if(modelObj.hasOwnProperty("currentContacts"))
      ion.currentContacts = modelObj["currentContacts"];

    var hostList = [];
    if(modelObj.hasOwnProperty("hosts"))  // optional for now.
      hostList = modelObj.hosts;
    for (var i=0; i<hostList.length; i++) {
      var hostObj = hostList[i];
      var hostKey = hostObj.hostName;
      var ipAddrs = hostObj.ipAddrs;
      // build the nodes state object
      hosts[hostKey] = { 
        "id" : hostKey, 
        "name" : hostObj["hostName"], 
        "desc" : hostObj["hostDesc"], 
        "linefeed" : hostObj["linefeed"],
        "ipAddrKeys" : []
      };
      let hostCmdKey = "host_" + hostKey;
      let cmdObj = { "id": hostCmdKey, "typeKey": "host_hostkey", "values":[ hostKey ] };
      let cloneVal = this.props.makeCloneVal(hostKey,cmdObj);
      cloneValues[hostCmdKey] = cloneVal;
      // get ipAddrs
      const ipCnt = ipAddrs?  ipAddrs.length : 0 ;
      for (var j=0; j<ipCnt; j++) { 
        let uniqid = this.props.getUniqId();
        let ipCmdKey = "ipAddr_" + uniqid;
        let ipAddr = ipAddrs[j];
        ipaddrs[ipCmdKey] = {
          "id" : ipCmdKey,
          "hostKey" : hostKey,
          "ipAddr" : ipAddr
        }
        hosts[hostKey].ipAddrKeys.push(ipCmdKey);
        let ipObj = { "id": ipCmdKey, "typeKey": "host_ipaddr", "values":[ ipAddr ] };
        let cloneVal = this.props.makeCloneVal(hostKey,ipObj);
        cloneValues[ipCmdKey] = cloneVal;
      }
    };
    console.log("ion IS:  " + JSON.stringify(ion));
    var nodeList = [];
    if(modelObj.hasOwnProperty("nodes"))  // optional for now.
      nodeList = modelObj.nodes;
    for (i=0; i<nodeList.length; i++) {
      var nodeObj = nodeList[i];
      var nodeKey = nodeObj["nodeName"];
      // build the nodes state object
      nodes[nodeKey] = { 
        "id" : nodeObj["nodeName"], 
        "longName" : nodeObj["nodeDesc"], 
        "ionNodeNum" : nodeObj["nodeNum"],
        "ionVersion" : nodeObj["ionVersion"],
        "hostKey" : nodeObj["hostName"],
        "configKeys" : []
      };
      // build nodenum & nodekey clone value
      let numCmdKey = "nodeNum_" + nodeKey;
      let cmdObj = { "id": numCmdKey, "typeKey": "node_nodenum", "values":[ nodeObj["nodeNum"] ] };
      let cloneVal = this.props.makeCloneVal(nodeKey,cmdObj);
      cloneValues[numCmdKey] = cloneVal;
      let nodeCmdKey = "nodeKey_" + nodeKey;
      cmdObj = { "id": nodeCmdKey, "typeKey": "node_nodekey", "values":[ nodeKey ] };
      cloneVal = this.props.makeCloneVal(nodeKey,cmdObj);
      cloneValues[nodeCmdKey] = cloneVal;

      console.log("node item=" + JSON.stringify(nodeObj) );
      var configsObj = nodeObj.configs;
      console.log("node configs=" + JSON.stringify(configsObj) );
      const configKeyList = this.extractConfigs(nodeKey,configsObj);
      console.log("Node got configKeys: " + configKeyList);
      nodes[nodeKey].configKeys = configKeyList;
    }
    console.log("=== Ingesting contacts.");
    var graphList = [];
    if (modelObj.hasOwnProperty("graphs"))  // optional for now.
      graphList = modelObj.graphs
    for (i=0; i<graphList.length; i++) {  // normally just one item
      var graphObj = graphList[i];
      var graphKey = graphObj["graphName"];
      // build the graph state object
      graphs[graphKey] = { 
        "id"   : graphObj["graphName"], 
        "name" : graphObj["graphName"], 
        "desc" : graphObj["graphDesc"],
        "ionVersion" : graphObj["ionVersion"],
        "configKey" : ""
      };
      console.log("graph item=" + JSON.stringify(graphObj) );
      configsObj = graphObj.configs;
      console.log("graph configs=" + JSON.stringify(configsObj) );
      const configKeyList = this.extractConfigs(graphKey,configsObj);
      console.log("Node got configKeys: " + configKeyList);
      graphs[graphKey].configKey = configKeyList[0];   // assuming just one
    }
    // NOTE: contacts was old name with old attributes
    var contactsList = [];
    if (modelObj.hasOwnProperty("contacts"))  // optional for now.
      contactsList = modelObj.contacts;
    for (i=0; i<contactsList.length; i++) {  // normally just one item
      graphObj  = contactsList[i];
      graphKey  = graphObj.contactsName;
      // build the graph state object
      graphs[graphKey] = { 
        "id"   : graphObj["graphName"], 
        "name" : graphObj["graphName"], 
        "desc" : graphObj["graphDesc"],
        "configKey" : ""
      };
      console.log("graph item=" + JSON.stringify(graphObj) );
      configsObj = graphObj.configs;
      console.log("contacts configs=" + JSON.stringify(configsObj) );
      const configKeyList = this.extractConfigs(graphKey,configsObj);
      console.log("Node got configKeys: " + configKeyList);
      graphs[graphKey].configKey = configKeyList[0];   // assuming just one
    }
    this.assignClones();   // analyze full new command set for cloneVal dependents
    return true;
  };
  extractConfigs(groupKey,configsObj) {
    // groupKey is for a group of configs (a node or contacts)
    console.log("extractConfigs groupKey:" + groupKey);
    //console.log("extractConfigs configsObj:" + JSON.stringify(configsObj) );
    // make short names for state objects
    var configs  = this.state.configs;

    if (configsObj === undefined) { configsObj = {}; }
    var keyList = [];  // save generated keys for caller
    for (var configType in configsObj) {   // object names are configTypes
      //console.log("loop for configType:" + configType);
      var configKey = groupKey + "." + configType;
      if (configType === "contacts")   // special case for ionrc used for contacts
        configKey = groupKey + ".cg";
      keyList.push(configKey);    // save for caller
      // build the configs state object
      configs[configKey] = {
        "id" : configKey,
        "nodeKey": groupKey,
        "configType" : configType,
        "cmdKeys" : [] 
      };
      var commandsList = configsObj[configType].commands;
      const cmdKeyList = this.extractCommands(groupKey,configType,configKey,commandsList);
      //console.log("Config got cmdKeys: " + cmdKeyList);
      configs[configKey].cmdKeys = cmdKeyList;
    }
    return keyList;   // return list of configKeys
  }

  // extract JSON config definition & build config with commands & cloneValues
 // extractCommands (nodeIdx,configKey) {
  extractCommands(groupKey,configType,configKey,commandsList) {
    console.log("extractCommands groupKey:" + groupKey);
    console.log("extractCommands configType:" + configType);
    console.log("extractCommands configKey:" + configKey);
    //console.log("extractCommands commandsObj:" + JSON.stringify(commandsList) );
    if (commandsList === undefined) { commandsList = []; }
    var keyList = [];
    // make short names for state objects
    var commands = this.state.commands;
    var cloneValues = this.state.cloneValues;

    //console.log("commands list=" + JSON.stringify(commandsList) );
    for (let i = 0; i < commandsList.length; i++) {
      const cmdObj = commandsList[i];
      const cmdTypeKey = cmdObj.type;
      console.log("cmdTypeKey: " + cmdTypeKey);
      const uniqid = this.props.getUniqId();
      const cmdKey = "cmd_" + uniqid;
      keyList.push(cmdKey);
      const cmdType = cmdTypes[cmdTypeKey];
      commands[cmdKey] = {
        "id" : cmdKey,
        "configKey" : configKey,
        "typeKey" : cmdTypeKey,
        "typeName" : cmdObj.type,
        "order" : cmdType.order,
        "lastUpdate" : cmdObj.lastUpdate,
        "values" : []
      };
      //console.log("command item=" + JSON.stringify(commands[cmdKey]) );
      for (var j = 0; j < cmdObj.parameters.length; j++) {
        const pVal = cmdObj.parameters[j];
        commands[cmdKey].values.push(pVal);
      };
      // build object with all clone-able values
      if (cmdTypes[cmdTypeKey].isCloned) {
        var cloneVal = this.props.makeCloneVal(groupKey,commands[cmdKey]);
        var cvKey = cloneVal.id;
        cloneValues[cvKey] = cloneVal;
      }
    }
    return keyList;    // return list of cmdKeys
  };
  // review all commands for cloneVal sources and cloneVal dependents
  assignClones() {
    // make short names for state objects
    var commands = this.state.commands;
    var cloneValues = this.state.cloneValues;
    const findCloneVal = this.props.findCloneVal;

   // identify commands dependent on cloneValues
    // and push them on to the cloneValue list for update notifications
    console.log("=== Identify clones using cloneValues from user ion model.");
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
  makeAlertElem(msg) {
    return (<Alert bsStyle="danger"><b>ERROR: {msg}</b></Alert>);
  };
  render() {
    // NOTE: this is an uncontrolled input form, so no value parameter provided
    //     the html5 file input form controls its own state
    console.log("IonModelLoader render form");
    // check for alert
    let msg = this.state.errMsg;
    var alert = (msg === "")?  "" : this.makeAlertElem(msg);
    var form =
      <FormControl
        id="ionmodel"
        name="name"
        type="file"
        label="Label"
        accept=".json"
        className="inputClass"
        onChange={this.handleFileChange}
      />;
    let icon = "remove";
    console.log("IonModelLoader render div");
    return (
        <div>
          <hr />
          <Col className="text-right" sm={2}><b>Ion Model File (.json)</b></Col>
          <Col sm={2}>{form}</Col>
          <Col sm={2}>
            <ButtonToolbar>
              <Button bsSize="sm" bsStyle="primary" onClick={this.load}>Submit</Button>
              <Button bsSize="sm" bsStyle="success" onClick={this.props.noLoadIonModel}><Glyphicon glyph={icon} /></Button>
            </ButtonToolbar>
          </Col>
          <Col sm={4}>{alert}</Col>
        </div>
    )
  };
  handleFileChange = (e) => {
    // special fetch of file object from html5 file input widget
    var modfile = document.getElementById('ionmodel').files[0];
    console.log("filename change!" + modfile.name);
    console.log("state: " + JSON.stringify(this.state.ion));
    //console.log("state: " + JSON.stringify(this));
    var newState = Object.assign({},this.state);
    newState.modelFile = modfile;
    newState.errMsg = "";
    this.setState (newState);
  };
  handleFileLoad = (e) => {
    // now we operate on the file contents, since loading is complete
    //console.log("result: " + e.target.result);
    console.log("$$$$$ extract model!");
    var json = {};
    var newState = Object.assign({},this.state);
    try {
      json = JSON.parse(e.target.result);
    }
    catch (err) {
      this.setError("Failed to parse the JSON file. " + err);
      return;
    }
    //console.log("Parse result: " + JSON.stringify(json));
    newState.modelJson = json;
    this.setState(newState);
    if (!this.extractModel()) // extract & flatten model into state
      return;                 // skip the load transaction on failure

    //console.log("model object = " + JSON.stringify(this.state.modelJson));
    var tran = {
      action: "LOAD-ION-MODEL",
      ionModel: this.state.ion,
      hosts: this.state.hosts,
      ipaddrs:this.state.ipaddrs,
      nodes: this.state.nodes,
      graphs: this.state.graphs,
      configs: this.state.configs,
      commands: this.state.commands,
      cloneValues: this.state.cloneValues
    };
    this.props.dispatch(tran);
  };
  load = () => {
    console.log("load ion model!" + this.state.modelFile);
    try {
      console.log("create file for: " + this.state.modelFile);
      var modfile = this.state.modelFile;
      console.log ("model file name: " + modfile.name);
      var reader = new FileReader();
      reader.onload = this.handleFileLoad;
      reader.readAsText(modfile);
    }
    catch (err) {
      this.setError("Failed to load the Ion Model file.");
    }
  };
}
