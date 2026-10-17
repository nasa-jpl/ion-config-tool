// Utility functions used by all CLI apps that are not part
// of the automatic extraction

// Special wrapper function for console.log debug messages
function debug_log(msg) {
  if (DEBUG_MODE)
     console.log(msg);
}

function warn(s) {
  console.log("Warning: "  + s);
}
function error(s) {
  console.log("Error: "  + s);
}
function setError(s) {
  console.log("Error: "  + s);
}
function debug(s) {
  if (debugFlag) 
    console.log("$$$ " + s);
}

// get now date-time in standard format
function getNow() {
  const now = new Date();
  var goodNow = df.formatISO(now);
  goodNow = goodNow.substring(0,16);
  return goodNow;
};

// the node's single fixed identity string for emission: "<node>" for a
// 2-part node, "<allocator>.<node>" for a 3-part node.  Never normalized.
// Mirrors the GUI helper of the same name (editor/src); provided here
// because it is called by extracted code but is not itself extracted.
function nodeIdOf(node) {
  var a = node.allocator;
  // 2-part: return the node number unchanged (preserves numeric type so
  // existing models serialize byte-identically).  3-part: compose the string.
  return (a === undefined || a === null || a === "")
    ? node.ionNodeNum
    : (a + "." + node.ionNodeNum);
};