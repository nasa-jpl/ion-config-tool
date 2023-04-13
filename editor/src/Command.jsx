//        Command.jsx     Command React Component
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
import {Panel} from 'react-bootstrap';
import {Glyphicon} from 'react-bootstrap';
import {Alert} from 'react-bootstrap';
import Datetime from 'react-datetime';
import 'react-datetime/css/react-datetime.css';
import 'moment';

export default class Command  extends React.Component {
  constructor (props) {
    super(props);

    let vals = props.initValues.slice(0);
    this.state = {
      editMode: false,
      viewMode: false,
      dictMode: false,
      entryMode: false,
      cmdMsg: "",
      values: vals
    };
    //console.log("Command values: " + this.state.values);
  }
  componentWillReceiveProps(newProps) {
    // only update initVals for commands affected by cloning
    if (this.props.cmdType.pickClone)
      //console.log("+++ cmdType" + this.props.name + " gets pick-cloned");
      this.updateInitVals(newProps);
    if (this.props.cmdType.copyClone)
      //console.log("+++ cmdType" + this.props.name + " gets copy-cloned");
      this.updateInitVals(newProps);
    return null;
  }
  // new props have come in for a clone-able command
  updateInitVals(newProps){
    var newState = Object.assign({},this.state);
    //console.log("updateInitValues = " + newProps.initValues);
    newState.values =  newProps.initValues.slice(0);
    newState.editMode = false;  // a submit must have happened
    newState.viewMode = false;  // a submit must have happened
    this.setState (newState);
    //console.log(">>>updateInitVals state= " + JSON.stringify(this.state));
    return null;
  }
  makeAlertElem(msg) {
    return (<Alert bsStyle="danger"><b>ERROR: {msg}</b></Alert>);
  }
  // check if this command owns a value that is cloned
  hasClonedValue() {
    const cloneVals = this.props.cloneValues;
    var cKey = this.props.cmdKey;
    if (cloneVals.hasOwnProperty(cKey) ) { // is this a clone-able command?
      var cloneVal = cloneVals[cKey];
      if (cloneVal.clones.length > 0)      // and a clone exists?
        return true;
    };
    return false;
  }
  makeSelectFormElem(valIdx,options) {
    let value = this.state.values[valIdx];
    //console.log("makeSelectFormElem valIdx= " + valIdx + "  value: " + val);
    var form =
      <FormControl
        readOnly={!this.state.editMode}
        disabled={!this.state.editMode}
        bsSize="sm"
        componentClass="select"
        value={value}
        onChange={this.handleParamSelect.bind(null,valIdx)}
        >{options}
      </FormControl>;
    return form;
  }
  makeShowForm(idx) {
    // show current value with selection widget
    const value = this.state.values[idx];
    var form =
      <FormControl
        readOnly="true"
        bsSize="sm"
        type="text"
        value={value}
      />;
    return form;
  }
  makeFieldForm(idx,type) {
    // assume readOnly, unless editable and in editmode
    //console.log("makeFileForm idx = " + idx + " type = " + type);
    //console.log("makeFileForm value = " + this.state.values[idx]);
    var param = this.props.params[idx];
    var justread = !this.state.editMode || param.copyClone;
    //const cmdKey = this.props.cmdKey;

    // pick up the current value and, if it has not yet been specified, use the default.
    // Note: the default may be the empty string if the param dict does not have one specified.
    var usrval = this.state.values[idx];
    var value = "";
    if (usrval !== "") {
      // has been specified
      value = usrval;
    } else {
      // pick up default and set it in the form and the command state.
      value = param.defaultValue;
      this.state.values[idx] = param.defaultValue;
    }
    var form =
      <FormControl
        readOnly={justread}
        bsSize="sm"
        type={type}
        value={value}
        spellCheck="false"
        onChange={this.handleParamChange.bind(null,idx)}
      />;
    return form;
  }
  makeDatetimeForm(idx) {
    const ionTimeStr = this.state.values[idx];
    //  it is recommended practice to parse by hand,  never use Date.parse
    var time = null;

    if (ionTimeStr === '') {
       time = new Date();
       time.setUTCHours(0,0,0);
    } else {
      var parts = [], dparts = [], tparts = [];
      parts = ionTimeStr.split('-');
      //console.log("date parse -- date: " + parts[0] + " time: " + parts[1]);
      console.log("date parse -- parts: " + JSON.stringify(parts) );
      dparts = parts[0].split('/');
      tparts = parts[1].split(':');
      time = new Date( Date.UTC(dparts[0],dparts[1]-1,dparts[2],tparts[0],tparts[1],tparts[2]) );
      console.log("date parse: " + JSON.stringify(dparts) + ' ' + JSON.stringify(tparts) );
    } 
    console.log('makeDatetime  ionTime= '+ ionTimeStr + " Date= " + time.toUTCString() );
    // NOTE: this is an UN-controlled component (no value provided)
    //   which avoids messy issues mid-edit
    var form =
      <Datetime
        defaultValue={time}
        utc={true}
        dateFormat="YYYY/MM/DD"
        timeFormat="HH:mm:ss"
        onChange={this.handleDatetimeChange.bind(null,idx)}
      />;
    return form;
  }
  makeParamElem(pKey,pIdx) {
    const param = this.props.params[pIdx];
    //console.log("Command-makeParamElem valueType = " + param.valueType + " idx =" + pIdx);
    let f = null;
    let show = null;
    let width = 3;
    let menuFlag = false;        // assume standard form, not menu
    let note = "from all nodes"  // note used with dynamic menus
    if (param.valueType === "number") { 
      f = this.makeFieldForm(pIdx,"number");
      width = 1;
    } else 
    if (param.valueType === "text") { 
      f = this.makeFieldForm(pIdx,"text");
      width = 2;
    } else
    if (param.valueType === "datetime") {
      f = this.makeDatetimeForm(pIdx);
      width = 2;
    } else 
    if (param.copyClone) { 
      f = this.makeShowForm(pIdx);
      width = 1;
    } else {  // must be menu type
      show = this.makeShowForm(pIdx);
      // infer match type based on valueType
      let matchType = "all";   // assume matching all, at first
      if (param.valueType.indexOf("select") >= 0) {  //no note needed for simple select
        note = "";
      } else
      if (param.valueType.indexOf("nodeNum") >= 0) { // nodes should be external
        if (param.typeKey.indexOf("ovrd") >= 0) {    // except for override commands (ipn)
          matchType = "all"
        } else
        if (this.props.usedNodeKey(this.props.nodeKey)) { // if this nodeKey is "real",need to exclude
          matchType ="exclude";                           // but for contacts,  nodeKey is artificial
          note = "from other nodes only";
        };
      } else 
      if (param.valueType.indexOf("ipAddr") >= 0) { // ipAddrs should be local
        if (param.typeKey.indexOf("span") >= 0) {   // except for span commands (bssp)
          matchType ="exclude";
          note = "from other nodes only";
        } else {
          matchType ="match"; 
          note = "from this host only";
        };
      } else 
      if (param.valueType.indexOf("Induct")   >= 0    // inducts should be external
       || param.valueType.indexOf("Link")     >= 0    // links should be external
       || param.valueType.indexOf("Endpoint") >= 0) { // endpoints should be external
        matchType ="exclude";
        note = "from other nodes only";
      } else 
      if (param.valueType.indexOf("Outduct") >= 0) { // outducts should be local
        matchType ="match";
        note = "from this node only";
      };
      f = this.makeMenuForm(param,pIdx,matchType);
      menuFlag = true;
    };
    var justread = !(this.state.editMode && !param.cloned);
    const cmdKey = this.props.cmdKey;
    const values = this.props.getValues(cmdKey);
    const value = values[pIdx];
    var pElem = null;
    if (note !== "")
      note = '(' + note + ')';
    if (menuFlag) {
      pElem =
        <Row key={pIdx}>
          <Col className="text-right" sm={3}><b>{param.name}</b></Col>
          <Col sm={2} value={value}>{show}</Col>
          <Col sm={2} type={param.type} value={value} readOnly={justread}>
            {f}
          </Col>
          <Col sm={2}>{note}</Col>
        </Row>
    } else {    // standard form control
      pElem = 
        <Row key={pIdx}>
          <Col className="text-right" sm={3}><b>{param.name}</b></Col>
          <Col sm={width} type={param.type} value={value} readOnly={justread}>
            {f}
          </Col>
          <Col sm={2}>{param.units}</Col>
        </Row>
    };
    return pElem;
  }

  makeMenuForm(param,pIdx,matchType) {
    let f = null;
    let opts = null;
    let myNodeKey = this.props.nodeKey;   // send the local node to filter needed values
    let myHostKey = this.props.hostKey;   // unless using the hostKey instead!

    if (param.valueType === "select") {
      console.log("+++select detected");
      var paramId = param.typeKey;
      opts = this.props.makeOptionElems(paramId);
    } else
    if (param.valueType === "ipAddr") {
      console.log("+++ ipAddr pick detected!");
      opts = this.props.makeTypeOptions(param.valueType,myHostKey,matchType);
    } else
    if (param.pickClone) {
      console.log("+++" + param.valueType + " pick detected!");
      opts = this.props.makeTypeOptions(param.valueType,myNodeKey,matchType);
    };
    f = this.makeSelectFormElem(pIdx,opts);
    return f;
  }

  makeEditFlagElem(editFlag) {
    if (editFlag) {
      return (
        <Col sm={1}>
            <Button bsSize="sm" bsStyle="danger">??</Button>
        </Col>
      );
    }
    return "";
  }
  makeCommandEditor(paramKeys) {
    var commandElems = paramKeys.map( (paramKey,idx) => {
      return this.makeParamElem(paramKey,idx) 
    } );
    const dictMode = this.state.dictMode;
    const entryMode = this.state.entryMode;
    const dictLabel = dictMode?  'Hide Dictionary' :'Show Dictionary' 
    const entryLabel = entryMode?  'Hide File Entry' :'Show File Entry' 
    let dictPanel = null;
    if (dictMode)
      dictPanel = this.makeDict();
    let entryPanel = null;
    if (entryMode)
      entryPanel = this.makeFileEntry();
            // check for alert
    let msg = this.state.cmdMsg;
    var alert = (msg === "")?  "" : this.makeAlertElem(msg);

    const icon = 'remove';
    const head  =
      <Row key="head">
        <Col sm={5}> <Label bsSize="lg" bsStyle="default">Command Editor</Label></Col>
        <Col sm={4}>
          <ButtonToolbar>
            <Button bsSize="sm" bsStyle="info" onClick={this.dict}>{dictLabel}</Button>
            <Button bsSize="sm" bsStyle="info" onClick={this.entry}>{entryLabel}</Button>
            <Button bsSize="sm" bsStyle="danger" onClick={this.delete}>Delete</Button>
            <Button bsSize="sm" bsStyle="success"  onClick={this.noedit}><Glyphicon glyph={icon} /></Button>
          </ButtonToolbar>
        </Col>
        <Col sm={4}>{alert}</Col>
      </Row>;
    commandElems.unshift(head);
    return (
      <div>
        {commandElems}
        <Panel collapsible expanded={dictMode}>{dictPanel}</Panel>
        <Panel collapsible expanded={entryMode}>{entryPanel}</Panel>
      </div>);
  }
  makeCommandViewer(paramKeys) {
    var commandElems = paramKeys.map( (paramKey,idx) => {
      return this.makeReadElem(paramKey,idx) 
    } );
    const dictMode = this.state.dictMode;
    const entryMode = this.state.entryMode;
    const dictLabel = dictMode?  'Hide Dictionary' :'Show Dictionary' 
    const entryLabel = entryMode?  'Hide File Entry' :'Show File Entry' 
    let dictPanel = null;
    if (dictMode)
      dictPanel = this.makeDict();
    let entryPanel = null;
    if (entryMode)
      entryPanel = this.makeFileEntry();
    const head  =
      <Row key="head">
        <Col sm={5}><Label bsSize="lg" bsStyle="default">Command Viewer</Label></Col>
        <Col sm={3}>
          <ButtonToolbar>
            <Button bsSize="sm" bsStyle="info" onClick={this.dict}>{dictLabel}</Button>
            <Button bsSize="sm" bsStyle="info" onClick={this.entry}>{entryLabel}</Button>
          </ButtonToolbar>
        </Col>
      </Row>;
    commandElems.unshift(head);
    return (
      <div>
        {commandElems}
        <Panel collapsible expanded={dictMode}>{dictPanel}</Panel>
        <Panel collapsible expanded={entryMode}>{entryPanel}</Panel>
      </div>);
  }
  makeReadElem(paramKey,pIdx) {
    //console.log(">>MakeNodeElem " + prop + ' ' + type + ' ' + val + ' ' + size);
    const param  = this.props.params[pIdx];
    const cmdKey = this.props.cmdKey;
    const values = this.props.getValues(cmdKey);
    const val    = values[pIdx];
    const name   = param.name;
    var   size   = 2;
    if (param.valueType === "number")
      size = 1;
    const form =
        <FormControl readOnly="true" bsSize="sm" type="text" value={val}/>;
    return (
      <Row key={name}>
        <Col className="text-right" sm={3}><b>{name}</b></Col>
        <Col sm={size} value={val}>{form}</Col>
        <Col sm={2}>{param.units}</Col>
      </Row>
    );
  };
  makeParamInfo(param, pIdx) {
    //console.log("makeParamInfo idx= " + pIdx + " param=" + JSON.stringify(param) );
    const targets = ["[1]","[2]","[3]","[4]","[5]","[6]","[7]","[8]"];
    const posTag = targets[pIdx];
    const pName = param.name;
    const valType = param.valueType;
    var def = param.defaultValue;
    if (def === '')
      def = '[none]';
    var units = param.units;
    if (units === '')
      units = '[none]';
    var flags = "";
    if (param.showDefault)
      flags += " showDefault";
    if (param.copyClone)
      flags += " copyClone";
    if (param.pickClone)
      flags += " pickClone";
    if (flags === '')
      flags = '[none]';
    let opt = "required";
    if (param.optional) { opt = "optional"; } 

    return (
      <Row key={pIdx}>
        <Col sm={2}>{posTag} {pName}</Col>
        <Col sm={1}>{opt}</Col>
        <Col sm={1}>{valType}</Col>
        <Col sm={1}>{units}</Col>
        <Col sm={2}>{flags}</Col>
        <Col sm={2}>{def}</Col>
        <Col sm={3}></Col>
      </Row>
    );
  }
  makeFileEntry() {
    var lf = "\n";   // assign linefeed format for text files
    const cmdLines = this.makeCmdLines();
    const page = cmdLines.join(lf) + lf;
    return (
      <div>
        <Row>
          <Col sm={4}><Label bsStyle="default">Command File Entry</Label></Col>
          <Col className="text-left" sm={3}>
             <b>Last updated: </b>{this.props.lastUpdate}
          </Col>
        </Row>
        <pre>{page}</pre>
      </div>
      );
  }
  makeCmdLines(){
    var cmdLines = this.props.params.map( (param, idx) => {
      return this.makeParamLine(param,idx);
    } );
    const cmdName = this.props.cmdType.name;
    var cmdNameStr = "#  " + cmdName.toUpperCase();
    cmdLines.unshift(cmdNameStr);
    const cmdTypeKey = this.props.cmdTypeKey;
    const cmdKey = this.props.cmdKey;
    const vals = this.props.getValues(cmdKey);
    const cmdStr = this.props.makeCmd(cmdTypeKey,vals);
    cmdLines.push(cmdStr);
    return cmdLines;
  }
  makeParamLine(param,pIdx) {
    const pTypeKey = param.typeKey;
    const cmdKey = this.props.cmdKey;
    const values = this.props.getValues(cmdKey);
    const val = values[pIdx];
    const note = this.props.makeParamNote(pTypeKey,pIdx,val);
    return note;
  }
  makeDict() { 
    console.log("$$$ makeDictionary");
    var cmdTypeKey = this.props.cmdTypeKey;
    var cmdPat = this.props.cmdPattern;
    const cmdTypeObj = this.props.cmdType;
    var flags = "";
    if (cmdTypeObj.multiple)
      flags += " multiple";
    else
      flags += " singleton";
    if (cmdTypeObj.copyClone)
      flags += ", copyClone";
    if (cmdTypeObj.isCloned)
      flags += ", isCloned";
    var order = cmdTypeObj.order
    var paramElems = this.props.params.map( (param, idx) => {
      return this.makeParamInfo(param,idx);
    } );
    return (
      <div>
        <Row>
          <Col sm={1} className="text-left"><Label bsStyle="default">Command Dictionary</Label></Col>
        </Row>
        <Row>
          <Col sm={2} className="text-left"><b>{cmdTypeKey}</b></Col>
          <Col sm={1} className="text-left"><b>Order: </b>{order}</Col>
          <Col sm={3} className="text-left"><b>Conditions: </b>{flags}</Col>
          <Col className="text-right" sm={2}><b>Command pattern:</b></Col>
          <Col className="text-left"  sm={4}><pre>{cmdPat}</pre></Col> 
        </Row>
        <Row>
          <Col sm={2}><b>Parameters</b></Col>
          <Col sm={1}><b>Required</b></Col>
          <Col sm={1}><b>Value type</b></Col>
          <Col sm={1}><b>Units</b></Col>
          <Col sm={2}><b>Conditions</b></Col>
          <Col sm={2}><b>Default value</b></Col>
        </Row>
        {paramElems}
      </div>
      );
  }
    
  render() {
    // const cmdKey = this.props.cmdKey;
    // console.log("Command render " + cmdKey);
    var vals = this.state.values;

    const editMode = this.state.editMode;
    const viewMode = this.state.viewMode;

    const editLabel = editMode?  'Submit' : 'Edit'
    const viewLabel = viewMode?  'Hide' : 'Show'

    let viewPanel = null;
    const paramKeys = this.props.params.map(param => {return param.id});
    if (viewMode)
      if (editMode)
        viewPanel = this.makeCommandEditor(paramKeys);
      else
        viewPanel = this.makeCommandViewer(paramKeys);

    const cmdTypeKey = this.props.cmdTypeKey;
    var cmdStr = this.props.makeCmd(cmdTypeKey,vals);
        // check if this command should be flagged for editing
    var editFlag = false;
    if (cmdStr.indexOf("??") > -1)
      editFlag = true;  

    return (
      <Grid fluid>
        <Row>
          <Col className="text-right" sm={1}><Label bsSize="lg" bsStyle="default">Command</Label></Col>
          <Col className="text-right" sm={1}><b>{this.props.name}</b></Col>
          <Col sm={3}> 
            <FormControl readOnly="true" bsSize="sm" type="text" value={cmdStr} />
          </Col>
          <Col sm={2}>
            <ButtonToolbar>
              <Button bsSize="sm" bsStyle="primary" onClick={this.edit}>{editLabel}</Button>
              <Button bsSize="sm" bsStyle="info" onClick={this.view}>{viewLabel}</Button>
            </ButtonToolbar>
          </Col>
          {this.makeEditFlagElem(editFlag)}
        </Row>
        <Panel collapsible expanded={viewMode}>
         {viewPanel}
        </Panel>
      </Grid>
    )
  };
  // handles value changes for a child parameter
  handleParamChange = (idx,e) => {
    const val = e.target.value;
    console.log(">>> param change!" + e + " idx = " + idx + " value= " + val);
    var newState = Object.assign({},this.state);
    console.log(">>> param old value = " + newState.values[idx]);
    newState.values[idx] = val;
    this.setState (newState);
    this.render();
    e.preventDefault();
  };
  handleDatetimeChange =(idx,m) => {
    console.log(">>>handleDatetimeChange  m: " + typeof m);
    let time = null;
    //    if (typeof m !== "undefined") {
    if (typeof m === "object") {
      time = m.format('YYYY/MM/DD-HH:mm:ss');
      console.log(">>> datetime change! idx= " + idx + " time= " + time);
    }
    else {
      let nowDate= new Date();
      nowDate.setUTCHours(0,0,0);
      let nowStr = nowDate.toISOString();
      nowStr = nowStr.replace('T','?');
      time = nowStr.slice(0,19);
      console.log(">>> datetime nulled! idx= " + idx + " time= " + time);
    }
    var newState = Object.assign({},this.state);
    console.log(">>> param old value = " + newState.values[idx] + "  new value = " + time);
    newState.values[idx] = time;
    this.setState (newState);
    this.render();
  };
  handleParamSelect = (idx,e) => {
    const val = e.target.value;
    console.log(">>> param selection!" + e + " idx = " + idx + " value= " + val);
    var newState = Object.assign({},this.state);
    console.log(">>> param old value = " + newState.values[idx]);
    newState.values[idx] = val;
    this.setState (newState);
    this.render();
    e.preventDefault();
  };
  edit = () => {   // activated by Edit/Submit button
    var newState = Object.assign({},this.state);
    const editMode = this.state.editMode;
    if (editMode) {
      console.log("let's submit!");
      newState.viewMode = false;     // force viewing
    }  else {
      console.log("let's edit!");
      newState.viewMode = true;     // force viewing
    }
    newState.editMode = !editMode;  // toggle mode
    this.setState (newState);
    if (editMode)
      this.submit();
  };
  noedit = () => {   // activated by Cancel button
    var newState = Object.assign({},this.state);
    newState.editMode = false;   // cancel editing
    newState.viewMode = false;   // cancel viewing
    this.setState (newState);
  };
  submit = () => { // callable by edit (above)
    console.log("submit updates!  initValues:" + JSON.stringify(this.props.initValues));
    var tran = {
      action: "UPDATE-COMMAND",
      nodeKey: this.props.nodeKey,
      cmdKey: this.props.cmdKey,
      values: this.state.values,
      initValues: this.props.initValues
    };
    this.props.dispatch(tran);
  };
  delete = () => { 
    console.log("submit delete!  cmdKey:" + this.props.cmdKey);
    var msg = "";  // no error, no msg
    if (this.hasClonedValue()) {
      msg = "Cannot delete while command value is cloned.  See clones survey.";
      console.log(msg);
    } else
      console.log("Command value is NOT Cloned.");
    if (msg === "") {  // all good!
      var tran = {
        action: "DELETE-COMMAND",
        nodeKey: this.props.nodeKey,
        configKey: this.props.configKey,
        cmdKey: this.props.cmdKey
      };
      this.props.dispatch(tran);
    } else {
      console.log("Delete rejected.");
      this.setState({
        cmdMsg: msg
      });
    }
  };
  view = () => { // activated by view/hide button
    var newState = Object.assign({},this.state);
    const viewMode = this.state.viewMode;
    if (viewMode)
      console.log("let's hide view panel!");
    else
      console.log("let's show view panel!");
    newState.viewMode = !viewMode;
    this.setState (newState);
  };
  dict = () => {
    var newState = Object.assign({},this.state);
    const dictMode = this.state.dictMode;
    if (dictMode)
      console.log("let's hide dictionary panel!");
    else
      console.log("let's show dictionary panel!");
    newState.dictMode = !dictMode;
    this.setState (newState);
  };
  entry = () => {
    var newState = Object.assign({},this.state);
    const entryMode = this.state.entryMode;
    if (entryMode)
      console.log("let's hide file entry panel!");
    else
      console.log("let's show file entry panel!");
    newState.entryMode = !entryMode;
    this.setState (newState);
  };
}

Command.propTypes = {
  cmdKey: PropTypes.string.isRequired,     // user model - cmd key
  nodeKey: PropTypes.string.isRequired,    // user model - node key
  hostKey: PropTypes.string.isRequired,    // user model - host key
  configKey: PropTypes.string.isRequired,  // user model - config key
  cmdTypeKey: PropTypes.string.isRequired,
  cmdType: PropTypes.object.isRequired,    // schema
  cmdPattern: PropTypes.string.isRequired, // schema
  initValues:  PropTypes.array.isRequired,
  cloneValues: PropTypes.array.isRequired,

  makeCmd: PropTypes.func.isRequired,
  getValues: PropTypes.func.isRequired,
  usedNodeKey: PropTypes.func.isRequired,
  makeTypeOptions: PropTypes.func.isRequired,
  makeOptionElems: PropTypes.func.isRequired,
  getOptionText: PropTypes.func.isRequired,
  makeParamNote: PropTypes.func.isRequired,
  dispatch: PropTypes.func.isRequired,
  lastUpdate: PropTypes.string.isRequired,
  params: PropTypes.array.isRequired,
};
