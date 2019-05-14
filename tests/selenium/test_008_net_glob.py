# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 2

import sys
import os
import time
cwd = str(os.getcwd())
sys.path.append(cwd)
from function import take_screenshot


skip_mesages = "Skipping first run"
script_name = os.path.basename(__file__).partition('.')[0]


xpaths = {
    'navNetwork': "//span[contains(.,'Network')]",
    'submenuNetworkconfig': "//a[contains(.,'Global Configuration')]",
    'nameserver3': "//div[@id='nameserver3']/mat-form-field/div/div/div/input",
    'buttonSave': '//*[@id="save_button"]',
    'breadcrumbBar': "//*[@id='breadcrumb-bar']/ul/li[2]/a"
}


def test_01_nav_net_conf(wb_driver):
    # Navigating to System>Update page
    wb_driver.find_element_by_xpath(xpaths['navNetwork']).click()
    # allowing page to load by giving explicit time(in seconds)
    time.sleep(1)
    # Click on the Update sub-menu
    wb_driver.find_element_by_xpath(xpaths['submenuNetworkconfig']).click()
    time.sleep(1)
    # get the ui element
    ui_element = wb_driver.find_element_by_xpath(xpaths['breadcrumbBar'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert "Configuration" in page_data, page_data
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_02_update_nameserver(wb_driver):
    # Fill up the form
    # Enter password newuserpassword
    wb_driver.find_element_by_xpath(xpaths['nameserver3']).clear()
    # wb_driver.find_element_by_xpath(xpaths['nameserver3']).send_keys("8.8.8.8")
    # wb_driver.find_element_by_xpath(xpaths['buttonSave']).click()
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
