import os
import sys
f=open("MANIFEST", "r")
#ARGUMENTS WILL BE ADDED AFTER INTERACTIVE RESPONSE USER NAME PASSWORD IS DONE
TAG =  "sys.argv[1]"
USERNAME = "sys.argv[2]"
PASSWORD = "sys.argv[3]"

f1 = f.readlines()
count = 0
for x in f1:
	if count == 0:
		y = x[27:]
	else:
		y = x[19:]
	a = y.split(" ", 1)
	rep = str(a[0])
	com = str(a[1])
	#EXTRACT REPO AND COMMIT FROM MANIFEST
	print ("repo: " + rep)
	print ("commit: " + com)
	print ("line number: " + str(count))
	count = count + 1
	#CLONE THE REPO
	os.system("git clone https://github.com/freenas/" + rep)
	#NAVIGATE TO THE REPO
	os.chdir(os.getcwd() + "/" + rep)
	# GIT CHECKOUT WITH COMMIT 
	os.system("git checkout " + com)
	# ENTER USERNAME/PASSWORD INTERACTIVE
print ("This is the name of the script: " + sys.argv[0])
