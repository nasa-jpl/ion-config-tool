//        Config.jsx     Config React Component
//
//        Copyright (c) 2018, California Institute of Technology.
//        ALL RIGHTS RESERVED.  U.S. Government Sponsorship
//        acknowledged.
//                                                                   
//      Author: Rick Borgen, Jet Propulsion Laboratory         
//                                                               
import React from 'react';
import PropTypes from 'prop-types';
import "date-format-lite";
import {FormControl} from 'react-bootstrap';
import {Container,Row,Col} from 'react-bootstrap';
import {Badge,Button,ButtonGroup} from 'react-bootstrap';
import {BsXLg} from "react-icons/bs";
import {BsChevronDoubleDown} from "react-icons/bs";
import {BsChevronDoubleRight} from "react-icons/bs";
import {Card} from 'react-bootstrap';
import {Alert} from 'react-bootstrap';
import {saveAs} from "file-saver";

import cmdTypes from './json/cmdTypes.json';

export default class Config  extends React.Component {
  constructor (props) {
    super(props);
    console.log("Config ctor " + props.name);
    this.state = {
      editMode: false,
      deleteMode: false,
      viewMode: false,
      configOpen: false,
      expandMode: false,
      newCommand: false,
    }
  }
  makeConfigEditor() {
    var configElems = [];
    const content = this.props.configType.content;
    const program = this.props.configType.program;
    var deleteMode = this.state.deleteMode;
    let deleteAlert = null;
    if (deleteMode)
      deleteAlert = this.makeDeleteAlertElem();
    const head  = 
      <Row key="head">
        <Col sm={5}> <Badge bg="secondary" text="light">Config File Editor</Badge></Col>
        <Col sm={2}>
          <ButtonGroup>
            <Button variant="outline-danger" onClick={this.deleteOn}>Delete</Button>
            <Button variant="outline-success"  onClick={this.noedit}><BsXLg/></Button>
          </ButtonGroup>
        </Col>
        <Col sm={5}>{deleteAlert}</Col>
      </Row>;
    configElems.push(head);
    const nameElem = this.makeConfigElem("","text",this.props.name,"Config File Name",1,true,"");
    configElems.push(nameElem);
    const descElem = this.makeConfigElem("desc","text",content,"Description",3,true,"");
    configElems.push(descElem);
    const programElem  = this.makeConfigElem("program","text",program,"Program",1,true,"");
    configElems.push(programElem);

    return (
      <div>
        {configElems}
        <Row><Col sm={2}></Col><Col sm={6}>Note: No config fields are editable at this time. Delete is supported.</Col></Row>
      </div>
    );
  };
  makeConfigViewer() {
    //console.log(">>makeNodeElems " + JSON.stringify(this.state));
    var configElems = [];
    const content = this.props.configType.content;
    const program = this.props.configType.program;
    const head  = <Row key="head"><Col sm={2}> <Badge bg="secondary" text="light">Config File Viewer</Badge></Col></Row>;
    configElems.push(head);
    const nameElem = this.makeConfigElem("","text",this.props.name,"Config File Name",1,true,"");
    configElems.push(nameElem);
    const descElem = this.makeConfigElem("desc","text",content,"Description",3,true,"");
    configElems.push(descElem);
    const programElem  = this.makeConfigElem("program","text",program,"Program",1,true,"");
    configElems.push(programElem);

    return (
      <div>
        {configElems}
      </div>
    );
  };
  makeConfigElem(prop,type,val,label,size,read,note) {
    //console.log(">>MakeNodeElem " + prop + ' ' + type + ' ' + val + ' ' + size);
    const form =
        <FormControl readOnly={read} bssize="sm" type={type} value={val} onChange={this.handleConfigChange.bind(null,prop)} />;
    return (
      <Row key={label}>
        <Col className="text-right" sm={2}><b>{label}</b></Col>
        <Col sm={size} value={val}>{form}</Col>
        <Col sm={size} value={2}>{note}</Col>
      </Row>
    );
  };
  makeNewCommandElem() {
    //console.log("makeNewCommandElems cmdTypes: " + this.props.configType.cmdTypes);
    var optionItems = [ ];

    optionItems[0] = <option key="none" value="none">&lt;none&gt;</option>;
    var allCmdTypes = this.props.configType.cmdTypes;   // all cmd Types for all versions
    var nodeCmdTypes = [];          // cmd Types for the node's version
    const nodeKey = this.props.nodeKey;                    
    var ionVerSeqNo = this.props.getIonVerSeqNo(nodeKey);
    // select correct commands for this node version
    console.log("??? makeCmdElem  seqno= " + ionVerSeqNo.toString());
    for (var i=0; i < allCmdTypes.length ; i++) {
        const cmdTypeKey = allCmdTypes[i];
        const cmdType = cmdTypes[cmdTypeKey]
        console.log("??? cmd: " + JSON.stringify(cmdType));
        if (cmdType.verFrom <= ionVerSeqNo && cmdType.verThru >= ionVerSeqNo) {
          console.log("??? selected " + cmdType.name);
          nodeCmdTypes.push(cmdTypeKey);
        }
    };
    var mainOptions = nodeCmdTypes.map( 
      (cmdTypeKey) => {
        const cmdType = cmdTypes[cmdTypeKey];
        const cmdname = cmdType.name;
        console.log("makeNewCommandElems cmdname: " + cmdname);
        return <option key={cmdname} value={cmdTypeKey}>{cmdname}</option>;
      }
    );
    optionItems.push(mainOptions);
    var form =
      <FormControl
        bssize="sm"
        as="select"
        placeholder=""
        onChange={this.handleNewCommand}
        >{optionItems}
      </FormControl>;
    const icon = 'remove';
    return (
      <>
        <Col className="text-right" sm={2}><b>Select new command:</b></Col>
        <Col sm={2}>{form}</Col>
        <Col sm={1}>
          <Button variant="outline-success"  onClick={this.nonewcmd}><BsXLg/></Button>
        </Col>
      </>
    );
    //return form;
  }
  makeDeleteAlertElem(msg) {
    //<Col sm={3}><b>Are you sure?</b></Col>
    //<Col sm={1}>
    //</Col>
    return (
      <Alert variant="outline-danger">
        <b>Confirm delete of config file and all its commands?</b>
        <ButtonGroup>
          <Button variant="outline-danger"  onClick={this.delete}>Delete</Button>
          <Button variant="outline-success" onClick={this.deleteOff}>Cancel</Button>
        </ButtonGroup>
      </Alert>);
  };
  makeInfo() {
    const configKey = this.props.name;
    const cmdLines = this.props.makeCmdLines(configKey);
    var lf = "\n";   // assign linefeed format for text files
    const page = cmdLines.join(lf) + lf;
    return (
      <div>
        <pre>{page}</pre>
      </div>
      );
  }
  render() {
    var expandMode = this.state.expandMode;
    const editMode = this.state.editMode;
    const viewMode = this.state.viewMode;
    const content = this.props.configType.content;
    var icon = this.state.expandMode? <BsChevronDoubleDown/> : <BsChevronDoubleRight/>;
    var configOpen = this.state.configOpen;
    var infoTag = this.state.configOpen?  "Hide File" : "Show File" ;
    const dimNewCmd = this.state.newCommand? true : false;
    const cmdEntry = this.state.newCommand?  this.makeNewCommandElem() : "" ;
    const editLabel = editMode?  'Submit' : 'Edit'
    const viewLabel = viewMode?  'Hide' : 'Show';

    let viewPanel = null;
    if (viewMode)
      if (editMode)
        viewPanel = this.makeConfigEditor();
      else
        viewPanel = this.makeConfigViewer();

    return (
    <div style={{backgroundColor: '#C8D7E0'}}>
      <Container fluid>
        <Row>
            <Col className="text-right" sm={1}> <Badge bg="secondary" text="light">Config File</Badge></Col>
            <Col className="text-left"  sm={2}><b>{this.props.name}</b></Col>
            <Col className="text-left"  sm={3}>{content}</Col>
            <Col sm={4}> 
              <ButtonGroup>
                <Button variant="outline-primary" onClick={this.edit}>{editLabel}</Button>
                <Button variant="outline-info" onClick={this.view}>{viewLabel}</Button>
                <Button variant="outline-info" onClick={this.info}>{infoTag}</Button>
                <Button variant="outline-primary" onClick={this.saveme}>Save File</Button> 
                <Button variant="outline-primary" disabled={dimNewCmd} onClick={this.newcmd}>New Command</Button>        
                <Button variant="outline-success"  onClick={this.toggle}> {icon}{' '}</Button>
              </ButtonGroup>
            </Col>
        </Row>
        <Row>
          {cmdEntry}
        </Row>
        <Card collapsible expanded={viewMode}>
          {viewPanel}
        </Card>
        {configOpen && (
          <Card>
            {this.makeInfo()} 
          </Card>
        )}
        {expandMode && (
          <Card>
            {this.props.children}
          </Card>
        )}
      </Container>
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
  noedit = () => {   // activated by Edit/Submit button
    var newState = Object.assign({},this.state);
    newState.editMode = false;   // cancel editing
    newState.viewMode = false;   // cancel viewing
    this.setState (newState);
  };
  submit = () => {    // callable by edit (above)
    console.log("submit config updates!" + JSON.stringify(this.props.desc));
    return;   // update config does not do anything yet
    //this.props.dispatch(tran);
  };
  deleteOn = () => {
    var newState = Object.assign({},this.state);
    newState.deleteMode = true;   // activate delete mode
    this.setState (newState);
  };
  deleteOff = () => {
    var newState = Object.assign({},this.state);
    newState.deleteMode = false;   // cancel delete mode
    this.setState (newState);
  };
  delete = () => { 
    console.log("submit delete!  cmdKey:" + this.props.cmdKey);
    // first delete all commands
    let cmdKeys = this.props.cmdKeys;
    for (let i = 0; i < cmdKeys.length; i++) {
      let cmdKey = cmdKeys[i];
      console.log("delete command: " + cmdKey);
      var tranCmd = {
        action: "DELETE-COMMAND",
        nodeKey: this.props.nodeKey,
        configKey: this.props.name,
        cmdKey: cmdKey
      };
      this.props.dispatch(tranCmd);
    };
    // now we can delete config
    console.log("delete config: " + this.props.name);
    var tranConfig = {
    action: "DELETE-CONFIG",
      nodeKey: this.props.nodeKey,
      configKey: this.props.name
    };
    this.props.dispatch(tranConfig);
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
  info = () => {
    console.log("let's peek!");
    var newMode = !this.state.configOpen;
    this.setState({
      configOpen: newMode
    });
  };
  saveme = () => {
    console.log("let's save me!");
    var configKey = this.props.name;
    const cmdLines = this.props.makeCmdLines(configKey);
    var lf = "\n";   // assign linefeed format for text files
    var host = this.props.host;  // get host object of node
    if (host)           // host only if a node config, not a graph
      if (host.linefeed === 'windows')            // windows is different
        lf = "\r\n";
    const page = cmdLines.join(lf) + lf;
    var blob = new Blob( [page], {type: "text/plain; charset=utf-8"} );
    saveAs(blob, this.props.name, true);   // true = disable autoBOM
  };
  newcmd = () => {
    console.log("add a new command!");
    this.setState({
      newCommand: true
    });
  };
  nonewcmd = () => {
    console.log("cancel add a new command!");
    this.setState({
      newCommand: false
    });
  };
  toggle = () => {
    console.log("let's toggle commands!");
    var newMode = !this.state.expandMode;
    this.setState({
      expandMode: newMode
    });
  };
  handleNewCommand = (e) => {
    console.log("a new command!" + e);
    const val = e.target.value;
    console.log("command name = " + val);
    const tran = {
      action: "NEW-COMMAND",
      nodeKey: this.props.nodeKey,
      configKey: this.props.name,
      cmdTypeKey: val
    };
    this.props.dispatch(tran);
    this.setState({
      newCommand: false,
      expandMode: true
    });
    e.preventDefault();
  };
  handleConfigChange = (prop,e) => {
    console.log("a value change of" + prop +  e);
    console.log("$$$$ should not happen for config!!")
    var newState = Object.assign({},this.state);
    newState[prop] = e.target.value;
    this.setState (newState);
    e.preventDefault();
  };
}

Config.propTypes =  {
  name: PropTypes.string.isRequired,        // unique name of this config file
  configType: PropTypes.object.isRequired,  // schema: info of this config type
  nodeKey: PropTypes.string.isRequired,     // user model - node key
  host: PropTypes.object.isRequired,        // user model - host object of node
  cmdKeys: PropTypes.array.isRequired,      // cmdKeys of this config file

  makeCmdLines: PropTypes.func.isRequired,  // func to format all lines of config file
  getIonVerSeqNo: PropTypes.func.isRequired,// func to get ion version seq num
  dispatch: PropTypes.func.isRequired,      // func to handle transactions centrally

  children: PropTypes.array.isRequired,     // command elements of this config file
}