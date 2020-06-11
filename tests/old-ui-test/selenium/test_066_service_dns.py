# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 4

import pytest
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
    'breadcrumbBar1': "//div[@id='breadcrumb-bar']/ul/li/a"
}


@pytest.mark.skip('Need configuration for iX network')
def test_01_turnon_dns(browser):
    # Click Service Menu
    browser.find_element_by_xpath(xpaths['navService']).click()
    # check if the Service page is opens
    time.sleep(1)
    # get the ui element
    ui_element = browser.find_element_by_xpath(xpaths['breadcrumbBar1'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert "Services" in page_data, page_data
    status_change(browser, "dns")
    # dns test takes almost 6 min to turn on and display
    time.sleep(7)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(browser, script_name, test_name)


@pytest.mark.skip('Need configuration for iX network')
def test_02_checkif_dns_on(browser):
    time.sleep(2)
    # status check
    status_check(browser, "dns")
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(browser, script_name, test_name)


@pytest.mark.skip('Need configuration for iX network')
def test_03_turnoff_dns(browser):
    time.sleep(2)
    status_change(browser, "dns")
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(browser, script_name, test_name)


@pytest.mark.skip('Need configuration for iX network')
def test_04_checkif_dns_off(browser):
    time.sleep(2)
    # status check
    status_check(browser, "dns")
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(browser, script_name, test_name)
