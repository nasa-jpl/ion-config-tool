//        IonNode.jsx     IonNode React Component
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
import {saveAs} from "file-saver";
import JSZip from "jszip";

import configTypes from './json/configTypes.json';

export default class IonNode  extends React.Component {
  constructor (props) {
    super(props);
    // props
    const desc = this.props.desc;
    const nodeNum = this.props.nodeNum;
    const version = this.props.version;
    const hostKey = this.props.hostKey;
    console.log("IonNode ctor " + desc + ' ' + nodeNum);
    this.state = {
      editMode: false,
      viewMode: false,
      expandMode: false,
      newConfig: false,
      alertMsg: "",
      desc: desc,
      nodeNum: nodeNum,
      version: version,
      hostKey: hostKey
    }
  }
  componentWillReceiveProps(newProps) {
    console.log("IonNode componentWillReceiveProps" + newProps.desc + ' ' + newProps.nodeNum);
    if (newProps.nodeNum !== this.state.nodeNum) {
       var newState = Object.assign({},this.state);
       newState.nodeNum = newProps.nodeNum;
       newState.version = newProps.version;
       newState.hostKey = newProps.hostKey;
       this.setState (newState);
    }
    return null;
  }
  makeAlertElem(msg) {
    return (<Alert bsStyle="danger"><b>ERROR: {msg}</b></Alert>);
  }
  makeNewConfigElem() {
    console.log("makeNewConfigElem cmdNames: " + this.props.configNames);
    const confNames = [ ];   // selection list
    confNames[0] = "<none>";
    for (var c in configTypes) {
      const configNames = this.props.configNames;
      var missing = true;
      for (var i=0; i<configNames.length; i++) {
        if (c === configNames[i]) { missing = false; };
      }
      if (missing && c !== 'contacts') { confNames.push(c); };
    };
    console.log("makeNewConfigElem cmdNames: " + confNames);
    var optionItems = confNames.map( 
      (configName) => {
        return <option key={configName} value={configName}>{configName}</option>;
      }
    );
    var form =
      <FormControl
        bsSize="sm"
        componentClass="select"
        placeholder=""
        onChange={this.handleNewConfig}
        >{optionItems}
      </FormControl>;
    const icon = 'remove';
    return (
      <div>
        <hr />
        <Col className="text-right" sm={2}><b>Select new config file:</b></Col>
        <Col sm={2}>{form}</Col>
        <Col sm={1}>
          <Button bsSize="sm" bsStyle="success"  onClick={this.nonewconfig}><Glyphicon glyph={icon} /></Button>
        </Col>
      </div>
    );
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
  makeNodeEditor() {
    //console.log(">>makeNodeElems " + JSON.stringify(this.state));
    var nodeElems = [];
    const icon = 'remove';
    const head  = 
      <Row key="head">
        <Col sm={5}> <Label bsSize="lg" bsStyle="default">ION Node Editor</Label></Col>
        <Col sm={1}><Button bsSize="sm" bsStyle="success"  onClick={this.noedit}><Glyphicon glyph={icon} /></Button></Col>
      </Row>;
    nodeElems.push(head);
    const nameElem = this.makeNodeElem("","text",this.props.name,"ION Node Name",1,true,"");
    nodeElems.push(nameElem);
    const descElem = this.makeNodeElem("desc","text",this.state.desc,"Description",2,false,"");
    nodeElems.push(descElem);
    const numElem  = this.makeNodeElem("nodeNum","number",this.state.nodeNum,"Ion Node Num",1,false,"");
    nodeElems.push(numElem);

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
    nodeElems.push(verElem);

    // build hostKey selector
    const nodeKey = this.props.name;
    var host = this.state.hostKey;
    const hostFunc = this.handleHostKey.bind(null);
    opts = this.props.makeTypeOptions("hostKey",nodeKey,"all");
    form = this.makeSelectForm(host,hostFunc,opts);
    show = this.makeShowForm(host);
    const hostElem = 
      <Row key="hostkey">
        <Col className="text-right" sm={2}><b>Host Name</b></Col>
        <Col sm={1} value={host}>{show}</Col>
        <Col sm={2} type="select" value={host} readOnly="false">{form}</Col>
        <Col sm={2} ></Col>
      </Row>;
    nodeElems.push(hostElem);

    const configStr = this.props.node.configKeys.join();
    const configElem = this.makeNodeElem("","text",configStr,"Config Files",3,true,"");
    nodeElems.push(configElem);

    const msg = (this.props.isGoodNodeNum(this.props.name,this.state.nodeNum)) ? "" : "Ion node number is already assigned" ;

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
    const head  = <Row key="head"><Col sm={2}> <Label bsSize="lg" bsStyle="default">ION Node Viewer</Label></Col></Row>;
    nodeElems.push(head);
    const nameElem = this.makeNodeElem("","text",this.props.name,"ION Node Name",1,true,"");
    nodeElems.push(nameElem);
    const descElem = this.makeNodeElem("desc","text",this.state.desc,"Description",2,true,"");
    nodeElems.push(descElem);
    const numElem  = this.makeNodeElem("nodeNum","text",this.state.nodeNum,"Ion Node Num",1,true,"");
    nodeElems.push(numElem);
    // show ion version selection
    var ver = this.state.version;
    const showVer = this.makeShowForm(ver);
    const verElem = 
      <Row key="version">
        <Col className="text-right" sm={2}><b>Ion Version</b></Col>
        <Col sm={1} value={ver}>{showVer}</Col>
      </Row>;
    nodeElems.push(verElem);
    // show host name selection
    var host = this.state.hostKey;
    const showHost = this.makeShowForm(host);
    const hostElem = 
      <Row key="hostkey">
        <Col className="text-right" sm={2}><b>Host Name</b></Col>
        <Col sm={1} value={host}>{showHost}</Col>
      </Row>;
    nodeElems.push(hostElem);

    const configStr = this.props.node.configKeys.join();
    const configElem = this.makeNodeElem("","text",configStr,"Config Files",3,true,"");
    nodeElems.push(configElem);

    return (
      <div>
        {nodeElems}
      </div>
    );
  };
  makeNodeElem(prop,type,val,label,size,read,note) {
    //console.log(">>MakeNodeElem " + prop + ' ' + type + ' ' + val + ' ' + size);
    const form =
        <FormControl readOnly={read} bsSize="sm" type={type} value={val} onChange={this.handleNodeChange.bind(null,prop)} />;
    return (
      <Row key={label}>
        <Col className="text-right" sm={2}><b>{label}</b></Col>
        <Col sm={size} value={val}>{form}</Col>
        <Col sm={size} value={2}>{note}</Col>
      </Row>
    );
  };
    
  render() {
    const nodeKey = this.props.name;
    console.log("IonNode render " + nodeKey);
    const editMode = this.state.editMode;
    const viewMode = this.state.viewMode;
    const expandMode = this.state.expandMode;
    const newConfig = this.state.newConfig;

    const editLabel = editMode?  'Submit' : 'Edit'
    const viewLabel = viewMode?  'Hide' : 'Show'
    const expandIcon = expandMode? 'chevron-down' : 'chevron-right';

    const dimNewconfig = newConfig?  true : false ; 
    const configEntry = newConfig?  this.makeNewConfigElem() : "" ; 

    let viewPanel = null;
    if (viewMode)
      if (editMode)
        viewPanel = this.makeNodeEditor();
      else
        viewPanel = this.makeNodeViewer();


    return (
    <div style={{backgroundColor: '#A5E6A7'}}>
      <Grid fluid>
        <Row>
          <div className="row mt-4">
            <Col className="text-right" sm={1}><Label bsSize="lg" bsStyle="default">ION Node</Label></Col>
            <Col className="text-right" sm={1}><b>{nodeKey}</b></Col>
            <Col className="text-right" sm={1}><b>ipn: {this.props.nodeNum}</b></Col>
            <Col className="text-left"  sm={2}>{this.props.desc}</Col>
            <Col sm={3}> 
              <ButtonToolbar>
                <Button bsSize="sm" bsStyle="primary" onClick={this.edit}>{editLabel}</Button>
                <Button bsSize="sm" bsStyle="info" onClick={this.view}>{viewLabel}</Button>
                <Button bsSize="sm" bsStyle="primary" onClick={this.saveConfigs}>Save Configs</Button>
                <Button bsSize="sm" bsStyle="primary" disabled={dimNewconfig} onClick={this.newconfig}>New Config File</Button>  
                <Button bsSize="sm" bsStyle="success" onClick={this.expand}><Glyphicon glyph={expandIcon}/>{' '}</Button>
              </ButtonToolbar>
            </Col>
          </div>
        </Row>
        <Row>
          {configEntry}
        </Row>
        <Panel collapsible expanded={viewMode}>
         {viewPanel}
        </Panel>
        <Panel  collapsible expanded={expandMode}>
          {this.props.children}
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
    console.log("submit node updates!" + JSON.stringify(this.props.desc));
    if (this.props.isGoodNodeNum(this.props.name,this.state.nodeNum))
       console.log("node number is okay");
    else
      return;   // do nothing
    var tran = {
      action: "UPDATE-NODE",
      nodeKey: this.props.node.id,
      desc: this.state.desc,
      nodeNum: this.state.nodeNum,
      version: this.state.version,
      hostKey: this.state.hostKey
    };
    this.props.dispatch(tran);
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
  saveConfigs = () => {
    console.log("let's save all config files in a zip file!");
    var zip = new JSZip();
    var nodedir = zip.folder(this.props.name);

    var lf = "\n";   // assign linefeed format for text files
    if (this.props.host.linefeed === 'windows')            // windows is different
      lf = "\r\n";
    // build common contact graph
    const graphKey = this.props.currentContacts + ".cg";
    var graphLines = this.props.makeCmdLines(graphKey);
    let graphPage = graphLines.join(lf) + lf;
    nodedir.file(graphKey,graphPage);  // add common contact graph

    let keys = this.props.configKeys;
    for (var i=0; i<keys.length; i++) {
      let configKey = keys[i];
      console.log("Saving config file: " + configKey);
      let cmdLines = this.props.makeCmdLines(configKey);
      console.log("config file " + configKey + " has " + cmdLines.length.toString() + " lines");
      let page = cmdLines.join(lf) + lf;
      nodedir.file(configKey,page);
    }
    // ... and build a start script for the node
    let nodeKey = this.props.node.id;
    let startName = "start_" + nodeKey + ".sh";
    let cmdLines = this.props.makeStartLines(nodeKey);
    let page = cmdLines.join(lf) + lf;
    nodedir.file(startName,page);
    // build zip file
    const zipname = this.props.name + ".zip";
    zip.generateAsync( {type:"blob"}).then(function(content) {
      saveAs(content, zipname, true);   // true = disable autoBOM
    });
    console.log("finished zip file!??");
  };
  newconfig = () => { // activated by newconfig button
    var newState = Object.assign({},this.state);
    console.log("add a new config!");
    newState.newConfig = true;   // setting flag changes render
    this.setState (newState);
  };
  nonewconfig = () => { // activated by new config cancel button
    var newState = Object.assign({},this.state);
    console.log("cancel add a new config!");
    newState.newConfig = false;   // setting flag changes render
    this.setState (newState);
  };
  handleNewConfig = (e) => {
    console.log("a new config!" + e);
    const configTypeKey = e.target.value;
    console.log("config name = " + configTypeKey);
    const tran = {
      action: "NEW-CONFIG",
      nodeKey: this.props.name,
      configType: configTypeKey
    };
    this.props.dispatch(tran);
    var newState = Object.assign({},this.state);
    newState.newConfig = false;   // setting flag changes render
    newState.expandMode = true;   // open up to show new config
    this.setState(newState);
    e.preventDefault();
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
  handleHostKey = (e) => {
    const val = e.target.value;
    console.log(">>> param selection!" + e + " value= " + val);
    var newState = Object.assign({},this.state);
    console.log(">>> param old value = " + newState.hostKey);
    newState.hostKey = val;
    this.setState (newState);
    this.render();
    e.preventDefault();
  };
  handleNodeChange = (prop,e) => {
    console.log("a value change of" + prop +  e);
    var newState = Object.assign({},this.state);
    console.log(">>> param old value = " + newState.desc);
    newState[prop] = e.target.value;
    this.setState (newState);
    e.preventDefault();
  };
}

IonNode.propTypes = { 
  node: PropTypes.object.isRequired,          // user model - node object
  name: PropTypes.string.isRequired,
  desc: PropTypes.string.isRequired,
  nodeNum: PropTypes.number.isRequired,
  version: PropTypes.string.isRequired,
  hostKey: PropTypes.string.isRequired,
  host:  PropTypes.object.isRequired,          // user model - host object of node
  currentContacts: PropTypes.string.isRequired, // network contacts name

  configKeys: PropTypes.array.isRequired,     // config file names of this node
  configNames: PropTypes.array.isRequired,    // config type names of this node

  isGoodNodeNum: PropTypes.func.isRequired,   // checks that node num not yet assigned
  makeCmdLines: PropTypes.func.isRequired,    // func to format all lines of config file
  makeStartLines: PropTypes.func.isRequired,  // func to format all lines of start file
  makeTypeOptions: PropTypes.func.isRequired, // func to get dynamic (cloned) options
  makeOptionElems: PropTypes.func.isRequired, // func to get static options
  dispatch: PropTypes.func.isRequired,

  children: PropTypes.array.isRequired,      // config elements of this node
};