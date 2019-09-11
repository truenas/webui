#!/usr/bin/env python

# Author: Eric Turgeon
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 1

import sys
import os
import time
cwd = str(os.getcwd())
sys.path.append(cwd)
from function import take_screenshot

skip_mesages = "Skipping first run"
script_name = os.path.basename(__file__).partition('.')[0]

xpaths = {
    "powerButton": "//button[@name='Power']",
    "logoutButton": "//button[@name='power-log-out']",
    "startImage": "//img"
}


def test_01_logout(browser):
    # Click on root account
    browser.find_element_by_xpath(xpaths['powerButton']).click()
    # Click on logout
    time.sleep(2)
    browser.find_element_by_xpath(xpaths['logoutButton']).click()
    time.sleep(2)
    # Click on OK when re-confirm logout
    # browser.find_element_by_xpath(xpaths['logoutconfirmationButton']).click()
    ui_element = browser.find_element_by_xpath(xpaths['startImage'])
    page_data = ui_element.text
    # assert response
    assert "" in page_data, page_data
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(browser, script_name, test_name)


def test_02_close(browser):
    browser.close()
