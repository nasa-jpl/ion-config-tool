#! /usr/bin/python3
#
#

import os

inputfiles =["../../editor/src/NetModel.jsx"]

for inputf in inputfiles:
	print("opening " +inputf)

	try:
		f = open(inputf, "r")
	except:
		print("Error opening "+inputf)
		exit()

	print("Opened "+inputf)
	f.close()


