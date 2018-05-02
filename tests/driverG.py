# /usr/bin/env python
# Author: Eric Turgeon
# License: BSD

from source import *
from selenium import webdriver


def webDriver(grid_sever_ip):
    # marionette setting is fixed in selenium 3.0 and above by default
    # caps = webdriver.DesiredCapabilities().FIREFOX
    # caps["marionette"] = False
    global driver
    desired_caps = {'platform': 'LINUX', 'browserName': 'firefox'}
    server_url = 'http://%s:4444/wd/hub' % grid_sever_ip
    driver = webdriver.Remote(command_executor=server_url,
                              desired_capabilities=desired_caps)
    driver.implicitly_wait(30)
    driver.maximize_window()
    return driver
