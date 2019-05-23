# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 1

import sys
import os
cwd = str(os.getcwd())
sys.path.append(cwd)
from function import take_screenshot

skip_mesages = "Skipping first run"
script_name = os.path.basename(__file__).partition('.')[0]

xpaths = {
    'navTasks': "//mat-list-item[@id='nav-3']/div/a/mat-icon[2]",
    'submenuCron': "//a[@id='3-0']",
    'breadcrumbBar1': "//div[@id='breadcrumb-bar']/ul/li/a",
    'breadcrumbBar2': "//*[@id='breadcrumb-bar']/ul/li[2]/a"
}


def test_01_nav_tasks_cron(wb_driver):
    # Navigating to System>General page
    wb_driver.find_element_by_xpath(xpaths['navTasks']).click()
    # allowing page to load by giving explicit time(in seconds)
    wb_driver.find_element_by_xpath(xpaths['submenuCron']).click()
    # get the ui element
    ui_element = wb_driver.find_element_by_xpath(xpaths['breadcrumbBar2'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert "Cron Jobs" in page_data, page_data
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
