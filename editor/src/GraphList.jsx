//        GraphList.jsx     GraphList React Component
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
import {Container,Row,Col} from 'react-bootstrap';
import {Badge,Button,ButtonGroup} from 'react-bootstrap';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';
import {BsQuestionCircle} from 'react-icons/bs';
import {BsXLg,BsChevronDoubleDown,BsChevronDoubleRight} from "react-icons/bs";
import {Card} from 'react-bootstrap';
import {Alert} from 'react-bootstrap';
import Graph from './Graph.jsx';

export default class GraphList  extends React.Component {
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
    return (<Alert variant="danger"><b>ERROR: {msg}</b></Alert>);
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
      <FormControl bssize="sm" type="text" value={id} spellCheck="false" onChange={this.handleNewGraph}/>;
    return (
      <Container fluid>
        <hr />
        <Row>
          <Col className="text-right" sm={2}><b>New Graph Name:</b></Col>
          <Col sm={1}>{form}</Col>
          <Col sm={1}>(no spaces)</Col>
          <Col sm={2}>
            <ButtonGroup>
              <Button variant="primary" className="mr-1" onClick={this.submitNewGraph}>Submit</Button>
              <Button variant="success" onClick={this.nonewgraph}><BsXLg/></Button>
            </ButtonGroup>
          </Col>
          <Col sm={4}>{alert}</Col>
        </Row>
      </Container>
    );
  };

  render() {
    console.log("GraphList render ");
    const expandMode = this.state.expandMode;
    const name = this.props.name;
    const newGraph = this.state.newGraph;
    const graphs = this.props.graphs;

    const expandIcon = expandMode? <BsChevronDoubleDown/>: <BsChevronDoubleRight/>;

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
        var paramTypeKeys = this.props.cmdTypes[cmdTypeKey].paramTypes;
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
      <Container fluid>
        <hr />
        <Row>
            <Col className="text-left" lg={2}>
            <ButtonGroup>
            <h5><Badge pill bg="primary" text="light">Graph List</Badge></h5>
              <OverlayTrigger
                placement="right"
                overlay={
                  <Tooltip id="tooltip">
                    Expand to view, create or edit ION contact graph configuration. 
                  </Tooltip>
                }
              >
                <div style={{alignItems: "center", display: "flex", marginLeft: "5px"}}>
                <BsQuestionCircle />
                </div>
              </OverlayTrigger>
            </ButtonGroup>            
            </Col>
            <Col className="text-left" lg={2}><h6>Contact Graphs {graphCnt}</h6></Col>
            <Col sm={3}> 
              <ButtonGroup>
                <Button variant="primary"  className="mr-1" disabled={dimNewGraph} onClick={this.newgraph}>New Contact Graph</Button>  
                <Button variant="success" onClick={this.expand}>{expandIcon}{' '}</Button>
              </ButtonGroup>
            </Col>
        </Row>
        <Row>
          {graphEntry}
        </Row>
        {expandMode && (
          <Card>
            {graphList}
          </Card>
        )}
      </Container>
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

GraphList.propTypes = {
  name:  PropTypes.string.isRequired,         // user model - model name

  graphs: PropTypes.array.isRequired,         // graph objects of the ION network
  configs: PropTypes.array.isRequired,        // config objects of the ION network
  commands: PropTypes.array.isRequired,       // config objects of the ION network
  cmdTypes: PropTypes.object.isRequired,

  isGoodName: PropTypes.func.isRequired,      // validate name format
  makeCmdLines: PropTypes.func.isRequired,    // all lines formatting of config file
  makeTypeOptions: PropTypes.func.isRequired, // get dynamic (cloned) options
  makeOptionElems: PropTypes.func.isRequired, // func to provide options
  makeConfigElem: PropTypes.func.isRequired,  // build config element
  makeCommandElem: PropTypes.func.isRequired, // build command element
  makeParamProps: PropTypes.func.isRequired,  // build param props

  dispatch: PropTypes.func.isRequired
}
