//        NetHost.jsx     NetHost React Component
//
//        Copyright (c) 2018, California Institute of Technology.
//        ALL RIGHTS RESERVED.  U.S. Government Sponsorship
//        acknowledged.
//                                                                   
//      Author: Rick Borgen, Jet Propulsion Laboratory         
//                                                               
import React from 'react';
import PropTypes from 'prop-types';
import {ButtonGroup, FormControl} from 'react-bootstrap';
import {Container,Row,Col} from 'react-bootstrap';
import {Badge,Button} from 'react-bootstrap';
import {BsXLg} from "react-icons/bs";
import {Card} from 'react-bootstrap';
import {Alert} from 'react-bootstrap';
import NetAddr from './NetAddr.jsx';

export default class NetHost  extends React.Component {
  constructor (props) {
    super(props);
    // props
    const hostKey = this.props.hostKey;
    const desc = this.props.desc;
    console.log("NetHost ctor " + desc + ' ' + hostKey);
    this.state = {
      editMode: false,
      viewMode: false,
      expandMode: false,
      alertMsg: "",

      hostKey: hostKey,
      desc: desc
    }
  }
  makeAlertElem(msg) {
    return (<Alert variant="danger"><b>ERROR: {msg}</b></Alert>);
  }
  makeIpAddrElem(hostKey,ipAddr,addMode) {
    console.log("makeIpAddrElem");
    const netaddrs = this.props.netaddrs;
    const netHost = this.props.netHost;
    console.log("host: " + hostKey + "  ipAddr: " + ipAddr + "  mode: " + addMode );

    const isValidIPAddr = this.props.isValidIPAddr;
    const dispatch = this.props.dispatch;  // make sure dispatch remembers "this"

    return (
      <NetAddr
        key={ipAddr}                  // unique id
        hostKey={hostKey}             // host name
        ipAddr={ipAddr}               // ip addr
        addMode={addMode}             // true: add  false: change/delete

        netHost={netHost}             // net host object
        netAddrs={netaddrs}           // ipaddr array

        isValidIPAddr={isValidIPAddr} // IP address validator

        dispatch={dispatch}           // dispatch func for new hosts
      />
    );  
  }
  // show choices with selection widget
  makeSelectForm(val,handler,options) {
    console.log("makeSelectFormElem version = " + val);
    var form =
      <FormControl
        readOnly="false"
        bssize="sm"
        as="select"
        value="{val}"
        onChange={handler}
        >{options}
      </FormControl>;
    return form;
  }
  // show current value with selection widget
  makeShowForm(val) {
    var form =
      <FormControl
        readOnly="true"
        bssize="sm"
        type="text"
        value={val}
      />;
    return form;
  }
  makeHostEditor() {
    //console.log(">>makeHostElems " + JSON.stringify(this.state));
    var hostElems = [];
    const hostKey = this.props.hostKey;
    const head  = 
      <Row key="head">
        <Col sm={5}> <Badge bg="secondary" text="light">Net Host Editor</Badge></Col>
        <Col sm={2}>
          <ButtonGroup>
            <Button variant="outline-danger"   onClick={this.delete}>Delete</Button>
            <Button variant="outline-success"  onClick={this.noedit}><BsXLg/></Button>
          </ButtonGroup>
        </Col>
      </Row>
    hostElems.push(head);
    const keyElem = this.makeHostElem("","text",this.state.hostKey,"Host Name",2,true,"");
    hostElems.push(keyElem);
    const descElem = this.makeHostElem("desc","text",this.state.desc,"Description",2,false,"");
    hostElems.push(descElem);
    const listline = <Row key="listline">
        <Col className="text-right" sm={3}><b>Host IP Addresses</b></Col>
        <Col sm={3}>(each item edited separately)</Col>
      </Row>;

    var ipAddrList = [];
    var addrs = this.props.netHost.ipAddrs;
    for (var m = 0; m < addrs.length; m++) {
      let ipAddr= addrs[m];
      ipAddrList.push(this.makeIpAddrElem(hostKey,ipAddr,false) );
    }
    ipAddrList.push(this.makeIpAddrElem(hostKey,"",true) );  // finish list with an "add" item
  
    const msg = "";
    var alert = (msg === "")?  "" : this.makeAlertElem(msg);

    return (
      <div>
        {hostElems}
        <Row>{alert}</Row>
        <hr />
        {listline}
        {ipAddrList}
      </div>
    );
  };
  makeHostViewer() {
    //console.log(">>makeHostElems " + JSON.stringify(this.state));
    var hostElems = [];
    const head  = <Row key="head"><Col sm={2}> <Badge bg="secondary" text="light">Net Host Viewer</Badge></Col></Row>;
    hostElems.push(head);
    const keyElem = this.makeHostElem("","text",this.state.hostKey,"Host Name",2,true,"");
    hostElems.push(keyElem);
    const descElem = this.makeHostElem("desc","text",this.state.desc,"Description",2,true,"");
    hostElems.push(descElem);

    var addrs = this.props.netHost.ipAddrs;
    console.log("+++++Viewer ipaddrs:" + JSON.stringify(addrs) );
    const note = (addrs.length > 0)? "(list)" : "(none)";
    const listline = <Row key="listline">
        <Col className="text-right" sm={3}><b>Host IP Addresses</b></Col>
        <Col sm={3}>{note}</Col>
      </Row>;

    var ipAddrList = [];
    for (var i=0; i<addrs.length; i++) {
      let ipAddr = addrs[i];
      var label = (i+1) + ") IP Address (or DNS Name)";
      var ipAddrElem = this.makeHostElem("","text",ipAddr,label,2,true,"");
      ipAddrList.push(ipAddrElem);
    }

    return (
      <div>
        {hostElems}
        <hr />
        {listline}
        {ipAddrList}
      </div>
    );
  };
  makeHostElem(prop,type,val,label,size,read,note) {
    //console.log(">>MakeHostElem " + prop + ' ' + type + ' ' + val + ' ' + size);
    const form =
        <FormControl readOnly={read} bssize="sm" type={type} value={val} spellCheck="false" onChange={this.handleHostChange.bind(null,prop)} />;
    return (
      <Row key={label}>
        <Col className="text-right" sm={3}><b>{label}</b></Col>
        <Col sm={size} value={val}>{form}</Col>
        <Col sm={size} value={2}>{note}</Col>
      </Row>
    );
  };
    
  render() {
    const hostKey = this.props.hostKey;
    console.log("NetHost render " + hostKey);
    const editMode = this.state.editMode;
    const viewMode = this.state.viewMode;

    const editLabel = editMode?  'Submit' : 'Edit'
    const viewLabel = viewMode?  'Hide' : 'Show'

    let viewPanel = null;
    if (viewMode)
      if (editMode)
        viewPanel = this.makeHostEditor();
      else
        viewPanel = this.makeHostViewer();

    return (
      <Container fluid>
        <Row>
            <Col className="text-right" sm={1}><h6><Badge bg="secondary" text="light">Net Host</Badge></h6></Col>
            <Col className="text-right" sm={1}><b>{hostKey}</b></Col>
            <Col className="text-left"  sm={3}>{this.props.desc}</Col>
            <Col sm={2}> 
              <ButtonGroup>
                <Button variant="outline-primary" onClick={this.edit}>{editLabel}</Button>
                <Button variant="outline-info" onClick={this.view}>{viewLabel}</Button>
              </ButtonGroup>
            </Col>
        </Row>
        <Card collapsible expanded={viewMode}>
         {viewPanel}
        </Card>
      </Container>
    )
  };

  edit = () => {   // activated by Edit/Submit button
    var newState = Object.assign({},this.state);
    const editMode = this.state.editMode;
    if (editMode)
      this.submit();
    else {
      console.log("let's edit!");
      newState.viewMode = true;   // force viewing
    }
    newState.editMode = !editMode;  // toggle mode
    this.setState (newState);
  };
  noedit = () => {   // activated by X glyph button (cancel edit)
    var newState = Object.assign({},this.state);
    newState.editMode = false;   // cancel editing
    newState.viewMode = false;   // cancel viewing
    this.setState (newState);
  };
  submit = () => {    // callable by edit (above)
    console.log("submit net host updates!" + JSON.stringify(this.props.desc));
    var tran = {
      action: "UPDATE-NET-HOST",
      hostKey: this.props.hostKey,
      desc: this.state.desc
    };
    this.props.dispatch(tran);
  };
  view = () => { // activated by view/hide button
    var newState = Object.assign({},this.state);
    var viewMode = this.state.viewMode;
    if (viewMode)
      console.log("let's hide view panel!");
    else
      console.log("let's show view panel!");
    newState.viewMode = !viewMode;
    this.setState (newState);
  };
  delete = () => {   // activated delete button 
    console.log("delete net-host!");
    const hostKey = this.props.hostKey;
    const tran = {
      action: "DELETE-NET-HOST",
      hostKey: hostKey
    };
    this.props.dispatch(tran);
    // don;t bother with state changes...this component is going to vanish
  };
  handleHostChange = (prop,e) => {
    console.log("a value change of " + prop +  e);
    var newState = Object.assign({},this.state);
    console.log(">>> param old value = " + newState[prop]);
    newState[prop] = e.target.value;
    this.setState (newState);
    e.preventDefault();
  };
}

NetHost.propTypes = {   
  hostKey: PropTypes.object.isRequired,         // user model - netHost key
  desc: PropTypes.string.isRequired,

  netHost: PropTypes.object.isRequired,         // user model - net host object
  netaddrs: PropTypes.array.isRequired,         // user model - net ipaddr names list

  isValidIPAddr: PropTypes.func.isRequired,     // func to validate IP address

  dispatch: PropTypes.func.isRequired
}
