//        SurveyPopout.jsx     SurveyPopoutl React Component
//
//        Copyright (c) 2018, California Institute of Technology.
//        ALL RIGHTS RESERVED.  U.S. Government Sponsorship
//        acknowledged.
//                                                                   
//      Author: Rick Borgen, Jet Propulsion Laboratory         
//                                                               
import React from 'react';
import {Button} from 'react-bootstrap';
import PopoutWindow from 'react-popout';

export default class SurveyPopout extends React.Component {
  propTypes: {
  	label: React.PropTypes.string.isRequired,
    showSurvey: React.PropTypes.func.isRequired      // func for survey content
  }
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
        <PopoutWindow title={label} onClosing={this.popoutClosed}>
          {survey}
        </PopoutWindow>
      );
    } else {
      //var popout = <span onClick={this.popout} className="buttonGlyphicon glyphicon glyphicon-export"></span>;
      return (
        <Button bsSize="sm" bsStyle="info" onClick={this.popout}>{label}</Button>
      );
    }
  }
  //        <PopoutWindow url="./local.html" title={label} onClosing={this.popoutClosed}>
};
