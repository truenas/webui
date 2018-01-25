# !/usr/bin/env python
# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 1

import sys
from subprocess import call
from os import path
# when running for jenkins user driver, and when running on  an ubuntu system user driverU, because of  capabilities
from driver import webDriver
# from driverU import webDriver
# Importing test
# from autoflush import autoflush
from login import run_login_test
# from guide import run_guide_test
from acc_group import run_create_group_test
from acc_user import run_create_user_test
from serv_ssh import run_configure_ssh_test
from serv_afp import run_configure_afp_test
from serv_webdav import run_configure_webdav_test
from sys_update import run_check_update_test
from sys_advanced import run_conf_system_advanced
from guide import run_view_guide_test
from acc_delete import run_delete_test
from theme import run_change_theme_test
from logout import run_logout_test
import sys
sys.stdout.flush()

global runDriver
runDriver = webDriver()
# turning on the autoflush to display result
# autoflush(True)
# Starting the test and genewratinf result
run_login_test(runDriver)
# run_guide_test(runDriver)

if len(sys.argv) == 2:
    test_name = sys.argv[1]
    if (test_name == "account"):
        print ("Running: Accounts Test")
        run_create_user_test(runDriver)
        run_create_group_test(runDriver)
        run_delete_test(runDriver)

    elif (test_name == "system"):
        run_check_update_test(runDriver)
        run_conf_system_advanced(runDriver)

    elif (test_name == "guide"):
        print ("Running: Guide Tests")
        run_view_guide_test(runDriver)

    elif (test_name == "service"):
        print ("Running: Guide Tests")
        run_configure_ssh_test(runDriver)
        run_configure_afp_test(runDriver)
        run_configure_webdav_test(runDriver)

    elif (test_name == "theme"):
        print ("Running: Theme Tests")
        run_change_theme_test(runDriver)

else:
    print ("Running: All Tests")
    run_create_user_test(runDriver)
    run_create_group_test(runDriver)
    run_check_update_test(runDriver)
    run_conf_system_advanced(runDriver)
    run_view_guide_test(runDriver)
    run_configure_ssh_test(runDriver)
    run_configure_afp_test(runDriver)
    run_configure_webdav_test(runDriver)
    run_delete_test(runDriver)
    run_change_theme_test(runDriver)

run_logout_test(runDriver)
# turning off autoflush, the default mode
# autoflush(False)
# Example test run
# run_creat_nameofthetest(runDriver)

# cleaning up files
if path.exists('login.pyc'):
    call(["rm", "login.pyc"])

if path.exists('source.pyc'):
    call(["rm", "source.pyc"])

if path.exists('acc_user.pyc'):
    call(["rm", "acc_user.pyc"])

if path.exists('serv_ssh.pyc'):
    call(["rm", "serv_ssh.pyc"])

if path.exists('acc_group.pyc'):
    call(["rm", "acc_group.pyc"])

if path.exists('logout.pyc'):
    call(["rm", "logout.pyc"])

if path.exists('guide.pyc'):
    call(["rm", "guide.pyc"])

if path.exists('driver.pyc'):
    call(["rm", "driver.pyc"])

if path.exists('guide_old.pyc'):
    call(["rm", "guide_old.pyc"])

if path.exists('driverU.pyc'):
    call(["rm", "driverU.pyc"])

if path.exists('serv_afp.pyc'):
    call(["rm", "serv_afp.pyc"])

if path.exists('serv_webdav.pyc'):
    call(["rm", "serv_webdav.pyc"])

if path.exists('sys_update.pyc'):
    call(["rm", "sys_update.pyc"])

if path.exists('sys_advanced.pyc'):
    call(["rm", "sys_advanced.pyc"])

if path.exists('acc_delete.pyc'):
    call(["rm", "acc_delete.pyc"])

if path.exists('theme.pyc'):
    call(["rm", "theme.pyc"])

if path.exists('autoflush.pyc'):
    call(["rm", "autoflush.pyc"])

# if path.exists('example.pyc'):
#    call(["rm", "example.pyc"])

if path.exists('geckodriver.log'):
    call(["rm", "geckodriver.log"])

if path.exists('__pycache__'):
    call(["rm", "-r", "__pycache__"])

if path.isdir('.cache'):
    call(["rm", "-r", ".cache"])
