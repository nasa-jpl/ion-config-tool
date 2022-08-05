//        GraphList.jsx     GraphList React Component
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
import Graph from './Graph.jsx';

import cmdTypes    from './cmdTypes.json';

export default class GraphList  extends React.Component {
  propTypes: {
    name:  React.PropTypes.string.isRequired,         // user model - model name

    graphs: React.PropTypes.array.isRequired,         // graph objects of the ION network
    configs: React.PropTypes.array.isRequired,        // config objects of the ION network
    commands: React.PropTypes.array.isRequired,       // config objects of the ION network

    isGoodName: React.PropTypes.func.isRequired,      // validate name format
    makeCmdLines: React.PropTypes.func.isRequired,    // all lines formatting of config file
    makeTypeOptions: React.PropTypes.func.isRequired, // get dynamic (cloned) options
    makeOptionElems: React.PropTypes.func.isRequired, // func to provide options
    makeConfigElem: React.PropTypes.func.isRequired,  // build config element
    makeCommandElem: React.PropTypes.func.isRequired, // build command element
    makeParamProps: React.PropTypes.func.isRequired,  // build param props

    dispatch: React.PropTypes.func.isRequired
  }
  constructor (props) {
    super(props);
    console.log("GraphList ctor");
    this.state = {
      expandMode: false,
      newGraph: false,
      newGraphMsg: "",
      newGraphId: ""
    };
  } 
  makeAlertElem(msg) {
    return (<Alert bsStyle="danger"><b>ERROR: {msg}</b></Alert>);
  }
  // check if a new graph name is valid
  isGoodGraphKey(newGraphKey) {
    console.log("isGoodGraphKey ?? " + newGraphKey);
    for (var graphKey in this.props.graphs)
       if (graphKey === newGraphKey)
         return false;
    return true;
  }
  makeGraphElem(graphKey, configList) {
    console.log("makeGraphElem");
    const graph = this.props.graphs[graphKey];
    console.log("graph: " +JSON.stringify(graph) );
    const desc = graph.desc;
    const ver = graph.ionVersion;

    const configKey = graph.configKey;

    const makeOptElems = this.props.makeOptionElems;    // pass through
    const dispatch = this.props.dispatch;               // pass through

    return (
      <Graph
        key={graphKey}                // unique id
        name={graphKey}               // graph key
        desc={desc}                   // description
        version={ver}                 // ion version of graph

        configKey={configKey}         // user model - config file key of this graph

        makeOptionElems={makeOptElems}// get static options
        dispatch={dispatch}           // dispatch func for graph transactions

        children={configList}         // list of Config children
      />
    );  
  }
  makeNewGraphElem() {
    console.log("makeNewGraphElem");
    const id = this.state.newGraphId;
        // check for alert
    let msg = this.state.newGraphMsg;
    var alert = (msg === "")?  "" : this.makeAlertElem(msg);

    var form =
      <FormControl bsSize="sm" type="text" value={id} spellCheck="false" onChange={this.handleNewGraph}/>;
    const icon = 'remove';
    return (
      <div>
        <hr />
        <Row>
          <Col className="text-right" sm={2}><b>New Graph Name:</b></Col>
          <Col sm={1}>{form}</Col>
          <Col sm={1}>(no spaces)</Col>
          <Col sm={2}>
            <ButtonToolbar>
              <Button bsSize="sm" bsStyle="primary" onClick={this.submitNewGraph}>Submit</Button>
              <Button bsSize="sm" bsStyle="success" onClick={this.nonewgraph}><Glyphicon glyph={icon} /></Button>
            </ButtonToolbar>
          </Col>
          <Col sm={4}>{alert}</Col>
        </Row>
      </div>
    );
  };

  render() {
    console.log("GraphList render ");
    const expandMode = this.state.expandMode;
    const name = this.props.name;
    const newGraph = this.state.newGraph;
    const graphs = this.props.graphs;

    const expandIcon = expandMode? 'chevron-down' : 'chevron-right';

    const dimNewGraph = newGraph?  true : false ;
    const graphCnt = '(' + Object.keys(graphs).length.toString() + ')';
    const graphEntry  = newGraph?  this.makeNewGraphElem() : "" ; 

    // gather Graph element definitions
    var graphList = [];
    for (var graphKey in graphs) {
      console.log("next graph: " + graphKey);
      var graph = graphs[graphKey];
      console.log("Graph:" + graph.name);
      var configList = [];    // gather Config element for Graph (1)
      var configKey = graph.configKey;

      console.log("Config: configKey:" + configKey);
      var config = this.props.configs[configKey];  
      console.log("Config:" + config.configType);
      var cmdKeys = config.cmdKeys;
      var cmdList = [];    // gather Command elements for Config type    
      for (var j = 0; j < cmdKeys.length; j++) {
        var cmdKey = cmdKeys[j];
        const cmd = this.props.commands[cmdKey];
        const cmdTypeKey = cmd.typeKey;
        //console.log("Command cmdKey:" + cmdKey + " cmdTypeKey: " + cmdTypeKey);
        var paramTypeKeys = cmdTypes[cmdTypeKey].paramTypes;
        var paramProps = [];
        for (var k = 0; k < paramTypeKeys.length; k++) {
          const pTypeKey = paramTypeKeys[k];
          const val = cmd.values[k];
          paramProps.push(this.props.makeParamProps(pTypeKey,val));
        }
        //console.log("calling makeCommandElem");
        // dummy values used for nodeKey and hostKey, since contact commands are not unique to a node
        cmdList.push(this.props.makeCommandElem(graphKey,configKey,cmdKey,"",paramProps) );
      }
      configList.push(this.props.makeConfigElem(configKey,cmdKeys,cmdList) );
      graphList.push(this.makeGraphElem(graphKey,configList) );
    }
    return (
      <Grid fluid>
        <Row>
          <div className="row mt-4">
            <Col className="text-right" sm={1}><Label bsSize="lg" bsStyle="default">Graph List</Label></Col>
            <Col className="text-right" sm={1}><b>{name}</b></Col>
            <Col className="text-left"  sm={2}>Contact Graphs {graphCnt}</Col>
            <Col sm={3}> 
              <ButtonToolbar>
                <Button bsSize="sm" bsStyle="primary" disabled={dimNewGraph} onClick={this.newgraph}>New Contact Graph</Button>  
                <Button bsSize="sm" bsStyle="success" onClick={this.expand}><Glyphicon glyph={expandIcon}/>{' '}</Button>
              </ButtonToolbar>
            </Col>
          </div>
        </Row>
        <Row>
          {graphEntry}
        </Row>
        <Panel collapsible expanded={expandMode}>
          {graphList}
        </Panel>
      </Grid>
    )
  };
  expand = () => {       // activated by expand/contract shutter icon
    var newState = Object.assign({},this.state);
    var expandMode = this.state.expandMode;
    if (expandMode)
      console.log("let's close-up graph list!");
    else
      console.log("let's expand graph list!");
    newState.expandMode = !expandMode;  // toggling flag changes render
    this.setState (newState);
  };
  newgraph = () => {     // activated by newnode button
    var newState = Object.assign({},this.state);
    console.log("add a new graph!");
    newState.newGraph= true;   // setting flag changes render
    this.setState (newState);
  };
  nonewgraph = () => {   // activated by new graph cancel button
    var newState = Object.assign({},this.state);
    console.log("cancel add a new graph!");
    newState.newGraph = false;   // setting flag changes render
    this.setState (newState);
  };
  handleNewGraph = (e) => {
    const val = e.target.value;
    console.log("a new graph name!" + val);
    var newState = Object.assign({},this.state);
    newState.newGraphId = val;
    this.setState (newState);
    e.preventDefault();
  };
  submitNewGraph = (e) => {
    console.log("a new graph!" + e);
    const graphKey = this.state.newGraphId;
    console.log("graph name = " + graphKey);
    let msg = "";
    if (!this.props.isGoodName(graphKey) )
      msg = "Graph name is mal-formed.";
    else if (!this.isGoodGraphKey(graphKey) )
      msg = "Graph name already used." ;
    if (msg === "") {  // all good!
      const tran = {
        action: "NEW-GRAPH",
        graphKey: graphKey
      };
      this.props.dispatch(tran);
      this.setState({
        expandMode: true,    // open up to show new node
        newGraph: false,     // setting flag changes render
        newGraphId: "",
        newGraphMsg: ""
      });
    } else {        // set msg to show problem
      this.setState({
        newGraphMsg: msg
      });
    }
    e.preventDefault();
  };
}
