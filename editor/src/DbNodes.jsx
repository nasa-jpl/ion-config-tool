//        DbNodes.jsx     Main App JSX for IonConfig Tool
//
//        Copyright (c) 2025, California Institute of Technology.
//        ALL RIGHTS RESERVED.  U.S. Government Sponsorship
//        acknowledged.
//                                                                   
//      Author: Dave Hanks, Jet Propulsion Laboratory         
//                                                               

import { useEffect, useState } from "react";
import {Form,Container} from 'react-bootstrap';
import {Row, Col} from 'react-bootstrap';
import {Button,ButtonGroup} from 'react-bootstrap';
import {Table} from 'react-bootstrap';
import {Alert} from 'react-bootstrap';

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


const DbNodes = () => {
    const [theError, setError] = useState(null);
    const [theNodeTable, setNodeTable] = useState(null);

    var dbHost = nodeDB["nodeDbUrls"].dbHost;
    var nodeUrl = dbHost+nodeDB["nodeDbUrls"].nodeUrl;
    var nodeList = [];

    const fetchData = (theUrl) => {
      if (!theUrl) return;
      fetch(theUrl)
      .then(res => {
        if (!res.ok) { // error coming back from server
          throw Error('could not fetch the data for that resource');
        }
        console.log(res);
        return res.json();
      })
      .then(data => {
        nodeList = data;
        formatNodeTable(data);
        preProcessNodes();
        setError(null);
      })
      .catch(err => {
        if (err.name === 'AbortError') {
          console.log('fetch aborted')
        } else {
          if (err.name === "TypeError") {
            setError("Unable to reach Node DB server at: "+dbHost);
          } else {
            // auto catches network / connection error
            setError(err.message);
          }
        }
      });
    };

    function preProcessNodes() {
        for (let i=0 ; i<nodeList.items.length; i++) {
            nodeList.items[i].selected = false;
        }
    };

    // Make sure to get data on the first render
    useEffect(() => {
      fetchData(nodeUrl);
    }, [])
    
    function formatNodeTable(nodeList) {
      var nodeTable = "";

      for (let i = 0; i < nodeList.items.length; i++) {
         var nodeObj = nodeList.items[i];
         console.log(JSON.stringify(nodeObj));
      } 

      nodeTable = 
        <Table striped border hover>
          <thead>
            <tr>
              <th className="d-flex justify-content-center">Select</th>
              <th>Node ID</th>
              <th>Node Number</th>
              <th>Host Name</th>
            </tr>
          </thead>
          <tbody>
            {nodeList.items.map((item, index) => (
              <tr key={item.node_id}>
                <td className="d-flex justify-content-center">
                  <Form.Check
                    type="checkbox"
                    id={'checkbox-${item.host_id}'}
                    onChange={(e) => handleCheckboxChange(item.node_id, e.target.checked)}
                    />
                </td>
                <td>{item.node_id}</td>
                <td>{item.node_number}</td>
                <td>{item.host.hostname}</td>
              </tr>
            ))}
          </tbody>
        </Table>

      setNodeTable(nodeTable);

    };


    function handleCheckboxChange(node_id, state) {
        var nodeIndex = nodeList.items.findIndex(n => n.node_id === node_id);
        nodeList.items[nodeIndex].selected = state;

        console.log("checkbox "+node_id+" checked!");
    };

    function importNodes() {
        console.log("Import Nodes!!");
    }

    return(
      <>  
        <Container fluid>
           {theNodeTable}
            <ButtonGroup>
              <Button variant="primary" onClick={importNodes}>Import</Button>
            </ButtonGroup>
        </Container>
      </>
   );

}

export default DbNodes;