//        NetHopList.jsx     NetHopList React Component
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
import {BsXLg} from "react-icons/bs";
import {BsChevronDoubleDown} from "react-icons/bs";
import {BsChevronDoubleRight} from "react-icons/bs";
import {Card} from 'react-bootstrap';
import {Alert} from 'react-bootstrap';
import NetHop from './NetHop.jsx';

export default class NetHopList  extends React.Component {
  constructor (props) {
    super(props);
    console.log("NetHopList ctor");
    this.state = {
      expandMode: false,
      newHop: false,
      newHopMsg: "",
      newHopId: ""
    };
  } 
  makeAlertElem(msg) {
    return (<Alert variant="danger"><b>ERROR: {msg}</b></Alert>);
  }
  makeNetHopElem(hopKey) {
    const hop = this.props.netHops[hopKey];

    console.log("***makeNetHopElem" + JSON.stringify(hop) );

    const makeOptions = this.props.makeTypeOptions;
    const makeOptElems = this.props.makeOptionElems;
    const makeNetNodeOptions = this.props.makeNetNodeOptions;
    const makeNetNodeOptionsForParam = this.props.makeNetNodeOptionsForParam;
    const makeNetIPOptions = this.props.makeNetIPOptions;
    const getDefaultIPforNode = this.props.getDefaultIPforNode;
    const getPortNumForNodeAndProtocol = this.props.getPortNumForNodeAndProtocol;
    const dispatch = this.props.dispatch;  // pass dispatch through

    return (
      <NetHop
        key={hopKey}                  // unique id
        hopKey={hopKey}               // state
        desc={hop.hopDesc}            // state
        fromNode={hop.fromNode}       // state
        fromIP={hop.fromIP}           // state
        toNode={hop.toNode}           // state
        toIP={hop.toIP}               // state
        bpLayer={hop.bpLayer}         // state
        ltpLayer={hop.ltpLayer}       // state
        portNum={hop.portNum}         // state
        maxRate={hop.maxRate}         // state
        symmetric={hop.symmetric}     // state

        makeTypeOptions={makeOptions} 
        makeOptionElems={makeOptElems}

        makeNetNodeOptions = {makeNetNodeOptions}
        makeNetNodeOptionsForParam = {makeNetNodeOptionsForParam}
        makeNetIPOptions = {makeNetIPOptions}
        getDefaultIPforNode = {getDefaultIPforNode}
        getPortNumForNodeAndProtocol = {getPortNumForNodeAndProtocol}
        dispatch={dispatch}           // dispatch func for hop updates
      />
    );  
  }

  makeNewHopElem() {
    console.log("makeNewHopElem");
    const id = this.state.newHopId;
        // check for alert
    let msg = this.state.newHopMsg;
    var alert = (msg === "")?  "" : this.makeAlertElem(msg);

    var form =
      <FormControl bssize="sm" type="text" value={id} spellCheck="false" onChange={this.handleNewHop}/>;
    const icon = 'remove';
    return (
      <Container fluid>
        <hr />
        <Row>
          <Col className="text-right" sm={2}><b>New Hop Name:</b></Col>
          <Col sm={1}>{form}</Col>
          <Col sm={1}>(no spaces)</Col>
          <Col sm={2}>
            <ButtonGroup>
              <Button variant="primary" onClick={this.submitNewHop}>Submit</Button>
              <Button variant="success" onClick={this.nonewhop}><BsXLg/></Button>
            </ButtonGroup>
          </Col>
          <Col sm={4}>{alert}</Col>
        </Row>
      </Container>
    );
  };

  render() {
    console.log("NetHopList render ");
    const expandMode = this.state.expandMode;
    const name = this.props.name;
    const newHop = this.state.newHop;
    const netHops = this.props.netHops;

    const expandIcon = expandMode? <BsChevronDoubleDown/> : <BsChevronDoubleRight/>;

    const dimNewHop = newHop?  true : false ; 
    const hopEntry  = newHop?  this.makeNewHopElem() : "" ;

    const hopCnt = '(' + Object.keys(netHops).length.toString() + ')';
    var hopList = [];
    for (var hopKey in this.props.netHops) {
      hopList.push(this.makeNetHopElem(hopKey));
    }

    return (
      <Container fluid>
        <hr />
        <Row>
            <Col className="text-left" lg={2}>
            <ButtonGroup>
            <h5><Badge pill bg="primary" text="light">Net Hop List</Badge></h5>
              <OverlayTrigger
                placement="right"
                overlay={
                  <Tooltip id="tooltip">
                    Expand to view, create or edit network hops. Network nodes must exist before hops can be created and hops must exist before an ION model can be built.
                  </Tooltip>
                }
              >
                <div style={{alignItems: "center", display: "flex", marginLeft: "5px"}}>
                <BsQuestionCircle />
                </div>
              </OverlayTrigger>
            </ButtonGroup>
            </Col>
            <Col className="text-left" lg={2}><h6>Node-to-Node Hops {hopCnt}</h6></Col>
            <Col> 
              <ButtonGroup>
                <Button variant="primary" className="mr-1" disabled={dimNewHop} onClick={this.newhop}>New Hop</Button>  
                <Button variant="success" onClick={this.expand}>{expandIcon}{' '}</Button>
              </ButtonGroup>
            </Col>
        </Row>
        <Row>
          {hopEntry}
        </Row>
        {expandMode && (
          <Card>
            {hopList}
          </Card>
        )}
      </Container>
    )
  };
  expand = () => {       // activated by expand/contract shutter icon
    var newState = Object.assign({},this.state);
    var expandMode = this.state.expandMode;
    if (expandMode)
      console.log("let's close-up hop list!");
    else
      console.log("let's expand hop list!");
    newState.expandMode = !expandMode;  // toggling flag changes render
    this.setState (newState);
  };
  newhop = () => {     // activated by newhop button
    var newState = Object.assign({},this.state);
    console.log("add a new hop!");
    newState.newHop= true;   // setting flag changes render
    this.setState (newState);
  };
  nonewhop = () => {   // activated by new hop cancel button
    var newState = Object.assign({},this.state);
    console.log("cancel add a new hop!");
    newState.newHop = false;   // setting flag changes render
    this.setState (newState);
  };
  handleNewHop = (e) => {
    const val = e.target.value;
    console.log("a new hop name!" + val);
    var newState = Object.assign({},this.state);
    newState.newHopId = val;
    this.setState (newState);
    e.preventDefault();
  };
  submitNewHop = (e) => {
    console.log("a new net hop!" + e);
    const hopKey = this.state.newHopId;
    console.log("hop name = " + hopKey);
    let msg = "";
    if (!this.props.isGoodName(hopKey) )
      msg = "Hop name is mal-formed.";
    else if (!this.props.isGoodNetHopKey(hopKey) )
      msg = "Hop name already used." ;
    if (msg === "") {  // all good!
      const tran = {
        action: "NEW-NET-HOP",
        hopKey: hopKey
      };
      this.props.dispatch(tran);
      this.setState({
        expandMode: true,  // open up to show new hop
        newHop: false,    // setting flag changes render
        newHopId: "",
        newHopMsg: ""
      });
    } else {        // set msg to show problem
      this.setState({
        newHopMsg: msg
      });
    }
    e.preventDefault();
  };
}

NetHopList.propTypes = {
  name:  PropTypes.string.isRequired,            // user model - model name
  netHops: PropTypes.object.isRequired,          // hop dict

  isGoodName: PropTypes.func.isRequired,                 // validate name
  isGoodNetHopKey: PropTypes.func.isRequired,            // validate hopKey not in use
  makeTypeOptions: PropTypes.func.isRequired,            // get dynamic (cloned) options
  makeOptionElems: PropTypes.func.isRequired,            // get static options
  makeNetNodeOptions: PropTypes.func.isRequired,         // build nodekey options
  makeNetIPOptions: PropTypes.func.isRequired,           // build IP address options
  getDefaultIPforNode: PropTypes.func.isRequired,        // get default IP for given node
  makeNetNodeOptionsForParam: PropTypes.func.isRequired, // get options based on node
  getPortNumForNodeAndProtocol: PropTypes.func.isRequired, // get port number for selected protocol

  dispatch: PropTypes.func.isRequired,
}