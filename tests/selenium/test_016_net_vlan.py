# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 3

import sys
import os
import time
cwd = str(os.getcwd())
sys.path.append(cwd)
from function import take_screenshot

skip_mesages = "Skipping first run"
script_name = os.path.basename(__file__).partition('.')[0]

xpaths = {
    'navNetwork': '//*[@id="nav-4"]/div/a[1]',
    # this should be the correct ID 'submenuVlan' : '//*[@id="4-4"]'
    'submenuVlan': '//*[@id="4-5"]',
    'breadcrumbBar': "//*[@id='breadcrumb-bar']/ul/li[2]/a"
}


def test_00_set_implicitly_wait(wb_driver):
    wb_driver.implicitly_wait(1)


def test_01_nav_net_vlan(wb_driver):
    # Click on the vlan sub-menu
    wb_driver.find_element_by_xpath(xpaths['submenuVlan']).click()
    # get the ui element
    ui_element = wb_driver.find_element_by_xpath(xpaths['breadcrumbBar'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert "Static Routes" in page_data, page_data
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_02_close_network_tab(wb_driver):
    # Close the System Tab
    wb_driver.find_element_by_xpath(xpaths['navNetwork']).click()
    time.sleep(2)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
