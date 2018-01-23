# /usr/bin/env python
# Author: Eric Turgeon
# License: BSD

from source import *
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
from acc_delete import run_delete_test
from theme import run_change_theme_test
from guide import run_view_guide_test
from logout import run_logout_test
from os import path
from selenium import webdriver
# from example import run_creat_nameofthetest


def webDriver():
    # marionette setting is fixed in selenium 3.0 and above by default
    # caps = webdriver.DesiredCapabilities().FIREFOX
    # caps["marionette"] = False
    global driver
    driver = webdriver.Firefox()
    driver.implicitly_wait(30)
    driver.maximize_window()
    return driver
