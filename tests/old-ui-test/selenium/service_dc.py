# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 4

import sys
import os
import time
cwd = str(os.getcwd())
sys.path.append(cwd)
from function import take_screenshot, status_change, status_check

skip_mesages = "Skipping first run"
script_name = os.path.basename(__file__).partition('.')[0]

xpaths = {
    'navService': '//*[@id="nav-8"]/div/a[1]',
    'turnoffConfirm': '//*[contains(text(), "OK")]',
    'breadcrumbBar': "//div[@id='breadcrumb-bar']/ul/li/a"
}


def test_00_set_implicitly_wait(browser):
    browser.implicitly_wait(1)


def test_01_turnon_dc(browser):
    # Click Service Menu
    browser.find_element_by_xpath(xpaths['navService']).click()
    # check if the Service page is opens
    time.sleep(1)
    # get the ui element
    ui_element = browser.find_element_by_xpath(xpaths['breadcrumbBar'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert "Services" in page_data, page_data
    status_change(browser, "2", "start")
    # dc test takes almost takes 18 seconds to turn on
    time.sleep(18)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(browser, script_name, test_name)


def test_02_checkif_dc_on(browser):
    time.sleep(2)
    # status check
    status_check(browser, "2")
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(browser, script_name, test_name)


def test_03_turnoff_dc(browser):
    time.sleep(2)
    status_change(browser, "2", "stop")
    # dc takes almost 22 sec to turn off
    time.sleep(22)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(browser, script_name, test_name)


def test_04_checkif_dc_off(browser):
    time.sleep(2)
    # status check
    status_check(browser, "2")
    time.sleep(10)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(browser, script_name, test_name)
