//        NetModelLoader.jsx     NetModelLoader React Component
//
//        Copyright (c) 2018, California Institute of Technology.
//        ALL RIGHTS RESERVED.  U.S. Government Sponsorship
//        acknowledged.
//                                                                   
//      Author: Rick Borgen, Jet Propulsnet Laboratory         +
//                                                               
import React from 'react';
import {FormControl} from 'react-bootstrap';
import {Col} from 'react-bootstrap';
import {Button, ButtonToolbar} from 'react-bootstrap';
import {Glyphicon} from 'react-bootstrap';
import {Alert} from 'react-bootstrap';

export default class NetModelLoader extends React.Component {
  propTypes: {
    netAddrs:  React.PropTypes.array.isRequired,    // user model - net ipaddr names
    noLoadNetModel: React.PropTypes.func.isRequired,// func to cancel load of model
    dispatch: React.PropTypes.func.isRequired       // func to handle transactnets centrally
  };

  constructor (props) {
    super(props);
    console.log("NetModelLoader ctor");
    var netObj = { "name": "test", "desc": "Test Net Model"};
    this.state = {
      net: netObj,         // model attributes
      modelFile: "",       // File object
      modelJson: {},       // JSON object
      netHosts: {},
      netNodes: {},
      netHops: {},

      errMsg: ""
    };
    console.log("NetModelLoader ctor done.");
  }
  setError(msg) {
    console.log(msg);
    var newState = Object.assign({},this.state);
    newState.errMsg = msg;
    this.setState (newState);
  };
  getBool(flag) {     // return boolean type
    // could be boolean already, or a boolean string
    if (!flag || flag === "false" || flag === "no")
      return false;
    return true;
  }
  extractModel () {
    // extract the Net config JSON structure &
    // flatten the data structures for efficient access

    // make short names for state objects
    const modelObj = this.state.modelJson;
    var net = this.state.net;
    var hosts = this.state.netHosts;
    var nodes = this.state.netNodes;
    var hops = this.state.netHops;
    var netaddrs = this.props.netAddrs;

    console.log("=== Ingesting user net model.  net: " + JSON.stringify(net));
    console.log("net WAS: " + JSON.stringify(net));
    if(modelObj.hasOwnProperty("netModelName"))
      net.name = modelObj["netModelName"];
    else {
       this.setError("The json file is not a Net Model.");
       return false;
    }
    if(modelObj.hasOwnProperty("netModelDesc"))
      net.desc = modelObj["netModelDesc"];

    console.log("=== Ingesting netHosts.");
    var hostList = [];
    if(modelObj.hasOwnProperty("netHosts")) 
      hostList = modelObj.netHosts;
    for (var hostKey in hostList) {
      var hostObj = hostList[hostKey];
      var desc = '';
      if(hostObj.hasOwnProperty("hostDesc"))
        desc = hostObj["hostDesc"];
      let addrs = [];
      if(hostObj.hasOwnProperty("ipAddrs"))
        addrs = hostObj["ipAddrs"];

      // build the hosts state object
      hosts[hostKey] = { 
        "id" : hostKey, 
        "hostDesc" : desc,
        "ipAddrs" : addrs
      };
      // add the ip addrs to master list
      for (var i=0; i<addrs.length; i++)
        netaddrs.push(addrs[i]);

    };
    console.log("net IS:  " + JSON.stringify(net));
    console.log("=== Ingesting netNodes.");
    var nodeList = [];
    if(modelObj.hasOwnProperty("netNodes"))  // optional for now.
      nodeList = modelObj.netNodes;
    for (var nodeKey in nodeList) {
      var nodeObj = nodeList[nodeKey];
      desc = '';
      if(nodeObj.hasOwnProperty("nodeDesc"))
        desc =nodeObj["nodeDesc"];
      var host = '';
      if(nodeObj.hasOwnProperty("nodeHost"))
        host =nodeObj["nodeHost"];
      var type = '';
      if(nodeObj.hasOwnProperty("nodeType"))
        type =nodeObj["nodeType"];
      var ep = '';
      if(nodeObj.hasOwnProperty("endpointID"))
         ep = nodeObj["endpointID"];
      var servs= [];
      if(nodeObj.hasOwnProperty("services"))
        servs = nodeObj["services"];
      // build the nodes state object
      nodes[nodeKey] = { 
        "id" : nodeKey, 
        "nodeDesc" : desc, 
        "nodeHost" : host,
        "nodeType" : type,
        "endpointID" : ep,
        "services" : servs
      };
    }
    console.log("=== Ingesting netHops.");
    var hopList = [];
    if(modelObj.hasOwnProperty("netHops"))  // optional for now.
      hopList = modelObj.netHops;
    for (var hopKey in hopList) {
      var hopObj = hopList[hopKey];
      desc = '';
      if(hopObj.hasOwnProperty("hopDesc"))
        desc = hopObj["hopDesc"];
      var fromnode = '';
      if(hopObj.hasOwnProperty("fromNode"))
        fromnode = hopObj["fromNode"];
      var tonode = '';
      if(hopObj.hasOwnProperty("toNode"))
        tonode = hopObj["toNode"];
      var bp = '';
      if(hopObj.hasOwnProperty("bpLayer"))
        bp = hopObj["bpLayer"];
      var ltp = '';
      if(hopObj.hasOwnProperty("ltpLayer"))
        ltp = hopObj["ltpLayer"];
      var rate = 0;
      if(hopObj.hasOwnProperty("maxRate"))
        rate = hopObj["maxRate"];
      var sym = "no";
      if(hopObj.hasOwnProperty("symmetric"))
        sym = this.getBool(hopObj["symmetric"]);
      // build the nodes state object
      hops[hopKey] = { 
        "id" : hopKey, 
        "hopName": hopKey,
        "hopDesc": desc,
        "fromNode": fromnode,
        "toNode": tonode,
        "bpLayer": bp,
        "ltpLayer": ltp,
        "maxRate": rate,
        "symmetric": sym
      };
    };
    return true;
  };

  makeAlertElem(msg) {
    return (<Alert bsStyle="danger"><b>ERROR: {msg}</b></Alert>);
  };
  render() {
    // NOTE: this is an uncontrolled input form, so no value parameter provided
    //     the html5 file input form controls its own state
    console.log("NetModelLoader render form");
    // check for alert
    let msg = this.state.errMsg;
    var alert = (msg === "")?  "" : this.makeAlertElem(msg);
    var form =
      <FormControl
        id="netmodel"
        name="name"
        type="file"
        label="Label"
        accept=".json"
        className="inputClass"
        onChange={this.handleFileChange}
      />;
    let icon = "remove";
    console.log("NetModelLoader render div");
    return (
        <div>
          <hr />
          <Col className="text-right" sm={2}><b>Net Model File (.json)</b></Col>
          <Col sm={2}>{form}</Col>
          <Col sm={2}>
            <ButtonToolbar>
              <Button bsSize="sm" bsStyle="primary" onClick={this.load}>Submit</Button>
              <Button bsSize="sm" bsStyle="success" onClick={this.props.noLoadNetModel}><Glyphicon glyph={icon} /></Button>
            </ButtonToolbar>
          </Col>
          <Col sm={4}>{alert}</Col>
        </div>
    )
  };
  handleFileChange = (e) => {
    // special fetch of file object from html5 file input widget
    var modfile = document.getElementById('netmodel').files[0];
    console.log("filename change!" + modfile.name);
    console.log("state: " + JSON.stringify(this.state.net));
    //console.log("state: " + JSON.stringify(this));
    var newState = Object.assign({},this.state);
    newState.modelFile = modfile;
    newState.errMsg = "";
    this.setState (newState);
  };
  handleFileLoad = (e) => {
    // now we operate on the file contents, since loading is complete
    //console.log("result: " + e.target.result);
    console.log("$$$$$ extract model!");
    var json = {};
    var newState = Object.assign({},this.state);
    try {
      json = JSON.parse(e.target.result);
    }
    catch (err) {
      this.setError("Failed to parse the JSON file. " + err);
      return;
    }
    //console.log("Parse result: " + JSON.stringify(json));
    newState.modelJson = json;
    this.setState(newState);
    if (!this.extractModel()) // extract & flatten model into state
      return;                 // skip the load transaction on failure

    //console.log("model object = " + JSON.stringify(this.state.modelJson));
    var tran = {
      action: "LOAD-NET-MODEL",
      netModel: this.state.net,
      netHosts: this.state.netHosts,
      netNodes: this.state.netNodes,
      netHops: this.state.netHops
    };
    this.props.dispatch(tran);
  };
  load = () => {
    console.log("load net model!" + this.state.modelFile);
    try {
      console.log("create file for: " + this.state.modelFile);
      var modfile = this.state.modelFile;
      console.log ("model file name: " + modfile.name);
      var reader = new FileReader();
      reader.onload = this.handleFileLoad;
      reader.readAsText(modfile);
    }
    catch (err) {
      this.setError("Failed to load the Net Model file.");
    }
  };
}
