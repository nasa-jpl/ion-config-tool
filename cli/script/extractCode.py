#! /usr/bin/python3
#
#

import os

srcAndDest =[
				["../../editor/src/NetModel.jsx",       "checkNetModel",      ["netHosts","netNodes","netHops"], "../src/checknet-x.js",{}],
				["../../editor/src/App.jsx",            "isGoodName",         ["name"],                          "../src/appfunc-x.js",{}],
				["../../editor/src/App.jsx",            "isStandardProtocol", ["protocol"],                      "../src/appfunc-x.js",{}],
				["../../editor/src/App.jsx",            "getUniqId",          [],                                "../src/appfunc-x.js",{}],
				["../../editor/src/NetModel.jsx",       "addCommandKey",      ["configs","configName","cmdKey"], "../src/appfunc-x.js",{}],
				["../../editor/src/NetModel.jsx",       "makeIonCommand",     ["commands","clones","groupKey","configKey","configType","cmdName","values"],"../src/appfunc-x.js",{}],
				["../../editor/src/NetModel.jsx",       "buildIonModel",      ["netName","netDesc","netHosts","netNodes","netHops"],"../src/buildion-x.js",\
					{'this.state.name': 'netName', 'this.state.desc': 'netDesc'}],
				["../../editor/src/IonModel.jsx",       "getIonVerSeqNo",     ["nodeKey"],                       "../src/ionfunc-x.js",{}],
				["../../editor/src/IonModel.jsx",       "makeCmdLine",        ["cmdTypeKey","cmdParams"],        "../src/ionfunc-x.js",{}],
				["../../editor/src/IonModel.jsx",       "makeCmdLines",       ["configKey"],                     "../src/ionfunc-x.js",\
					{'this.state.name': 'ion.name', 'this.state.desc': 'ion.desc'}],
				["../../editor/src/IonModel.jsx",       "makeStartLines",     ["nodeKey"],                       "../src/ionfunc-x.js",\
					{'this.state.name': 'ion.name', 'this.state.currentContacts': 'ion.currentContacts', 'this.props.nodes': 'nodes'}],
				["../../editor/src/IonModel.jsx",       "makeParamNote",      ["pTypeKey","pIdx","paramVal"],    "../src/ionfunc-x.js",\
					{}],
				["../../editor/src/NetModelLoader.jsx", "extractModel",       ["modelObj"],                      "../src/netloader-x.js",\
					{'this.state.modelJson': 'modelObj','this.state.netHosts': '{}', 'this.state.netNodes': '{}','this.state.netHops': '{}','this.state.net': '{}','this.props.netAddrs': '[]', 'return true': 'return [ net, hosts, nodes, hops, addrs]'}],
				["../../editor/src/IonModelLoader.jsx", "extractModel",       ["modelObj"],                      "../src/ionloader-x.js",\
					{}],
				["../../editor/src/IonModelLoader.jsx", "extractCommands",    ["groupKey","configType","configKey","commandsList"],     "../src/ionloader-x.js",\
					{}],
				["../../editor/src/IonModelLoader.jsx", "assignClones",       [],                                "../src/ionloader-x.js",{}],
				["../../editor/src/App.jsx",            "makeCloneVal",       ["nodeKey","cmd"],                 "../src/clone-x.js",{}],
				["../../editor/src/App.jsx",            "makeComboValue",     ["cmd","type"],                    "../src/clone-x.js",{}],
				["../../editor/src/App.jsx",            "findCloneVal",       ["cloneVals","type","value"],      "../src/clone-x.js",{}],
				["../../editor/src/App.jsx",            "getAnyCloneVal",     ["cloneVals","type"],              "../src/clone-x.js",{}],
				["../../editor/src/App.jsx",            "getCloneVal",        ["cloneVals","cmdKey"],            "../src/clone-x.js",{}],
 				["../../editor/src/IonModel.jsx",       "makeModelObj",       ["nodeKey"],                       "../src/makeobj-x.js",\
 				  {'this.state': 'ion'}],
 				["../../editor/src/IonModel.jsx",       "makeConfigObj",      ["configKey"],                     "../src/makeobj-x.js",{}],
				["../../editor/src/NetModel.jsx",       "assignClones",       ["commands","cloneValues"],        "../src/getfunc-x.js",{}],
				["../../editor/src/NetModel.jsx",       "getHostPorts",       ["hostKey","hosts","ipaddrs","commands"],  "../src/getfunc-x.js",{}],
				["../../editor/src/NetModel.jsx",       "getNodeInduct",      ["cloneVals","nodeKey","bpLayer"], "../src/getfunc-x.js",{}],
				["../../editor/src/NetModel.jsx",       "getNodeLink",        ["cloneVals","nodeKey","ltpLayer"],"../src/getfunc-x.js",{}],
				["../../editor/src/NetModel.jsx",       "getNodeOutduct",     ["cloneVals","nodeKey","toAddr","bpLayer"],"../src/getfunc-x.js",{}],
				["../../editor/src/IonModel.jsx",       "checkModel",         [],                                "../src/checkion-x.js",\
					{"this.props.name": "ion.name"}]
			]
extractedLines = []


def replace_strs(line, strmap):
    for old_value, new_value in strmap.items():
        line = line.replace(old_value, new_value)
    return line

## processLine
#
#  inputs
#      in_line  - line of text to be processed
#      strmap   - dict of mappings from one string to another
#
#  output
#      out_line - the processed line of text based on order of
#                 processing rules
#
#  This function takes an input string from a file and processes
#  it according to rules with an implied priority as set out in the
#  function itself.
#
#
def processLine(in_line, strmap):
	# Set the output to the unprocessed input
	out_line = in_line

    # PRIORITY 1
    # Any line with variables must be replaced with a local
    # variable (probably passed in) according to the supplied
    # string map. NOTE: All state variables *must* be accounted
    # for, some property variables *may* be accounted for
	if (out_line.find("this.state.") > -1 or out_line.find("this.props.")):
		out_line = replace_strs(out_line, strmap)

    # PRIORITY 2
	# Any line with 'this.props' AND is not a function 
	# must be passed into the non-GUI function
	# NOTE: string replacements from the strmap input have already
	# been done, so looking for 'this.props' should be benign
	if (out_line.find("this.props.") > -1 and out_line.find("(") == -1 ):
		## skip line
		return("")
	else:
		## strip out "this.props."
		out_line = out_line.replace("this.props.", "")

    # PRIORITY 3
	# Any line with "this." not followed by "props." is a function
	# call, strip out "this."
	if  (out_line.find("this.") > -1 and out_line.find("props.") == -1):
		out_line = out_line.replace("this.", "")


	return(out_line)


def removeFiles():
	for w, x, y, file, z in srcAndDest:
		if os.path.exists(file):
			os.remove(file)
		else:
			print(file+" not found.")
	return

print("Deleting files...")

removeFiles()

for inputf, func, fargs, outputf, strmap in srcAndDest:
	print("opening " +inputf+" looking for "+func)
	print("opening "+outputf+" for "+inputf)
	print("****** "+str(strmap))

	try:
		inpf = open(inputf, "r")
	except:
		print("Error opening "+inputf)
		exit()

	try:
		outpf = open(outputf, "a")
	except:
		print("Error opening "+outputf)
		inpf.close()
		exit()

	print("Opened "+inputf+" and "+outputf)

	extract_flag = False
	delimeter =","

	try:
		no_extract = False
		for line in inpf:
			if (extract_flag):
				# Skip the line that contains the function 
				# being extracted; it gets written below
				# with the args. Remove all internal space chars
				# before looking in case the code has them
				if (line.replace(" ","").find(func+"(") > -1):
					continue

				# If done extracting this function set
				# flag and continue
				if (line.find("// END EXTRACT") > -1):
					extract_flag = False
					outpf.close()
					print("Done writing "+outputf)
					continue

				# If a NO EXTRACT key is found set flag
				# and continue
				if (line.find("// NO EXTRACT") > -1):
					no_extract = True
					continue

				# If an END NO EXTRACT key is found 
				# un-set flag and continue
				if (line.find("// END NO EXTRACT") > -1):
					no_extract = False
					continue

				# If not extracting, continue
				if (no_extract):
					continue

				# Process line for output file, if 
				# nothing is returned, continue
				proc_line = processLine(line, strmap)
				if (proc_line == ""):
					continue

				# Write the line to the output file 
				# and continue
				outpf.write(proc_line)
				continue

			searchStr = "// EXTRACT "+func

			# If the EXTRACT key with the function
			# being extracted has an exact match, format
			# function call with args write it and set
			# the extract flag
			if (line.strip() == searchStr):
				# print (line)
				outpf.write("// Automatically extracted from source file "+inputf+"\n")
				outpf.write("function "+func+"("+delimeter.join(fargs)+") {\n")
				extract_flag = True
		

	except Exception as err:
		print("Encountered err ", err)
		inpf.close()
		outpf.close()
		exit()

	print("Closing "+inputf)
	inpf.close()
	print("Closing "+outputf)
	outpf.close()

print("All processing finished.")



