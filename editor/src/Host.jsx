//        Host.jsx     Host React Component
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
import IpAddr from './IpAddr.jsx';

export default class Host  extends React.Component {
  constructor (props) {
    super(props);
    // props
    const desc = this.props.desc;
    const lf = this.props.linefeed;
    console.log("Host ctor " + desc);
    this.state = {
      editMode: false,
      viewMode: false,
      alertMsg: "",
      newIpAddrName: "",
      desc: desc,
      linefeed: lf
    }
  }
  makeAlertElem(msg) {
    return (<Alert bsStyle="danger"><b>ERROR: {msg}</b></Alert>);
  }
  makeIpAddrElem(hostKey,ipAddrKey,addMode) {
    console.log("makeIpAddrElem");
    const host = this.props.host;
    const ipaddrs = this.props.ipaddrs;
    const ipAddrObj = ipaddrs[ipAddrKey];
    let ipAddr = "";
    if (!addMode)
      ipAddr = ipAddrObj.ipAddr;
    console.log("host: " + JSON.stringify(host));

    const isGoodName = this.props.isGoodName;
    const dispatch = this.props.dispatch;  // make sure dispatch remembers "this"

    return (
      <IpAddr
        key={ipAddrKey}             // unique id
        ipAddrKey={ipAddrKey}       // ipAddr Key
        hostKey={hostKey}           // host name
        ipAddr={ipAddr}             // ip addr
        addMode={addMode}           // true: add  false: change/delete

        host={host}                 // host object
        ipaddrs={ipaddrs}           // ipaddr objects

        isGoodName={isGoodName}     // verify name string is valid

        dispatch={dispatch}         // dispatch func for new hosts
      />
    );  
  }
  makeSelectForm(val,options) {
    console.log("makeSelectFormElem linefeed = " + val);
    var form =
      <FormControl
        readOnly="false"
        bsSize="sm"
        componentClass="select"
        value="{val}"
        onChange={this.handleSelect.bind(null)}
        >{options}
      </FormControl>;
    return form;
  }
  // show current value with selection widget
  makeShowForm(val) {
    var form =
      <FormControl
        readOnly="true"
        bsSize="sm"
        type="text"
        value={val}
      />;
    return form;
  }

  makeHostEditor() {
    console.log(">>makeHostEditor " + JSON.stringify(this.state));
    var hostElems = [];
    const icon = 'remove';
    const hostKey = this.props.name;
    const head  = 
      <Row key="head">
        <Col sm={5}> <Label bsSize="lg" bsStyle="default">ION Host Editor</Label></Col>
        <Col sm={1}><Button bsSize="sm" bsStyle="success"  onClick={this.noedit}><Glyphicon glyph={icon} /></Button></Col>
      </Row>;
    hostElems.push(head);
    const nameElem = this.makeHostElem("","text",hostKey,"Host Name",1,true,"");
    hostElems.push(nameElem);
    const descElem = this.makeHostElem("desc","text",this.state.desc,"Description",2,false,"");
    hostElems.push(descElem);
    var val = this.state.linefeed;
    var opts = this.props.makeOptionElems("host_linefeed");
    const form = this.makeSelectForm(val,opts);
    const show = this.makeShowForm(val);
    const lfElem = 
      <Row key="linefeed">
        <Col className="text-right" sm={2}><b>Linefeed Type</b></Col>
        <Col sm={1} value={val}>{show}</Col>
        <Col sm={2} type="select" value={val} readOnly="false">{form}</Col>
        <Col sm={2} >(affects config text files)</Col>
      </Row>;
    hostElems.push(lfElem);

    const listline = <Row key="listline">
        <Col className="text-right" sm={2}><b>Host IP Addresses</b></Col>
        <Col sm={3}>(each item edited separately)</Col>
      </Row>;
    //var alert = (msg === "")?  "" : this.makeAlertElem(msg);
    var alert = "";

    var ipAddrList = [];
    var addrKeys = this.props.host.ipAddrKeys;
    for (var m = 0; m < addrKeys.length; m++) {
      let ipAddrKey = addrKeys[m];
      ipAddrList.push(this.makeIpAddrElem(hostKey,ipAddrKey,false) );
    }
    ipAddrList.push(this.makeIpAddrElem(hostKey,"add",true) );  // finish list with an "add" item

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
    console.log(">>makeHostViewer" + JSON.stringify(this.state));
    var hostElems = [];
    const head = <Row key="head"><Col sm={2}> <Label bsSize="lg" bsStyle="default">ION Host Viewer</Label></Col></Row>;
    hostElems.push(head);
    const nameElem = this.makeHostElem("","text",this.props.name,"Host Name",1,true,"");
    hostElems.push(nameElem);
    const descElem = this.makeHostElem("desc","text",this.state.desc,"Description",2,true,"");
    hostElems.push(descElem);
    var val = this.state.linefeed;
    const show = this.makeShowForm(val);
    const lfElem = 
      <Row key="linefeed">
        <Col className="text-right" sm={2}><b>Linefeed Type</b></Col>
        <Col sm={1} value={val}>{show}</Col>
      </Row>;
    hostElems.push(lfElem);

    var ipkeys = this.props.host.ipAddrKeys;
    console.log("+++++Viewer ips...ipkeys:" + JSON.stringify(ipkeys) );
    const note = (ipkeys.length > 0)? "(list)" : "(none)";
    const listline = <Row key="listline">
        <Col className="text-right" sm={2}><b>Host IP Addresses</b></Col>
        <Col sm={3}>{note}</Col>
      </Row>;

    var ipAddrList = [];
    for (var i=0; i<ipkeys.length; i++) {
      let ipAddrKey = ipkeys[i];
      let ipAddr = this.props.ipaddrs[ipAddrKey].ipAddr;
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
        <FormControl readOnly={read} bsSize="sm" type={type} value={val} spellCheck="false" onChange={this.handleHostChange.bind(null,prop)} />;
    return (
      <Row key={label}>
        <Col className="text-right" sm={2}><b>{label}</b></Col>
        <Col sm={size} value={val}>{form}</Col>
        <Col sm={size} value={2}>{note}</Col>
      </Row>
    );
  };
    
  render() {
    const hostKey = this.props.name;
    console.log("Host render " + hostKey);
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
    <div style={{backgroundColor: '#DBF4DC'}}>
     <Grid fluid>
        <Row>
          <div className="row mt-4">
            <Col className="text-right" sm={1}><Label bsSize="lg" bsStyle="default">ION Host</Label></Col>
            <Col className="text-right" sm={1}><b>{hostKey}</b></Col>
            <Col className="text-left"  sm={2}>{this.state.desc}</Col>
            <Col sm={3}> 
              <ButtonToolbar>
                <Button bsSize="sm" bsStyle="primary" onClick={this.edit}>{editLabel}</Button>
                <Button bsSize="sm" bsStyle="info" onClick={this.view}>{viewLabel}</Button> 
              </ButtonToolbar>
            </Col>
          </div>
        </Row>
        <Panel collapsible expanded={viewMode}>
         {viewPanel}
        </Panel>
      </Grid>
      </div>
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
    console.log("submit host updates!");
    var tran = {
      action: "UPDATE-HOST",
      hostKey: this.props.name,
      desc: this.state.desc,
      linefeed: this.state.linefeed
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
  handleSelect = (e) => {
    const val = e.target.value;
    console.log(">>> param selection!" + e + " value= " + val);
    var newState = Object.assign({},this.state);
    console.log(">>> param old value = " + newState.linefeed);
    newState.linefeed = val;
    this.setState (newState);
    this.render();
    e.preventDefault();
  };
  handleHostChange = (prop,e) => {
    console.log("a value change of" + prop +  e);
    var newState = Object.assign({},this.state);
    newState[prop] = e.target.value;
    this.setState (newState);
    e.preventDefault();
  };
}

Host.propTypes = { 
  name: PropTypes.string.isRequired,         // user model - host name
  desc: PropTypes.string.isRequired,
  linefeed: PropTypes.string.isRequired,     // linefeed style for text files

  host: PropTypes.object.isRequired,         // user model - host object
  ipaddrs: PropTypes.array.isRequired,       // user model - ipaddr objects 

  isGoodName: PropTypes.func.isRequired,     // func to validate name
  makeOptionElems: PropTypes.func.isRequired,

  dispatch: PropTypes.func.isRequired,
}