//        DbNodes.jsx  Functional component that retrieves node
//        and host data from the node database located at the
//        URL specified in ./json/nodeDB.json.
//
//        Copyright (c) 2025, California Institute of Technology.
//        ALL RIGHTS RESERVED.  U.S. Government Sponsorship
//        acknowledged.
//                                                                   
//      Author: Dave Hanks, Jet Propulsion Laboratory         
//                                                               

import {useEffect, useState} from "react";
import {Form,Container,Row,Col} from 'react-bootstrap';
import {Button,InputGroup} from 'react-bootstrap';
import {Table} from 'react-bootstrap';
import {Modal} from 'react-bootstrap';

import nodeDB  from './json/nodeDB.json';

// DbNodes *must* be a functional component as opposed to a
// React component (ie. inherits from React.Component).
// This is because DbNodes uses hooks.
// 
// For a complete explanation of all the Rules of Hooks
// go to:
//
//      https://react.dev/reference/rules/rules-of-hooks
//

const DbNodes = (props) => {
  // State variables
  const [nodeTable, setNodeTable]           = useState(null);  // HTML formatted table of hosts
  const [hostList, setHostList]             = useState([]);    // Raw host data returned from DB
  const [hostsLoaded, setHostsLoaded]       = useState(false); // Flag indicating raw host data (without destinations) loaded
  const [IPsLoaded, setIPsLoaded]           = useState(false); // Flag indicating IPs for hosts loaded
  const [nodeList, setNodeList]             = useState([]);    // Raw node data returned from DB
  const [nodesLoaded, setNodesLoaded]       = useState(false); // Flag indicating raw node data loaded
  const [netModelName, setNetModelName]     = useState("");    // Name to affix to the Net Model upon import
  const [showSuccess, setShowSuccess]       = useState(false); // Toggle to hide/show successful import modal
  const [netNameNeeded, setNetNameNeeded]   = useState(false); // Toggle to hide/show successful import modal

  // Extract the parent URLs from the JSON configs
  var dbHost = nodeDB["nodeDbUrls"].dbHost;
  var hostUrl = dbHost+nodeDB["nodeDbUrls"].hostUrl;
  var nodeUrl = dbHost+nodeDB["nodeDbUrls"].nodeUrl;
  var importAlert = 
      <Modal show={showSuccess} 
             onHide={toggleShowSuccess}
             backdrop="static"
             keyboard={false}>
        <Modal.Header closeButton>
          <Modal.Title>Success</Modal.Title>
        </Modal.Header>
        <Modal.Body>Node Import Successful!    </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" bssize="sm" onClick={toggleShowSuccess}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
  
  var netModelNameAlert =
      <Modal show={netNameNeeded} 
             onHide={toggleShowSuccess}
             backdrop="static"
             keyboard={false}>
        <Modal.Header closeButton>
          <Modal.Title>Net Model Name Missing</Modal.Title>
        </Modal.Header>
        <Modal.Body>Net Model Name Required Before Import</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" bssize="sm" onClick={toggleNeedNetName}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

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
      // TBD deal with errors cleanly
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

  // Fetch nodes from the DB
  const fetchNodes = (nodeUrl) => {
    fetch(nodeUrl)
    .then(res => {
      if (!res.ok) { // error coming back from server
        throw Error('could not fetch the data for that resource');
      }
      console.log(res);
      return res.json();
    })
    .then(data => {
      setNodeList(preProcessNodes(data));
      setNodesLoaded(true);
    })
    .catch(err => {
      // TBD deal with errors cleanly
      if (err.name === 'AbortError') {
        console.log('fetch aborted')
      } else {
        if (err.name === "TypeError") {
          console.log("Type Error encountered")
        } else {
          // auto catches network / connection error
          console.log(err.name);
        }
      }
    });
  };

  // Fetch host destinations (usally IP addrs)
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
      setIPsLoaded(true);

    })
    .catch(err => {
      // TBD deal with errors cleanly
      console.error(err);
    });


  }

  // useEffect gets called after each time the object is rendered
  // and if a dependency changes state.
  //
  // dependencies:
  //    hostsLoaded  -- toggle that hosts without destinations loaded 
  //    nodesLoaded  -- toggle that nodes loaded
  //    IPsLoaded    -- toggle that the IP addrs for hosts are loaded
  useEffect(() => {
    // Flags are used to control when certain fetches are completed.
    // Only when one fetch completes is the following one attempted.

    // Load the hosts from the db first
    if (!hostsLoaded) {
      console.log("going to load the hosts");
      fetchHosts(hostUrl);
    }

    // If host loading is complete, get the IPs from the destinations
    // URL
    if (hostsLoaded && !IPsLoaded) {
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

    // If the IPs are loaded, load the nodes from the db
    if (IPsLoaded && !nodesLoaded) {
      console.log("going to load nodes");
      fetchNodes(nodeUrl);
    }

    // If all loading is complete, merge host data into nodes
    // and format the table for rendering
    if (hostsLoaded && IPsLoaded && nodesLoaded) {
      mergeData();
      formatNodeTable();
    }

  }, [hostsLoaded, nodesLoaded, IPsLoaded])

  // After the destination (IP) data is loaded must associate
  // IPs with the correct host.
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
  };

  // preProcessHosts
  //
  // Initialize the host data with an empty array for destinations (usu. IPs)
  function preProcessHosts(data) {
      var hosts = data;
      // dests -- array of destinations that is likely IPs associated with host
      for (let i=0 ; i<hosts.items.length; i++) {
          hosts.items[i].dests = [];
      }
      
      return hosts;
  }

  // preProcessNodes
  //
  // Initialize the node data with the flag indicating whether the user
  // has selected the node for import and an empty array of IPs 
  function preProcessNodes(data) {
      var nodes = data;
      // ips      -- array of IPs associated with a node's host
      // selected -- true = import host; false = do not import host
      for (let i=0 ; i<nodes.items.length; i++) {
          nodes.items[i].ips = [];
          nodes.items[i].selected = false;
      }
      
      return nodes;
  }

  // mergeData
  //
  // Grab the data from the hosts array and put the pertinent data from
  // it into the nodes array. We are only going to deal with one array
  // of objects for display and manipulation
  function mergeData()  {
    var nodes = nodeList.items;
    var hosts = hostList.items;

    for (var idx in nodes) {
      var hostname = nodes[idx].host.hostname;
      const hostIdx = hosts.findIndex(h => h.hostname === hostname)
      if ( hostIdx > -1) {
        var host = hosts[hostIdx];
        nodes[idx].ips = host.dests;       
      }
    }
    
  };

  // formatNodeTable
  //
  // This function is run to create the HTML representation of the
  // node table once all the data has been loaded from the DB.
  function formatNodeTable() {
    var nodeTable = "";

    nodeTable = 
      <Table striped border hover>
        <thead>
          <tr>
            <th className="d-flex justify-content-center">Select</th>
            <th>Node ID</th>
            <th>Node Name</th>
            <th>Node Number</th>
            <th>Host Name</th>
            <th>Host ID</th>
            <th>IP Addresses</th>
            <th>Config Flags</th>
          </tr>
        </thead>
        <tbody>
          {nodeList.items.map((item, index) => (
            <tr key={item.node_id}>
              <td className="d-flex justify-content-center">
                <Form.Check
                  type="checkbox"
                  id={'checkbox-${item.host_id}'}
                  checked={item.checked}
                  onChange={() => handleCheckboxChange(item.node_id)}
                  />
              </td>
              <td>{item.node_id}</td>
              <td>{item.node_name}</td>
              <td>{item.node_number}</td>
              <td>{item.host.hostname}</td>
              <td>{item.host.host_id}</td>
              <td>{item.ips.join(", ")}</td>
              <td>{item.sdr_config_flags.join(", ")}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    
    // Update state with the table, this triggers a render
    setNodeTable(nodeTable);
  };

  // hadleCheckboxChange
  //
  // The user has selected/deselected a node for import set the change
  // and update the node list with the change.
  function handleCheckboxChange(node_id) {
    console.log("checkbox "+node_id+" checked!");
    var nodeIdx = nodeList.items.findIndex((node) => node.node_id === node_id);
    if (nodeIdx > -1) {
      var isSelected = nodeList.items[nodeIdx].selected;
      nodeList.items[nodeIdx].selected = !isSelected;
    }
    setNodeList(nodeList);
  };

  // inportData
  //
  // The user has clicked the import button, collect the selected
  // nodes and use the dispatch function to send it to the top 
  // level App object. Note: dispatch is passed into the DbNodes object
  // as a property.
  function importData() {
    console.log("Import Hosts!!");
    if (netModelName === "") {
      setNetNameNeeded(true);
      return;
    } else {
      setNetNameNeeded(false);
    }

    var dbDataToSend = [];
    nodeList.items.forEach(node => {
      if (node.selected) {
        dbDataToSend.push(node);
      }
    });

    const tran = {
      action: "NEW-NODEDB-DATA",
      dbData: dbDataToSend,
      netModelName: netModelName
    }
    props.dispatch(tran);
    toggleShowSuccess();
  }
  
  function toggleShowSuccess() {
    var newState = !showSuccess;
    setShowSuccess(newState);
  }

  function toggleNeedNetName() {
    var newState = !netNameNeeded;
    setNetNameNeeded(newState);
  }

  // Event listener for when the net model name field changes
  function updateNetModelName(e) {
    setNetModelName(e.target.value);
  }

  // Render the DbNodes object
  return(
    <>
      {nodeTable && 
      <Container fluid>
        <Row>
          <Col>
            {nodeTable}
          </Col>
        </Row>
        <Row className="justify-content-md-left">
          <Col lg="3">
            <InputGroup className="mb-2">
              <Form.Control
                placeholder="Net Model Name (no spaces)"
                aria-label="Net Model Name"
                aria-describedby="basic-addon2"
                onChange={updateNetModelName}
              />
              <Button variant="primary" id="button-addon2" onClick={importData}>Import</Button>
            </InputGroup>
          </Col>
        </Row>
        <Row><Col><i>Net Model will be created if it doesn't exist.</i></Col></Row>
      </Container>}
      {importAlert}
      {netModelNameAlert}
    </>
  );

}

export default DbNodes;