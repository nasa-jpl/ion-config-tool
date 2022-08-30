//        Param.jsx     Param React Component
//
//        Copyright (c) 2018, California Institute of Technology.
//        ALL RIGHTS RESERVED.  U.S. Government Sponsorship
//        acknowledged.
//                                                                   
//      Author: Rick Borgen, Jet Propulsion Laboratory         
//                                                               
import React from 'react';
import PropTypes from 'prop-types';
import CreateReactCLass from 'create-react-class';
import {Form,FormGroup,FormControl} from 'react-bootstrap';
import {ControlLabel} from 'react-bootstrap';
import {Grid,Row,Col} from 'react-bootstrap';
import {Label,Button} from 'react-bootstrap';

export default class Param  extends React.Component {

  constructor (props) {
    super(props);
    console.log("Param ctor");
    this.state = {
      value: this.props.initValue
    };
  }
  render() {
    // the parameter is read-only unless it is 
    // both editable in edit mode.
    var justread = true;
    const edit = this.props.editable;
    const mode = this.props.editMode;
    const value = this.state.value;
    const type = this.props.valueType;
    if(edit === "true" && mode === "true") {
      justread = false;
    }
    return (
        <Row>
        <div className="row mt-4">
          <Col className="text-right" sm={3}><b>{this.props.name}</b></Col>
          <Col sm={3} type={type} value={value} readOnly={justread}>
            {this.props.children}
          </Col>
          <Col sm={1}> <Button bsSize="sm" bsStyle="info">Info</Button> </Col>
        </div>
        </Row>
    )
  };
}
