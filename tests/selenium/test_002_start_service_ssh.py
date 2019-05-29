# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 5

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
    'configButton': "//button[@id='action-button__SSH']",
    'rootCheckbox': '//*[@id="ssh_rootlogin"]/mat-checkbox/label/div',
    'breadcrumbBar1': "//div[@id='breadcrumb-bar']/ul/li/a",
    'saveButton': '//*[@id="save_button"]',
    'theEnd': "//a[contains(text(),'2')]",
    'toDashboard': "//span[contains(.,'Dashboard')]"
}


def test_01_navigate_to_service(wb_driver):
    # click Service Menu
    wb_driver.find_element_by_xpath(xpaths['navService']).click()
    # allowing the button to load
    time.sleep(1)
    # get the ui element
    ui_element = wb_driver.find_element_by_xpath(xpaths['breadcrumbBar1'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert "Services" in page_data, page_data


def test_02_configure_ssh(wb_driver):
    # scroll down
    wb_driver.find_element_by_xpath(xpaths['theEnd']).click()
    time.sleep(2)
    # click on configure button
    wb_driver.find_element_by_xpath(xpaths['configButton']).click()
    # unchecked on Login as Root with Password
    wb_driver.find_element_by_xpath(xpaths['rootCheckbox']).click()
    # click on save button
    wb_driver.find_element_by_xpath(xpaths['saveButton']).click()
    time.sleep(5)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_03_turn_ssh_service_on(wb_driver):
    # scroll down
    wb_driver.find_element_by_xpath(xpaths['theEnd']).click()
    time.sleep(2)
    status_change(wb_driver, "14", "start")
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_04_checkif_ssh_on(wb_driver):
    time.sleep(2)
    # status check
    status_check(wb_driver, "14")
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_05_return_to_dashboard(wb_driver):
    # Close the System Tab
    wb_driver.find_element_by_xpath(xpaths['toDashboard']).click()
    time.sleep(1)
    # get the ui element
    ui_element = wb_driver.find_element_by_xpath(xpaths['breadcrumbBar1'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert page_data == "Dashboard", page_data
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)