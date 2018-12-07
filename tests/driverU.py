# /usr/bin/env python
# Author: Rishabh Chauhan
# License: BSD

from source import *
from os import path
from selenium import webdriver



def webDriver():
    # marionette setting is fixed in selenium 3.0 and above by default
    # caps = webdriver.DesiredCapabilities().FIREFOX
    # caps["marionette"] = False
    global driver
    driver = webdriver.Firefox()
    driver.implicitly_wait(30)
    driver.maximize_window()
    return driver
