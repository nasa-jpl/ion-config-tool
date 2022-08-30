//        IpAddr.jsx     IpAddr React Component
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
import {Button,ButtonToolbar} from 'react-bootstrap';
import {Alert} from 'react-bootstrap';

export default class IpAddr  extends React.Component {
  constructor (props) {
    super(props);
    // props
    const ipAddr = this.props.ipAddr;
    console.log("IpAddr ctor " + ipAddr);
    this.state = {
      changeMode: false,
      wasIpAddr: ipAddr,     // remember old ip addr while in change mode
      ipAddr: ipAddr,
      nameMsg: ""
    }
  }
  makeAlertElem(msg) {
    return (<Alert bsStyle="danger"><b>ERROR: {msg}</b></Alert>);
  }
  // check if a new ipAddr is valid
  isGoodIpAddr(ipAddr) {
    console.log("isGoodIpAddr ?? " + ipAddr);
    const ipaddrs = this.props.ipaddrs;
    for (var key in ipaddrs) {
      const addr = ipaddrs[key];
      if (addr.ipAddr === ipAddr)
        return false;
    }
    return true;
  }
  // gets current position in array (which could change)
  getPosition() {
    var position = 1;
    const host = this.props.host;
    var ipAddrKey = this.props.ipAddrKey;
    console.log("host: "+ JSON.stringify(host));
    let keys = this.props.host.ipAddrKeys;
    for (var i=0; i<keys.length; i++) {
      console.log ("comparing: " + keys[i] + " " + ipAddrKey);
      if (keys[i] === ipAddrKey) { break; };
      position += 1;
    }
    return position;
  }
    
  render() {
    const hostKey = this.props.hostKey;
    const ipAddr = this.state.ipAddr;
    console.log("IpAddr render " + hostKey + " " + ipAddr);
    const addMode = this.props.addMode;
    const changeMode = this.state.changeMode;

    var read = true;  // read only is default
    if (changeMode || addMode) { read = false; };
    const changeLabel = changeMode?  'Submit' : 'Change'
    const dimDelete = false;
    const tail = "IP Address (or DNS Name)";
    const pos = this.getPosition();
    const label  = addMode? "New " + tail : pos + " ) " + tail;

    const chgbtn = addMode? "" : <Button bsSize="sm" bsStyle="primary" onClick={this.change}>{changeLabel}</Button>;
    const delbtn = addMode? "" : <Button bsSize="sm" bsStyle="danger" disabled={dimDelete} onClick={this.delete}>Delete</Button>;
    const addbtn = addMode? <Button bsSize="sm" bsStyle="primary" onClick={this.add}>Add</Button> : "";

    let msg = this.state.nameMsg;
    var alert = (msg === "")?  "" : this.makeAlertElem(msg);

    const form =
      <FormControl readOnly={read} bsSize="sm" type="text" value={ipAddr} spellCheck="false" onChange={this.handleChange.bind(null)} />;

    return (
      <Grid fluid>
        <Row>
          <div className="row mt-4">
            <Col className="text-right" sm={2}><b>{label}</b></Col>
            <Col sm={2}>{form}</Col>
            <Col sm={3}> 
              <ButtonToolbar>
                {chgbtn}
                {delbtn}
                {addbtn}
              </ButtonToolbar>
            </Col>
            <Col sm={5}>{alert}</Col>
          </div>
        </Row>
      </Grid>
    )
  };
  change = () => {   // activated by Change/Submit button
    var newState = Object.assign({},this.state);
    const changeMode = this.state.changeMode;
    if (changeMode)
      this.submit();
    else {
      console.log("let's edit!");
      newState.viewMode = true;   // force viewing
    }
    newState.changeMode = !changeMode;  // toggle mode
    this.setState (newState);
  };
  submit = () => {   // activated by submit button
    var newState = Object.assign({},this.state);
    newState.changeMode = false;
    newState.wasIpAddr = newState.ipAddr;
    const hostKey = this.props.hostKey;
    const ipAddrKey = this.props.ipAddrKey;
    const ipAddr = this.state.ipAddr;
    var tran = {
      action: "CHANGE-IPADDR",
      hostKey: hostKey,
      ipAddrKey: ipAddrKey,
      ipAddr: ipAddr
    };
    this.props.dispatch(tran);
    this.setState (newState);
  };
  delete = () => {   // activated delete button 
    console.log("delete ipaddr!");
    const hostKey = this.props.hostKey;
    const ipAddrKey = this.props.ipAddrKey;
    const tran = {
      action: "DELETE-IPADDR",
      hostKey: hostKey,
      ipAddrKey: ipAddrKey
    };
    this.props.dispatch(tran);
    // don;t bother with state changes...this component is going to vanish
  };
  add = () => {   // activated delete button 
    console.log("add ipaddr!");
    var newState = Object.assign({},this.state);
    newState.changeMode = false;
    newState.addMode = false;
    newState.wasIpAddr = newState.ipAddr;
    newState.ipAddr = "";
    const hostKey = this.props.hostKey;
    const ipAddr = this.state.ipAddr;
    let msg = "";
    if (!this.props.isGoodName(ipAddr) )
      msg = "ipAddr name is mal-formed.";
    if (!this.isGoodIpAddr(ipAddr) )
      msg = "ipAddr already used." ;
    if (msg === "") {  // all good!
      const tran = {
        action: "NEW-IPADDR",
        hostKey: hostKey,
        ipAddr: ipAddr
      };
      this.props.dispatch(tran);
      newState.nameMsg = "";
    } else {        // set msg to show problem
      newState.nameMsg = msg;
    };
    this.setState (newState);
  };
  handleChange = (e) => {
    console.log("a value change of ipAddr: "+  e);
    var newState = Object.assign({},this.state);
    console.log(">>> param old value = " + newState.ipAddr);
    newState.ipAddr = e.target.value;
    this.setState (newState);
    e.preventDefault();
  };
}

IpAddr.propTypes = {
  hostKey: PropTypes.string.isRequired,      // user model - host name
  ipAddrKey:  PropTypes.string.isRequired,   // user model - ipAddr key
  ipAddr: PropTypes.string.isRequired,       // user model - ipAddr
  addMode: PropTypes.string.isRequired,      // true  - elem is for adding a new ipaddr
                                                     // false - elem is for change/delete of existing ipaddr
  host:  PropTypes.object.isRequired,        // user model - host object
  ipaddrs: PropTypes.array.isRequired,       // user model - ipaddr objects 

  isGoodName: PropTypes.func.isRequired,     // func to validate name

  dispatch: PropTypes.func.isRequired,
}