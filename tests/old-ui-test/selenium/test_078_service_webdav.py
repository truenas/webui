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
from source import newuserpassword as psswrd

skip_mesages = "Skipping first run"
script_name = os.path.basename(__file__).partition('.')[0]

xpaths = {
    'navService': '//*[@id="nav-8"]/div/a[1]',
    'turnoffConfirm': '//*[contains(text(), "OK")]',
    'configButton': "//button[@id='action-button__WebDAV']",
    'wbdvPassword': "//div[@id='password']/mat-form-field/div/div/div/input",
    'wbdvPassword2': "//div[@id='password2']/mat-form-field/div/div/div/input",
    'breadcrumbBar1': "//div[@id='breadcrumb-bar']/ul/li/a",
    'breadcrumbBar2': "//*[@id='breadcrumb-bar']/ul/li[2]/a",
    'theEnd': "//a[contains(text(),'2')]",
    'toDashboard': "//span[contains(.,'Dashboard')]",
    'scrollToWebDav': "//datatable-row-wrapper[9]/datatable-body-row/div[2]/datatable-body-cell/div/div"
}


def test_01_turnon_webdav(browser):
    # Click Service Menu
    browser.find_element_by_xpath(xpaths['navService']).click()
    # check if the Services page is open
    time.sleep(1)
    # get the ui element
    ui_element = browser.find_element_by_xpath(xpaths['breadcrumbBar1'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert "Services" in page_data, page_data
    # scroll down
    scroll = browser.find_element_by_xpath(xpaths['scrollToWebDav'])
    time.sleep(1)
    browser.execute_script("arguments[0].scrollIntoView(true);", scroll)
    time.sleep(1)
    status_change(browser, "webdav")
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(browser, script_name, test_name)


def test_02_checkif_webdav_on(browser):
    time.sleep(2)
    # status check
    status_check(browser, "webdav")
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(browser, script_name, test_name)


def test_03_configure_webdav(browser):
    time.sleep(1)
    # click on configure button
    browser.find_element_by_xpath(xpaths['configButton']).click()
    time.sleep(1)
    # Enter password newuserpassword
    browser.find_element_by_xpath(xpaths['wbdvPassword']).clear()
    browser.find_element_by_xpath(xpaths['wbdvPassword']).send_keys(psswrd)
    # Enter password confirmation newuserpassword
    browser.find_element_by_xpath(xpaths['wbdvPassword2']).clear()
    browser.find_element_by_xpath(xpaths['wbdvPassword2']).send_keys(psswrd)
    # Click on save button
    browser.find_element_by_xpath('//*[@id="save_button"]').click()
    # wait till saving is finished
    time.sleep(5)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(browser, script_name, test_name)


def test_04_turnoff_webdav(browser):
    # Click Service Menu
    browser.find_element_by_xpath(xpaths['navService']).click()
    # scroll down
    scroll = browser.find_element_by_xpath(xpaths['scrollToWebDav'])
    time.sleep(1)
    browser.execute_script("arguments[0].scrollIntoView(true);", scroll)
    time.sleep(1)
    time.sleep(2)
    status_change(browser, "webdav")
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(browser, script_name, test_name)


def test_05_checkif_wedbdav_off(browser):
    time.sleep(2)
    # status check
    status_check(browser, "webdav")
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(browser, script_name, test_name)


def test_06_return_to_dashboard(browser):
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