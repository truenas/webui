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
    'navTasks': '//*[@id="nav-3"]/div/a[1]',
    'submenuCloudsync': '//*[@id="3-8"]',
    'breadcrumbBar': "//*[@id='breadcrumb-bar']/ul/li[2]/a"
}


def test_01_nav_tasks_cloudsync(wb_driver):
    wb_driver.find_element_by_xpath(xpaths['submenuCloudsync']).click()
    # get the ui element
    ui_element = wb_driver.find_element_by_xpath(xpaths['breadcrumbBar'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert "Cloud Sync Tasks" in page_data, page_data
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_02_close_system_tab(wb_driver):
    # Close the System Tab
    wb_driver.find_element_by_xpath(xpaths['navTasks']).click()
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
