#! /usr/bin/python3
#
# extractCode.py
#
# Author: David Hanks david.r.hanks@jpl.nasa.gov
#
# This script is run as part of the build process to extract code from
# the GUI editor source and format it appropriately for use by the
# CLI tools. This ensures that if changes are made to the GUI code
# the CLI tools are kept up to date. Proir to this script, the process
# was manual and error prone causing updates to the CLI tools
# to be incorrect or completely missed altogether. 
#
# The parts of the GUI code to be extracted are marked by keywords
# in the comments to indicate that they are part of the CLI tools.
# 
# The keywords in the GUI code and their meanings:
#
#    // EXTRACT theFunctionName - indicates that the following
#                                 function called 'theFunctionName'
#                                 is used by the CLI tools and is part
#                                 of the extraction. 'theFunctionName'
#                                 needs to be specified in the Python
#                                 array defined in this script to be
#                                 successfully extracted.
#    // END EXTRACT             - indicates the end of the extraction
#                                 and should appear after the last
#                                 close squiggly bracket for the
#                                 function being extracted.
#    // NO EXTRACT              - appears between the EXTRACT and
#                                 END EXTRACT keywords indicating
#                                 that the code immediately following
#                                 is NOT part of the CLI tools and
#                                 should not be extracted
#    // END NO EXTRACT          - appears after the NO EXTRACT keyword
#                                 but before the end of the function
#                                 being extracted indicating that the
#                                 code extraction should continue
#
# SPECIFYING WHAT GETS EXTRACTED
#
# The srcAndDest Python array is used to specify what functions in the
# GUI code are to be extracted, optional parameters to be added to the
# function call that are needed by the CLI tools, any string substitutions
# that need to be made to make the function work properly and the 
# destination script that the extracted code is appended to.
#
# EXTRACTION ARRAY DEFINITION
#
# srcAndDest is an array of arrays where each array has five
# elements as defined below:
#
# ELEMENT 1 - STRING: The GUI source file from which code is to be extracted
# ELEMENT 2 - STRING: The name of the function to be extracted. It should 
#                     match exactly the name found in the GUI code. The name 
#                     is preserved during the extraction
# ELEMENT 3 - ARRAY:  The arguments to be specified as part of the function
#                     definition. These may be different from the GUI code
#                     since the CLI code may not have access to React objects
#                     that are defined in the GUI and, thus, must be passed
#                     to the function to operate correctly. This array may
#                     be empty if the function has no arguments
# ELEMENT 4 - STRING: The destination script for the extracted code. The
#                     files are opened as 'append'.
# ELEMENT 4 - OBJECT: A dictionary that specifies strings in the source script
#                     that should be replaced with strings for the CLI
#                     script.
#
# EXAMPLE srcAndDest ARRAY:
#
# srcAndDest = [
#                [
#                  "MySourceFile.jsx", 
#                  "theFunctionName", 
#                  ["arg1","arg2","arg3"], 
#                  "MyDestFile.js", 
#                  {"this string": "that string"}
#                ],
#                [
#                  "MySourceFile2.jsx". 
#                  "theOtherFunction", 
#                  [], 
#                  "MyDestFile.js", 
#                  {}
#                ]
#              ]
#
# In regular English:
# MySourceFile.jsx contains a function called theFunctionName
# that should be extracted with the arguments arg1, arg2 and arg3 
# appearing in the destination script. The function should be appended 
# to MyDestFile.js and all instances of 'this string' should be 
# replaced with 'that string'.
# 
# MySourceFile2.jsx contains a function called theOtherFunction that
# has no arguments in the destination script. The function should be 
# appended to MyDestFile.js and there are no string replacements.
#                        
import os

# Description of this array is in the header
srcAndDest = [
				[
				  "../../editor/src/NetModel.jsx",
				  "checkNetModel",
				  ["netHosts","netNodes","netHops"], 
				  "../src/auto/checknet-auto.js",
				  {'console.log' : 'debug'}
				],

				[
				  "../../editor/src/App.jsx",
				  "isGoodName",
				  ["name"],
				  "../src/auto/appfunc-auto.js",
				  {'console.log' : 'debug'}
				 ],

				[
				  "../../editor/src/App.jsx",
				  "isStandardProtocol",
				  ["protocol"],
				  "../src/auto/appfunc-auto.js",
				  {'console.log' : 'debug'}
				 ],
				
				[
				  "../../editor/src/App.jsx",
				  "getUniqId",
				  [],
				  "../src/auto/appfunc-auto.js",
				  {'console.log' : 'debug'}
				 ],
				
				[
				  "../../editor/src/NetModel.jsx",
				  "addCommandKey",
				  ["configs","configName","cmdKey"],
				  "../src/auto/appfunc-auto.js",
				  {'console.log' : 'debug'}
				],
				
				[
				  "../../editor/src/NetModel.jsx",
				  "makeIonCommand",
				  [
				    "commands","clones","groupKey","configKey","configType",
				    "cmdName","values"
				  ],
				  "../src/auto/appfunc-auto.js",
				  {'console.log' : 'debug'}
				],
				
				[
				  "../../editor/src/NetModel.jsx",
				  "buildIonModel",
				  ["netName","netDesc","netHosts","netNodes","netHops"],
				  "../src/auto/buildion-auto.js",
				  {'this.state.name': 'netName',
				   'this.state.desc': 'netDesc',
				   'console.log' : 'debug'}
				],
				
				["../../editor/src/IonModel.jsx",
				 "getIonVerSeqNo",
				  ["nodeKey"],
				  "../src/auto/ionfunc-auto.js",
				  {'console.log' : 'debug'}
				],
				
				[
				  "../../editor/src/IonModel.jsx",
				  "makeCmdLine",
				  ["cmdTypeKey","cmdParams"],
				  "../src/auto/ionfunc-auto.js",
				  {'console.log' : 'debug'}
				],
				
				[
				  "../../editor/src/IonModel.jsx",
				  "makeCmdLines",
				  ["configObj"],
				  "../src/auto/ionfunc-auto.js",
				  {'this.state.name':  'ion.name',
				   'this.state.desc':  'ion.desc',
				   'this.props.nodes': 'nodes',
				   'console.log':      'debug'}
				],
				
				[
				  "../../editor/src/IonModel.jsx",
				  "makeStartLines",
				  ["nodeKey"],
				  "../src/auto/ionfunc-auto.js",
				  {'this.state.name':            'ion.name', 
				   'this.state.currentContacts': 'ion.currentContacts', 
				   'this.props.nodes':           'nodes',
				   'console.log':               'debug'}
				],
				
				[
				  "../../editor/src/IonModel.jsx",
				  "makeParamNote",
				  ["pTypeKey","pIdx","paramVal"],
				  "../src/auto/ionfunc-auto.js",
				  {'console.log' : 'debug'}
				],
				
				[
				  "../../editor/src/NetModelLoader.jsx",
				  "extractModel",
				  ["modelObj"],
				  "../src/auto/netloader-auto.js",
				  {'this.state.modelJson': 'modelObj',
				   'this.state.netHosts':  '{}',
				   'this.state.netNodes':  '{}',
				   'this.state.netHops':   '{}',
				   'this.state.net':       '{}',
				   'this.props.netAddrs':  '[]',
				   'return true':          'return [net,hosts,nodes,hops,netaddrs]'}
				],
				
				[
				  "../../editor/src/IonModelLoader.jsx",
				  "extractModel",
				  ["modelObj"],
				  "../src/auto/ionloader-auto.js",
				  {'console.log' : 'debug'}
				],
				
				["../../editor/src/IonModelLoader.jsx",
				 "extractCommands",
				 ["groupKey","configType","configKey","commandsList"],
				 "../src/auto/ionloader-auto.js",
				  {'console.log' : 'debug'}
				],
				
				["../../editor/src/IonModelLoader.jsx",
				 "assignClones",
				 [],
				 "../src/auto/ionloader-auto.js",
				  {'console.log' : 'debug'}
				],

				["../../editor/src/IonModelLoader.jsx",
				 "extractConfigs",
				 ["groupKey","configsObj"],
				 "../src/auto/ionloader-auto.js",
				  {'console.log' : 'debug'}
				],
				
				[
				  "../../editor/src/App.jsx",
				  "makeCloneVal",
				  ["nodeKey","cmd"],
				  "../src/auto/clone-auto.js",
				  {'console.log' : 'debug'}
				],
				
				[
				 "../../editor/src/App.jsx",
				 "makeComboValue",
				  ["cmd","type"],
				  "../src/auto/clone-auto.js",
				  {'console.log' : 'debug'}
				],
				
				[
				  "../../editor/src/App.jsx",
				  "findCloneVal",
				  ["cloneVals","type","value"],
				  "../src/auto/clone-auto.js",
				  {'console.log' : 'debug'}
				],
				
				[
				  "../../editor/src/App.jsx",
				  "getAnyCloneVal",
				  ["cloneVals","type"],
				  "../src/auto/clone-auto.js",
				  {'console.log' : 'debug'}
				],
				
				[
				  "../../editor/src/App.jsx",
				  "getCloneVal",
				  ["cloneVals","cmdKey"],            
				  "../src/auto/clone-auto.js",{}
				],
 				
 				[
 				  "../../editor/src/IonModel.jsx",       
 				  "makeModelObj",
 				  ["nodeKey"],                       
 				  "../src/auto/makeobj-auto.js",
 				  {'this.state': 'ion',
 				   'console.log' : 'debug'}
 				],
 				
 				[
 				  "../../editor/src/IonModel.jsx",
 				  "makeConfigObj",
 				  ["configKey"],
 				  "../src/auto/makeobj-auto.js",
				  {'console.log' : 'debug'}
 				],
				
				[
				  "../../editor/src/NetModel.jsx",       
				  "assignClones",
				  ["commands","cloneValues"],        
				  "../src/auto/getfunc-auto.js",
				  {'console.log' : 'debug'}
				],
				
				[
				  "../../editor/src/NetModel.jsx",       
				  "getHostPorts",
				  ["hostKey","hosts","ipaddrs","commands"], 
				  "../src/auto/getfunc-auto.js",
				  {'console.log' : 'debug'}
				],
				
				[
				  "../../editor/src/NetModel.jsx",       
				  "getNodeInduct",
				  ["cloneVals","nodeKey","bpLayer"], 
				  "../src/auto/getfunc-auto.js",
				  {'console.log' : 'debug'}
				],
				
				[
				  "../../editor/src/NetModel.jsx",       
				  "getNodeLink",
				  ["cloneVals","nodeKey","ltpLayer"],
				  "../src/auto/getfunc-auto.js",
				  {'console.log' : 'debug'}
				],
				
				[
				  "../../editor/src/NetModel.jsx",       
				  "getNodeOutduct",
				  ["cloneVals","nodeKey","toAddr","bpLayer"],
				  "../src/auto/getfunc-auto.js",
				  {'console.log' : 'debug'}
				],
				
				[
				  "../../editor/src/IonModel.jsx",       
				  "checkModel",
				  [],                                
				  "../src/auto/checkion-auto.js",
				  {'this.props.name': 'ion.name',
  				   'console.log' : 'debug'}
				] 
			 ]

# Utility function for replacing strings according
# to a string map expressed as a dictionary
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

## removeFiles
#
# inputs none
# outputs none
#
# This function deletes the destination scripts from
# the filesystem in preparation for regeneration.
#
def removeFiles():
	files_to_delete = []
	for w, x, y, file, z in srcAndDest:
		if not file in files_to_delete:
			files_to_delete.append(file)

	for f in files_to_delete:
		if os.path.exists(f):
			os.remove(f)
			print("Removed "+f)
		else:
			print(f+" not found, continuing.")
	return

# Main script logic

print("Deleting files...")

# Delete the destination scripts, they are about
# to be regenerated.
removeFiles()

# Go through the srcAndDest specification and generate
# all CLI source scripts.
for inputf, func, fargs, outputf, strmap in srcAndDest:
	print("opening " +inputf+" looking for "+func)
	print("opening "+outputf+" for "+inputf)

    # Open the input GUI source file. Any
    # error encountered results in script
    # termination.
	try:
		inpf = open(inputf, "r")
	except:
		print("Error opening "+inputf)
		exit()

    # Open the output file for append.
    # Any error encountered results
    # in script termination.
	try:
		outpf = open(outputf, "a")
	except:
		print("Error opening "+outputf)
		inpf.close()
		exit()

	print("Opened "+inputf+" and "+outputf)

    # Set up for the extraction by setting the flag
    # to indicate extraction is not active.
	extract_flag = False

	# The delimeter between function arguments.
	delimeter =","

    # Begin extraction one by one according to the
    # srcAndDest array. Any errors are reported back
    # and script is terminated. 
	try:
		# Set the mid extraction temporary pause
		# flag
		no_extract = False

		# Go through the source looking for the function
		# to extract
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
				# Begin the extraction by setting the extract flag and writing
				# the first line which is the function name with any args.
				outpf.write("// Automatically extracted from source file "+inputf+"\n")
				outpf.write("function "+func+"("+delimeter.join(fargs)+") {\n")

				# Set the extract flag to indicate extraction is active
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



