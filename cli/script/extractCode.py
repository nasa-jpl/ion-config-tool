#! /usr/bin/python3
#
#

import os

srcAndDest =[
				["../../editor/src/NetModel.jsx", "checkNetModel",      ["netHosts","netNodes","netHops"], "../src/checknet-x.js",{}],
				["../../editor/src/App.jsx",      "isGoodName",         ["name"],                          "../src/appfunc-x.js",{}],
				["../../editor/src/App.jsx",      "isStandardProtocol", ["protocol"],                      "../src/appfunc-x.js",{}],
				["../../editor/src/App.jsx",      "getUniqId",          [],                                "../src/appfunc-x.js",{}],
				["../../editor/src/NetModel.jsx", "addCommandKey",      ["configs","configName","cmdKey"], "../src/appfunc-x.js",{}],
				["../../editor/src/NetModel.jsx", "makeIonCommand",     ["commands","clones","groupKey","configKey","configType","cmdName","values"],"../src/appfunc-x.js",{}],
				["../../editor/src/NetModel.jsx", "buildIonModel",      ["netName","netDesc","netHosts","netNodes","netHops"],"../src/buildion-x.js",\
					{'this.state.name': 'netName', 'this.state.desc': 'netDesc'}]			
			]
extractedLines = []

def replace_strs(line, strmap):
    for old_value, new_value in strmap.items():
        line = line.replace(old_value, new_value)
    return line

def processLine(in_line, strmap):
	# Set the output to the unprocessed input
	out_line = in_line

	# Any line with 'this.props' that is not also a function 
	# must be passed into the non-GUI function
	if (out_line.find("this.props.") > -1 and out_line.find("(") == -1 ):
		## skip line
		return("")
	else:
		## strip out "this.props."
		out_line = out_line.replace("this.props.", "")

	# Any line with "this." not followed by "props." is a function
	# call, strip out "this."
	if  (out_line.find("this.") > -1 and out_line.find("props.") == -1):
		out_line = out_line.replace("this.", "")

    # Any line with state variables must be replaced with a local
    # variable (probably passed in) according to the supplied
    # string map.
	if (in_line.find("this.state.") > -1):
		out_line = replace_strs(out_line, strmap)

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
				# with the args
				if (line.find(func+"(") > -1):
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

			# If the EXTRACT key is found with the function
			# being extracted, format function call with args
			# write it and set the extract flag
			if (line.find(searchStr) > -1):
				print (line)
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



