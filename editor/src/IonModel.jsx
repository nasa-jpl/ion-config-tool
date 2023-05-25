//        IonModel.jsx     IonModel React Component
//
//        Copyright (c) 2018, California Institute of Technology.
//        ALL RIGHTS RESERVED.  U.S. Government Sponsorship
//        acknowledged.
//                                                                   
//      Author: Rick Borgen, Jet Propulsion Laboratory         
//                                                               
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {FormControl} from 'react-bootstrap';
import {Row,Col} from 'react-bootstrap';
import {Label,Button,ButtonToolbar} from 'react-bootstrap';
import {Table, Panel} from 'react-bootstrap';
import {Glyphicon} from 'react-bootstrap';
import PopoutWindow from 'react-popout';
import {saveAs} from "file-saver";
import JSZip from "jszip";
import {Alert} from 'react-bootstrap';
import {Modal} from 'react-bootstrap';

import SurveyPopout from './SurveyPopout.jsx';
import Config       from './Config.jsx';
import Command      from './Command.jsx';
import HostList     from './HostList.jsx';
import IonNodeList  from './IonNodeList.jsx';
import GraphList    from './GraphList.jsx';

import cmdTypes     from './json/cmdTypes.json';
import configTypes  from './json/configTypes.json';
import paramTypes   from './json/paramTypes.json';
import patterns     from './json/patterns.json';
import selections   from './json/selections.json';
import versions     from './json/ionVersions.json';

export default class IonModel  extends React.Component {
  constructor (props) {
    super(props);
    // props
    //  name
    console.log("IonModel ctor");
    this.state = {
      name: this.props.name,
      desc: this.props.desc,
      nextNodeNum: this.props.nextNodeNum,
      currentContacts: this.props.currentContacts,

      editMode: false,
      viewMode: false,
      surveyMode: false,
      showPopoutMode: false,
      showDeleteWarn: false,
      expandMode: false
    }
  };
  componentWillReceiveProps(newProps) {
    //console.log("IonModel componentWillReceiveProps" + newProps.desc + ' ' + newProps.nextNodeNum);
    if (newProps.nextNodeNum !== this.state.nextNodeNum) {
       var newState = Object.assign({},this.state);
       newState.nextNodeNum = newProps.nextNodeNum;   // only field updated externally
       this.setState (newState);
    }
    return null;
  }
  makeModelObj() {
    console.log("makeUserModel net:" + this.state.name);
    const hosts = this.props.hosts;
    const ipaddrs = this.props.ipaddrs;
    const graphs = this.props.graphs;
    const nodes = this.props.nodes;
    const configs = this.props.configs;
    var model = {};    // user model built from current state

    model["ionModelName"] = this.state.name;
    model["ionModelDesc"] = this.state.desc;
    model["nextNodeNum"] = this.state.nextNodeNum;
    model["currentContacts"] = this.state.currentContacts;
    model["hosts"] = [];
    model["nodes"] = [];
    model["graphs"]  = [];

    for (var hostKey in hosts) {
      const hostObj = hosts[hostKey];
      var hostJson = {
        hostName: hostKey,
        hostDesc: hostObj.desc,
        linefeed: hostObj.linefeed,
        ipAddrs: []
      }
      for (var addrKey in ipaddrs) {
        if (ipaddrs[addrKey].hostKey === hostKey)
          hostJson["ipAddrs"].push(ipaddrs[addrKey].ipAddr)
      }
      model["hosts"].push(hostJson);
    }
    for (var nodeKey in nodes) {
      const nodeObj = nodes[nodeKey];
      var nodeJson = {
        nodeName: nodeKey,
        nodeDesc: nodeObj.longName,
        nodeNum: nodeObj.ionNodeNum,
        ionVersion: nodeObj.ionVersion,
        hostName: nodeObj.hostKey,
        configs: {}
      }
      const nodeConfigKeys = nodeObj.configKeys;
      for (var i=0; i<nodeConfigKeys.length; i++) {
        const configKey = nodeConfigKeys[i];
        const configObj = configs[configKey];
        const configType = configObj.configType;
        let configJson = this.makeConfigObj(configKey);
        nodeJson.configs[configType] =  configJson;
      }
      model["nodes"].push(nodeJson);
    }
    for (var ctxKey in graphs) {
      const ctxObj = graphs[ctxKey];
      var graphsJson = {
        graphName: ctxKey,
        graphDesc: ctxObj.desc,
        ionVersion: ctxObj.ionVersion,
        configs: {}
      }
      const configKey = ctxObj.configKey;  // just one config
      console.log("graph configKey: " + configKey);
      const configObj = configs[configKey];
      const configType = configObj.configType;
      let configJson = this.makeConfigObj(configKey);
      graphsJson.configs[configType] =  configJson;
      model["graphs"].push(graphsJson);
    }
    return model;
  };
  makeConfigObj(configKey) {
    const configs = this.props.configs;
    const commands = this.props.commands;
    var config = { commands: [] };

    const configObj = configs[configKey];
    const configCmdKeys = configObj.cmdKeys;
    for (var j=0; j<configCmdKeys.length; j++) {
      const cmdId = configCmdKeys[j];
      console.log("cmdId: " + cmdId);
      const cmdObj = commands[cmdId];    
      const userCmdObj = {
        type: cmdObj.typeKey,
        lastUpdate: cmdObj.lastUpdate,
        parameters: cmdObj.values
      };
      config.commands.push(userCmdObj);
    }
    return config;
  };
  makeAlertElem(msg) {
    return (<Alert bsStyle="danger"><b>ERROR: {msg}</b></Alert>);
  };
  // tranlsate version to sequence number for command effectivity
  getIonVerSeqNo(nodeKey) {
    console.log("getIonVerSeqNo for:" + nodeKey);
    const nodes = this.props.nodes;
    const graphs = this.props.graphs;
    if (!(nodes.hasOwnProperty(nodeKey) || graphs.hasOwnProperty(nodeKey) ) )
      return 0;
    var ver = 0;
    if (nodeKey in nodes) {
      const node = nodes[nodeKey];
      console.log("??? node: " + JSON.stringify(node));
      ver = node.ionVersion;
    } else {
      const graph = graphs[nodeKey];
      console.log("??? graph: " + JSON.stringify(graph));
      ver = graph.ionVersion;
    }
    console.log("???nodeKey: " + nodeKey + " ionVer: "+ ver);
    for (var seqno in versions) {
      if (ver === versions[seqno].ionVersion)
        return seqno;
    }
    return 0;                       
  };
  isOptional(paramTypeKey) {
    const paramType = paramTypes[paramTypeKey];
    return paramType.optional;
  };
  makeHostListElem(name) {
    console.log("makeHostListElem");
    const hosts = this.props.hosts;                   // host objects
    const ipaddrs = this.props.ipaddrs;               // ipaddr objects
    const isGoodName = this.props.isGoodName;         // pass through
    const makeOptElems = this.props.makeOptionElems;  // pass through
    const dispatch = this.props.dispatch;             // pass through
    return (
      <HostList
        key="1"                        // unique id
        name={name}                    // user model - defaults to model name
        hosts={hosts}                  // user model - hosts
        ipaddrs={ipaddrs}              // user model - ipaddrs

        isGoodName={isGoodName}        // verify name string is valid
        makeOptionElems={makeOptElems} // static options building func

        dispatch={dispatch}            // dispatch func for new hosts/ipaddrs
      />
    );  
  }
  makeIonNodeListElem(name) {
    console.log("makeIonNodeListElem");
    const contacts = this.props.currentContacts;        // network contacts name
    const nodes = this.props.nodes;                     // node objects
    const hosts = this.props.hosts;                     // host objects
    const configs = this.props.configs;                 // config objects
    const commands = this.props.commands;               // command objects
    const ipaddrs = this.props.ipaddrs;                 // ipaddr objects
    const isGoodName = this.props.isGoodName;           // pass through
    const isGoodNodeNum = this.props.isGoodNodeNum;     // pass through
    const makeCmdLines = this.makeCmdLines.bind(this);         // remember this
    const makeStarts = this.makeStartLines.bind(this);         // remember this
    const makeTypeOptions = this.props.makeTypeOptions;        // pass through
    const makeOptElems = this.props.makeOptionElems;           // pass through
    const makeConfigElem = this.makeConfigElem.bind(this);     // remember this
    const makeCommandElem = this.makeCommandElem.bind(this);   // remember this
    const makeParamProps = this.makeParamProps.bind(this);     // remember this
    const dispatch = this.props.dispatch;                      // pass through
    return (
      <IonNodeList
        key="2"                            // unique id
        name={name}                        // user model - defaults to model name
        currentContacts={contacts}         // user model - network contacts name
        nodes={nodes}                      // user model - nodes
        hosts={hosts}                      // user model - hosts
        configs={configs}                  // user model - configs
        commands={commands}                // user model - commands
        ipaddrs={ipaddrs}                  // user model - ipaddrs

        configTypes={configTypes}          // schema
        cmdTypes={cmdTypes}                // schema
        paramTypes={paramTypes}            // schema

        isGoodName={isGoodName}             // verify name string is valid
        isGoodNodeNum={isGoodNodeNum}       // verify name string is valid
        makeCmdLines={makeCmdLines}         // all lines formatting of config file
        makeStartLines={makeStarts}         // all lines for a start script
        makeTypeOptions={makeTypeOptions}   // get dynamic (cloned) options
        makeOptionElems={makeOptElems}      // static options building func
        makeConfigElem={makeConfigElem}     // build config elem
        makeCommandElem={makeCommandElem}   // build command elem
        makeParamProps={makeParamProps}     // build param props

        dispatch={dispatch}                 // dispatch func for new hosts/ipaddrs
      />  
    );  
  }
  makeGraphListElem(name) {
    console.log("makeGraphListElem");
    const graphs = this.props.graphs;                       // graph objects
    const configs = this.props.configs;                     // config objects
    const commands = this.props.commands;                   // command objects
    const isGoodName = this.props.isGoodName;               // pass through
    const makeCmdLines = this.makeCmdLines.bind(this);      // remember this
    const makeTypeOptions = this.props.makeTypeOptions;     // pass through
    const makeOptElems = this.props.makeOptionElems;        // pass through
    const makeConfigElem = this.makeConfigElem.bind(this);  // remember this
    const makeCommandElem = this.makeCommandElem.bind(this);// remember this
    const makeParamProps = this.makeParamProps.bind(this);  // remember this
    const dispatch = this.props.dispatch;                   // pass through
    return (
      <GraphList
        key="3"                             // unique id
        name={name}                         // user model - defaults to model name
        graphs={graphs}                     // user model - graphs
        configs={configs}                   // user model - configs
        commands={commands}                 // user model - commands

        isGoodName={isGoodName}             // verify name string is valid
        makeCmdLines={makeCmdLines}         // all lines formatting of config file
        makeTypeOptions={makeTypeOptions}   // get dynamic (cloned) options
        makeOptionElems={makeOptElems}      // static options building func
        makeConfigElem={makeConfigElem}     // build config elem
        makeCommandElem={makeCommandElem}   // build command elem
        makeParamProps={makeParamProps}     // build param props

        dispatch={dispatch}                 // dispatch func for new graphs
      />  
    );  
  }
  // build ION parameter annotation (commands file format)
  makeParamNote(pTypeKey,pIdx,paramVal) {
    // define padit here, because "this" can be weird
    function padit (w,str,pad) {
      return (w <= str.length) ? str : padit(w, pad + str, pad);
    };
    //console.log("makeParamNote: " + pTypeKey + " " + pIdx + " " + paramVal);
    var pType = paramTypes[pTypeKey];
    var longname = pType.name;
    longname = padit(34,longname," ");
    const position = pIdx + 1;
    const posTag = "["+ position + "]";
    var units = "";
    if (pType.units !== "") {
      units = "(" + pType.units + ")";
    }
    var descrip = "";
    var sels = undefined;
    if (pTypeKey in selections) {
      sels = selections[pTypeKey];
    }
    if (sels) {
      //console.log("makeParamNote sels: " + JSON.stringify(sels));
      for (var i = 0; i < sels.length; i++) {
        var select = sels[i];
        if(Object.keys(select)[0] === paramVal) {
          descrip = "[" + select[paramVal] + "]";
        }
      }
    }
    const note = "#  " + posTag + " " + longname + " : " + paramVal + " " + units + " " + descrip;
    //console.log("param Note " + pTypeKey + " " + note);
    return note;
  }
  // builds ION command text (commands file format)
  makeCmdLine(cmdTypeKey,cmdParams) {
    // console.log("makeCmdLine cmdTypeKey: " + cmdTypeKey + "  Params : " + JSON.stringify(cmdParams));
    const targets = [ "[1]", "[2]", "[3]", "[4]", "[5]", "[6]", "[7]", "[8]", "[9]" ];
    var cmdPattern = patterns[cmdTypeKey];
    let cmdType = cmdTypes[cmdTypeKey];
    //console.log("cmdType: " + JSON.stringify(cmdType));
    for (var i = 0; i < cmdParams.length; i++) {
      //console.log("makeCmdLine Pattern: " + cmdPattern + " tgt: " + cmdTypeKey + "  " + targets[i] + "  " + cmdParams[i]);
      var paramTypeKey = cmdType.paramTypes[i];
      if (cmdParams[i] === "")
        if (this.isOptional(paramTypeKey))
          cmdPattern = cmdPattern.replace(targets[i],"");
        else
          cmdPattern = cmdPattern.replace(targets[i],"??");
      else
        cmdPattern = cmdPattern.replace(targets[i],cmdParams[i]);
    }
    //console.log("cmd Type pattern " + cmdTypeKey + " " + cmd);
    return cmdPattern;
  }
  makeCmdLines(configKey) {
    console.log("makeCmdLines for: " + configKey);
    const configObj = this.props.configs[configKey];
    const cmdKeys = configObj.cmdKeys;
    const configTypeKey = configObj.configType;
    const configTypeObj = configTypes[configTypeKey];
    //console.log("makeConfigElem configType:" + JSON.stringify(configType));
    const modelName = this.state.name;
    const modelDesc = this.state.desc;
    const nodeKey = configObj.nodeKey;
    const node = this.props.nodes[nodeKey];
    let nodeDesc = "";
    let nodeLabel = "";
    if (node) {  // a node?,  might be a graphs key)    
      nodeDesc = this.props.nodes[nodeKey].longName; 
      nodeLabel = "ipn:" + node.ionNodeNum;
    };
    const content = configTypeObj.content;
    const program = configTypeObj.program;
    const commands = this.props.commands;

    const now = new Date();
    const fileDate = now.format("YYYY-MM-DD hh:mm");
    var cmdLines = [];
    // build header 
    cmdLines.push("#  FILE:      " + configObj.id);
    //console.log("makeCmdLines commands: " + Object.keys(this.props.commands).length); 
    cmdLines.push("#  CONTENT:   " + content);
    cmdLines.push("#  FOR:       " + program);
    cmdLines.push("#  BUILDER:   ION Configuration Editor");
    cmdLines.push("#  NETWORK:   " + modelName + "    [" + modelDesc + "]");
    if (node) {
      cmdLines.push("#  NODE:      " + nodeKey +  "    [" + nodeDesc + "]");
      cmdLines.push("#  IPN:       " + nodeLabel);
    }
    cmdLines.push("#  DATE:      " + fileDate);
    // build commands
    for (var i=0; i<cmdKeys.length; i++) {
      const cmdKey = cmdKeys[i];
      //console.log("makeCmdLines i: " + i + " cmdKey: " + cmdKey);
      const cmd = commands[cmdKey];
      const cmdTypeKey = cmd.typeKey;
      //console.log("makeCmdLines cmdTypeKey: " + cmdTypeKey);
      const cmdType = cmdTypes[cmdTypeKey];
      const cmdName = cmdType.name;
      cmdLines.push("#");
      cmdLines.push("#  " + cmdName.toUpperCase());
      const pTypeKeys = cmdType.paramTypes;
      const cmdVals = cmd.values;
      for (let j=0; j<pTypeKeys.length; j++) {
        const pTypeKey = pTypeKeys[j];
        const val = cmdVals[j];
        cmdLines.push(this.makeParamNote(pTypeKey,j,val));
      }
      cmdLines.push(this.makeCmdLine(cmdTypeKey,cmdVals));
    }
    return cmdLines;
  }
  // build the start script text lines for a node
  makeStartLines(nodeKey) {
    let node = this.props.nodes[nodeKey];
    let fileName = "start_" + nodeKey + ".sh";
    let nodeLabel = "ipn:" + node.ionNodeNum;
    const now = new Date();
    const fileDate = now.format("YYYY-MM-DD hh:mm");
    var cmdLines = [];
    cmdLines.push("#!/bin/bash");
    cmdLines.push("#  FILE:  " + fileName);
    cmdLines.push("#  NODE:  " + nodeKey + " [" + nodeLabel + "]");
    cmdLines.push("#  DESC:  " + node.longName);
    cmdLines.push("#  DATE:  " + fileDate);
    cmdLines.push("host=`uname -n`");
    cmdLines.push("wdir=`pwd`");
    cmdLines.push('echo "Clearing old ion.log"');
    cmdLines.push("echo > ion.log");

    let nodeConfigs = [];
    let configs = this.props.configs;
    for (var i=0; i<node.configKeys.length; i++) {
      let configKey = node.configKeys[i];
      let configType = configs[configKey].configType;
      let order = configTypes[configType].start_order;
      let nodeConfig = configs[configKey];
      nodeConfig.order = order;
      if (configKey.indexOf("ionconfig") < 0)  // add all except ionconfig
         nodeConfigs.push(nodeConfig);
    }
    nodeConfigs.sort( (a,b) => (a.order > b.order) ? 1 : -1);
    console.log("makeStartLines sortConfigs: " + JSON.stringify(nodeConfigs));
    for (var j=0; j<nodeConfigs.length; j++) {
      let configObj = nodeConfigs[j];
      let configKey = configObj.id;
      console.log("makeStartLines configKey: " + configKey);
      let configTypeKey = configObj.configType;
      let configTypeObj = configTypes[configTypeKey];
      let prog = configTypeObj.program;
      if (j === 0) 
        cmdLines.push('echo "Starting ION node ' + nodeLabel + ' on $host from $wdir"');
      else
        cmdLines.push("sleep  1");
      cmdLines.push(prog + "  " + configKey);
    }
    // special case for (global) graphs file
    let contacts = this.state.currentContacts;
    if (contacts !== "") {
      let contactsFile = contacts + ".cg";
      cmdLines.push("sleep  1");
      cmdLines.push("# global contact graph");
      cmdLines.push("ionadmin  " + contactsFile);
    }
    let nodeId = node.ionNodeNum;
    cmdLines.push('echo "Startup of ION node ' + nodeLabel + ' on $host complete!"');
    cmdLines.push('echo "Starting bpecho on ipn:' + nodeId + '.3."');
    cmdLines.push('bpecho   ipn:' + nodeId + '.3 &');
    return cmdLines;
  }
  // build and return a Config file element
  makeConfigElem(configKey,cmdKeys,cmdsList) {
    const config = this.props.configs[configKey];
    const configTypeKey = config.configType;
    const configType = configTypes[configTypeKey];
    const nodeKey = config.nodeKey;     // note...nodeKey might NOT be a node (graphs)
    var verSeqNo = this.getIonVerSeqNo(nodeKey);
    console.log("???the Version sequence Number is: " + verSeqNo.toString() + " for " + configKey);
    const nodes = this.props.nodes;
    var host = null;
    if (nodes.hasOwnProperty(nodeKey)) {
      const hostKey = nodes[nodeKey].hostKey;
      host = this.props.hosts[hostKey];
    }

    const makeCmdLines = this.makeCmdLines.bind(this);
    const getVer = this.getIonVerSeqNo.bind(this);
    const dispatch = this.props.dispatch;    // make sure dispatch remembers "this"

    return (
      <Config
        key={configKey}                 // unique id
        name={config.id}                // unique name of this config file
        configType={configType}         // schema - config type object
        nodeKey={nodeKey}               // user model - node key
        host={host}                     // user model - host object
        cmdKeys={cmdKeys}               // list of command keys  for this config file

        makeCmdLines={makeCmdLines}     // all lines formatting of config file
        getIonVerSeqNo={getVer}         // get version seq num
        dispatch={dispatch}             // dispatch func for new commands
 
        children={cmdsList}             // list of command elements for this config file
      />
    );  
  }
  // build and return a Command element
  makeCommandElem(nodeKey,configKey,cmdKey,hostKey,paramPropsList) {
    //console.log("makeCommandElem " + cmdKey);
    const cmd = this.props.commands[cmdKey];
    const cmdTypeKey = cmd.typeKey;
    const cmdType = cmdTypes[cmdTypeKey];
    const pattern = patterns[cmdTypeKey];
    const vals = this.props.getValues(cmdKey).slice(0); // a shallow copy of the values
    const clones = this.props.cloneValues;              // need to know if command value is cloned
    // functions need to remember "this", hence the bind
    const makeCmd = this.makeCmdLine.bind(this);          // func to build an ion cmd line
    const getVals = this.props.getValues;                 // func to get values for command
    const usedNodeKey = this.props.usedNodeKey;           // func to check if nodekey in use
    const makeTypeOpts = this.props.makeTypeOptions;      // func to make dynamic clone option elems
    const makeOptElems = this.props.makeOptionElems;      // func to make static option elems
    const getOptText = this.props.getOptionText;          // func to get an option's text
    const makePNote = this.makeParamNote;                 // func to make param note
    const dispatch = this.props.dispatch;                 // pass through
    return (
      <Command
        key={cmdKey}                   // unique id for command component
        cmdKey={cmdKey}                // unique id for command
        nodeKey={nodeKey}              // unique id for node of command
        hostKey={hostKey}              // unique id for host of node
        configKey={configKey}          // unique key of config file
        cmdType={cmdType}              // schema object for command type
        cmdTypeKey={cmdTypeKey}        // commmand type key
        initValues={vals}              // command values
        cmdPattern={pattern}           // cmd pattern string
        cloneValues={clones}           // cloneValues object

        makeCmd={makeCmd}              // cmd formatting func
        getValues={getVals}            // value retrieval func
        usedNodeKey={usedNodeKey}      // node key check func
        makeTypeOptions={makeTypeOpts} // dynamic options building func
        makeOptionElems={makeOptElems} // static options building func
        getOptionText={getOptText}     // get option's text func
        makeParamNote={makePNote}      // parameter note function
        dispatch={dispatch}            // dispatch of state updates
        lastUpdate={cmd.lastUpdate}    // last update
        params={paramPropsList}
      />
    );                                               //
  }
  // initialize all Param props (will pass to Command to complete)
  // return Param Props object
  makeParamProps(pTypeKey,value) {
    //console.log("makeParamProps pTypeKey: " + pTypeKey)
    const paramType = paramTypes[pTypeKey];
    const def = paramType.defaultValue;
    const copyClone = paramType.copyClone;
    const pickClone = paramType.pickClone;
    const optional = paramType.optional; 
    const showDefault = paramType.showDefault;
    //console.log("paramType= " + pTypeKey + " selections: " + JSON.stringify(selections));
    return {
      "name" : paramType.name,          // schema
      "typeKey" : pTypeKey,             // user model
      "valueType" : paramType.valType,  // schema
      "units" : paramType.units,        // schema
      "defaultValue": def,              // schema
      "initVal" : value,                // user model
      "optional" : optional,            // schema
      "copyClone" : copyClone,          // schema 
      "pickClone": pickClone,           // schema
      "showDefault": showDefault        // schema                
    }
  }
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
  makeShowPopout() {
    const report = this.makeShowNodes();
    return (
      <PopoutWindow title="POPOUT" options={{outerHeight: '400 px', outerWidth: '900 px'}} onClosing={this.showPopout}>
        {report}
      </PopoutWindow>
    );
  };
  makeShowDeleteWarn() {
    console.log("Delete Model: popup the modal delete warn");
    return (
      <Modal show={this.state.showDeleteWarn}>
        <Modal.Header closeButton>
          <Modal.Title>Warning</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to delete the Ion Model?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" bsSize="sm" bsStyle="success" onClick={ () => this.deleteModelState(true)}>
            Yes 
          </Button>
          <Button variant="primary" bsSize="sm" bsStyle="success" onClick={ () => this.deleteModelState(false)}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };
  makeShowEndpoints() {
    //console.log("makeShowEndpoints");
    var epElemList = [];
    var cmds = [];
    const commandObjs = this.props.commands;
    for (var cmdKey in commandObjs) {
      if (commandObjs[cmdKey].typeName === 'endpoint')
        cmds.push(commandObjs[cmdKey]);
    };
    // first sort by service num
    cmds = cmds.sort( function(a,b) { return (Number(a.values[1]) > Number(b.values[1]) )  ? 1 : 
                                            ((Number(b.values[1]) > Number(a.values[1]) ) ? -1 : 0); } );
    // then sort by node num
    cmds = cmds.sort( function(a,b) { return (Number(a.values[0]) > Number(b.values[0]) )  ? 1 : 
                                            ((Number(b.values[0]) > Number(a.values[0]) ) ? -1 : 0); } );
    const configs = this.props.configs;
    var epCols = ["Endpoint ID","Node Name","Service Num","Disposition","Queue Task"];
    var headElem = this.makeHeadElem(epCols);
    for (var i=0; i<cmds.length;i++)  {
      const cmdObj = cmds[i];
      const configKey = cmdObj.configKey;
      const configObj = configs[configKey];
      const nodeKey = configObj.nodeKey;
      const nodeNum = cmdObj.values[0];
      const serviceNum = cmdObj.values[1];
      const id = "ipn:" + nodeNum + '.' + serviceNum;
      const dispCode = cmdObj.values[2];
      const disp = (dispCode === 'x')?  "discard" : "queue" ;
      const qTask = cmdObj.values[3];
      const epElem = this.makeRowElem(id,[id,nodeKey,serviceNum,disp,qTask]);
      epElemList.push(epElem);
    }
    return <Table striped condensed hover>{headElem}<tbody>{epElemList}</tbody></Table>;
  };
  makeShowHosts() {
    //console.log("makeShowHosts");
    var hostElemList = [];
    const hostObjs = this.props.hosts;
    const nodeObjs = this.props.nodes;

    var hosts = Object.keys(hostObjs).map( function(key) {return hostObjs[key] } );
    var nodes = Object.keys(nodeObjs).map( function(key) {return nodeObjs[key] } );
        //  sort by hostKey
    hosts = hosts.sort( function(a,b) { return (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0); } );
    var hostCols = ["Host Name","Description","Linefeed","Nodes","IP Addresses"];
    var headElem = this.makeHeadElem(hostCols);
    for (var i=0; i<hosts.length;i++)  {
      var host = hosts[i];
      var hostKey = host.id;
      var desc = host.desc;
      var linefeed = host.linefeed;
      // find list of referencing nodes
      var nodeList = [];
      for (var j=0; j<nodes.length;j++) {
        var node = nodes[j];
        console.log("node j=" + j + hostKey + " jhost" +  node.hostKey);
        if (node.hostKey === hostKey)
          nodeList.push(node.id);
      }
      const ipaddrs = this.props.ipaddrs;
      var ipAddrList = [];
      for (var k=0; k<host.ipAddrKeys.length; k++) {
        var iKey = host.ipAddrKeys[k];
        ipAddrList.push(ipaddrs[iKey].ipAddr)
      }
      var nodeStr = nodeList.join();
      var addrStr = ipAddrList.join();
      var hostElem = this.makeRowElem(hostKey,[hostKey,desc,linefeed,nodeStr,addrStr]);
      hostElemList.push(hostElem);
    }
    return <Table striped condensed hover>{headElem}<tbody>{hostElemList}</tbody></Table>;
  };
  makeShowNodes() {
    //console.log("makeShowNodes");
    var nodeElemList = [];
    const nodeObjs = this.props.nodes;
    var nodes = Object.keys(nodeObjs).map( function(key) {return nodeObjs[key] } );
        //  sort by nodeKey
    nodes = nodes.sort( function(a,b) { return (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0); } );
    var nodeCols = ["Node Name","Description","Address","Host Name","Config Files"];
    var headElem = this.makeHeadElem(nodeCols);
    for (var i=0; i<nodes.length;i++)  {
      var node = nodes[i];
      var nodeKey = node.id;
      var desc = node.longName;;
      var nodeAddr = "ipn:" + node.ionNodeNum;
      var host = node.hostKey;
      var configStr = node.configKeys.join();
      var nodeElem = this.makeRowElem(nodeKey,[nodeKey,desc,nodeAddr,host,configStr]);
      nodeElemList.push(nodeElem);
    }
    return <Table striped condensed hover>{headElem}<tbody>{nodeElemList}</tbody></Table>;
  };
  makeShowConfigs() {
    //console.log("makeShowConfigs");
    var configElemList = [];
    const configObjs = this.props.configs;
    var configs = Object.keys(configObjs).map( function(key) {return configObjs[key] } );
    //  first, sort by nodeKey
    configs = configs.sort( function(a,b) { return (a.nodeKey > b.nodeKey) ? 1 : ((b.nodeKey > a.nodeKey) ? -1 : 0); } );
    //  then, sort by configKey
    configs = configs.sort( function(a,b) { return (a.id > b.id) ? 1 : ((b.id > a.id) ? -1 : 0); } );
    var configCols = ["Config File","Node/Graph Name","Command Count"];
    var headElem = this.makeHeadElem(configCols);
    for (var i=0; i<configs.length;i++)  {
      var config = configs[i];
      var configKey = config.id;
      var nodeKey = config.nodeKey;
      var cnt = config.cmdKeys.length;
      var configElem = this.makeRowElem(configKey,[configKey,nodeKey,cnt]);
      configElemList.push(configElem);
    }
    return <Table striped condensed hover>{headElem}<tbody>{configElemList}</tbody></Table>;
  };
  makeShowCommands() {
    //console.log("makeShowCommands");
    var cmdElemList = [];
    const commandObjs = this.props.commands;

    var cmds = Object.keys(commandObjs).map(function(key) {return commandObjs[key] } );
    // first sort by configKey
    cmds = cmds.sort( function(a,b) { return (a.configKey > b.configKey) ? 1 : ((b.configKey > a.configKey) ? -1 : 0); } );
    // then sort by typeKey
    cmds = cmds.sort( function(a,b) { return (a.typeKey > b.typeKey) ? 1 : ((b.typeKey > a.typeKey) ? -1 : 0); } );
    var cmdCols = ["Command Type","Config File","Last Update","Warning(s)","Command"];
    var headElem = this.makeHeadElem(cmdCols);
    for (var i=0; i<cmds.length;i++)  {
      const cmdObj = cmds[i];
      const cmdKey = cmdObj.id;
      const type = cmdObj.typeKey;
      const file = cmdObj.configKey;
      const timeTag = cmdObj.lastUpdate;
      const cmdStr = this.makeCmdLine(type,cmdObj.values);
      var warns = "";
      if (cmdStr.indexOf("??") > -1) {
        warns += "missingParam";  
      }
      var cmdElem = this.makeRowElem(cmdKey,[type,file,timeTag,warns,cmdStr]);
      cmdElemList.push(cmdElem);
    }
    return <Table striped condensed hover>{headElem}<tbody>{cmdElemList}</tbody></Table>;
  };
  makeShowSpans() {
    //console.log("makeShowSpans");
    var spanElemList = [];
    var spans = [];
    const cmdObjs = this.props.commands;
    for (var cmdKey in cmdObjs) 
      if(cmdObjs[cmdKey].typeName.indexOf("span") >= 0)
        spans.push(cmdObjs[cmdKey]);
    // first sort by configKey
    spans = spans.sort( function(a,b) { return (a.configKey > b.configKey) ? 1 : ((b.configKey > a.configKey) ? -1 : 0); } );
    // then sort by typeKey
    spans = spans.sort( function(a,b) { return (a.typeName > b.typeName) ? 1 : ((b.typeName > a.typeName) ? -1 : 0); } );
    var spanCols = ["Command Type","Config File","Last Update","Command"];
    var headElem = this.makeHeadElem(spanCols);
    for (var i=0; i<spans.length;i++)  {
      const cmdObj = spans[i];
      const cmdKey = cmdObj.id;
      const file = cmdObj.configKey;
      const type = cmdObj.typeName;
      const fullType = cmdObj.typeKey;
      const timeTag = cmdObj.lastUpdate;
      const cmdStr = this.makeCmdLine(fullType,cmdObj.values);
      var spanElem = this.makeRowElem(cmdKey,[type,file,timeTag,cmdStr]);
      spanElemList.push(spanElem);
    }
    return <Table striped condensed hover>{headElem}<tbody>{spanElemList}</tbody></Table>;
  };
  makeShowInducts() {
    //console.log("makeShowInducts");
    var inductElemList = [];
    const cVals = this.props.cloneValues;
    var cloneVals = Object.keys(cVals).map(function(key) {return cVals[key] } );
    // first sort by duct name (value)
    cloneVals = cloneVals.sort( function(a,b) { return (a.value > b.value) ? 1 : ((b.value > a.value) ? -1 : 0); } );
    // then sort by type
    cloneVals = cloneVals.sort( function(a,b) { return (a.type > b.type) ? 1 : ((b.type > a.type) ? -1 : 0); } );
    var inductCols = ["Protocol","Induct Name","To Node","Outducts From Node(s)"];
    var headElem = this.makeHeadElem(inductCols);
    for (var cKey in cloneVals)  {
      const cloneObj = cloneVals[cKey];
      var type = cloneObj.type;
      var ductType = "";
      var idx = type.indexOf("Induct");  // an Induct Name clone value?
      if (idx >= 0) 
        ductType = type.substring(0,idx);
      else
        continue;
      const nodeKey = cloneObj.nodeKey;
      const ductName = cloneObj.value;
      console.log("inductName: " + ductName);
      const clones = cloneObj.clones;
      let refList = [];
      for (var i=0; i< clones.length; i++) {
        let clone = clones[i];
        let cmdKey = clone.cmdKey;
        let nKey = this.props.getNodeKey(cmdKey);
        refList.push(nKey);
        console.log("cmdKey: " + cmdKey + " nodeKey: " + nKey);
      }
      let refs = JSON.stringify(refList);
      var inductElem = this.makeRowElem(cKey,[ductType,ductName,nodeKey,refs]);
      inductElemList.push(inductElem);
    }
    return <Table striped condensed hover>{headElem}<tbody>{inductElemList}</tbody></Table>;
  };
  makeShowOutducts() {
    //console.log("makeShowOutducts");
    var inductNodes = {};      // lookup for node destination
    var outductElemList = [];
    const cVals = this.props.cloneValues;
    var clones = Object.keys(cVals).map(function(key) {return cVals[key] } );
    // first sort by duct name (value)
    clones = clones.sort( function(a,b) { return (a.value > b.value) ? 1 : ((b.value > a.value) ? -1 : 0); } );
    // then sort by type
    clones = clones.sort( function(a,b) { return (a.type > b.type) ? 1 : ((b.type > a.type) ? -1 : 0); } );
    // build lookup for induct names
    for (var cKey in clones)  {
      const cloneObj = clones[cKey];
      var type = cloneObj.type;
      var idx = type.indexOf("Induct");  // an Induct Name clone value?
      if (idx >= 0) {
        const nodeKey = cloneObj.nodeKey;
        const ductName = cloneObj.value;
        inductNodes[ductName] = nodeKey;
      }
    }
    var outductCols = ["Protocol","Outduct Name","From Node","To Node"];
    var headElem = this.makeHeadElem(outductCols);
    for (cKey in clones)  {
      const cloneObj = clones[cKey];
      type = cloneObj.type;
      var ductType = "";
      idx = type.indexOf("Outduct");  // an Induct Name clone value?
      if (idx >= 0) 
        ductType = type.substring(0,idx);
      else
        continue;
      const fromNode = cloneObj.nodeKey;
      const ductName = cloneObj.value;
      const toNode = inductNodes[ductName];
      var outductElem = this.makeRowElem(cKey,[ductType,ductName,fromNode,toNode]);
      outductElemList.push(outductElem);
    }
    return <Table striped condensed hover>{headElem}<tbody>{outductElemList}</tbody></Table>;
  };
  makeShowClones() {
    console.log("makeShowClones");
    var cloneElemList = [];
    const cmds = this.props.commands;            // command objects
    const cVals = this.props.cloneValues;        // clone value objects
    var cloneVals = Object.keys(cVals).map(function(key) {return cVals[key] } );
    // first sort by value to clone (value)
    cloneVals = cloneVals.sort( function(a,b) { return (a.value > b.value) ? 1 : ((b.value > a.value) ? -1 : 0); } );
    // then sort by type
    cloneVals = cloneVals.sort( function(a,b) { return (a.type > b.type) ? 1 : ((b.type > a.type) ? -1 : 0); } );
    var cloneCols = ["Origin Type","Origin Value","Origin Node","Target Config File","Command with Cloned Value",];
    var headElem = this.makeHeadElem(cloneCols);
    for (var cKey in cloneVals)  {
      const cloneObj = cloneVals[cKey];
      var type = cloneObj.type;
      const nodeKey = cloneObj.nodeKey;
      const value = cloneObj.value;
      //console.log("value: " + value);
      const clones = cloneObj.clones;
      for (var i=0; i< clones.length; i++) {
        let elemKey = cKey + i;
        let clone = clones[i];
        let cmdKey = clone.cmdKey;
        //console.log("cmdKey: " + cmdKey);
        let cmdObj = cmds[cmdKey];
        let typeKey = cmdObj.typeKey;
        let params = cmdObj.values;
        let configKey = cmdObj.configKey;
        let cmdLine = this.makeCmdLine(typeKey,params);
        var cloneElem = this.makeRowElem(elemKey,[type,value,nodeKey,configKey,cmdLine]);
        cloneElemList.push(cloneElem);
      }
    }
    return <Table striped condensed hover>{headElem}<tbody>{cloneElemList}</tbody></Table>;
  };
  makeShowAlerts() {
    console.log("makeShowAlerts");
    var alertElemList = [];
    const alerts = this.checkModel();
    var alertCols = ["Model Entity","Name","Level","Alert Message"];
    var headElem = this.makeHeadElem(alertCols);
    for (var i=0; i<alerts.length;i++)  {
      var alert = alerts[i];
      var entity = alert.type;
      var name = alert.name;
      var level = alert.level;
      var msg = alert.msg;
      var alertElem = this.makeRowElem(i,[entity,name,level,msg]);
      alertElemList.push(alertElem);
    }
    return <Table striped condensed hover>{headElem}<tbody>{alertElemList}</tbody></Table>;
  };
  // check model for errors
  checkModel() {
    let alerts = [];
    const modelName = this.props.name;
    const hosts = this.props.hosts;
    const nodes = this.props.nodes;
    const graphs = this.props.graphs;
    const configs = this.props.configs;
    const commands = this.props.commands;
    // Model-level
    if (Object.keys(graphs).length === 0)
      alerts.push({"type": "IonModel", "name": modelName, "level":"warn", "msg":"No graphs created."});
    if (Object.keys(nodes).length === 0)
      alerts.push({"type": "IonModel", "name": modelName, "level":"warn", "msg":"No nodes created."});
    // Node-level   required configs
    const reqConfigs = ["ionrc", "ionconfig"];
    // TODO : add req for bprc of either v6 or v7
    // Config-level required command types
    var reqCmds = {}; 
    reqCmds["ionrc"] = ["initialize","start"];
    reqCmds["bpv6rc"] = ["initialize","scheme","start"];
    reqCmds["bpv7rc"] = ["initialize","scheme","start"];
    reqCmds["ionconfig"] = [];
    reqCmds["ipnrc"] = ["plan"];
    reqCmds["ltprc"] = ["initialize"];
    reqCmds["bssprc"] = ["initialize"];
    // host loop
    for (var hostKey in hosts) {
      const host = hosts[hostKey];
      if (host.ipAddrKeys.length === 0) {
        let msg = "has no IP addresses defined.";
        alerts.push({"type": "Host", "name": hostKey, "level":"warn", "msg": msg});
      }
    }
    // node loop
    for (var nodeKey in nodes) {
      const node = nodes[nodeKey];
      if (node.hostKey === "") {
        let msg = "has no host machine assigned.";
        alerts.push({"type": "Node", "name": nodeKey, "level":"warn", "msg": msg});
      }
      var ionVerSeqNo = this.getIonVerSeqNo(nodeKey);
      var ionVer = versions[ionVerSeqNo].ionVersion;
      let protFlags = {};  // dict for protocol cmd existence
      let ductFlags = {};  // dict for duct cmd existence by protocol
      console.log("checking commands for version seq: " + ionVerSeqNo.toString())
      var nconfs = node.configKeys;
      for (let i=0; i<reqConfigs.length; i++) {
        let chkConf = reqConfigs[i];
        let missing = true;
        for (let j=0; j<nconfs.length; j++) {
          if (nconfs[j].indexOf(chkConf) >= 0)
            missing = false;
        }
        if (missing) {
          let msg = "Has no " + chkConf + " file.";
          alerts.push({"type": "Node", "name": nodeKey, "level":"warn", "msg": msg});
        }
      }
      console.log("+++ conf count: " + nconfs.length);
      // node configs loop
      for (let k=0; k<nconfs.length; k++) {
        let confKey = nconfs[k];
        var configObj = configs[confKey];
        let chkConf = configObj.configType;
        let cmdCounts = {};   // dict for cmd type counts

        let missed = [];   // assume all required commands missing...will drop from list if found
        if (reqCmds.hasOwnProperty(chkConf) ) 
          missed = reqCmds[chkConf];
        console.log("+++ checking reqd cmds: " + missed.toString());
        // node config commands loop
        for (let n=0; n<configObj.cmdKeys.length; n++) { 
          let cmdKey = configObj.cmdKeys[n];
          let cmdTypeKey = commands[cmdKey].typeKey;
          var cmdType = cmdTypes[cmdTypeKey];
          console.log("checking command type: " + cmdTypeKey + " " );
          if (cmdType.verFrom > ionVerSeqNo) {
            let msg = "Node " + nodeKey + "(" + ionVer + ") needs earlier variant of this command";
            alerts.push({"type": "Command", "name": cmdTypeKey, "level":"warn", "msg": msg});
          }
          if (cmdType.verThru < ionVerSeqNo) {
            let msg = "Node " + nodeKey + "(" + ionVer + ") needs later variant of this command";
            alerts.push({"type": "Command", "name": cmdTypeKey, "level":"warn", "msg": msg});
          }
          // keep count of each cmdType
          if (cmdCounts.hasOwnProperty(cmdTypeKey))
            cmdCounts[cmdTypeKey] += 1; 
          else 
            cmdCounts[cmdTypeKey] = 1;

          for (let c=0; c<missed.length; c++) {
            let reqCmd = missed[c];
            if (cmdTypeKey.indexOf(reqCmd) >= 0) {
              missed.splice(c,1);  // drop this one from missing list
              break;               // and exit loop
            }
          }
          // check for missing command parameters
          let cmdObj = commands[cmdKey];
          let cmdStr = this.makeCmdLine(cmdTypeKey,cmdObj.values);
          console.log("cmdStr: " + cmdStr);
          if (cmdStr.indexOf("??") > -1) {
            let msg = "Missing parameter(s).";
            let cmdTag = nodeKey + "." + cmdTypeKey;
            alerts.push({"type": "Command", "name": cmdTag, "level":"warn","msg": msg});
          }
          // check for missing protocol cmds
          if (cmdStr.indexOf("induct")  > -1 || 
              cmdStr.indexOf("outduct") > -1 ) {
             let pList = cmdStr.split(" ").filter(Boolean);  // get non-empty tokens
             let prot = pList[2];   // 3rd token should be protocol
             ductFlags[prot] = 1;  // don't need full count
          }
          if (cmdStr.indexOf("protocol")  > -1) {
             let pList = cmdStr.split(" ").filter(Boolean);  // get non-empty tokens
             let prot = pList[2];   // 3rd token should be protocol
             protFlags[prot] = 1;  // don't need full count
          }
        }  // end of command loop
        // check for incorrect command duplicates
        console.log("***** cmdCounts " + JSON.stringify(cmdCounts));
        for (var cntKey in cmdCounts) {
          if (cmdCounts[cntKey] > 1) {
            console.log("***** " + cntKey + " count =" + cmdCounts[cntKey].toString() );
            if (!cmdTypes[cntKey].hasOwnProperty("multiple")) {   // singleton command?
              let msg = "Improper duplicate command: " + cntKey;
              alerts.push({"type": "Config", "name": confKey, "level":"warn", "msg": msg});
            }
          }
        }
        // alert any missing commands
        for (let m=0; m<missed.length; m++) {
          let missedCmd = missed[m];
          let msg = "Has no " + missedCmd + " command.";
          alerts.push({"type": "Config", "name": confKey, "level":"warn", "msg": msg});
        }
      } //end of config loop
      console.log("***** ductFlags " + JSON.stringify(ductFlags));
      console.log("***** protFlags " + JSON.stringify(protFlags));
      // alert any missing protocol commands
      for (var prot in ductFlags) {
        if (!protFlags.hasOwnProperty(prot)) {
          let msg = "The bprc is missing the protocol " + prot + " command.";
          alerts.push({"type": "Node", "name": nodeKey, "level":"error", "msg": msg});
        }
      }
    } // end of node loop

    return alerts;
  }
  makeSelectFormElem(val,handler,options) {
    var form =
      <FormControl
        readOnly={!this.state.editMode}
        disabled={!this.state.editMode}
        bsSize="sm"
        componentClass="select"
        value={val}
        onChange={handler}
        >{options}
      </FormControl>;
    return form;
  }
  // show current value with selection widget
  makeShowForm(val) {
    var form =
      <FormControl
        readOnly="true"
        bsSize="sm"
        type="text"
        value={val}
      />;
    return form;
  }
  makeIonEditor() {
    //console.log(">>makeModelElems " + JSON.stringify(this.state));
    var modelElems = [];
    const icon = 'remove';
    const head  = 
      <Row key="head">
        <Col sm={4}><Label bsSize="lg" bsStyle="default">ION Model Editor</Label></Col>
        <Col sm={1}><Button bsSize="sm" bsStyle="success"  onClick={this.noedit}><Glyphicon glyph={icon} /></Button></Col>
      </Row>;
    modelElems.push(head);
    const nameElem = this.makeModelElem("name","text",this.state.name,"ION Model Name",1,false,"");
    modelElems.push(nameElem);
    const descElem = this.makeModelElem("desc","text",this.state.desc,"Description",2,false,"");
    modelElems.push(descElem);
    const numElem  = this.makeModelElem("nextNodeNum","number",this.state.nextNodeNum,"Next Node Num",1,false,"(for new Node)");
    modelElems.push(numElem);
    // build contactGraph selector
    const contactFunc = this.handleIonChange.bind(null,"currentContacts");
    const graphs = this.props.graphs;
    var opts = [];
    for (var name in graphs) {
      var graph = graphs[name];
      var option = name;   // get the first & only key
      var text = graph["desc"];
      opts.push(<option key={option} value={option}>{option}    == {text}</option>);
    };
    opts.unshift(<option key="none" value="none">(Select)</option>);
    console.log("graph options:");
    var contacts = this.state.currentContacts;
    var show = this.makeShowForm(contacts);
    var form = this.makeSelectFormElem(contacts,contactFunc,opts);
    const contElem = 
      <Row key="contacts">
        <Col className="text-right" sm={2}><b>Current Contacts Name</b></Col>
        <Col sm={1} value={contacts}>{show}</Col>
        <Col sm={2} type="select" value={contacts} readOnly="false">{form}</Col>
        <Col sm={2} ></Col>
      </Row>;
    modelElems.push(contElem);

    return (
      <div>
        {modelElems}
      </div>
    );
  };
  makeIonViewer() {
    //console.log(">>makeModelElems " + JSON.stringify(this.state));
    var modelElems = [];
    const head  = <Row key="head"><Col sm={2}> <Label bsSize="lg" bsStyle="default">ION Model Viewer</Label></Col></Row>;
    modelElems.push(head);
    const nameElem = this.makeModelElem("name","text",this.state.name,"ION Model Name",1,true,"");
    modelElems.push(nameElem);
    const descElem = this.makeModelElem("desc","text",this.state.desc,"Description",2,true,"");
    modelElems.push(descElem);
    const numElem  = this.makeModelElem("nextNodeNum","text",this.state.nextNodeNum,"Next Node Num",1,true,"");
    modelElems.push(numElem);
    const contactsElem  = this.makeModelElem("currentContacts","text",this.state.currentContacts,"Current Contacts Graph",1,true,"");
    modelElems.push(contactsElem);

    return (
      <div>
        {modelElems}
      </div>
    );
  };
  makeModelElem(prop,type,val,label,size,read,note) {
    //console.log(">>MakeModelElem " + prop + ' ' + type + ' ' + val + ' ' + size);
    const form =
        <FormControl readOnly={read} bsSize="sm" type={type} value={val} onChange={this.handleIonChange.bind(null,prop)} />;
    return (
      <Row key={label}>
        <Col className="text-right" sm={2}><b>{label}</b></Col>
        <Col sm={size} value={val}>{form}</Col>
        <Col sm={2} value={2}>{note}</Col>
      </Row>
    );
  };
  makeSurveyElem() {
    return (
      <div>
        <hr />
        <Row>
          <Col sm={1}></Col>
          <Col className="text-left"  sm={2}><b>Click Popout Survey Topic(s):</b></Col>
          <Col sm={6}> 
            <ButtonToolbar>
              <SurveyPopout label="Hosts" showSurvey={this.makeShowHosts.bind(this)}></SurveyPopout>
              <SurveyPopout label="Nodes" showSurvey={this.makeShowNodes.bind(this)}></SurveyPopout>
              <SurveyPopout label="Configs" showSurvey={this.makeShowConfigs.bind(this)}></SurveyPopout>
              <SurveyPopout label="Commands" showSurvey={this.makeShowCommands.bind(this)}></SurveyPopout>
              <SurveyPopout label="Endpoints" showSurvey={this.makeShowEndpoints.bind(this)}></SurveyPopout>
              <SurveyPopout label="Inducts" showSurvey={this.makeShowInducts.bind(this)}></SurveyPopout>
              <SurveyPopout label="Outducts" showSurvey={this.makeShowOutducts.bind(this)}></SurveyPopout>
              <SurveyPopout label="Spans" showSurvey={this.makeShowSpans.bind(this)}></SurveyPopout>
              <SurveyPopout label="Clones" showSurvey={this.makeShowClones.bind(this)}></SurveyPopout>
              <SurveyPopout label="Alerts" showSurvey={this.makeShowAlerts.bind(this)}></SurveyPopout>
            </ButtonToolbar>
          </Col>
        </Row>
      </div>
    );
  };
  render() {
    //console.log("IonModel render begin. state" +JSON.stringify(this.state));
    console.log("IonModel render begin.");
    const name = this.state.name;
    const editMode = this.state.editMode;
    const viewMode = this.state.viewMode;
    const surveyMode = this.state.surveyMode;
    const showPopoutMode = this.state.showPopoutMode;
    const showDeleteWarn = this.state.showDeleteWarn;
    const expandMode = this.state.expandMode;

    const ionHosts    = expandMode? this.makeHostListElem(name) : "";
    const ionNodeList = expandMode? this.makeIonNodeListElem(name) : "";
    const graphList   = expandMode? this.makeGraphListElem(name) : "";

    const showSurveyTag = surveyMode?  "Hide Surveys" : "Show Surveys" ;
    const offerSurveys = surveyMode? this.makeSurveyElem() : "";
    const showPopoutWin = showPopoutMode? this.makeShowPopout() : "";
    const showDeleteWarnModal = showDeleteWarn? this.makeShowDeleteWarn() : "";
    const editLabel = editMode?  'Submit' : 'Edit'
    const viewLabel = viewMode?  'Hide' : 'Show'
    const expandIcon = expandMode? 'chevron-down' : 'chevron-right';
    const dimSaveION = false;
    const dimSaveConfigs = false;

    var alerts = this.checkModel();   // any alerts?

    const alertit =  alerts.length? <Alert bsStyle="danger"><b>See Alerts (in Surveys)</b></Alert> : "";

    let viewPanel = null;
    if (viewMode)
      if (editMode)
        viewPanel = this.makeIonEditor();
      else
        viewPanel = this.makeIonViewer();

    console.log("IonModel render return next.")
    return (
      <div>
        <hr />
        <Row>
          <Col className="text-left"  sm={1}><Label bsSize="sm" bsStyle="default">ION Model</Label></Col>
          <Col className="text-right" sm={1}><b>{name}</b></Col>
          <Col className="text-left"  sm={2}>{this.state.desc}</Col>
          <Col sm={6}> 
            <ButtonToolbar>
              <Button bsSize="sm" bsStyle="primary" onClick={this.edit}>{editLabel}</Button>
              <Button bsSize="sm" bsStyle="info" onClick={this.view}>{viewLabel}</Button>
              <Button bsSize="sm" bsStyle="info" onClick={this.showSurveys}>{showSurveyTag}</Button>
              <Button bsSize="sm" bsStyle="primary" disabled={dimSaveION}  onClick={this.saveModel}>Save Model</Button>
              <Button bsSize="sm" bsStyle="primary" disabled={dimSaveConfigs}  onClick={this.saveConfigs}>Save Configs</Button>
              <Button bsSize="sm" bsStyle="danger" onClick={this.showDeleteWarn}>Delete Model</Button>
              <Button bsSize="sm" bsStyle="success" onClick={this.expand}><Glyphicon glyph={expandIcon}/>{' '}</Button>
            </ButtonToolbar>
          </Col>
          <Col sm={2}> {alertit} </Col>
        </Row>
        {offerSurveys}
        {showPopoutWin}
        {showDeleteWarnModal}
        <Panel collapsible expanded={viewMode}>
          {viewPanel}
        </Panel>
        <Panel  collapsible expanded={expandMode}>
          {ionHosts}
          {ionNodeList}
          {graphList}
        </Panel>
      </div>
    );

  };
  expand = () => { // activated by expand/contract shutter icon
    var newState = Object.assign({},this.state);
    var expandMode = this.state.expandMode;
    if (expandMode)
      console.log("let's close-up ion model list!");
    else
      console.log("let's expand ion mode list!");
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
    console.log("submit ion model updates!" + JSON.stringify(this.state.desc));
    var ionModel = { 
      "name": this.state.name,
      "desc": this.state.desc,
      "nextNodeNum": this.state.nextNodeNum,
      "currentContacts": this.state.currentContacts
    };
    var tran = {
      action: "UPDATE-ION-MODEL",
      ionModel: ionModel
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
  showSurveys = () => {
    console.log(">>show Surveys!");
    const newMode = !this.state.surveyMode;
    this.setState({
      surveyMode: newMode
    });
  };
  showPopout = () => {
    console.log(">>show Popout!");
    const newMode = !this.state.showPopoutMode;
    if (!newMode) {   // time ot close?
      var myPopout = window.open("","POPOUT");
      if (myPopout) {
        console.log("myPopout lives!!");
        myPopout.close();
      }
      else
        console.log("myPopout null-ish!!");
      //myPopout.close();
    }
    this.setState({
      showPopoutMode: newMode
    });
  };
  showDeleteWarn = () => {
    console.log("Delete Model pressed.");
    this.setState({
      showDeleteWarn: true
    });
  };
  deleteModelState = (toggle) => {
    console.log("delete model state: "+toggle);
    const deleteModel = toggle;
    if (deleteModel) {
      this.delete();
    }
    this.setState({
      showDeleteWarn: false
    });
  };
  delete = () => {
    console.log("deleting ION model "+this.state.name);
    var tran = {
      action: "DELETE-ION-MODEL",
      ionModelName: this.state.name
    };
    this.props.dispatch(tran);
  };
  saveModel = () => {
    console.log("save ION model!");
    const modelObj = this.makeModelObj();
    const modelJson = JSON.stringify(modelObj,null,2);
    const blob = new Blob( [modelJson], {type: "text/plain; charset=utf-8"} );
    const modelName = this.state.name + ".json";
    console.log("save ION model to: " + modelName);
    saveAs(blob, modelName, true);   // true = disable autoBOM
  };
  saveConfigs = () => {
    console.log("let's save all config files in a zip file!");
    var zip = new JSZip();
    var rootdir = zip.folder(this.props.name);   // the network name
    // build common contact graph
    const graphKey = this.props.currentContacts + ".cg";
    var graphLines = this.makeCmdLines(graphKey);


    // build config files node-by-node
    for (var nodeKey in this.props.nodes) {
      const node = this.props.nodes[nodeKey]
      var nodedir = rootdir.folder(node.id);
      const confKeys = node.configKeys;
      var lf = "\n";   // assign linefeed format for text files
      var host = this.props.hosts[node.hostKey];  // get host object of node
      if (host.linefeed === 'windows')            // windows is different
        lf = "\r\n";

      for (let j=0; j<confKeys.length; j++) {
        var configKey = confKeys[j];
        console.log("Saving config file: " + configKey);
        const cmdLines = this.makeCmdLines(configKey);
        const page = cmdLines.join(lf) + lf;
        nodedir.file(configKey,page);
      };
      let graphPage = graphLines.join(lf) + lf;
      nodedir.file(graphKey,graphPage);  // add common contact graph
      // ... and build start scripts for each node
      let startName = "start_" + nodeKey + ".sh";
      console.log("Saving start file: " + startName);
      let cmdLines = this.makeStartLines(nodeKey);
      let page = cmdLines.join(lf) + lf;
      nodedir.file(startName,page);
    };
    const zipname = this.props.name + ".zip";
    zip.generateAsync( {type:"blob"}).then(function(content) {
      saveAs(content, zipname, true);   // true = disable autoBOM
    });
    console.log("finished zip file!??");
  };
  handleIonChange = (prop,e) => {
    console.log("a value change of" + prop +  e);
    var newState = Object.assign({},this.state);
    console.log(">>> param old value = " + newState.desc);
    newState[prop] = e.target.value;
    this.setState (newState);
    e.preventDefault();
  };
}

IonModel.propTypes = {
  name: PropTypes.string.isRequired,
  desc: PropTypes.string.isRequired,
  nextNodeNum: PropTypes.number.isRequired,
  currentContacts: PropTypes.string.isRequired,

  hosts: PropTypes.array.isRequired,
  ipaddrs: PropTypes.array.isRequired,
  graphs: PropTypes.array.isRequired,
  nodes: PropTypes.array.isRequired,
  configs: PropTypes.array.isRequired,
  commands: PropTypes.array.isRequired,
  cloneValues: PropTypes.array.isRequired,

  getNodeKey: PropTypes.func.isRequired,      // func to find nodeKey from a cmdKey
  isGoodName: PropTypes.func.isRequired,      // func to validate name
  isGoodNodeKey: PropTypes.func.isRequired,   // func to validate nodeKey not in use
  isGoodNodeNum: PropTypes.func.isRequired,   // func to validate node num not in use
  checkModel: PropTypes.func.isRequired,      // func to check the entire model
  getValues:  PropTypes.func.isRequired,      // get command value list
  makeOptionElems: PropTypes.func.isRequired, // func to provide options
  makeTypeOptions: PropTypes.func.isRequired, // func to make type options
  getOptionText: PropTypes.func.isRequired,   // func to get option text

  dispatch: PropTypes.func.isRequired,        // func to handle transactions centrally
};
