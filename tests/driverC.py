# /usr/bin/env python
# Author: Rishabh Chauhan
# Driver script for Chrome browser


from login import run_login_test
from os import path
from selenium import webdriver
# from example import run_creat_nameofthetest

def webDriver():
    # marionette setting is fixed in selenium 3.0 and above by default
    # caps = webdriver.DesiredCapabilities().FIREFOX
    # caps["marionette"] = False
    global driver
    driver = webdriver.Chrome()
    driver.implicitly_wait(30)
    driver.maximize_window()
    return driver
