//        Graph.jsx     Graph React Component
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

export default class Graph  extends React.Component {
  constructor (props) {
    super(props);
    // props
    const desc = this.props.desc;
    const ver = this.props.version;
    console.log("Graph ctor " + desc);
    this.state = {
      editMode: false,
      viewMode: false,
      expandMode: false,
      desc: desc,
      version: ver
    }
  }
  logDebug() {
    var debug = true;
    if ( debug ) {
      console.log.apply(this, arguments);
    }
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
  };
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
  makeGraphEditorElem() {
    console.log(">>makeGraphEditorElem " + JSON.stringify(this.state));
    const readMode = !this.state.editMode;
    var graphElems = [];
    const icon = "remove";
    const head  =  readMode? 
        <Row key="head"><Col sm={2}> <Label bsSize="lg" bsStyle="default">Graph Viewer</Label></Col></Row>
      : <Row key="head"><Col sm={5}> <Label bsSize="lg" bsStyle="default">Graph Editor</Label></Col> 
        <Col sm={1}><Button bsSize="sm" bsStyle="success"  onClick={this.noedit}><Glyphicon glyph={icon} /></Button></Col></Row> ;
    graphElems.push(head);
    const nameElem = this.makeGraphAttrElem("","text",this.props.name,"Graph Name",1,true,"");
    graphElems.push(nameElem);
    const descElem = this.makeGraphAttrElem("desc","text",this.state.desc,"Description",2,readMode,"");
    graphElems.push(descElem);

    // build ion version selector
    var ver = this.state.version;
    const verFunc = this.handleVersion.bind(null);
    var opts = this.props.makeOptionElems("node_version");
    var form = this.makeSelectForm(ver,verFunc,opts);
    var show = this.makeShowForm(ver);
    const verElem = 
      <Row key="version">
        <Col className="text-right" sm={2}><b>Ion Version</b></Col>
        <Col sm={1} value={ver}>{show}</Col>
        <Col sm={2} type="select" value={ver} readOnly="false">{form}</Col>
        <Col sm={2} >(affects ion command syntax)</Col>
      </Row>;
    graphElems.push(verElem);

    return (
      <div>
        {graphElems}
      </div>
    );
  };
  makeGraphAttrElem(prop,type,val,label,size,read,note) {
    console.log(">>MakeGraphElem " + prop + ' ' + type + ' ' + val + ' ' + size + ' ' + read);
    const form =
        <FormControl readOnly={read} bsSize="sm" type={type} value={val} onChange={this.handleAttrChange.bind(null,prop)} />;
    return (
      <Row key={label}>
        <Col className="text-right" sm={2}><b>{label}</b></Col>
        <Col sm={size} value={val}>{form}</Col>
        <Col sm={size} value={2}>{note}</Col>
      </Row>
    );
  };
    
  render() {
    const name = this.props.name;
    console.log("Graph render " + name);
    const editMode = this.state.editMode;
    const viewMode = this.state.viewMode;
    const expandMode = this.state.expandMode;

    const editLabel = editMode?  'Submit' : 'Edit'
    const viewLabel = viewMode?  'Hide' : 'Show'

    const expandIcon = this.state.expandMode? 'chevron-down' : 'chevron-right';

    const viewPanel = this.makeGraphEditorElem();

    return (
      <Grid fluid>
        <Row>
          <div className="row mt-4">
            <Col className="text-right" sm={1}><Label bsSize="lg" bsStyle="default">Graph</Label></Col>
            <Col className="text-right" sm={1}><b>{name}</b></Col>
            <Col className="text-right" sm={1}>contact graph</Col>
            <Col className="text-left"  sm={2}>{this.props.desc}</Col>
            <Col sm={2}> 
              <ButtonToolbar>
                <Button bsSize="sm" bsStyle="primary" onClick={this.edit}>{editLabel}</Button>
                <Button bsSize="sm" bsStyle="info" onClick={this.view}>{viewLabel}</Button>
                <Button bsSize="sm" bsStyle="success" onClick={this.expand}><Glyphicon glyph={expandIcon}/>{' '}</Button>
              </ButtonToolbar>
            </Col>
          </div>
        </Row>
        <Panel collapsible expanded={viewMode}>
         {viewPanel}
        </Panel>
        <Panel  collapsible expanded={expandMode}>
          {this.props.children}
        </Panel>
      </Grid>
    );
  };

  toggle = () => {
    this.logDebug("let's toggle configs!");
    var newState = Object.assign({},this.state);
    newState.configsOpen = !this.state.configsOpen;
    this.setState (newState);
  };
  expand = () => { // activated by expand/contract shutter icon
    var newState = Object.assign({},this.state);
    var expandMode = this.state.expandMode;
    if (expandMode)
      console.log("let's close-up config list!");
    else
      console.log("let's expand config list!");
    newState.expandMode = !expandMode;  // toggling flag changes render
    this.setState (newState);
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
  noedit = () => {   // activated by Cancel button
    var newState = Object.assign({},this.state);
    newState.editMode = false;   // cancel editing
    newState.viewMode = false;   // cancel viewing
    this.setState (newState);
  };
  submit = () => {    // callable by edit (above)
    console.log("submit Graph updates!" + JSON.stringify(this.props.desc));
    var tran = {
      action: "UPDATE-GRAPH",
      graphKey: this.props.name,
      desc: this.state.desc,
      version: this.state.version
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
  handleVersion = (e) => {
    const val = e.target.value;
    console.log(">>> param selection!" + e + " value= " + val);
    var newState = Object.assign({},this.state);
    console.log(">>> param old value = " + newState.version);
    newState.version = val;
    this.setState (newState);
    this.render();
    e.preventDefault();
  };
  handleAttrChange = (prop,e) => {
    this.logDebug("a value change of" + prop +  e);
    var newState = Object.assign({},this.state);
    this.logDebug(">>> param old value = " + newState.desc);
    newState[prop] = e.target.value;
    this.setState (newState);
    this.render();
    e.preventDefault();
  };
}

Graph.propTypes = {   
  name: PropTypes.string.isRequired,
  desc: PropTypes.string.isRequired,
  version: PropTypes.string.isRequired,

  configKey: PropTypes.string.isRequired,     // config file name 

  makeOptionElems: PropTypes.func.isRequired, // func to get static options
  dispatch: PropTypes.func.isRequired,

  children: PropTypes.array.isRequired,       // config elements of this Graph
}