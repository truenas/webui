# !/usr/bin/env python
#Selenium Grid Node Initial setup
#Author: Rishabh Chauhan
import os
import sys

argument = sys.argv
UsageMSG = """
Usage for %s:
Mandatory Commands:

--ip <0.0.0.0>            - IP of the machine hosting the selenium hub

""" % argument[0]
# if have no argument stop
if len(argument) == 1:
    print(UsageMSG)
    exit()
ip = argument[1]


dir = os.getcwd()
os.chdir(dir)
# selenium grid
command = "java -jar selenium-server-standalone-3.11.0.jar -role webdriver -hub http://%s:4444/grid/register -port 5566 -browser browserName=firefox,platform=LINUX" %ip
os.system(command)
