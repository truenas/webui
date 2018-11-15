# /usr/bin/env python
# Author: Rishabh Chauhan
# License: BSD

from source import *
from os import path
from selenium import webdriver

from login import run_login_test
# from guide import run_guide_test
from acc_group import run_create_group_test
from acc_user import run_create_user_test
from acc_edit import run_edit_test
from acc_delete import run_delete_test

from store_pool import run_create_pool_test
from store_delete import run_delete_pool_test

from net_conf import run_conf_network_test

from plugins import run_plugin_test

from sys_general import run_conf_sysgeneral_test
from sys_ntpserver import run_conf_ntpserver_test
from sys_bootenv import run_conf_bootenv_test
from sys_advanced import run_conf_sysadvanced_test
from sys_email import run_conf_email_test
from sys_dataset import run_conf_sysdataset_test
from sys_alertservices import run_conf_alertservices_test
from sys_alertsettings import run_conf_alertsettings_test
from sys_cloudcreds import run_conf_cloudcreds_test
from sys_tunables import run_conf_tunables_test
from sys_update import run_check_update_test
from sys_ca import run_conf_ca_test
from sys_certificates import run_conf_certificates_test
from sys_support import run_conf_support_test

from serv_ssh import run_conf_ssh_test
from serv_afp import run_conf_afp_test
from serv_smb import run_conf_smb_test
from serv_dns import run_conf_dns_test
from serv_ftp import run_conf_ftp_test
from serv_iscsi import run_conf_iscsi_test
from serv_lldp import run_conf_lldp_test
from serv_dc import run_conf_dc_test
from serv_webdav import run_conf_webdav_test

from guide import run_view_guide_test
from theme import run_change_theme_test
from logout import run_logout_test

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
