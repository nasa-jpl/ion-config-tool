//        NetNodeList.jsx     NetNodeList React Component
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
import {Grid,Row,Col} from 'react-bootstrap';
import {Label,Button,ButtonToolbar} from 'react-bootstrap';
import {Glyphicon,Panel} from 'react-bootstrap';
import {Alert} from 'react-bootstrap';
import NetNode from './NetNode.jsx';

export default class NetNodeList  extends React.Component {
  constructor (props) {
    super(props);
    console.log("NetNodeList ctor");
    this.state = {
      expandMode: false,
      newNode: false,
      newNodeMsg: "",
      newNodeId: ""
    };
  } 
  makeAlertElem(msg) {
    return (<Alert bsStyle="danger"><b>ERROR: {msg}</b></Alert>);
  }
  makeNetNodeElem(nodeKey) {
    const node = this.props.netNodes[nodeKey];
    console.log("***makeNetNodeElem" + JSON.stringify(node) );
    const makeOptElems = this.props.makeOptionElems;
    const makeNetHostOptions = this.props.makeNetHostOptions;

    const dispatch = this.props.dispatch;  // pass dispatch through

    return (
      <NetNode
        key={nodeKey}                 // unique id
        nodeKey={nodeKey}             // state
        desc={node.nodeDesc}          // state
        nodeHost={node.nodeHost}      // state
        nodeType={node.nodeType}      // state
        endpointID={node.endpointID}  // state
        services={node.services}      // state

        makeOptionElems={makeOptElems}
        makeNetHostOptions = {makeNetHostOptions}
        dispatch={dispatch}           // dispatch func for node updates
      />
    );  
  }

  makeNewNodeElem() {
    console.log("makeNewNodeElem");
    const id = this.state.newNodeId;
        // check for alert
    let msg = this.state.newNodeMsg;
    var alert = (msg === "")?  "" : this.makeAlertElem(msg);

    var form =
      <FormControl bsSize="sm" type="text" value={id} spellCheck="false" onChange={this.handleNewNode}/>;
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
              <Button bsSize="sm" bsStyle="primary" onClick={this.submitNewNode}>Submit</Button>
              <Button bsSize="sm" bsStyle="success" onClick={this.nonewnode}><Glyphicon glyph={icon} /></Button>
            </ButtonToolbar>
          </Col>
          <Col sm={4}>{alert}</Col>
        </Row>
      </div>
    );
  };

  render() {
    console.log("NetNodeList render ");
    const expandMode = this.state.expandMode;
    const name = this.props.name;
    const newNode = this.state.newNode;
    const netNodes = this.props.netNodes;

    const expandIcon = expandMode? 'chevron-down' : 'chevron-right';

    const dimNewNode = newNode?  true : false ; 
    const nodeEntry  = newNode?  this.makeNewNodeElem() : "" ;
    const nodeCnt = '(' + Object.keys(netNodes).length.toString() + ')';
    var nodeList = [];
    for (var nodeKey in netNodes) {
      nodeList.push(this.makeNetNodeElem(nodeKey));
    }

    return (
      <Grid fluid>
        <Row>
          <div className="row mt-4">
            <Col className="text-right" sm={1}><Label bsSize="lg" bsStyle="default">Net Node List</Label></Col>
            <Col className="text-right" sm={1}><b>{name}</b></Col>
            <Col className="text-left"  sm={2}>Network Node Servers  {nodeCnt}</Col>
            <Col sm={3}> 
              <ButtonToolbar>
                <Button bsSize="sm" bsStyle="primary" disabled={dimNewNode} onClick={this.newnode}>New Node</Button>  
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
    newState.newNode= true;   // setting flag changes render
    this.setState (newState);
  };
  nonewnode = () => {   // activated by new node cancel button
    var newState = Object.assign({},this.state);
    console.log("cancel add a new node!");
    newState.newNode = false;   // setting flag changes render
    this.setState (newState);
  };
  handleNewNode = (e) => {
    const val = e.target.value;
    console.log("a new node name!" + val);
    var newState = Object.assign({},this.state);
    newState.newNodeId = val;
    this.setState (newState);
    e.preventDefault();
  };
  submitNewNode = (e) => {
    console.log("a new net node!" + e);
    const nodeKey = this.state.newNodeId;
    console.log("node name = " + nodeKey);
    let msg = "";
    if (!this.props.isGoodName(nodeKey) )
      msg = "Node name is mal-formed.";
    else if (!this.props.isGoodNetNodeKey(nodeKey) )
      msg = "Node name already used." ;
    if (msg === "") {  // all good!
      const tran = {
        action: "NEW-NET-NODE",
        nodeKey: nodeKey
      };
      this.props.dispatch(tran);
      this.setState({
        expandMode: true,  // open up to show new node
        newNode: false,    // setting flag changes render
        newNodeId: "",
        newNodeMsg: ""
      });
    } else {        // set msg to show problem
      this.setState({
        newNodeMsg: msg
      });
    }
    e.preventDefault();
  };
}

NetNodeList.propTypes = {
  name:  PropTypes.string.isRequired,           // user model - model name
  netNodes: PropTypes.object.isRequired,         // node elements of this node

  isGoodName: PropTypes.func.isRequired,        // func to validate name
  isGoodNetNodeKey: PropTypes.func.isRequired,  // func to validate nodeKey not in use
  makeOptionElems: PropTypes.func.isRequired,   // func to get static options
  makeNetHostOptions: PropTypes.func.isRequired,// func to build hostkey options
  dispatch: PropTypes.func.isRequired,
}