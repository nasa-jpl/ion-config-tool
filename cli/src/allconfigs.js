// Not automatically extracted, likely not to change in GUI
// See saveConfigs in IonModel.jsx for similarities and
// differences.
function saveAllConfigs() {
  try 
    { fs.mkdirSync(ion.name); }  // the network name
  catch (err)
    { console.log(ion.name + " dir already exists."); }
  const graphKey = ion.currentContacts + ".cg";
  var graphLines = makeCmdLines(graphKey);

  // build config files node-by-node
  for (var nodeKey in nodes) {
    const node = nodes[nodeKey]
    const nodeDir = ion.name + '/' + node.id;
    try 
      { fs.mkdirSync(nodeDir); }  // the network name
    catch (err)
      { console.log(nodeDir + " dir already exists."); }
    const confKeys = node.configKeys;
    var lf = "\n";   // assign linefeed format for text files
    var host = hosts[node.hostKey];  // get host object of node
    if (host.linefeed === 'windows')            // windows is different
      lf = "\r\n";

    for (let j=0; j<confKeys.length; j++) {
      var configKey = confKeys[j];
      console.log("Saving config file: " + configKey);
      const cmdLines = makeCmdLines(configKey);
      const page = cmdLines.join(lf) + lf;
      var configFile = ion.name + '/' + node.id + '/' + configKey;
      try 
        { fs.writeFileSync(configFile,page); }
      catch (err)
        { console.log(err); }
    };
    // add common contact graph
    let graphPage = graphLines.join(lf) + lf;
    let fullGraph = ion.name + '/' + node.id + '/' + graphKey;
    try 
      { fs.writeFileSync(fullGraph, graphPage); }
    catch (err)
      { console.log(err); }
    // ... and build start scripts for each node
    let startName = "start_" + nodeKey + ".sh";
    console.log("Saving start file: " + startName);
    let cmdLines = makeStartLines(nodeKey);
    let page = cmdLines.join(lf) + lf;
    let fullStart = ion.name + '/' + node.id + '/' + startName;
    try 
      { fs.writeFileSync(fullStart, page); }
    catch (err)
      { console.log(err); }
  };
};
