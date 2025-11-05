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
import {Alert} from 'react-bootstrap';

import DbNodes from './DbNodes.jsx';
//import DbNodes from './DbNodes_xx.jsx';
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
  const [loading, setLoading] = useState(true);

  // Do a check to make sure the server has been specified and is 
  // responding.
  useEffect(() => {
    var url = nodeDB["nodeDbUrls"].dbHost;
    setLoading(true);
    // Arbitrarily choose the URL for nodes
    fetch(url+"/nodes")
    .then(res => {
      if (!res.ok) { // error coming back from server 
        throw Error("Unable to connect to DB server at: "+url);
      } else {
        setDbHost(url);
        setLoading(false);
      }
    })
    .catch(err => {
      if (err.name === "TypeError") {
        setError("Unable to reach Node DB server at: "+url);
      } else {
        // auto catches network / connection error
        setError(err.message);
      }
    });
  }, [])

  return(
      <>
      {!theError && 
      <Container fluid>
        <hr />
        <Row>
          {!loading && <Col className="d-flex justify-content-left">
             <Alert variant="success" show='true'>Connected to {dbHost}</Alert>
          </Col>}
          {loading && <b>LOADING...</b>}
        </Row>
        <Row >
          <Col className="d-flex justify-content-center"><h1>Nodes</h1></Col>
        </Row>
        <Row>
          <Col><DbNodes dispatch={props.dispatch}/></Col>
        </Row>
      </Container>}
      <hr />
      {theError && <Alert variant="danger" show='true'><b>ERROR: {theError}</b></Alert>}
      </>
  );


}

export default NodeDb;
