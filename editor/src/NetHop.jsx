//        NetHop.jsx     NetHop React Component
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

export default class NetHop  extends React.Component {
  constructor (props) {
    super(props);
    // props
    const hopKey = this.props.hopKey;
    const desc = this.props.desc;
    const fromNode = this.props.fromNode;
    const toNode = this.props.toNode;
    const bpLayer = this.props.bpLayer;
    const ltpLayer = this.props.ltpLayer;
    const portNum = this.props.portNum;
    const maxRate = this.props.maxRate;
    const symmetric = this.props.symmetric;
    console.log("NetHop ctor " + desc + ' ' + hopKey);
    this.state = {
      editMode: false,
      viewMode: false,
      expandMode: false,
      alertMsg: "",

      hopKey: hopKey,
      desc: desc,
      fromNode: fromNode,
      toNode: toNode,
      bpLayer: bpLayer,
      ltpLayer: ltpLayer,
      portNum: portNum,
      maxRate: maxRate,
      symmetric: symmetric
    }
  }
  makeAlertElem(msg) {
    return (<Alert bsStyle="danger"><b>ERROR: {msg}</b></Alert>);
  }
  getBool(flag) {     // return boolean type
    // could be boolean already, or a boolean string
    if (!flag || flag === "false" || flag === "no")
      return false;
    return true;
  }
  getBoolStr(flag) {  // return boolean string
    if(this.getBool(flag))
      return "true";
    return "false";
  }
  // show choices with selection widget
  makeSelectForm(val,handler,options) {
    console.log("makeSelectFormElem version = " + val);
    var form =
      <FormControl
        readOnly="false"
        bsSize="sm"
        componentClass="select"
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
        bsSize="sm"
        type="text"
        value={val}
      />;
    return form;
  }
  makeSelectElem(value,label,showform,selectform) {
    const selectElem = 
      <Row key={label}>
        <Col className="text-right" sm={2}><b>{label}</b></Col>
        <Col sm={1} value={value}>{showform}</Col>
        <Col sm={2} type="select" value={value} readOnly="false">{selectform}</Col>
        <Col sm={2} ></Col>
      </Row>;
    return selectElem;
  }
  makeHopEditor() {
    //console.log(">>makeHopElems " + JSON.stringify(this.state));
    var hopElems = [];
    const icon = 'remove';
    const head  = 
      <Row key="head">
        <Col sm={5}> <Label bsSize="lg" bsStyle="default">Net Hop Editor</Label></Col>
        <Col sm={2}>
          <ButtonToolbar>
            <Button bsSize="sm" bsStyle="danger"   onClick={this.delete}>Delete</Button>
            <Button bsSize="sm" bsStyle="success"  onClick={this.noedit}><Glyphicon glyph={icon} /></Button>
          </ButtonToolbar>
        </Col>
      </Row>;
    hopElems.push(head);
    const keyElem = this.makeHopElem("","text",this.state.hopKey,"Net Hop Name",2,true,"");
    hopElems.push(keyElem);
    const descElem = this.makeHopElem("desc","text",this.state.desc,"Description",3,false,"");
    hopElems.push(descElem);

    var param;
    var value;
    var handler;
    var opts;
    var selform;
    var showform;
    // build fromNode selector
    param    = "fromNode";
    value    = this.state.fromNode;
    handler  = this.handleHopChange.bind(null,param);
    opts     = this.props.makeNetNodeOptions();
    selform  = this.makeSelectForm(value,handler,opts);
    showform = this.makeShowForm(value);
    const fromNodeElem = this.makeSelectElem(value,'From Node Name',showform,selform);
    hopElems.push(fromNodeElem);
    // build toNode selector
    param    = "toNode";
    value    = this.state.toNode;
    handler  = this.handleHopChange.bind(null,param);
    opts     = this.props.makeNetNodeOptions();
    selform  = this.makeSelectForm(value,handler,opts);
    showform = this.makeShowForm(value);
    const toNodeElem = this.makeSelectElem(value,'To Node Name',showform,selform);
    hopElems.push(toNodeElem);
    // build bpLayer selector
    param    = "bpLayer";
    value    = this.state.bpLayer;
    handler  = this.handleHopChange.bind(null,param);
    opts     = this.props.makeOptionElems(param);
    selform  = this.makeSelectForm(value,handler,opts);
    showform = this.makeShowForm(value);
    const bpLayerElem = this.makeSelectElem(value,'BP Protocol Layer',showform,selform);
    hopElems.push(bpLayerElem);
    // build ltpLayer selector
    param    = "ltpLayer";
    value    = this.state.ltpLayer;
    handler  = this.handleHopChange.bind(null,param);
    opts     = this.props.makeOptionElems(param);
    selform  = this.makeSelectForm(value,handler,opts);
    showform = this.makeShowForm(value);
    const ltpLayerElem = this.makeSelectElem(value,'LTP Protocol Layer',showform,selform);
    hopElems.push(ltpLayerElem);

    const portNumElem = this.makeHopElem("portNum", "number", this.state.portNum,"Port Number",1,false,"");
    hopElems.push(portNumElem);

    const rateElem = this.makeHopElem("maxRate","number",this.state.maxRate,"Max Transmission Rate",1,false,"(bytes per sec)");
    hopElems.push(rateElem);
    // build ltpLayer selector
    param    = "symmetric";
    value    = this.getBoolStr(this.state.symmetric);
    handler  = this.handleHopChange.bind(null,param);
    opts     = this.props.makeOptionElems(param);
    selform  = this.makeSelectForm(value,handler,opts);
    showform = this.makeShowForm(value);
    const symmetricElem = this.makeSelectElem(value,'Symmetric 2-way Hop',showform,selform);
    hopElems.push(symmetricElem);
  
    const msg = "";
    var alert = (msg === "")?  "" : this.makeAlertElem(msg);

    return (
      <div>
        {hopElems}
        <Row>{alert}</Row>
      </div>
    );
  };
  makeHopViewer() {
    //console.log(">>makeHopElems " + JSON.stringify(this.state));
    var hopElems = [];
    const head  = <Row key="head"><Col sm={2}> <Label bsSize="lg" bsStyle="default">Net Hop Viewer</Label></Col></Row>;
    hopElems.push(head);
    const keyElem = this.makeHopElem("","text",this.state.hopKey,"Hop Name",2,true,"");
    hopElems.push(keyElem);
    const descElem = this.makeHopElem("desc","text",this.state.desc,"Description",3,true,"");
    hopElems.push(descElem);
    const fromNodeElem = this.makeHopElem("fromNode","text",this.state.fromNode,"From Node Name",1,true,"");
    hopElems.push(fromNodeElem);
    const toNodeElem = this.makeHopElem("toNode","text",this.state.toNode,"To Node Name",1,true,"");
    hopElems.push(toNodeElem);
    const bpLayerElem = this.makeHopElem("bpLayer","text",this.state.bpLayer,"BP Layer Protocol",1,true,"");
    hopElems.push(bpLayerElem);
    const ltpLayerElem = this.makeHopElem("ltpLayer","text",this.state.ltpLayer,"LTP Layer Protocol",1,true,"");
    hopElems.push(ltpLayerElem);
    const portNumElem = this.makeHopElem("portNum","number",this.state.portNum,"Port Number",1,true,"");
    hopElems.push(portNumElem);
    const rateElem = this.makeHopElem("maxRate","number",this.state.maxRate,"Max Transmission Rate",1,true,"(bytes per sec)");
    hopElems.push(rateElem);
    var symStr = this.getBoolStr(this.state.symmetric);
    const symmetricElem = this.makeHopElem("symmetric","text",symStr,"Symmetric 2-way Hop",1,true,"");
    hopElems.push(symmetricElem);

    return (
      <div>
        {hopElems}
      </div>
    );
  };
  makeHopElem(prop,type,val,label,size,read,note) {
    //console.log(">>MakeHopElem " + prop + ' ' + type + ' ' + val + ' ' + size);
    const form =
        <FormControl readOnly={read} bsSize="sm" type={type} value={val} spellCheck="false" onChange={this.handleHopChange.bind(null,prop)} />;
    return (
      <Row key={label}>
        <Col className="text-right" sm={2}><b>{label}</b></Col>
        <Col sm={size} value={val}>{form}</Col>
        <Col sm={size} value={2}>{note}</Col>
      </Row>
    );
  };
    
  render() {
    const hopKey = this.props.hopKey;
    console.log("NetHop render " + hopKey);
    const editMode = this.state.editMode;
    const viewMode = this.state.viewMode;

    const editLabel = editMode?  'Submit' : 'Edit'
    const viewLabel = viewMode?  'Hide' : 'Show'

    let viewPanel = null;
    if (viewMode)
      if (editMode)
        viewPanel = this.makeHopEditor();
      else
        viewPanel = this.makeHopViewer();

    return (
      <Grid fluid>
        <Row>
          <div className="row mt-4">
            <Col className="text-right" sm={1}><Label bsSize="lg" bsStyle="default">Net Hop</Label></Col>
            <Col className="text-right" sm={2}><b>{hopKey}</b></Col>
            <Col className="text-left"  sm={2}>{this.props.desc}</Col>
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
    console.log("submit hop updates!" + JSON.stringify(this.props.desc));
    var sym = this.getBool(this.state.symmetric);  // cast to boolean
    var tran = {
      action: "UPDATE-NET-HOP",
      hopKey: this.props.hopKey,
      desc: this.state.desc,
      fromNode: this.state.fromNode,
      toNode: this.state.toNode,
      bpLayer: this.state.bpLayer,
      ltpLayer: this.state.ltpLayer,
      portNum: this.state.portNum,
      maxRate: this.state.maxRate,
      symmetric: sym
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
    console.log("delete net-hop!");
    const hopKey = this.props.hopKey;
    const tran = {
      action: "DELETE-NET-HOP",
      hopKey: hopKey
    };
    this.props.dispatch(tran);
    // don;t bother with state changes...this component is going to vanish
  };
  handleHopChange = (prop,e) => {
    console.log("a value change of " + prop +  e);
    var newState = Object.assign({},this.state);
    console.log(">>> param old value = " + newState[prop]);
    newState[prop] = e.target.value;
    this.setState (newState);
    e.preventDefault();
  };
}

NetHop.propTypes = {   
  hopKey: PropTypes.object.isRequired,         // user model - netHop key
  desc: PropTypes.string.isRequired,
  fromHop: PropTypes.string.isRequired,
  toHop: PropTypes.string.isRequired,
  bpLayer: PropTypes.string.isRequired,
  ltpLayer: PropTypes.string.isRequired,
  portNum: PropTypes.number.isRequired,
  maxRate: PropTypes.number.isRequired,
  symmetric: PropTypes.bool.isRequired,

  makeTypeOptions: PropTypes.func.isRequired,    // func to get dynamic (cloned) options
  makeOptionElems: PropTypes.func.isRequired,    // func to get static options
  makeNetNodeOptions: PropTypes.func.isRequired, // func to build hostkey options
  dispatch: PropTypes.func.isRequired
}