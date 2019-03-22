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


def test_00_set_implicitly_wait(wb_driver):
    wb_driver.implicitly_wait(1)


def test_01_logout(wb_driver):
    # Click on root account
    wb_driver.find_element_by_xpath(xpaths['powerButton']).click()
    # Click on logout
    time.sleep(2)
    wb_driver.find_element_by_xpath(xpaths['logoutButton']).click()
    time.sleep(2)
    # Click on OK when re-confirm logout
    # wb_driver.find_element_by_xpath(xpaths['logoutconfirmationButton']).click()
    # time.sleep(2)
    # taking screenshot
    # get the ui element
    ui_element = wb_driver.find_element_by_xpath(xpaths['startImage'])
    page_data = ui_element.text
    # assert response
    assert "" in page_data, page_data
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_02_close(wb_driver):
    wb_driver.close()
