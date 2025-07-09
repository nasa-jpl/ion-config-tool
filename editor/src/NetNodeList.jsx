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
import {Container,Row,Col} from 'react-bootstrap';
import {Badge,Button,ButtonGroup} from 'react-bootstrap';
import {BsXLg} from "react-icons/bs";
import {BsChevronDoubleDown} from "react-icons/bs";
import {BsChevronDoubleRight} from "react-icons/bs";
import {Card} from 'react-bootstrap';
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
    return (<Alert variant="danger"><b>ERROR: {msg}</b></Alert>);
  }
  makeNetNodeElem(nodeKey) {
    let node = {};
    node = this.props.netNodes[nodeKey];

    // Check if nodeType is set and default to "ion" if not.
    if (node.nodeType === "") {
      node.nodeType = "ion";
    }
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
      <FormControl bssize="sm" type="text" value={id} spellCheck="false" onChange={this.handleNewNode}/>;
    return (
      <Container fluid>
        <hr />
        <Row>
          <Col className="text-right" sm={2}><b>New Node Name:</b></Col>
          <Col sm={1}>{form}</Col>
          <Col sm={1}>(no spaces)</Col>
          <Col sm={2}>
            <ButtonGroup>
              <Button bssize="sm" variant="outline-primary" onClick={this.submitNewNode}>Submit</Button>
              <Button bssize="sm" variant="outline-success" onClick={this.nonewnode}><BsXLg/></Button>
            </ButtonGroup>
          </Col>
          <Col sm={4}>{alert}</Col>
        </Row>
      </Container>
    );
  };

  render() {
    console.log("NetNodeList render ");
    const expandMode = this.state.expandMode;
    const name = this.props.name;
    const newNode = this.state.newNode;
    const netNodes = this.props.netNodes;

    const expandIcon = expandMode? <BsChevronDoubleDown/> : <BsChevronDoubleRight/>;

    const dimNewNode = newNode?  true : false ; 
    const nodeEntry  = newNode?  this.makeNewNodeElem() : "" ;
    const nodeCnt = '(' + Object.keys(netNodes).length.toString() + ')';
    var nodeList = [];
    for (var nodeKey in netNodes) {
      nodeList.push(this.makeNetNodeElem(nodeKey));
    }

    return (
      <Container fluid>
        <hr />
        <Row>
            <Col className="text-left" sm={1}><h5><Badge pill bg="primary" text="light">Net Node List</Badge></h5></Col>
            <Col className="text-left" sm={2}><h6><b>{name}</b></h6></Col>
            <Col className="text-left" sm={2}><h6>DTN Nodes  {nodeCnt}</h6></Col>
            <Col> 
              <ButtonGroup>
                <Button bssize="sm" variant="outline-primary" disabled={dimNewNode} onClick={this.newnode}>New Node</Button>  
                <Button bssize="sm" variant="outline-success" onClick={this.expand}>{expandIcon}{' '}</Button>
              </ButtonGroup>
            </Col>
        </Row>
        <Row>
          {nodeEntry}
        </Row>
        {expandMode && (
          <Card>
            {nodeList}
          </Card>
        )}
      </Container>
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