#! /usr/bin/python3
#
#

import os

filesAndFunc =[["../../editor/src/NetModel.jsx", "checkNetModel"]]
extractedLines = []

for inputf, func in filesAndFunc:
	print("opening " +inputf+" looking for "+func)

	try:
		f = open(inputf, "r")
	except:
		print("Error opening "+inputf)
		exit()

	print("Opened "+inputf)

	try:
		for line in f:
			searchStr = "// EXTRACT "+func
			if (line.find(searchStr) > -1):
				print (line)
				break
	except Exception as err:
		print("Encountered err ", err)
		f.close()

	f.close()
	print("Done.")


