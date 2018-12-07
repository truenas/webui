# !/usr/bin/env python
#Selenium Grid Initial setup
#Author: Rishabh Chauhan
import os
import sys

os.system("apt-get -y update")
os.system("apt-get -y install default-jre")

dir = os.getcwd()
os.chdir(dir)
#cloning webui repo
os.system("git clone https://github.com/freenas/webui")
os.chdir(dir + "/webui/tests/selenium-utils/")
# geckodriver
os.system("chmod +x geckodriver")
os.system("cp geckodriver /usr/local/bin/")
# selenium grid
os.system("java -jar selenium-server-standalone-3.11.0.jar -role hub")
