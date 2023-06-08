//        NetHopList.jsx     NetHopList React Component
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
import NetHop from './NetHop.jsx';

export default class NetHopList  extends React.Component {
  constructor (props) {
    super(props);
    console.log("NetHopList ctor");
    this.state = {
      expandMode: false,
      newHop: false,
      newHopMsg: "",
      newHopId: ""
    };
  } 
  makeAlertElem(msg) {
    return (<Alert bsStyle="danger"><b>ERROR: {msg}</b></Alert>);
  }
  makeNetHopElem(hopKey) {
    const hop = this.props.netHops[hopKey];

    // Use default of 25MBps for maxRate
    hop.maxRate = 25000000;

    console.log("***makeNetHopElem" + JSON.stringify(hop) );

    const makeOptions = this.props.makeTypeOptions;
    const makeOptElems = this.props.makeOptionElems;
    const makeNetNodeOptions = this.props.makeNetNodeOptions;
    const dispatch = this.props.dispatch;  // pass dispatch through

    return (
      <NetHop
        key={hopKey}                  // unique id
        hopKey={hopKey}               // state
        desc={hop.hopDesc}            // state
        fromNode={hop.fromNode}       // state
        toNode={hop.toNode}           // state
        bpLayer={hop.bpLayer}         // state
        ltpLayer={hop.ltpLayer}       // state
        maxRate={hop.maxRate}         // state
        symmetric={hop.symmetric}     // state

        makeTypeOptions={makeOptions} 
        makeOptionElems={makeOptElems}

        makeNetNodeOptions = {makeNetNodeOptions}
        dispatch={dispatch}           // dispatch func for hop updates
      />
    );  
  }

  makeNewHopElem() {
    console.log("makeNewHopElem");
    const id = this.state.newHopId;
        // check for alert
    let msg = this.state.newHopMsg;
    var alert = (msg === "")?  "" : this.makeAlertElem(msg);

    var form =
      <FormControl bsSize="sm" type="text" value={id} spellCheck="false" onChange={this.handleNewHop}/>;
    const icon = 'remove';
    return (
      <div>
        <hr />
        <Row>
          <Col className="text-right" sm={2}><b>New Hop Name:</b></Col>
          <Col sm={1}>{form}</Col>
          <Col sm={1}>(no spaces)</Col>
          <Col sm={2}>
            <ButtonToolbar>
              <Button bsSize="sm" bsStyle="primary" onClick={this.submitNewHop}>Submit</Button>
              <Button bsSize="sm" bsStyle="success" onClick={this.nonewhop}><Glyphicon glyph={icon} /></Button>
            </ButtonToolbar>
          </Col>
          <Col sm={4}>{alert}</Col>
        </Row>
      </div>
    );
  };

  render() {
    console.log("NetHopList render ");
    const expandMode = this.state.expandMode;
    const name = this.props.name;
    const newHop = this.state.newHop;
    const netHops = this.props.netHops;

    const expandIcon = expandMode? 'chevron-down' : 'chevron-right';

    const dimNewHop = newHop?  true : false ; 
    const hopEntry  = newHop?  this.makeNewHopElem() : "" ;

    const hopCnt = '(' + Object.keys(netHops).length.toString() + ')';
    var hopList = [];
    for (var hopKey in this.props.netHops) {
      hopList.push(this.makeNetHopElem(hopKey));
    }

    return (
      <Grid fluid>
        <Row>
          <div className="row mt-4">
            <Col className="text-right" sm={1}><Label bsSize="lg" bsStyle="default">Net Hop List</Label></Col>
            <Col className="text-right" sm={1}><b>{name}</b></Col>
            <Col className="text-left"  sm={2}>Node-to-Node Hops {hopCnt}</Col>
            <Col sm={3}> 
              <ButtonToolbar>
                <Button bsSize="sm" bsStyle="primary" disabled={dimNewHop} onClick={this.newhop}>New Hop</Button>  
                <Button bsSize="sm" bsStyle="success" onClick={this.expand}><Glyphicon glyph={expandIcon}/>{' '}</Button>
              </ButtonToolbar>
            </Col>
          </div>
        </Row>
        <Row>
          {hopEntry}
        </Row>
        <Panel  collapsible expanded={expandMode}>
          {hopList}
        </Panel>
      </Grid>
    )
  };
  expand = () => {       // activated by expand/contract shutter icon
    var newState = Object.assign({},this.state);
    var expandMode = this.state.expandMode;
    if (expandMode)
      console.log("let's close-up hop list!");
    else
      console.log("let's expand hop list!");
    newState.expandMode = !expandMode;  // toggling flag changes render
    this.setState (newState);
  };
  newhop = () => {     // activated by newhop button
    var newState = Object.assign({},this.state);
    console.log("add a new hop!");
    newState.newHop= true;   // setting flag changes render
    this.setState (newState);
  };
  nonewhop = () => {   // activated by new hop cancel button
    var newState = Object.assign({},this.state);
    console.log("cancel add a new hop!");
    newState.newHop = false;   // setting flag changes render
    this.setState (newState);
  };
  handleNewHop = (e) => {
    const val = e.target.value;
    console.log("a new hop name!" + val);
    var newState = Object.assign({},this.state);
    newState.newHopId = val;
    this.setState (newState);
    e.preventDefault();
  };
  submitNewHop = (e) => {
    console.log("a new net hop!" + e);
    const hopKey = this.state.newHopId;
    console.log("hop name = " + hopKey);
    let msg = "";
    if (!this.props.isGoodName(hopKey) )
      msg = "Hop name is mal-formed.";
    else if (!this.props.isGoodNetHopKey(hopKey) )
      msg = "Hop name already used." ;
    if (msg === "") {  // all good!
      const tran = {
        action: "NEW-NET-HOP",
        hopKey: hopKey
      };
      this.props.dispatch(tran);
      this.setState({
        expandMode: true,  // open up to show new hop
        newHop: false,    // setting flag changes render
        newHopId: "",
        newHopMsg: ""
      });
    } else {        // set msg to show problem
      this.setState({
        newHopMsg: msg
      });
    }
    e.preventDefault();
  };
}

NetHopList.propTypes = {
  name:  PropTypes.string.isRequired,          // user model - model name
  netHops: PropTypes.object.isRequired,        // hop dict

  isGoodName: PropTypes.func.isRequired,       // func to validate name
  isGoodNetHopKey: PropTypes.func.isRequired,  // func to validate hopKey not in use
  makeTypeOptions: PropTypes.func.isRequired,  // func to get dynamic (cloned) options
  makeOptionElems: PropTypes.func.isRequired,  // func to get static options
  makeNetNodeOptions: PropTypes.func.isRequired,// func to build nodekey options
  dispatch: PropTypes.func.isRequired,
}