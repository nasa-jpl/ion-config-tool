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
import {Button,ButtonGroup} from 'react-bootstrap';
import {Table} from 'react-bootstrap';
import {Alert} from 'react-bootstrap';

import nodeDB  from './json/nodeDB.json';

// DbHosts *must* be a functional component as opposed to a
// React component (ie. inherits from React.Component).
// This is because DbHosts uses hooks.
// 
// For a complete explanation of all the Rules of Hooks
// go to:
//
//      https://react.dev/reference/rules/rules-of-hooks
//


const DbHosts = () => {
  // State variables
  const [theHostTable, setHostTable]    = useState(null);  // HTML formatted table of hosts
  const [hostList, setHostList]         = useState([]);    // Raw host data returned from DB
  const [hostsLoaded, setHostsLoaded]   = useState(false); // Flag indicating raw host data (without destinations) loaded
  const [loadComplete, setLoadComplete] = useState(false); // Flag indicating all raw data loaded, including destinations

  // Extract the parent URLs from the JSON configs
  var dbHost = nodeDB["nodeDbUrls"].dbHost;
  var hostUrl = dbHost+nodeDB["nodeDbUrls"].hostUrl;

  // Fetch hosts from the DB
  const fetchHosts = (hostUrl) => {
    fetch(hostUrl)
    .then(res => {
      if (!res.ok) { 
        throw Error('could not fetch the data for hosts');
      }
      return res.json();
    })
    .then(data => {
      // Successful fetch, set the toggle and pre process the data
      setHostsLoaded(true);
      setHostList(preProcessHosts(data));
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

  // Fetch host destinations
  const fetchDestsWithIds = (destUrls) => {
    // Need to track host ID with each fetch so we
    // know for which host the destinations are
    // associated. 
    const destWithIds = destUrls.map(dest => (
      {
        dest: dest.host_id,
        promise: fetch(dest.destUrl).then(res => res.json())
      }
    ));

    // Now get the results of the fetches 
    Promise.all(destWithIds.map(item => item.promise))
    .then(results => {
      const dataWithIds = results.map((data, index) => ({
        host_id: destWithIds[index].dest,
        data: data
      }));
      
      setDestinationsInHosts(dataWithIds);
    })
    .catch(err => {
      console.error(err);
    });

  }

  // useEffect gets called after each time the object is rendered
  // and if a dependency changes state.
  //
  // dependencies:
  //    hostsLoaded -- toggle indicating whether hosts have been loaded from the db 
  useEffect(() => {
    // Load the hosts from the db first
    if (!hostsLoaded) {
      console.log("going to load the hosts");
      fetchHosts(hostUrl);
    }
    
    // If the hosts are loaded, get the destinations (IP addreses)
    if (hostsLoaded && !loadComplete) {
      var destUrls = [];
      // Build up a set of URLs to do a batch fetch of all the IP
      // addresses at once. Keep track of the host ID for each
      // fetch to maintain the association of which host has
      // which destinations in the DB.
      for (let i=0 ; i<hostList.items.length; i++) {
        let host_id = hostList.items[i].host_id;
        let destUrl = hostUrl+"/"+host_id+"/destinations";
        let urlWithHostId = {"host_id" : host_id, "destUrl" : destUrl };
        destUrls.push(urlWithHostId);
      }

      // Do the fetch
      fetchDestsWithIds(destUrls);

    }

    if (loadComplete) {
        formatHostTable();
    }

  }, [hostsLoaded, loadComplete])

  function setDestinationsInHosts(destData) {
    destData.forEach(dataobj => {
      let host_id = dataobj.host_id;
      let dests = dataobj.data.items;
      dests.forEach(element => {
        const index = hostList.items.findIndex(item => item.host_id === host_id);
        if (index !== -1) {
          hostList.items[index].dests.push(element.destination_value);
        }
      })
    })

    setHostList(hostList);
    setLoadComplete(true);
  };

  // preProcessHosts
  //
  // Set up the host list to contain some data specific to the client

  function preProcessHosts(data) {
      var hosts = data;
      // selected -- true = import host; false = do not import host
      // dests -- array of destinations that is likely IPs associated with host
      for (let i=0 ; i<hosts.items.length; i++) {
          hosts.items[i].selected = false;
          hosts.items[i].dests = [];
      }
      
      return hosts;
  }

  function formatHostTable() {
    var hostTable = "";

    hostTable = 
      <Table striped border hover>
        <thead>
          <tr>
            <th className="d-flex justify-content-center">Select</th>
            <th>Host ID</th>
            <th>Host Name</th>
            <th>IP Addresses</th>
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
              <td>{item.dests.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </Table>

    setHostTable(hostTable);
  };

  function handleCheckboxChange(host_id) {
    console.log("checkbox "+host_id+" checked!");
  };

  function importHosts() {
      console.log("Import Hosts!!");
  }

  return(
    <>
      {theHostTable && 
      <Container fluid>
          {theHostTable}
          <ButtonGroup>
            <Button variant="primary" onClick={importHosts}>Import</Button>
          </ButtonGroup>

      </Container>}
    </>
  );

}

export default DbHosts;