# !/usr/bin/env python
# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 1

import sys
import os
import time
from selenium.webdriver.common.by import By
cwd = str(os.getcwd())
sys.path.append(cwd)
from function import take_screenshot, is_element_present


skip_mesages = "Skipping first run"
script_name = os.path.basename(__file__).partition('.')[0]

xpaths = {
    'navNetwork': '//*[@id="nav-4"]/div/a[1]',
    'submenuInterface': '//*[@id="4-1"]',
    'pageTitle': "//*[@id='breadcrumb-bar']/ul/li[2]/a"
}


def setUpClass(wb_driver):
    wb_driver.implicitly_wait(1)


def test_01_nav_net_interface(wb_driver):

    # Click on the vlan submenu
    wb_driver.find_element_by_xpath(xpaths['submenuInterface']).click()
    # cancelling the tour
    if is_element_present(wb_driver, By.XPATH, "/html/body/div[6]/div[1]/button"):
        wb_driver.find_element_by_xpath("/html/body/div[6]/div[1]/button").click()
    # get the ui element
    ui_element = wb_driver.find_element_by_xpath(xpaths["pageTitle"])
    # get the weather data
    page_data = ui_element.text
    print("the Page now is: " + page_data)
    # assert response
    assert "Interfaces" in page_data, page_data
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def error_check_sys(wb_driver):
    if (is_element_present(By.XPATH, "/html/body/div[5]/div[4]/div/mat-dialog-container/error-dialog/h1")):
        wb_driver.find_element_by_xpath("//*[contains(text(), 'Close')]").click()
