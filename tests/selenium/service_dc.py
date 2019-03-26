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


def test_00_set_implicitly_wait(wb_driver):
    wb_driver.implicitly_wait(1)


def test_01_turnon_dc(wb_driver):
    # Click Service Menu
    wb_driver.find_element_by_xpath(xpaths['navService']).click()
    # check if the Service page is opens
    time.sleep(1)
    # get the ui element
    ui_element = wb_driver.find_element_by_xpath(xpaths['breadcrumbBar'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert "Services" in page_data, page_data
    status_change(wb_driver, "2", "start")
    # dc test takes almost takes 18 seconds to turn on
    time.sleep(18)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_02_checkif_dc_on(wb_driver):
    time.sleep(2)
    # status check
    status_check(wb_driver, "2")
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_03_turnoff_dc(wb_driver):
    time.sleep(2)
    status_change(wb_driver, "2", "stop")
    # dc takes almost 22 sec to turn off
    time.sleep(22)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_04_checkif_dc_off(wb_driver):
    time.sleep(2)
    # status check
    status_check(wb_driver, "2")
    time.sleep(10)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
