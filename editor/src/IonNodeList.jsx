//        IonNodeList.jsx     IonNodeList React Component
//
//        Copyright (c) 2018, California Institute of Technology.
//        ALL RIGHTS RESERVED.  U.S. Government Sponsorship
//        acknowledged.
//                                                                   
//      Author: Rick Borgen, Jet Propulsion Laboratory         
//                                                               
import React from 'react';
import {FormControl} from 'react-bootstrap';
import {Grid,Row,Col} from 'react-bootstrap';
import {Label,Button,ButtonToolbar} from 'react-bootstrap';
import {Glyphicon,Panel} from 'react-bootstrap';
import {Alert} from 'react-bootstrap';
import IonNode from './IonNode.jsx';

import cmdTypes    from './cmdTypes.json';

export default class IonNodeList  extends React.Component {
  propTypes: {
    name: React.PropTypes.string.isRequired,            // user model - model name
    currentContacts: React.PropTypes.string.isRequired, // user model - network contacts name

    nodes: React.PropTypes.array.isRequired,          // node objects of the ION network
    hosts: React.PropTypes.array.isRequired,          // host objects of the ION network
    configs: React.PropTypes.array.isRequired,        // config objects of the ION network
    commands: React.PropTypes.array.isRequired,       // config objects of the ION network
    ipaddrs: React.PropTypes.array.isRequired,        // ipaddr objects of the ION network

    isGoodName: React.PropTypes.func.isRequired,      // validate name format
    isGoodNodeNum: React.PropTypes.func.isRequired,   // validate node num
    usedNodeKey: React.PropTypes.func.isRequired,     // used as node key?
    makeCmdLines: React.PropTypes.func.isRequired,    // all lines formatting of config file
    makeStartLines: React.PropTypes.func.isRequired,  // all lines for a start script
    makeTypeOptions: React.PropTypes.func.isRequired, // get dynamic (cloned) options
    makeOptionElems: React.PropTypes.func.isRequired, // func to provide options
    makeConfigElem: React.PropTypes.func.isRequired,  // build config element
    makeCommandElem: React.PropTypes.func.isRequired, // build command element
    makeParamProps: React.PropTypes.func.isRequired,  // build param props

    dispatch: React.PropTypes.func.isRequired
  }
  constructor (props) {
    super(props);
    console.log("IonNodeList ctor");
    this.state = {
      expandMode: false,
      newIonNode: false,
      newIonNodeMsg: "",
      newIonNodeId: ""
    };
  } 
  makeAlertElem(msg) {
    return (<Alert bsStyle="danger"><b>ERROR: {msg}</b></Alert>);
  }
  // check if a new host name is valid
  isGoodIonNodeKey(newIonNodeKey) {
    console.log("isGoodIonNodeKey ?? " + newIonNodeKey);
    for (var nodeKey in this.props.nodes)
       if (nodeKey === newIonNodeKey)
         return false;
    return true;
  }
  makeIonNodeElem(nodeKey, configList) {
    console.log("makeIonNodeElem");
    const contacts = this.props.currentContacts;        // network contacts name
    const node = this.props.nodes[nodeKey];
    const configs = this.props.configs;
    const ipaddrs = this.props.ipaddrs;
    const desc = node.longName;
    const hostKey = node.hostKey;
    const host = this.props.hosts[hostKey];

    const configKeys = node.configKeys;
    const configNames = [ ];
    for (var i=0; i<configKeys.length; i++)  {
      const c = configKeys[i];
      configNames.push(configs[c].configType);
    };

    const isGoodNodeNum = this.props.isGoodNodeNum;     // pass through
    const makeCmdLines = this.props.makeCmdLines;       // pass through
    const makeStarts = this.props.makeStartLines;       // pass through
    const makeTypeOptions = this.props.makeTypeOptions; // pass through
    const makeOptElems = this.props.makeOptionElems;    // pass through
    const dispatch = this.props.dispatch;               // pass through

    return (
      <IonNode
        key={nodeKey}                 // unique id
        name={nodeKey}                // node key
        desc={desc}                   // description
        nodeNum={node.ionNodeNum}     // state
        version={node.ionVersion}     // state
        hostKey={hostKey}             // state
        host={host}                   // state
        currentContacts={contacts}    // user model - network contacts name

        configKeys={configKeys}       // user model - config file keys of this node
        configNames={configNames}     // user model - config type names of this node

        node={node}                    // node object
        ipaddrs={ipaddrs}              // ipaddr objects list

        isGoodNodeNum={isGoodNodeNum}      // verify that node num not already assigned
        makeCmdLines={makeCmdLines}        // all lines formatting of config file
        makeStartLines={makeStarts}        // all lines for a start script
        makeTypeOptions={makeTypeOptions}  // get dynamic (cloned) options
        makeOptionElems={makeOptElems}     // get static options

        dispatch={dispatch}                // dispatch func for node transactions

        children={configList}         // list of Config children
      />
    );  
  }
  makeNewIonNodeElem() {
    console.log("makeNewIonNodeElem");
    const id = this.state.newIonNodeId;
        // check for alert
    let msg = this.state.newIonNodeMsg;
    var alert = (msg === "")?  "" : this.makeAlertElem(msg);

    var form =
      <FormControl bsSize="sm" type="text" value={id} spellCheck="false" onChange={this.handleNewIonNode}/>;
    const icon = 'remove';
    return (
      <div>
        <hr />
        <Row>
          <Col className="text-right" sm={2}><b>New Node Name:</b></Col>
          <Col sm={1}>{form}</Col>
          <Col sm={1}>(no spaces)</Col>
          <Col sm={2}>
            <ButtonToolbar>
              <Button bsSize="sm" bsStyle="primary" onClick={this.submitNewIonNode}>Submit</Button>
              <Button bsSize="sm" bsStyle="success" onClick={this.nonewnode}><Glyphicon glyph={icon} /></Button>
            </ButtonToolbar>
          </Col>
          <Col sm={4}>{alert}</Col>
        </Row>
      </div>
    );
  };

  render() {
    console.log("IonNodeList render ");
    const expandMode = this.state.expandMode;
    const name = this.props.name;
    const newIonNode = this.state.newIonNode;
    const ionNodes = this.props.nodes;

    const expandIcon = expandMode? 'chevron-down' : 'chevron-right';

    const dimNewIonNode = newIonNode?  true : false ; 
    const nodeCnt = '(' + Object.keys(ionNodes).length.toString() + ')';
    const nodeEntry  = newIonNode?  this.makeNewIonNodeElem() : "" ; 

    // top-down definition of elements
    // gather Node element definitions
    var nodeList = [];
    for (var nodeKey in ionNodes) {
      console.log("next node: " + nodeKey);
      var node = ionNodes[nodeKey];
      var hostKey = node.hostKey;
      console.log("Node:" + node.longName);
      var configKeys = node.configKeys;
      var configList = [];    // gather Config elements for Node
      for (var i = 0; i < configKeys.length; i++) {
        var configKey = configKeys[i];
        console.log("Config  i:" + i + "  configKey:" + configKey);
        var config = this.props.configs[configKey];
        // console.log("Config:" + config.configType);
        var cmdKeys = config.cmdKeys;
        var cmdList = [];    // gather Command elements for Config
        for (var j = 0; j < cmdKeys.length; j++) {
          var cmdKey = cmdKeys[j];
          const cmd = this.props.commands[cmdKey];
          const cmdTypeKey = cmd.typeKey;
          // console.log("Command cmdKey:" + cmdKey + " cmdTypeKey: " + cmdTypeKey);
          var paramTypeKeys = cmdTypes[cmdTypeKey].paramTypes;
          var paramProps = [];
          for (var k = 0; k < paramTypeKeys.length; k++) {
            const pTypeKey = paramTypeKeys[k];
            const val = cmd.values[k];
            paramProps.push(this.props.makeParamProps(pTypeKey,val));
          }
          //console.log("calling makeCommandElem");
          cmdList.push(this.props.makeCommandElem(nodeKey,configKey,cmdKey,hostKey,paramProps) );
        }
        //console.log("calling makeConfigElem  cmds:" + cmdList.length);
        configList.push(this.props.makeConfigElem(configKey,cmdKeys,cmdList) );
      }
      nodeList.push(this.makeIonNodeElem(nodeKey,configList) );
    }
    return (
      <Grid fluid>
        <Row>
          <div className="row mt-4">
            <Col className="text-right" sm={1}><Label bsSize="lg" bsStyle="default">ION Node List</Label></Col>
            <Col className="text-right" sm={1}><b>{name}</b></Col>
            <Col className="text-left"  sm={2}>ION Node Servers {nodeCnt}</Col>
            <Col sm={3}> 
              <ButtonToolbar>
                <Button bsSize="sm" bsStyle="primary" disabled={dimNewIonNode} onClick={this.newnode}>New Ion Node</Button>  
                <Button bsSize="sm" bsStyle="success" onClick={this.expand}><Glyphicon glyph={expandIcon}/>{' '}</Button>
              </ButtonToolbar>
            </Col>
          </div>
        </Row>
        <Row>
          {nodeEntry}
        </Row>
        <Panel  collapsible expanded={expandMode}>
          {nodeList}
        </Panel>
      </Grid>
    )
  };
  expand = () => {       // activated by expand/contract shutter icon
    var newState = Object.assign({},this.state);
    var expandMode = this.state.expandMode;
    if (expandMode)
      console.log("let's close-up node list!");
    else
      console.log("let's expand node list!");
    newState.expandMode = !expandMode;  // toggling flag changes render
    this.setState (newState);
  };
  newnode = () => {     // activated by newnode button
    var newState = Object.assign({},this.state);
    console.log("add a new node!");
    newState.newIonNode= true;   // setting flag changes render
    this.setState (newState);
  };
  nonewnode = () => {   // activated by new node cancel button
    var newState = Object.assign({},this.state);
    console.log("cancel add a new node!");
    newState.newIonNode = false;   // setting flag changes render
    this.setState (newState);
  };
  handleNewIonNode = (e) => {
    const val = e.target.value;
    console.log("a new node name!" + val);
    var newState = Object.assign({},this.state);
    newState.newIonNodeId = val;
    this.setState (newState);
    e.preventDefault();
  };
  submitNewIonNode = (e) => {
    console.log("a new node!" + e);
    const nodeKey = this.state.newIonNodeId;
    console.log("node name = " + nodeKey);
    let msg = "";
    if (!this.props.isGoodName(nodeKey) )
      msg = "IonNode name is mal-formed.";
    else if (!this.isGoodIonNodeKey(nodeKey) )
      msg = "IonNode name already used." ;
    if (msg === "") {  // all good!
      const tran = {
        action: "NEW-NODE",
        nodeKey: nodeKey
      };
      this.props.dispatch(tran);
      this.setState({
        expandMode: true,    // open up to show new node
        newIonNode: false,   // setting flag changes render
        newIonNodeId: "",
        newIonNodeMsg: ""
      });
    } else {        // set msg to show problem
      this.setState({
        newIonNodeMsg: msg
      });
    }
    e.preventDefault();
  };
}
