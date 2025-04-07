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