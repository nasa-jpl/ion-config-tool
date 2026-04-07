//        NodeDb.jsx     Main App JSX for IonConfig Tool
//
//        Copyright (c) 2025, California Institute of Technology.
//        ALL RIGHTS RESERVED.  U.S. Government Sponsorship
//        acknowledged.
//                                                                   
//      Author: Dave Hanks, Jet Propulsion Laboratory         
//                                                               

import { useEffect, useState } from "react";
import {Container} from 'react-bootstrap';
import {Row, Col} from 'react-bootstrap';
import {InputGroup, Button, Form} from 'react-bootstrap';
import {Alert} from 'react-bootstrap';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';
import {Spinner} from 'react-bootstrap';
import {BsQuestionCircle} from 'react-icons/bs';

import DbNodes from './DbNodes.jsx';
import nodeDB  from './json/nodeDB.json';

// NodeDb *must* be a functional component as opposed to a
// React component (ie. inherits from React.Component).
// This is because NodeDb uses hooks.
// 
// For a complete explanation of all the Rules of Hooks
// go to:
//
//      https://react.dev/reference/rules/rules-of-hooks
//


const NodeDb = (props) => {
  const [theError, setError] = useState(null);
  const [dbHost, setDbHost]  = useState("");
  const [dbURL, setDbURL] = useState("");
  const [loading, setLoading] = useState(true);
  const [connectDB, setConnectDB] = useState(false);
  const [dbPort, setDbPort] = useState("");

  var serverInputForm =
  <>
      <Col lg="3">
        <InputGroup className="mb-3">
          <InputGroup.Text id="basic-addon2">DB Server:</InputGroup.Text>
          <Form.Control
            placeholder="Host/IP Address"
            onChange={updateDBHost}
            value={dbHost}
          />
        </InputGroup>
        </Col>
      <Col lg="2" className="justify-content-left">          
        <InputGroup className="align-items-left mb-3">
          <Form.Control
            placeholder="Port"
            onChange={updateDBPort}
            value={dbPort}
          />
          <Button variant="primary" id="button-addon2" className="mr-2" onClick={tryConnect}>
            Connect
          </Button>
          <OverlayTrigger
            placement="right"
            overlay={
              <Tooltip id="tooltip">
                Specify the host and port for the Node DB server, then click "Connect". The server must be running and accessible.
              </Tooltip>
            }
          >
            <div style={{alignItems: "center", display: "flex", marginLeft: "5px"}}>
            <BsQuestionCircle />
            </div>
          </OverlayTrigger>
          </InputGroup>
      </Col>
  </>  

  // Do a check to make sure the server has been specified and is 
  // responding.
  useEffect(() => {
    var ignore = false;
    
    async function checkServer() {
      var url = nodeDB["nodeDbUrls"].dbHost;
      extractHostAndPort(url);
      setLoading(true);
      // Arbitrarily choose the URL for nodes
      
      fetch(url+"/nodes")
      .then(res => {
        if (!res.ok) { // error coming back from server 
          throw Error("Unable to connect to DB server at: "+url);
        } else {
          setDbURL(url);
          setLoading(false);
          setError(null);
        }
      })
      .catch(err => {
        if (ignore) return;
        if (err.name === "TypeError") {
          setError("Unable to reach Node DB server at: "+url);
        } else {
          // auto catches network / connection error
          setError(err.message);
        }
      });
    };

    checkServer();

    // Set ignore flag on cleanup
    return () => {
      ignore = true;
    };

    }, [connectDB])


  function tryConnect() {
    var state = connectDB;
    var url = "http://"+dbHost.trim()+":"+dbPort.trim()+"/api";
    nodeDB["nodeDbUrls"].dbHost = url;
    setLoading(true);
    setConnectDB(!state);
  };

  function updateDBHost(evt) {
    setDbHost(evt.target.value);
  };

  function updateDBPort(evt) {
    setDbPort(evt.target.value);
  };

  function extractHostAndPort(url) {
    var urlObj = new URL(url);
    setDbHost(urlObj.hostname);
    setDbPort(urlObj.port);
  }

  return(
      <>
      {!theError && 
      <Container fluid>
        <hr />
          {loading && <Row>{serverInputForm}</Row>}
          {loading &&
            <Row>
              <Spinner animation="border" role="status" variant="primary"/>
              <div className="pl-2 center"><b>LOADING...</b></div>
            </Row>}
          {!loading && 
            <Row>{serverInputForm}      
              <Col className="d-flex justify-content-left">
                <Alert variant="success" show='true'>Connected to {dbURL}</Alert>
              </Col>
            </Row>}
          {!loading &&
          <Container fluid>
            <Row >
              <Col lg="12" className="d-flex justify-content-center"><h1>Nodes</h1>
                <OverlayTrigger
                  placement="right"
                  overlay={
                    <Tooltip id="tooltip">
                      Select Nodes to import, then provide a Net Model name at bottom and click "Import". A partial Net Model will be created that still needs node connection information.  
                    </Tooltip>
                  }
                >
                  <div style={{alignItems: "center", display: "flex", marginLeft: "5px"}}>
                  <BsQuestionCircle />
                  </div>
                </OverlayTrigger>
                </Col>
            </Row>
            <Row>
              <Col lg="12"><DbNodes dispatch={props.dispatch}/></Col>
            </Row>
          </Container>}
      </Container>}
      {theError && <><hr /><Row>{serverInputForm}</Row></>}
      {theError && <Alert variant="danger" show='true'><b>ERROR: {theError}</b></Alert>}
      </>
  );


}

export default NodeDb;
