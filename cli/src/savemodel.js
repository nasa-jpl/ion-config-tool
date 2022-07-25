function saveModel(modelName, modelObj) {
  debug("save ION model!");
  const modelJson = JSON.stringify(modelObj,null,2);
  //const buff = new buf.Buffer( [modelJson], {type: "text/plain; charset=utf-8"} );
  fs.writeFileSync(modelName,modelJson); 
};
