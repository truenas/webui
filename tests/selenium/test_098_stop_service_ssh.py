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
from function import is_element_present
skip_mesages = "Skipping first run"
script_name = os.path.basename(__file__).partition('.')[0]


xpaths = {
    'navService': '//*[@id="nav-8"]/div/a[1]',
    'turnoffConfirm': '//*[contains(text(), "OK")]',
    'configButton': "//button[@id='action-button__SSH']/span/mat-icon",
    'rootCheckbox': '//*[@id="ssh_rootlogin"]/mat-checkbox/label/div',
    'verifyRootCheck': '//mat-checkbox',
    'breadcrumbBar1': "//div[@id='breadcrumb-bar']/ul/li/a",
    'breadcrumbBar2': "//*[@id='breadcrumb-bar']/ul/li[2]/a",
    'saveButton': "//button[@id='save_button']/span",
    'theEnd': "//a[contains(text(),'2')]",
    'toDashboard': "//span[contains(.,'Dashboard')]",
    'scrollToSSH': "//datatable-row-wrapper[9]/datatable-body-row/div[2]/datatable-body-cell/div/div"
}


def test_01_navigate_service(browser):
    # click Service Menu
    browser.find_element_by_xpath(xpaths['navService']).click()
    # allowing the button to load
    time.sleep(1)
    # get the ui element
    ui_element = browser.find_element_by_xpath(xpaths['breadcrumbBar1'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert "Services" in page_data, page_data


def test_02_navigate_to_configure_ssh(browser):
    # scroll down
    scroll = browser.find_element_by_xpath(xpaths['scrollToSSH'])
    time.sleep(1)
    browser.execute_script("arguments[0].scrollIntoView(true);", scroll)
    time.sleep(1)
    # click on configure button
    browser.find_element_by_xpath(xpaths['configButton']).click()
    ui_element = browser.find_element_by_xpath(xpaths['breadcrumbBar1'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert "Services" in page_data, page_data
    ui_element = browser.find_element_by_xpath(xpaths['breadcrumbBar2'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert "SSH" in page_data, page_data
    test_name = sys._getframe().f_code.co_name
    take_screenshot(browser, script_name, test_name)


def test_03_uncheck_ssh_root_login(browser):
    # unchecked on Login as Root with Password
    browser.find_element_by_xpath(xpaths['rootCheckbox']).click()
    test_name = sys._getframe().f_code.co_name
    take_screenshot(browser, script_name, test_name)
    root_checkbox = browser.find_element_by_xpath(xpaths['verifyRootCheck'])
    class_value = root_checkbox.get_attribute('class')
    assert 'mat-checkbox-checked' not in class_value, class_value


def test_04_save_ssh_configuration(browser):
    # click on save button
    browser.find_element_by_xpath(xpaths['saveButton']).click()
    time.sleep(5)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(browser, script_name, test_name)
    assert is_element_present(browser, xpaths['breadcrumbBar2']) is False


def test_05_turnoff_ssh(browser):
    # scroll down
    scroll = browser.find_element_by_xpath(xpaths['scrollToSSH'])
    time.sleep(1)
    browser.execute_script("arguments[0].scrollIntoView(true);", scroll)
    time.sleep(1)
    time.sleep(2)
    status_change(browser, "ssh")
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(browser, script_name, test_name)


def test_06_checkif_ssh_off(browser):
    time.sleep(2)
    # status check
    status_check(browser, "ssh")
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(browser, script_name, test_name)


def test_07_return_to_dashboard(browser):
    # Close the System Tab
    browser.find_element_by_xpath(xpaths['toDashboard']).click()
    time.sleep(1)
    # get the ui element
    ui_element = browser.find_element_by_xpath(xpaths['breadcrumbBar1'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert page_data == "Dashboard", page_data
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(browser, script_name, test_name)
