//        Contacts.jsx     Contacts React Component
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

export default class Contacts  extends React.Component {
  constructor (props) {
    super(props);
    // props
    const desc = this.props.desc;
    console.log("Contacts ctor " + desc);
    this.state = {
      editMode: false,
      viewMode: false,
      expandMode: false,
      desc: desc
    }
  }
  logDebug() {
    var debug = true;
    if ( debug ) {
      console.log.apply(this, arguments);
    }
  }
  makeContactsEditorElem() {
    console.log(">>makeContactsEditorElem " + JSON.stringify(this.state));
    const readMode = !this.state.editMode;
    var AttrElems = [];
    const icon = "remove";
    const head  =  readMode? 
        <Row key="head"><Col sm={2}> <Label bsSize="lg" bsStyle="default">Contacts Viewer</Label></Col></Row>
      : <Row key="head"><Col sm={5}> <Label bsSize="lg" bsStyle="default">Contacts Editor</Label></Col> 
        <Col sm={1}><Button bsSize="sm" bsStyle="success"  onClick={this.noedit}><Glyphicon glyph={icon} /></Button></Col></Row> ;
    AttrElems.push(head);
    const nameElem = this.makeContactsAttrElem("","text",this.props.name,"Contacts Name",1,true,"");
    AttrElems.push(nameElem);
    const descElem = this.makeContactsAttrElem("desc","text",this.state.desc,"Description",2,readMode,"");
    AttrElems.push(descElem);

    return (
      <div>
        {AttrElems}
      </div>
    );
  };
  makeContactsAttrElem(prop,type,val,label,size,read,note) {
    console.log(">>MakeContactsElem " + prop + ' ' + type + ' ' + val + ' ' + size + ' ' + read);
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
    console.log("IonContacts render " + name);
    const editMode = this.state.editMode;
    const viewMode = this.state.viewMode;
    const expandMode = this.state.expandMode;

    const editLabel = editMode?  'Submit' : 'Edit'
    const viewLabel = viewMode?  'Hide' : 'Show'

    const expandIcon = this.state.expandMode? 'chevron-down' : 'chevron-right';

    return (
      <Grid fluid>
        <Row>
          <div className="row mt-4">
            <Col className="text-right" sm={1}><Label bsSize="lg" bsStyle="default">Contacts</Label></Col>
            <Col className="text-right" sm={1}><b>{name}</b></Col>
            <Col className="text-right" sm={1}><b>graph</b></Col>
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
         {this.makeContactsEditorElem()}
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
    console.log("submit Contacts updates!" + JSON.stringify(this.props.desc));
    var tran = {
      action: "UPDATE-CONTACTS",
      contactsKey: this.props.name,
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

Contacts.propTypes = {   
  contacts: PropTypes.object.isRequired,     // user model - contacts object
  name: PropTypes.string.isRequired,
  desc: PropTypes.string.isRequired,

  configKey: PropTypes.string.isRequired,    // config file name 
  configType: PropTypes.array.isRequired,    // config type name

  dispatch: PropTypes.func.isRequired,

  children: PropTypes.array.isRequired,      // config elements of this Contacts
}