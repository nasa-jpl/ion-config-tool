//        NetNode.jsx     NetNode React Component
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
import {Label,Button,ButtonToolbar} from 'react-bootstrap';
import {Glyphicon,Panel} from 'react-bootstrap';
import {Alert} from 'react-bootstrap';

export default class NetNode  extends React.Component {
  propTypes: {   
    nodeKey: React.PropTypes.object.isRequired,         // user model - netNode key
    desc: React.PropTypes.string.isRequired,
    nodeHost: React.PropTypes.string.isRequired,
    nodeType: React.PropTypes.string.isRequired,
    endpointID: React.PropTypes.string.isRequired,
    services: React.PropTypes.array.isRequired,

    makeOptionElems: React.PropTypes.func.isRequired,   // func to get static options
    makeNetHostOptions: React.PropTypes.func.isRequired,// func to build hostkey options
    dispatch: React.PropTypes.func.isRequired
  }
  constructor (props) {
    super(props);
    // props
    const nodeKey = this.props.nodeKey;
    const desc = this.props.desc;
    const nodeHost = this.props.nodeHost;
    const nodeType = this.props.nodeType;
    const endpointID = this.props.endpointID;
    const services = this.props.services;
    console.log("NetNode ctor " + desc + ' ' + nodeKey);
    this.state = {
      editMode: false,
      viewMode: false,
      expandMode: false,
      aService: "",
      alertMsg: "",

      nodeKey: nodeKey,
      desc: desc,
      nodeHost: nodeHost,
      nodeType: nodeType,
      endpointID: endpointID,
      services: services
    }
  }
  makeAlertElem(msg) {
    return (<Alert bsStyle="danger"><b>ERROR: {msg}</b></Alert>);
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
  makeNodeEditor() {
    //console.log(">>makeNodeElems " + JSON.stringify(this.state));
    var nodeElems = [];
    const icon = 'remove';
    const head  = 
      <Row key="head">
        <Col sm={5}> <Label bsSize="lg" bsStyle="default">Net Node Editor</Label></Col>
        <Col sm={2}>
          <ButtonToolbar>
            <Button bsSize="sm" bsStyle="danger"   onClick={this.delete}>Delete</Button>
            <Button bsSize="sm" bsStyle="success"  onClick={this.noedit}><Glyphicon glyph={icon} /></Button>
          </ButtonToolbar>
        </Col>
      </Row>;
    nodeElems.push(head);
    const keyElem = this.makeNodeElem("","text",this.state.nodeKey,"Net Node Name",1,true,"");
    nodeElems.push(keyElem);
    const descElem = this.makeNodeElem("desc","text",this.state.desc,"Description",2,false,"");
    nodeElems.push(descElem);


    var param;
    var value;
    var handler;
    var opts;
    var selform;
    var showform;
    // build nodeHost selector
    param    = "nodeHost";
    value    = this.state.nodeHost;
    handler  = this.handleNodeChange.bind(null,param);
    opts = this.props.makeNetHostOptions();
    selform  = this.makeSelectForm(value,handler,opts);
    showform = this.makeShowForm(value);
    const nodeHostElem = this.makeSelectElem(value,'Node Host Name',showform,selform);
    nodeElems.push(nodeHostElem);
    const typeElem = this.makeNodeElem("nodeType","text",this.state.nodeType,"Net Node Type",1,false,"");
    nodeElems.push(typeElem);
    const endElem = this.makeNodeElem("endpointID","text",this.state.endpointID,"Endpoint ID",1,false,"");
    nodeElems.push(endElem);
    // read-only services list
    let servList = this.state.services.join(',');
    const servElem = this.makeNodeElem("services","text",servList,"ION Services",2,true,"(see below to modify)");
    nodeElems.push(servElem);

    const sep = <Row key="sep"><hr /></Row>;   // separate the list add/del elements
    nodeElems.push(sep);
    // build aService selector
    param    = "aService";
    value    = this.state.aService;
    handler  = this.handleNodeChange.bind(null,param);
    opts     = this.props.makeOptionElems('services');
    selform  = this.makeSelectForm(value,handler,opts);
    showform = this.makeShowForm(value);
    const aServiceElem = this.makeSelectElem(value,'Add/Drop ION Service',showform,selform);
    nodeElems.push(aServiceElem);

    const msg = "";
    var alert = (msg === "")?  "" : this.makeAlertElem(msg);

    return (
      <div>
        {nodeElems}
        <Row>{alert}</Row>
      </div>
    );
  };
  makeNodeViewer() {
    //console.log(">>makeNodeElems " + JSON.stringify(this.state));
    var nodeElems = [];
    const head  = <Row key="head"><Col sm={2}> <Label bsSize="lg" bsStyle="default">Net Node Viewer</Label></Col></Row>;
    nodeElems.push(head);
    const keyElem = this.makeNodeElem("","text",this.state.nodeKey,"Net Node Name",1,true,"");
    nodeElems.push(keyElem);
    const descElem = this.makeNodeElem("desc","text",this.state.desc,"Description",2,true,"");
    nodeElems.push(descElem);
    const hostElem = this.makeNodeElem("nodeHost","text",this.state.nodeHost,"Net Host Name",1,true,"");
    nodeElems.push(hostElem);
    const typeElem = this.makeNodeElem("nodeType","text",this.state.nodeType,"Net Node Type",1,true,"");
    nodeElems.push(typeElem);
    const endElem = this.makeNodeElem("endpointID","text",this.state.endpointID,"Endpoint ID",1,true,"");
    nodeElems.push(endElem);
    let servList = this.state.services.join(',');
    const servElem = this.makeNodeElem("services","text",servList,"ION Services",2,true,"");
    nodeElems.push(servElem);

    return (
      <div>
        {nodeElems}
      </div>
    );
  };
  makeNodeElem(prop,type,val,label,size,read,note) {
    //console.log(">>MakeNodeElem " + prop + ' ' + type + ' ' + val + ' ' + size);
    const form =
        <FormControl readOnly={read} bsSize="sm" type={type} value={val} spellCheck="false" onChange={this.handleNodeChange.bind(null,prop)} />;
    return (
      <Row key={label}>
        <Col className="text-right" sm={2}><b>{label}</b></Col>
        <Col sm={size} value={val}>{form}</Col>
        <Col sm={size} value={2}>{note}</Col>
      </Row>
    );
  };
    
  render() {
    const nodeKey = this.props.nodeKey;
    console.log("NetNode render " + nodeKey);
    const editMode = this.state.editMode;
    const viewMode = this.state.viewMode;

    const editLabel = editMode?  'Submit' : 'Edit'
    const viewLabel = viewMode?  'Hide' : 'Show'

    let viewPanel = null;
    if (viewMode)
      if (editMode)
        viewPanel = this.makeNodeEditor();
      else
        viewPanel = this.makeNodeViewer();

    return (
      <Grid fluid>
        <Row>
          <div className="row mt-4">
            <Col className="text-right" sm={1}><Label bsSize="lg" bsStyle="default">Net Node</Label></Col>
            <Col className="text-right" sm={1}><b>{nodeKey}</b></Col>
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
    console.log("submit node updates!" + JSON.stringify(this.props.desc));
    var tran = {
      action: "UPDATE-NET-NODE",
      nodeKey: this.props.nodeKey,
      desc: this.state.desc,
      nodeHost: this.state.nodeHost,
      nodeType: this.state.nodeType,
      endpointID: this.state.endpointID,
      services: this.state.services
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
    console.log("delete net-node!");
    const nodeKey = this.props.nodeKey;
    const tran = {
      action: "DELETE-NET-NODE",
      nodeKey: nodeKey
    };
    this.props.dispatch(tran);
    // don;t bother with state changes...this component is going to vanish
  };
  updateServices(newState) {
   console.log("update services ");
    const srv = newState.aService;
    if (srv !== "") {
      const idx = newState.services.indexOf(srv);
      if (idx < 0)  // need to add?
        newState.services.push(srv);       // not there, so add
      else
        newState.services.splice(idx,1);   // there, so drop
    }
  };
  handleNodeChange = (prop,e) => {
    console.log("a value change of " + prop +  e);
    var newState = Object.assign({},this.state);
    console.log(">>> param old value = " + newState[prop]);
    newState[prop] = e.target.value;
    if (prop === "aService")
      this.updateServices(newState);
    this.setState (newState);
    e.preventDefault();
  };
}
