# Author: Rishabh Chauhan
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
    'navSystem': "//span[contains(.,'System')]",
    'submenuSupport': "//a[contains(text(),'Support')]",
    'breadcrumbBar1': "//div[@id='breadcrumb-bar']/ul/li/a",
    'breadcrumbBar2': "//*[@id='breadcrumb-bar']/ul/li[2]/a"
}


def test_01_nav_system_support(wb_driver):
    wb_driver.find_element_by_xpath(xpaths['submenuSupport']).click()
    # get the ui element
    ui_element = wb_driver.find_element_by_xpath(xpaths['breadcrumbBar2'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert "Support" in page_data, page_data
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
    time.sleep(1)


# def test_02_close_system_tab(wb_driver):
#     # Close the System Tab
#     wb_driver.find_element_by_xpath(xpaths['navSystem']).click()
#     time.sleep(1)
#     # taking screenshot
#     test_name = sys._getframe().f_code.co_name
#     take_screenshot(wb_driver, script_name, test_name)
