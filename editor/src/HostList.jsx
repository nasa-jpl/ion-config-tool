//        HostList.jsx     HostList React Component
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
import Host from './Host.jsx';

export default class HostList  extends React.Component {

  constructor (props) {
    super(props);
    console.log("HostList ctor");
    this.state = {
      expandMode: false,
      newHost: false,
      newHostMsg: "",
      newHostId: ""
    };
  } 
  makeAlertElem(msg) {
    return (<Alert bsStyle="danger"><b>ERROR: {msg}</b></Alert>);
  }
  // check if a new host name is valid
  isGoodHostKey(newHostKey) {
    console.log("isGoodHostKey ?? " + newHostKey);
    for (var hostKey in this.props.hosts)
       if (hostKey === newHostKey)
         return false;
    return true;
  }
  makeHostElem(hostKey) {
    console.log("makeHostElem");
    const host = this.props.hosts[hostKey];
    const ipaddrs = this.props.ipaddrs;

    const desc = host.desc;
    const linefeed = host.linefeed;

    const isGoodName = this.props.isGoodName;         // pass throufh
    const makeOptElems = this.props.makeOptionElems;  // pass through
    const dispatch = this.props.dispatch;             // pass through

    return (
      <Host
        key={hostKey}                  // unique id
        name={hostKey}                 // host key
        desc={desc}                    // description
        linefeed={linefeed}            // linefeed type

        host={host}                    // host object
        ipaddrs={ipaddrs}              // ipaddr objects list

        isGoodName={isGoodName}        // general name validation
        makeOptionElems={makeOptElems} // static options building func

        dispatch={dispatch}            // dispatch func for host transactions
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
      <FormControl bsSize="sm" type="text" value={id} spellCheck="false" onChange={this.handleNewHost}/>;
    const icon = 'remove';
    return (
      <div>
        <hr />
        <Row>
          <Col className="text-right" sm={2}><b>New Host Name:</b></Col>
          <Col sm={1}>{form}</Col>
          <Col sm={1}>(no spaces)</Col>
          <Col sm={2}>
            <ButtonToolbar>
              <Button bsSize="sm" bsStyle="primary" onClick={this.submitNewHost}>Submit</Button>
              <Button bsSize="sm" bsStyle="success" onClick={this.nonewnode}><Glyphicon glyph={icon} /></Button>
            </ButtonToolbar>
          </Col>
          <Col sm={4}>{alert}</Col>
        </Row>
      </div>
    );
  };

  render() {
    console.log("HostList render ");
    const expandMode = this.state.expandMode;
    const name = this.props.name;
    const newHost = this.state.newHost;
    const ionHosts = this.props.hosts;

    const expandIcon = expandMode? 'chevron-down' : 'chevron-right';

    const dimNewHost = newHost?  true : false ; 
    const hostCnt = '(' + Object.keys(ionHosts).length.toString() + ')';
    const hostEntry  = newHost?  this.makeNewHostElem() : "" ; 

    var hostList = [];
    for (var hostKey in ionHosts) {
      hostList.push(this.makeHostElem(hostKey));
    }

    return (
      <Grid fluid>
        <Row>
          <div className="row mt-4">
            <Col className="text-right" sm={1}><Label bsSize="lg" bsStyle="default">ION Host List</Label></Col>
            <Col className="text-right" sm={1}><b>{name}</b></Col>
            <Col className="text-left"  sm={2}>ION Host Machines {hostCnt}</Col>
            <Col sm={3}> 
              <ButtonToolbar>
                <Button bsSize="sm" bsStyle="primary" disabled={dimNewHost} onClick={this.newhost}>New Ion Host</Button>  
                <Button bsSize="sm" bsStyle="success" onClick={this.expand}><Glyphicon glyph={expandIcon}/>{' '}</Button>
              </ButtonToolbar>
            </Col>
          </div>
        </Row>
        <Row>
          {hostEntry}
        </Row>
        <Panel  collapsible expanded={expandMode}>
          {hostList}
        </Panel>
      </Grid>
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
    else if (!this.isGoodHostKey(hostKey) )
      msg = "Host name already used." ;
    if (msg === "") {  // all good!
      const tran = {
        action: "NEW-HOST",
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

HostList.propTypes = {
  name:  PropTypes.string.isRequired,         // user model - model name

  hosts: PropTypes.array.isRequired,          // host objects of the ION network
  ipaddrs: PropTypes.array.isRequired,        // ipaddr objects of the ION network

  isGoodName: PropTypes.func.isRequired,      // func to validate name
  makeOptionElems: PropTypes.func.isRequired, // func to provide options

  dispatch: PropTypes.func.isRequired
}