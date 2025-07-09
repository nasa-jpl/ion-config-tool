//        NetHostList.jsx     NetHostList React Component
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
import NetHost from './NetHost.jsx';

export default class NetHostList  extends React.Component {
  constructor (props) {
    super(props);
    console.log("NetHostList ctor");
    this.state = {
      expandMode: false,
      newHost: false,
      newHostMsg: "",
      newHostId: ""
    };
  } 
  makeAlertElem(msg) {
    return (<Alert variant="danger"><b>ERROR: {msg}</b></Alert>);
  }
  makeNetHostElem(hostKey) {
    const host = this.props.netHosts[hostKey];
    console.log("makeNetHostElem " + JSON.stringify(host));
    const desc = host.hostDesc;
    const netaddrs = this.props.netAddrs;
    const isGoodName = this.props.isGoodName;
    const isValidIPAddr = this.props.isValidIPAddr; // pass through
    const makeOptElems = this.props.makeOptElems;   // pass through
    const dispatch = this.props.dispatch;           // pass dispatch through

    return (
      <NetHost
        key={hostKey}              // unique id
        hostKey={hostKey}          // host key
        desc={desc}                // description
        netHost={host}             // net host object
        netaddrs={netaddrs}        // net ip addrs

        isValidIPAddr={isValidIPAddr}  // verify IP address is valid
        makeOptionElems={makeOptElems} // static options building func

        dispatch={dispatch}        // dispatch func for host transactions
      />
    );  
  }
  makeNewHostElem() {
    console.log("makeNewHostElem");
    const id = this.state.newHostId;
        // check for alert
    let msg = this.state.newHostMsg;
    var alert = (msg === "")?  "" : this.makeAlertElem(msg);

    var form =
      <FormControl bssize="sm" type="text" value={id} spellCheck="false" onChange={this.handleNewHost}/>;
    return (
      <Container fluid>
        <hr />
        <Row>
          <Col className="text-right" sm={2}><b>New Host Name:</b></Col>
          <Col sm={1}>{form}</Col>
          <Col sm={1}>(no spaces)</Col>
          <Col sm={2}>
            <ButtonGroup>
              <Button bssize="sm" variant="outline-primary" onClick={this.submitNewHost}>Submit</Button>
              <Button bssize="sm" variant="outline-success" onClick={this.nonewhost}><BsXLg/></Button>
            </ButtonGroup>
          </Col>
          <Col sm={4}>{alert}</Col>
        </Row>
      </Container>
    );
  };

  render() {
    console.log("NetHostList render ");
    const expandMode = this.state.expandMode;
    const name = this.props.name;
    const newHost = this.state.newHost;
    const netHosts = this.props.netHosts;

    const expandIcon = expandMode? <BsChevronDoubleDown/>: <BsChevronDoubleRight/>;

    const dimNewHost = newHost?  true : false ; 
    const hostEntry  = newHost?  this.makeNewHostElem() : "" ; 

    const hostCnt = '(' + Object.keys(netHosts).length.toString() + ')';
    var hostList = [];
    for (var hostKey in netHosts) {
      hostList.push(this.makeNetHostElem(hostKey));
    }

    return (
      <Container fluid>
        <hr />
       <Row>
            <Col className="text-left" lg={1}><h5><Badge pill bg="primary" text="light">Net Host List</Badge></h5></Col>
            <Col className="text-left" lg={2}><h6><b>{name}</b></h6></Col>
            <Col className="text-left" lg={2}><h6>Network Host Machines {hostCnt}</h6></Col>
            <Col> 
              <ButtonGroup>
                <Button variant="outline-primary" disabled={dimNewHost} onClick={this.newhost}>New Host</Button>  
                <Button variant="outline-success" onClick={this.expand}>{expandIcon}{' '}</Button>
              </ButtonGroup>
            </Col>
        </Row>
        <Row>
          {hostEntry}
        </Row>
        {expandMode && (
          <Card>
            {hostList}
          </Card>
        )}
      </Container>
    )
  };
  expand = () => {       // activated by expand/contract shutter icon
    var newState = Object.assign({},this.state);
    var expandMode = this.state.expandMode;
    if (expandMode)
      console.log("let's close-up host list!");
    else
      console.log("let's expand host list!");
    newState.expandMode = !expandMode;  // toggling flag changes render
    this.setState (newState);
  };
  newhost = () => {     // activated by newhost button
    var newState = Object.assign({},this.state);
    console.log("add a new host!");
    newState.newHost= true;   // setting flag changes render
    this.setState (newState);
  };
  nonewhost = () => {   // activated by new host cancel button
    var newState = Object.assign({},this.state);
    console.log("cancel add a new host!");
    newState.newHost = false;   // setting flag changes render
    this.setState (newState);
  };
  handleNewHost = (e) => {
    const val = e.target.value;
    console.log("a new host name!" + val);
    var newState = Object.assign({},this.state);
    newState.newHostId = val;
    this.setState (newState);
    e.preventDefault();
  };
  submitNewHost = (e) => {
    console.log("a new host!" + e);
    const hostKey = this.state.newHostId;
    console.log("host name = " + hostKey);
    let msg = "";
    if (!this.props.isGoodName(hostKey) )
      msg = "Host name is mal-formed.";
    else if (!this.props.isGoodNetHostKey(hostKey) )
      msg = "Host name already used." ;
    if (msg === "") {  // all good!
      const tran = {
        action: "NEW-NET-HOST",
        hostKey: hostKey
      };
      this.props.dispatch(tran);
      this.setState({
        expandMode: true,  // open up to show new host
        newHost: false,    // setting flag changes render
        newHostId: "",
        newHostMsg: ""
      });
    } else {        // set msg to show problem
      this.setState({
        newHostMsg: msg
      });
    }
    e.preventDefault();
  };
}

NetHostList.propTypes = {
  name:  PropTypes.string.isRequired,           // user model - model name
  netHosts: PropTypes.object.isRequired,        // user model - net host objects
  netAddrs:  PropTypes.array.isRequired,        // user model - net ipaddr names

  isGoodName: PropTypes.func.isRequired,        // func to validate name
  isGoodNetHostKey: PropTypes.func.isRequired,  // func to validate hostKey not in use
  isValidIPAddr: PropTypes.func.isRequired,     // func to validate IP address
  makeOptionElems: PropTypes.func.isRequired,   // func to provide options

  dispatch: PropTypes.func.isRequired
}