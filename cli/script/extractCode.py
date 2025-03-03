#! /usr/bin/python3
#
#

import os

srcAndDest =[["../../editor/src/NetModel.jsx", "checkNetModel", ["netHosts","netNodes","netHops"], "../src/checknet-x.js"]]
extractedLines = []

def processLine(in_line):
	out_line = ""

	# Any line with 'this.props' that is not also a function 
	# must be passed into the non-GUI function
	if (in_line.find("this.props.") > -1 and in_line.find("(") == -1 ):
		## skip line
		return("")
	else:
		## strip out "this.props."
		out_line = in_line.replace("this.props.", "")
		return out_line

for inputf, func, fargs, outputf in srcAndDest:
	print("opening " +inputf+" looking for "+func)
	print("opening "+outputf+" for "+inputf)
	print(fargs)

	try:
		inpf = open(inputf, "r")
	except:
		print("Error opening "+inputf)
		exit()

	try:
		outpf = open(outputf, "w")
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
				if (line.find(func) > -1):
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
				proc_line = processLine(line)
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
				outpf.write("function "+func+"("+delimeter.join(fargs)+")\n")
				extract_flag = True
				
	except Exception as err:
		print("Encountered err ", err)
		inpf.close()
		outpf.close()
		exit()

	inpf.close()
	print("Done processing "+inputf)




