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
    # this should be the ID           'submenuLink' : '//*[@id="4-2"]'
    'submenuLink': '//*[@id="4-3"]'
}


def setUpClass(wb_driver):
    wb_driver.implicitly_wait(30)
    pass


def test_01_nav_net_linkagg(wb_driver):
    # Click on the link aggregations submenu
    wb_driver.find_element_by_xpath(xpaths['submenuLink']).click()
    # cancelling the tour
    if is_element_present(wb_driver, By.XPATH, "/html/body/div[6]/div[1]/button"):
        wb_driver.find_element_by_xpath("/html/body/div[6]/div[1]/button").click()
    # get the ui element
    ui_element = wb_driver.find_element_by_xpath("//*[@id='breadcrumb-bar']/ul/li[2]/a")
    # get the weather data
    page_data = ui_element.text
    print("the Page now is: " + page_data)
    # assert response
    assert "Link Aggregations" in page_data, page_data
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
