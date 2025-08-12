//        DbHosts.jsx     Main App JSX for IonConfig Tool
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


const DbHosts = () => {
    const [theUrl, setUrl] = useState(null);
    const [theContent, setContent] = useState("None");
    const [theHostList, setHostList] = useState(null);

    var dbHost = nodeDB["nodeDbUrls"].dbHost;
    var hostUrl = dbHost+nodeDB["nodeDbUrls"].hostUrl;
    console.log(hostUrl);

    //const {error, data: content} = DbContent("localhost:5000");

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
        formatHostTable(data);
        setContent(JSON.stringify(data));
      })
      .catch(err => {
        if (err.name === 'AbortError') {
          console.log('fetch aborted')
        } else {
          if (err.name === "TypeError") {
          } else {
            // auto catches network / connection error
          }
        }
      });
    };

    // Make sure to get data on the first render
    useEffect(() => {
      fetchData(hostUrl);
    }, [])
    
    function formatHostTable(hostList) {
      var hostTable = "";

      hostTable = 
        <Table striped border hover>
          <thead>
            <tr>
              <th className="d-flex justify-content-center">Select</th>
              <th>Host ID</th>
              <th>Host Name</th>
            </tr>
          </thead>
          <tbody>
            {hostList.items.map((item, index) => (
              <tr key={item.host_id}>
                <td className="d-flex justify-content-center">
                  <Form.Check
                    type="checkbox"
                    id={'checkbox-${item.host_id}'}
                    checked={item.checked}
                    onChange={() => handleCheckboxChange(item.host_id)}
                    />
                </td>
                <td>{item.host_id}</td>
                <td>{item.hostname}</td>
              </tr>
            ))}
          </tbody>
        </Table>

      setHostList(hostTable);

      //hostList.items.forEach(item => {
      //  console.log('host_id: '+item.host_id);
      //})
    };

    function handleCheckboxChange(host_id) {
      console.log("checkbox "+host_id+" checked!");
    };

    function importHosts() {
        console.log("Import Hosts!!");
    }

    return(
      <>
        <Container fluid>
           {theHostList}
            <ButtonGroup>
              <Button variant="primary" onClick={importHosts}>Import</Button>
            </ButtonGroup>

        </Container>
      </>
   );

}

export default DbHosts;