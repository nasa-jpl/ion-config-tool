//        NetAddr.jsx     Net IpAddr React Component
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
import {Button,ButtonToolbar} from 'react-bootstrap';
import {Alert} from 'react-bootstrap';

export default class NetAddr  extends React.Component {
  propTypes: {
    hostKey: React.PropTypes.string.isRequired,      // user model - host name
    ipAddr: React.PropTypes.string.isRequired,       // user model - ipAddr
    addMode: React.PropTypes.string.isRequired,      // true  - elem is for adding a new ipaddr
                                                     // false - elem is for change/delete of existing ipaddr
    netHost:  React.PropTypes.object.isRequired,     // user model - net host object
    netAddrs: React.PropTypes.array.isRequired,      // user model - net ipaddr names

    isGoodName: React.PropTypes.func.isRequired,     // func to validate name

    dispatch: React.PropTypes.func.isRequired,
  }
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
    const ipaddrs = this.props.netAddrs;
    console.log("isGoodIpAddr ?? " + ipAddr + " in " + ipaddrs);
    for (var i=0; i<ipaddrs.length; i++) {
      if (ipaddrs[i] === ipAddr)
        return false;
    }
    return true;
  }
  // gets current position in array (which could change)
  getPosition() {
    var position = 1;
    const host = this.props.netHost;
    var ipAddr = this.props.ipAddr;
    console.log("host: "+ JSON.stringify(host));
    let addrs = host.ipAddrs;
    for (var i=0; i<addrs.length; i++) {
      console.log ("comparing: " + addrs[i] + " " + ipAddr);
      if (addrs[i] === ipAddr) { break; };
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
    const isIpAddr = this.state.ipAddr;
    const wasIpAddr = this.state.wasIpAddr;
    var tran = {
      action: "CHANGE-NETADDR",
      hostKey: hostKey,
      wasIpAddr: wasIpAddr,
      isIpAddr: isIpAddr
    };
    this.props.dispatch(tran);
    this.setState (newState);
  };
  delete = () => {   // activated delete button 
    console.log("delete ipaddr!");
    const hostKey = this.props.hostKey;
    const ipAddr = this.props.ipAddr;
    const tran = {
      action: "DELETE-NETADDR",
      hostKey: hostKey,
      ipAddr: ipAddr
    };
    this.props.dispatch(tran);
    // don;t bother with state changes...this component is going to vanish
  };
  add = () => {   // activated by add button 
    console.log("add ipaddr!");
    var newState = Object.assign({},this.state);
    newState.changeMode = false;
    newState.addMode = false;
    const hostKey = this.props.hostKey;
    const ipAddr = this.state.ipAddr;
    let msg = "";
    if (!this.props.isGoodName(ipAddr) )
      msg = "ipAddr name is mal-formed.";
    if (!this.isGoodIpAddr(ipAddr) )
      msg = "ipAddr already used." ;
    if (msg === "") {  // all good!
      newState.ipAddr = "";  // clear the name for the next add
      const tran = {
        action: "NEW-NETADDR",
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
    console.log("a value change of netAddr: "+  e);
    var newState = Object.assign({},this.state);
    console.log(">>> param old value = " + newState.ipAddr);
    newState.ipAddr = e.target.value;
    this.setState (newState);
    e.preventDefault();
  };
}