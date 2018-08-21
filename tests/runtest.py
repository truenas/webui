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

# from driver import webDriver
from driverU import webDriver
# Importing test

from login import run_login_test
# from guide import run_guide_test
from acc_group import run_create_group_test
from acc_user import run_create_user_test
from store_pool import run_create_pool_test
from net_conf import run_conf_network_test
from plugins import run_plugin_test
from serv_ssh import run_conf_ssh_test
from serv_afp import run_conf_afp_test
from serv_smb import run_conf_smb_test
from serv_dns import run_conf_dns_test
from serv_ftp import run_conf_ftp_test
from serv_iscsi import run_conf_iscsi_test
from serv_lldp import run_conf_lldp_test
from serv_dc import run_conf_dc_test
from serv_webdav import run_conf_webdav_test
from sys_update import run_check_update_test
from sys_email import run_conf_email_test
from sys_advanced import run_conf_sysadvance_test
from guide import run_view_guide_test
from acc_edit import run_edit_test
from acc_delete import run_delete_test
from store_delete import run_delete_pool_test
from theme import run_change_theme_test
from logout import run_logout_test

if path.exists("/usr/local/etc/ixautomation.conf"):
    copyfile("/usr/local/etc/ixautomation.conf", "config.py")
    from config import *
    if "Grid_ip" in locals():
        grid_server_ip = Grid_ip
    else:
        grid_server_ip = "127.0.0.1"
else:
    grid_server_ip = "10.20.21.200"

sys.stdout.flush()

argument = sys.argv

UsageMSG = """
Usage for %s:

Mandatory Commands:

--ip <0.0.0.0>            - IP of the machine targeted

Optional Commands:

--test-name <test_name>    - name of tests targeted
                            [account, storage, system, guide, service, theme]

--driver <d_v>             - version of the driver
                             [U]

""" % argument[0]

# if have no argument stop
if len(argument) == 1:
    print(UsageMSG)
    exit()

# list of argument that should be use.
optionlist = ["ip=", "test-name=", "driver="]
testlist = ["account", "storage", "plugin",  "network", "system", "guide", "service", "theme"]
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

global runDriver

try:
    driver_v
except NameError:
    from driverG import webDriver
    print("Running Selenium Grid")
    runDriver = webDriver(grid_server_ip)

else:
    if (driver_v == "U"):
        from driverU import webDriver
        print ("Running Ubuntu driver")
        runDriver = webDriver()

#running tests
run_login_test(runDriver, ip)

try:
    test_name
except NameError:
    print ("Running: All Tests")
    run_create_user_test(runDriver)
    run_create_group_test(runDriver)
    run_create_pool_test(runDriver)
    run_conf_network_test(runDriver)
    run_check_update_test(runDriver)
    run_conf_email_test(runDriver)
    run_conf_sysadvance_test(runDriver)
    run_conf_afp_test(runDriver)
    run_conf_smb_test(runDriver)
#    run_conf_dc_test(runDriver)
    run_conf_dns_test(runDriver)
    run_conf_ftp_test(runDriver)
    run_conf_iscsi_test(runDriver)
    run_conf_lldp_test(runDriver)
    run_conf_ssh_test(runDriver)
    run_conf_webdav_test(runDriver)
    run_view_guide_test(runDriver)
    run_edit_test(runDriver)
    run_delete_test(runDriver)
    run_delete_pool_test(runDriver)
    run_change_theme_test(runDriver)
else:
    if (test_name == "account"):
        print ("Running: Accounts Test")
        run_create_user_test(runDriver)
        run_create_group_test(runDriver)
        run_edit_test(runDriver)
        run_delete_test(runDriver)

    elif (test_name == "storage"):
        run_create_pool_test(runDriver)
        run_delete_pool_test(runDriver)

    elif (test_name == "plugin"):
#        run_create_pool_test(runDriver)
        run_plugin_test(runDriver)

    elif (test_name == "network"):
        run_conf_network_test(runDriver)

    elif (test_name == "system"):
        run_check_update_test(runDriver)
        run_conf_email_test(runDriver)
        run_conf_sysadvance_test(runDriver)

    elif (test_name == "service"):
        print ("Running: Guide Tests")
        run_conf_afp_test(runDriver)
        run_conf_smb_test(runDriver)
#        run_conf_dc_test(runDriver)
        run_conf_dns_test(runDriver)
        run_conf_ftp_test(runDriver)
        run_conf_iscsi_test(runDriver)
        run_conf_lldp_test(runDriver)
        run_conf_ssh_test(runDriver)
        run_conf_webdav_test(runDriver)

    elif (test_name == "guide"):
        print ("Running: Guide Tests")
        run_view_guide_test(runDriver)

    elif (test_name == "theme"):
        print ("Running: Theme Tests")
        run_change_theme_test(runDriver)

run_logout_test(runDriver)

# Example test run
# run_creat_nameofthetest(runDriver)

# cleaning up files
if path.exists('driver.pyc'):
    call(["rm", "driver.pyc"])

if path.exists('driverU.pyc'):
    call(["rm", "driverU.pyc"])

if path.exists('function.pyc'):
    call(["rm", "function.pyc"])

if path.exists('login.pyc'):
    call(["rm", "login.pyc"])

if path.exists('source.pyc'):
    call(["rm", "source.pyc"])

if path.exists('acc_user.pyc'):
    call(["rm", "acc_user.pyc"])

if path.exists('acc_group.pyc'):
    call(["rm", "acc_group.pyc"])

if path.exists('store_pool.pyc'):
    call(["rm", "store_pool.pyc"])

if path.exists('plugins.pyc'):
    call(["rm", "plugins.pyc"])

if path.exists('serv_afp.pyc'):
    call(["rm", "serv_afp.pyc"])

if path.exists('net_conf.pyc'):
    call(["rm", "net_conf.pyc"])

if path.exists('serv_smb.pyc'):
    call(["rm", "serv_smb.pyc"])

if path.exists('serv_dns.pyc'):
    call(["rm", "serv_dns.pyc"])

if path.exists('serv_ftp.pyc'):
    call(["rm", "serv_ftp.pyc"])

if path.exists('serv_iscsi.pyc'):
    call(["rm", "serv_iscsi.pyc"])

if path.exists('serv_lldp.pyc'):
    call(["rm", "serv_lldp.pyc"])

if path.exists('serv_ssh.pyc'):
    call(["rm", "serv_ssh.pyc"])

if path.exists('serv_dc.pyc'):
    call(["rm", "serv_dc.pyc"])

if path.exists('serv_webdav.pyc'):
    call(["rm", "serv_webdav.pyc"])

if path.exists('sys_update.pyc'):
    call(["rm", "sys_update.pyc"])

if path.exists('sys_advanced.pyc'):
    call(["rm", "sys_advanced.pyc"])

if path.exists('sys_email.pyc'):
    call(["rm", "sys_email.pyc"])

if path.exists('guide.pyc'):
    call(["rm", "guide.pyc"])

if path.exists('acc_delete.pyc'):
    call(["rm", "acc_delete.pyc"])

if path.exists('store_delete.pyc'):
    call(["rm", "store_delete.pyc"])

if path.exists('theme.pyc'):
    call(["rm", "theme.pyc"])

if path.exists('autoflush.pyc'):
    call(["rm", "autoflush.pyc"])

if path.exists('logout.pyc'):
    call(["rm", "logout.pyc"])

# if path.exists('example.pyc'):
#    call(["rm", "example.pyc"])

if path.exists('geckodriver.log'):
    call(["rm", "geckodriver.log"])

if path.exists('__pycache__'):
    call(["rm", "-r", "__pycache__"])

if path.isdir('.cache'):
    call(["rm", "-r", ".cache"])
