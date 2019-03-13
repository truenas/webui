# !/usr/bin/env python
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

--test-name <test_name>    - name of tests targeted
                            [accounts, system, tasks, network, storage, services, plugin, guide, theme]

--driver <G or F>             - version of the driver G = Grid F = Firefox

""" % argument[0]

# if have no argument stop
if len(argument) == 1:
    print(UsageMSG)
    exit()

# list of argument that should be use.
optionlist = ["ip=", "test-name=", "driver="]
testlist = ["accounts", "system", "tasks", "network", "storage", "services", "plugin", "guide", "theme"]
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
    if output == "--test-name":
        test_name = arg
    if output == "--driver":
        driver_v = arg

try:
    ip
except NameError:
    print("Option '--ip' is missing")
    print(UsageMSG)
    sys.exit(1)


# try:
#     driver_v
# except NameError:
#     from driverU import webDriver
#     print("Running DriverU")
#     runDriver = webDriver()
# else:
#     if driver_v == "F":
#         from driverU import webDriver
#         print("Running Firefox driver")
#         runDriver = webDriver()
#     elif driver_v == "G":
#         from driverG import webDriver
#         print("Running Selenium Grid")
#         runDriver = webDriver(grid_server_ip)
#     else:
#         print("Option '%s' not allowed" % driver_v)
#         print(UsageMSG)
#         sys.exit(1)

# # running tests
# run_login_test(runDriver, ip)

# try:
#     test_name
# except NameError:
#     print ("Running: All Tests")
#     run_create_user_test(runDriver)
#     run_create_group_test(runDriver)
#     run_create_pool_test(runDriver)

#     run_conf_netglob_test(runDriver)
#     run_conf_netinterface_test(runDriver)
#     run_conf_netlinkagg_test(runDriver)
#     run_conf_netstatic_test(runDriver)
#     run_conf_netvlan_test(runDriver)

#     run_conf_sysgeneral_test(runDriver)
#     run_conf_ntpserver_test(runDriver)
#     run_conf_bootenv_test(runDriver)
#     run_conf_sysadvanced_test(runDriver)
#     run_conf_email_test(runDriver)
#     run_conf_sysdataset_test(runDriver)
#     run_conf_alertservices_test(runDriver)
#     run_conf_alertsettings_test(runDriver)
#     run_conf_cloudcreds_test(runDriver)
#     run_conf_tunables_test(runDriver)
# #    run_check_update_test(runDriver)
#     run_conf_ca_test(runDriver)
#     run_conf_certificates_test(runDriver)
#     run_conf_support_test(runDriver)

#     run_conf_taskscron_test(runDriver)
#     run_conf_tasksinitshutscript_test(runDriver)
#     run_conf_tasksrsync_test(runDriver)
#     run_conf_tasksSMART_test(runDriver)
#     run_conf_tasksperiodicSS_test(runDriver)
#     run_conf_tasksreplication_test(runDriver)
#     run_conf_tasksresilver_test(runDriver)
#     run_conf_tasksscrub_test(runDriver)
#     run_conf_taskscloudsync_test(runDriver)

# #    run_conf_afp_test(runDriver)
# # special reason for dns other services turned off until status is figured out
# #    run_conf_dc_test(runDriver)
# #    run_conf_dns_test(runDriver)
# #    run_conf_ftp_test(runDriver)
# #    run_conf_iscsi_test(runDriver)
# #    run_conf_lldp_test(runDriver)
# #    run_conf_smb_test(runDriver)
# #    run_conf_ssh_test(runDriver)
# #    run_conf_webdav_test(runDriver)
# #    run_view_guide_test(runDriver)
#     run_edit_test(runDriver)
#     run_delete_test(runDriver)
#     run_delete_pool_test(runDriver)
#     run_change_theme_test(runDriver)
# else:
#     if (test_name == "accounts"):
#         print ("Running: Accounts Test")
#         run_create_user_test(runDriver)
#         run_create_group_test(runDriver)
#         run_edit_test(runDriver)
#         run_delete_test(runDriver)

#     elif (test_name == "system"):
#         run_conf_sysgeneral_test(runDriver)
#         run_conf_ntpserver_test(runDriver)
#         run_conf_bootenv_test(runDriver)
#         run_conf_sysadvanced_test(runDriver)
#         run_conf_email_test(runDriver)
#         run_conf_sysdataset_test(runDriver)
#         run_conf_alertservices_test(runDriver)
#         run_conf_alertsettings_test(runDriver)
#         run_conf_cloudcreds_test(runDriver)
#         run_conf_tunables_test(runDriver)
#         run_check_update_test(runDriver)
#         run_conf_ca_test(runDriver)
#         run_conf_certificates_test(runDriver)
#         run_conf_support_test(runDriver)

#     elif (test_name == "tasks"):
#         run_conf_taskscron_test(runDriver)
#         run_conf_tasksinitshutscript_test(runDriver)
#         run_conf_tasksrsync_test(runDriver)
#         run_conf_tasksSMART_test(runDriver)
#         run_conf_tasksperiodicSS_test(runDriver)
#         run_conf_tasksreplication_test(runDriver)
#         run_conf_tasksresilver_test(runDriver)
#         run_conf_tasksscrub_test(runDriver)
#         run_conf_taskscloudsync_test(runDriver)

#     elif (test_name == "network"):
#         run_conf_netglob_test(runDriver)
#         run_conf_netinterface_test(runDriver)
#         run_conf_netlinkagg_test(runDriver)
#         run_conf_netstatic_test(runDriver)
#         run_conf_netvlan_test(runDriver)

#     elif (test_name == "storage"):
#         run_create_pool_test(runDriver)
#         run_delete_pool_test(runDriver)

#     elif (test_name == "services"):
#         print ("Running: Guide Tests")
# #        run_conf_afp_test(runDriver)
# #        run_conf_dc_test(runDriver)
# #        run_conf_dns_test(runDriver)
# #        run_conf_ftp_test(runDriver)
# #        run_conf_iscsi_test(runDriver)
# #        run_conf_lldp_test(runDriver)
# #        run_conf_smb_test(runDriver)
# #        run_conf_ssh_test(runDriver)
# #        run_conf_webdav_test(runDriver)
#     elif (test_name == "plugin"):
#       # run_create_pool_test(runDriver)
#         run_plugin_test(runDriver)
#     elif (test_name == "guide"):
#         print ("Running: Guide Tests")
#         run_view_guide_test(runDriver)
#     elif (test_name == "theme"):
#         print ("Running: Theme Tests")
#         run_change_theme_test(runDriver)

# run_logout_test(runDriver)

# Example test run
# run_creat_nameofthetest(runDriver)

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
    "-vs",
    "selenium",
    "--junitxml=results/webui_test.xml"
]

call(pytestcmd)
