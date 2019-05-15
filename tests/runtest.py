#!/usr/bin/env python3.6
# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 1

import sys
import getopt
from shutil import copyfile
from subprocess import call
from os import path
# when running for jenkins user driver, and when running on  an ubuntu system
# user driverU, because of capabilities

if path.exists("/usr/local/etc/ixautomation.conf"):
    copyfile("/usr/local/etc/ixautomation.conf", "config.py")
    from config import *
    if "Grid_ip" in locals():
        grid_server_ip = Grid_ip
    else:
        grid_server_ip = "127.0.0.1"
else:
    grid_server_ip = "127.0.0.1"

sys.stdout.flush()

argument = sys.argv

UsageMSG = """
Usage for %s:

Mandatory Commands:

--ip <0.0.0.0>            - IP of the machine targeted

Optional Commands:

--driver <G or F>             - version of the driver G = Grid F = Firefox

""" % argument[0]

# if have no argument stop
if len(argument) == 1:
    print(UsageMSG)
    exit()

# list of argument that should be use.
optionlist = ["ip=", "test-name=", "driver="]
versionlist = ["U"]
# look if all the argument are there.
try:
    myopts, args = getopt.getopt(argument[1:], 'it', optionlist)
except getopt.GetoptError as e:
    print(str(e))
    print(UsageMSG)
    sys.exit(1)

for output, arg in myopts:
    if output == '--ip':
        ip = arg
    if output == "--driver":
        driver_v = arg

try:
    ip
except NameError:
    print("Option '--ip' is missing")
    print(UsageMSG)
    sys.exit(1)

try:
    driver_v
except NameError:
    print("Running Firefox driver")
    browser = "Firefox"
else:
    if driver_v == "F":
        print("Running Firefox driver")
        browser = "Firefox"
    elif driver_v == "G":
        print("Running Chrome driver")
        browser = "Chrome"
    else:
        print("Option '%s' not allowed" % driver_v)
        print(UsageMSG)
        sys.exit(1)

config_content = f"""#!/usr/bin/env python

browser = "{browser}"
ip = "{ip}"
"""

cfg_file = open("config.py", 'w')
cfg_file.writelines(config_content)
cfg_file.close()

pytestcmd = [
    "pytest-3.6",
    "-v",
    "selenium",
    "--junitxml=results/webui_test.xml"
]

call(pytestcmd)
