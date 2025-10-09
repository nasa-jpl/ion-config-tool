//        SurveyPopout.jsx     SurveyPopoutl React Component
//
//        Copyright (c) 2018, California Institute of Technology.
//        ALL RIGHTS RESERVED.  U.S. Government Sponsorship
//        acknowledged.
//                                                                   
//      Author: Rick Borgen, Jet Propulsion Laboratory         
//                                                               
import React from 'react';
import PropTypes from 'prop-types';
import {Button} from 'react-bootstrap';
import {Modal} from 'react-bootstrap';
import {Popover} from 'react-bootstrap';

export default class SurveyPopout extends React.Component {
  constructor(props) {
    super(props);
    this.popout = this.popout.bind(this);
    this.popoutClosed = this.popoutClosed.bind(this);

    this.state = { 
      popoutMode: false 
    };
  }
  popout() {
    this.setState({popoutMode: true});
  }
 
  popoutClosed() {
    this.setState({popoutMode: false});
  }
 
  render() {
  	const label = this.props.label;
    if (this.state.popoutMode) {
      const survey = this.props.showSurvey();
      return (
        <Modal show={this.state.popoutMode}
          backdrop="static"
          scrollable={true}
          size="xl"
          keyboard={false}>
          <Modal.Header closeButton>
            <Modal.Title>{label}</Modal.Title>
          </Modal.Header>
          <Modal.Body>{survey}</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" bssize="sm" onClick={this.popoutClosed}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      );
    } else {
      return (
        <Button variant="info" onClick={this.popout}>{label}</Button>
      );
    }
  }
  //        <PopoutWindow url="./local.html" title={label} onClosing={this.popoutClosed}>
}

SurveyPopout.propTypes = {
  label: PropTypes.string.isRequired,
  showSurvey: PropTypes.func.isRequired      // func for survey content
}
