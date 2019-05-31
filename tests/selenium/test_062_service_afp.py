# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 5

import sys
import os
import time
from selenium.webdriver.common.keys import Keys
cwd = str(os.getcwd())
sys.path.append(cwd)
from function import take_screenshot, status_change, status_check

skip_mesages = "Skipping first run"
script_name = os.path.basename(__file__).partition('.')[0]

xpaths = {
    'navService': '//*[@id="nav-8"]/div/a[1]',
    'turnoffConfirm': '//*[contains(text(), "OK")]',
    'breadcrumbBar1': "//div[@id='breadcrumb-bar']/ul/li/a"
}


def test_01_nav_services(wb_driver):
    # Click  Service menu
    wb_driver.find_element_by_xpath(xpaths['navService']).click()
    # allowing the button to load
    time.sleep(1)
    # get the ui element
    ui_element = wb_driver.find_element_by_xpath(xpaths['breadcrumbBar1'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert "Services" in page_data, page_data
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_02_turn_on_afp(wb_driver):
    # scroll down
    wb_driver.find_element_by_tag_name('body').send_keys(Keys.HOME)
    time.sleep(2)
    status_change(wb_driver, "afp")
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_03_checkif_afp_on(wb_driver):
    time.sleep(2)
    # status check
    status_check(wb_driver, "afp")
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_04_turnoff_afp(wb_driver):
    time.sleep(2)
    status_change(wb_driver, "afp")
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_05_checkif_afp_off(wb_driver):
    time.sleep(2)
    # status check
    status_check(wb_driver, "1")
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
