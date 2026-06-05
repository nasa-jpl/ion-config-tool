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
import {Form,Container,Row,Col, Navbar, FormLabel} from 'react-bootstrap';
import {Button,InputGroup} from 'react-bootstrap';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';
import {BsQuestionCircle} from 'react-icons/bs';
import {Table} from 'react-bootstrap';
import {Modal} from 'react-bootstrap';

import nodeDB  from './json/nodeDB.json';
import NodeTable from './NodeTable';

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
  const [nodeTable, setNodeTable]             = useState(null);  // HTML formatted table of hosts
  const [hostList, setHostList]               = useState([]);    // Raw host data returned from DB
  const [hostData, setHostData]               = useState([]);
  const [hostsLoaded, setHostsLoaded]         = useState(false); // Flag indicating raw host data (without destinations) loaded
  const [IPsLoaded, setIPsLoaded]             = useState(false); // Flag indicating IPs for hosts loaded
  const [nodeList, setNodeList]               = useState([]);    // Raw node data returned from DB
  const [nodeData, setNodeData]               = useState([]);    // Raw node data returned from DB
  const [nodesLoaded, setNodesLoaded]         = useState(false); // Flag indicating raw node data loaded
  const [protocolsLoaded, setProtocolsLoaded] = useState(false); // Flag indicating available protocols for nodes loaded
  const [inductsLoaded, setInductsLoaded]     = useState(false); // Flag indicating inducts for nodes loaded
  const [netModelName, setNetModelName]       = useState("");    // Name to affix to the Net Model upon import
  const [showSuccess, setShowSuccess]         = useState(false); // Toggle to hide/show successful import modal
  const [netNameNeeded, setNetNameNeeded]     = useState(false); // Toggle to hide/show successful import modal
  const [nextHostToken, setNextHostToken]     = useState(null);  // Token to handle pagination in DB
  const [nextNodeToken, setNextNodeToken]     = useState(null);  // Token to handle pagination in DB

  // Extract the parent URLs from the JSON configs
  var dbHost = nodeDB["nodeDbUrls"].dbHost;
  var hostUrl = dbHost+nodeDB["nodeDbUrls"].hostUrl;
  var nodeUrl = dbHost+nodeDB["nodeDbUrls"].nodeUrl;

  // Query limit is 100 items per fetch
  var qLimit = 100;

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
          <Button variant="secondary" bssize="sm" onClick={() => toggleShowSuccess("false")}>
            Close
          </Button>
          <Button variant="primary" bssize="sm" onClick={() => toggleShowSuccess("true")}>
            Show Net Model
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
          <Button variant="secondary" bssize="sm" onClick={toggleNetNameNeeded}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

  // Grab the hosts from the DB in an effect.
  useEffect(() => {
    // ignore flag set on cleanup
    let ignore = false;

    async function fetchHosts() {

      var params = {};
      // set params accordingly
      if (nextHostToken) {
        params = new URLSearchParams({
          max_page_size: qLimit,
          page_token: nextHostToken
        });
      } else {
        params = new URLSearchParams({
          max_page_size: qLimit
        })
      }

      // Build the URL with the query parameters
      var url = `${hostUrl}/?${params}`;
      fetch(url)
      .then(res => {
        if (!res.ok) { 
          throw Error('could not fetch the data for hosts');
        }
        return res.json();
      })
      .then(data => {
        if (ignore) return;
        if (!data.next_page_token) {
          // No next page token, pre-process the data and set the toggle
          // that we are done.
          hostData.push(...data.items);
          preProcessHosts(hostData.slice());
          setHostsLoaded(true);
        } else {
          // There's more data to get. Append and set the next
          // token which will trigger another fetch.
          hostData.push(...data.items);
          setHostData(hostData);
          setNextHostToken(data.next_page_token);
        }
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

    // Do the fetch for hosts
    fetchHosts();

    // Set ignore flag on cleanup
    return () => {
      ignore = true;
    };

  }, [nextHostToken])

  // Grab nodes from the DB in an effect
  useEffect(() => {
    // Initialize cleanup flag
    let ignore = false;

    async function fetchNodes() {
      var params = {};

      // Set query params
      if (nextNodeToken) {
        params = new URLSearchParams({
          max_page_size: qLimit,
          page_token: nextNodeToken
        });
      } else {
        params = new URLSearchParams({
          max_page_size: qLimit
        })
      }

      // Build URL and fetch
      var url = `${nodeUrl}/?${params}`;
      fetch(url)
      .then(res => {
        if (!res.ok) { // error coming back from server
          throw Error('could not fetch the data for that resource');
        }
        return res.json();
      })
      .then(data => {
        // If ignore is set, no-op
        if (ignore) return;
        if (!data.next_page_token) {
          nodeData.push(...data.items);
          preProcessNodes(nodeData.slice());
          setNodesLoaded(true);
        } else {
          nodeData.push(...data.items);
          setNodeData(nodeData);
          setNextNodeToken(data.next_page_token);
        }
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
    
    // Do the fetch
    fetchNodes();

    // Set ignore flag on cleanup
    return () => {
      ignore = true;
    };
  }, [nextNodeToken])

  // Fetch host destinations (usally IP addrs)
  const fetchDestsWithIds = (destUrls) => {
    // Need to track host ID with each fetch so we
    // know for which host the destinations are
    // associated. 
    const destWithIds = destUrls.map(dest => (
      {
        host_id: dest.host_id,
        promise: fetch(dest.destUrl).then(res => res.json())
      }
    ));

    // Do the batch request 
    Promise.all(destWithIds.map(item => item.promise))
    .then(results => {
      const dataWithIds = results.map((data, index) => ({
        host_id: destWithIds[index].host_id,
        data: data
      }));
      
      setHostList(setDestinationsInHosts(dataWithIds));
    })
    .catch(err => {
      // TBD deal with errors cleanly
      console.error(err);
    });
  }

  // Fetch protocols for each node by ID
  const fetchProtocolsByNode = (protUrls) => {

    // Track node ID for each returned promise
    // so the protocols are associated with the
    // right node.
    const protWithIds = protUrls.map(prot => (
      {
        node_id: prot.node_id,
        promise: fetch(prot.protUrl).then(res => res.json())
      }
    ));

    // Do the batch request
    Promise.all(protWithIds.map(item => item.promise))
    .then( results => {
      const dataWithIds = results.map((data, index) => ({
        node_id: protWithIds[index].node_id,
        data: data
      }));

      setNodeList(setProtocolsInNodes(dataWithIds));
    })
    .catch(err => {
      // TBD better error handling
      console.error(err);
    });
  }

  // Fetch inducts for each node by ID
  const fetchInductsByNode = (inductUrls) => {

    // Track node ID for each returned promise
    // so the inducts are associated with the
    // right node.
    const inductWithIds = inductUrls.map(induct => (
      {
        node_id: induct.node_id,
        promise: fetch(induct.inductUrl).then(res => res.json())
      }
    ));

    // Do the batch request
    Promise.all(inductWithIds.map(item => item.promise))
    .then( results => {
      const dataWithIds = results.map((data, index) => ({
        node_id: inductWithIds[index].node_id,
        data: data
      }));

      setNodeList(setInductsInNodes(dataWithIds));
      setInductsLoaded(true);
    })
    .catch(err => {
      // TBD better error handling
      console.error(err);
    });
  }

  // Load data that needs node-based and host-based URLs
  //
  // dependencies:
  //    hostsLoaded     -- toggle that hosts without destinations loaded 
  //    nodesLoaded     -- toggle that nodes loaded
  //    IPsLoaded       -- toggle that the IP addrs for hosts are loaded
  //    protocolsLoaded -- toggle that protocols for nodes are loaded
  //    inductsLoaded   -- toggle that inducts for nodes are loaded
  useEffect(() => {
    // Flags are used to control when certain fetches are completed.
    // Only when one fetch completes is the following one attempted.

    // Nothing to do until hosts and nodes are loaded
    if (!hostsLoaded || !nodesLoaded) return;

    // Load IP addresses if they have not yet been
    if (!IPsLoaded) {
      var destUrls = [];
      // Build up a set of URLs to do a batch fetch of all the IP
      // addresses at once. Keep track of the host ID for each
      // fetch to maintain the association of which host has
      // which destinations in the DB.
      for (let i=0 ; i<hostList.length; i++) {
        let host_id = hostList[i].host_id;
        let destUrl = hostUrl+"/"+host_id+"/destinations";
        let urlWithHostId = {"host_id" : host_id, "destUrl" : destUrl };
        destUrls.push(urlWithHostId);
      }

      // Do the fetch
      fetchDestsWithIds(destUrls);
      setIPsLoaded(true);
    }

    // Load protocols if they have not yet been
    if (!protocolsLoaded) {
      var protUrls = [];
      // Build a set of URLs to do a batch fetch for all
      // the protocols for every node in one call. Keep 
      // track of the node ID to associate the returned
      // protocols with the correct node.
      for (let i=0; i<nodeList.length; i++) {
        let node_id = nodeList[i].node_id;
        let protUrl = nodeUrl+"/"+node_id+"/cl-protocols";
        let urlWithNodeId = {"node_id" : node_id, "protUrl" : protUrl};
        protUrls.push(urlWithNodeId);
      }

      // Do the fetch
      fetchProtocolsByNode(protUrls);
      setProtocolsLoaded(true);
    }

    // Load inducts if they have not yet been
    if (!inductsLoaded) {
      var inductUrls =[];
      // Build a set of URLs to do a batch fetch for all
      // the inducts for every node in one call. Keep 
      // track of the node ID to associate the returned
      // inducts with the correct node.

      for (let i=0; i<nodeList.length; i++) {
        let node_id = nodeList[i].node_id;
        let inductUrl = nodeUrl+"/"+node_id+"/inducts";
        let urlWithNodeId = {"node_id" : node_id, "inductUrl" : inductUrl};
        inductUrls.push(urlWithNodeId);
      }

      // Do the fetch
      fetchInductsByNode(inductUrls);
    }

    // If inducts are loaded, time to merge all the data into
    // one data structure and generate the node table
    if (inductsLoaded) {
      mergeData();
      setNodeTable(formatNodeTable(nodeList));
    }

  }, [hostsLoaded, nodesLoaded, IPsLoaded, protocolsLoaded, inductsLoaded])

  // After the destination (IP) data is loaded must associate
  // IPs with the correct host.
  function setDestinationsInHosts(destData) {
    destData.forEach(dataobj => {
      let host_id = dataobj.host_id;
      let dests = dataobj.data.items;
      dests.forEach(element => {
        const index = hostList.findIndex(item => item.host_id === host_id);
        if (index !== -1) {
          hostList[index].dests.push(element.destination_value);
        }
      })
    })

    return hostList;
  };

  // After protocols (ie. tcp, ltp, etc...) are loaded from the database, 
  // they are associated with the appropriate node in memory
  function setProtocolsInNodes(protData) {
    protData.forEach(dataobj => {
      let node_id = dataobj.node_id;
      let prots = dataobj.data.items;

      prots.forEach(element => {
        const index = nodeList.findIndex(item => item.node_id === node_id);
        if (index !== -1) {
          nodeList[index].prots.push(element.cl_protocol_name);
        }
      })
    })

    return nodeList;
  };

  // After inducts are loaded from the database, they have relevant
  // data associated with the appropriate node in memory
  function setInductsInNodes(inductData) {
    inductData.forEach(dataobj => {
      let node_id = dataobj.node_id;
      let inducts = dataobj.data.items;

      inducts.forEach(element => {
        const index = nodeList.findIndex(item => item.node_id === node_id);
        if (index !== -1) {
          let inductObj = {"cl_protocol" : element.cl_protocol.cl_protocol_name,
                           "port_number" : element.duct_name.port_number};
          nodeList[index].inducts.push(inductObj);
        }
      })
    })

    return(nodeList);
  };

  // preProcessHosts
  //
  // Initialize the host data with an empty array for destinations (usu. IPs)
  function preProcessHosts(hosts) {
      // dests -- array of destinations that is likely IPs associated with host
      for (let i=0 ; i<hosts.length; i++) {
          hosts[i].dests = [];
      }
      
      setHostList(hosts);
  }

  // preProcessNodes
  //
  // Initialize nodes to prepare for data that will get filled
  // in later either through user or from elsewhere in the node
  // database. 
  function preProcessNodes(nodes) {
      // ips      -- array of IPs associated with a node's host
      // selected -- true = import host; false = do not import host
      // prots    -- array of protocols associated with a node
      // inducts  -- array of relevant induct information for a node
      for (let i=0 ; i<nodes.length; i++) {
          nodes[i].ips = [];
          nodes[i].selected = false;
          nodes[i].prots = [];
          nodes[i].inducts = [];
      }
      
      setNodeList(nodes);
  }

  // mergeData
  //
  // Grab the data from the hosts array and put the pertinent data from
  // it into the nodes array. We are only going to deal with one array
  // of objects for display and manipulation
  function mergeData()  {
    var nodes = nodeList;
    var hosts = hostList;

    for (var idx in nodes) {
      var hostname = nodes[idx].host.hostname;
      var host_id  = nodes[idx].host.host_id;
      const hostIdx = hosts.findIndex(h => h.hostname === hostname)
      if ( hostIdx > -1) {
        var host = hosts[hostIdx];
        nodes[idx].ips = host.dests.map(str => str.trim());
        nodes[idx].hostname = hostname;
        nodes[idx].host_id = host_id;
      }
    }
    
  };

  // formatNodeTable
  //
  // This function is run once all the data has been loaded from the DB.
  //
  // label    - The string that appears in the table header 
  // accessor - used by the sorting algorithm defined in the NodeTable
  // sortable - only columns with true can be sorted.
  function formatNodeTable(data) {

    const columns = [
      { label: "Select", accesor: "select", sortable: false},
      { label: "Node ID", accessor: "node_id", sortable: true},
      { label: "Node Name", accessor: "node_name", sortable: true},
      { label: "Protocols", accessor: "protocols", sortable: false},
      { label: "Node Number", accessor: "node_number", sortable: true},
      { label: "Host Name", accessor: "hostname", sortable: true},
      { label: "Host ID", accessor: "host_id", sortable: true},
      { label: "IP Adddresses", acccessor: "ip_addr", sortable: false},
      { label: "Config Flags", accessor: "config_flags", sortable: false}
    ];

    return (
      <NodeTable 
        columns={columns} 
        data={data}
        handleCheckboxChange={handleCheckboxChange}>
      </NodeTable>
    )

  };

  // handleCheckboxChange
  //
  // The user has selected/deselected a node for import set the change
  // and update the node list with the change.
  function handleCheckboxChange(node_id) {
    var nodeIdx = nodeList.findIndex((node) => node.node_id === node_id);
    if (nodeIdx > -1) {
      var isSelected = nodeList[nodeIdx].selected;
      nodeList[nodeIdx].selected = !isSelected;
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
    if (netModelName === "") {
      setNetNameNeeded(true);
      return;
    } else {
      setNetNameNeeded(false);
    }

    var dbDataToSend = [];
    nodeList.forEach(node => {
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
    toggleShowSuccess(false);
  }
  
  function toggleShowSuccess(showNet) {
    var newState = !showSuccess;
    if (showNet == "true") {
      const tran = {
        action: "SHOW-TAB",
        tabKey: "netmodel"
      }
      props.dispatch(tran);
    }
    setShowSuccess(newState);
  }

  function toggleNetNameNeeded() {
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
          <Row>
            <Navbar bg="light" container="fluid" fixed="bottom">
              <Col lg="auto">
                <FormLabel>Net Model Name (no spaces):</FormLabel>
              </Col>
                <Col lg="auto">
                  <Form>
                    <InputGroup>
                      <Form.Control
                        onChange={updateNetModelName} />
                    </InputGroup>
                  </Form>
                </Col>
                <Col lg="auto">
                  <Button variant="primary" id="button-addon2" className="mr-2" onClick={importData}>Import</Button>
                  <OverlayTrigger
                    placement="right"
                    overlay={<Tooltip id="tooltip">
                      Import selected nodes into Net Model. Net Model will be created if it doesn't exist.
                    </Tooltip>}
                  >
                    <BsQuestionCircle />
                  </OverlayTrigger>
                </Col>
            </Navbar>
          </Row>
          </Container>}
      {importAlert}
      {netModelNameAlert}
    </>
  );

}

export default DbNodes;
