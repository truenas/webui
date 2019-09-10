# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 7

import sys
import os
from selenium.webdriver.common.keys import Keys
cwd = str(os.getcwd())
sys.path.append(cwd)
from function import take_screenshot, is_element_present, error_check
from function import wait_on_element
from source import *


skip_mesages = "Skipping first run"
script_name = os.path.basename(__file__).partition('.')[0]

xpaths = {
    # 'navAccount': '//*[@id="nav-1"]/div/a[1]',
    'navAccount': "//span[contains(.,'Accounts')]",
    'submenuUser': "//a[contains(.,'Users')]",
    'submenuGroup': "//a[contains(.,'Groups')]",
    # 'primaryGroupcheckbox': '//label/div',
    'primaryGroupcheckbox': '//*[@id="group_create"]/mat-checkbox/label/div',
    'primaryGroupdropdown': '//*[@id="group"]',
    'newUserName': "//div[@id='full_name']/mat-form-field/div/div/div/input",
    'newUser': "//div[@id='username']/mat-form-field/div/div/div/input",
    'newUserEmail': "//div[@id='email']/mat-form-field/div/div/div/input",
    'newUserPass': "//div[@id='password']/mat-form-field/div/div/div/input",
    'newUserPassConf': "//div[@id='password_conf']/mat-form-field/div/div/div/input",
    'permitSudocheckbox': '//*[@id="sudo"]/mat-checkbox/label/div',
    'fabAction': "//button[@id='add_action_button']",
    'saveButton': '//*[@id="save_button"]',
    'cancelButton': "//button[@id='goback_button']/span",
    'tourButton': '/html/body/div[6]/div[1]/button',
    'breadcrumbBar1': "//div[@id='breadcrumb-bar']/ul/li/a",
    'breadcrumbBar2': "//*[@id='breadcrumb-bar']/ul/li[2]/a"
}


def test_00_disable_tour_guide_if_present(browser):
    if is_element_present(browser, xpaths['tourButton']):
        browser.find_element_by_xpath(xpaths['tourButton']).click()


def test_01_nav_acc_user(browser):
    test_name = sys._getframe().f_code.co_name
    # Click  Account menu
    browser.find_element_by_xpath(xpaths['navAccount']).click()
    # allowing the button to load
    # Click User sub-menu
    browser.find_element_by_xpath(xpaths['submenuUser']).click()
    # get the ui element
    ui_element = browser.find_element_by_xpath(xpaths['breadcrumbBar1'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert "Account" in page_data, page_data
    # get the ui element
    ui_element = browser.find_element_by_xpath(xpaths['breadcrumbBar2'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert "User" in page_data, page_data
    # taking screenshot
    take_screenshot(browser, script_name, test_name)


def test_02_create_newuser(browser):
    test_name = sys._getframe().f_code.co_name
    # Click create new user option
    browser.find_element_by_xpath(xpaths['fabAction']).click()
    # wait on the page to load
    wait = wait_on_element(browser, xpaths['newUserName'], script_name, test_name)
    assert wait, f'Loading Users Add page timeout'
    # Enter User Full name
    browser.find_element_by_xpath(xpaths['newUserName']).send_keys(newuserfn)
    # clear user name and enter new Username
    browser.find_element_by_xpath(xpaths['newUser']).clear()
    browser.find_element_by_xpath(xpaths['newUser']).send_keys(newuser)
    # Enter User email id
    browser.find_element_by_xpath(xpaths['newUserEmail']).send_keys(newuseremail)
    # Enter Password
    browser.find_element_by_xpath(xpaths['newUserPass']).send_keys(newuserpassword)
    # Enter Password Conf
    browser.find_element_by_xpath(xpaths['newUserPassConf']).send_keys(newuserpassword)
    # Click on create new User button
    assert is_element_present(browser, xpaths['saveButton']) is True
    print("found the save button")
    browser.find_element_by_xpath(xpaths['saveButton']).click()
    # wait on the fabAction
    xpath = xpaths['fabAction']
    wait = wait_on_element(browser, xpath, script_name, test_name)
    assert wait, f'Loading Users page timeout'
    # taking screenshot
    take_screenshot(browser, script_name, test_name)
    no_error = error_check(browser)
    assert no_error['result'], no_error['traceback']


def test_03_create_newuser_primarygroup_uncheck(browser):
    test_name = sys._getframe().f_code.co_name
    # Click create new user option
    browser.find_element_by_xpath(xpaths['fabAction']).click()
    # wait on the page to load
    wait = wait_on_element(browser, xpaths['newUserName'], script_name, test_name)
    assert wait, f'Loading Users Add page timeout'
    # Enter User Full name
    browser.find_element_by_xpath(xpaths['newUserName']).send_keys(uncheckuserfn)
    # clear user name and enter new Username
    browser.find_element_by_xpath(xpaths['newUser']).clear()
    browser.find_element_by_xpath(xpaths['newUser']).send_keys(uncheckuser)

    # Enter Password
    browser.find_element_by_xpath(xpaths['newUserPass']).send_keys(newuserpassword)
    # Enter Password Conf
    browser.find_element_by_xpath(xpaths['newUserPassConf']).send_keys(newuserpassword)
    # Click on create new User button
    assert is_element_present(browser, xpaths['saveButton']) is True
    browser.find_element_by_xpath(xpaths['saveButton']).click()
    # wait on the fabAction
    xpath = xpaths['fabAction']
    wait = wait_on_element(browser, xpath, script_name, test_name)
    assert wait, f'Loading Users page timeout'
    # taking screenshot
    take_screenshot(browser, script_name, test_name)
    # check if there is a generic error when making a duplicate user, and print the error
    no_error = error_check(browser)
    assert no_error['result'], no_error['traceback']


def test_04_create_superuser(browser):
    test_name = sys._getframe().f_code.co_name
    browser.find_element_by_tag_name('html').send_keys(Keys.END)
    # Click create new user option
    browser.find_element_by_xpath(xpaths['fabAction']).click()
    # wait on the page to load
    wait = wait_on_element(browser, xpaths['newUserName'], script_name, test_name)
    assert wait, f'Loading Users Add page timeout'
    # Enter User Full name
    browser.find_element_by_xpath(xpaths['newUserName']).send_keys(superuserfn)
    # clear user name and enter new Username
    browser.find_element_by_xpath(xpaths['newUser']).clear()
    browser.find_element_by_xpath(xpaths['newUser']).send_keys(superuser)

    # Enter Password
    browser.find_element_by_xpath(xpaths['newUserPass']).send_keys(superuserpassword)
    # Enter Password Conf
    browser.find_element_by_xpath(xpaths['newUserPassConf']).send_keys(superuserpassword)
    # check Permit Sudo Checkbox
    browser.find_element_by_xpath(xpaths['permitSudocheckbox']).click()
    # Click on create new User button
    assert is_element_present(browser, xpaths['saveButton']) is True
    browser.find_element_by_xpath(xpaths['saveButton']).click()
    # wait on the fabAction
    xpath = xpaths['fabAction']
    wait = wait_on_element(browser, xpath, script_name, test_name)
    assert wait, f'Loading Users page timeout'
    # taking screenshot
    take_screenshot(browser, script_name, test_name)
    # check if there is a generic error when making a duplicate user, and print the error
    no_error = error_check(browser)
    assert no_error['result'], no_error['traceback']


def test_05_create_duplicate_user(browser):
    test_name = sys._getframe().f_code.co_name
    # Click create new user option
    browser.find_element_by_xpath(xpaths['fabAction']).click()
    # wait on the page to load
    wait = wait_on_element(browser, xpaths['newUserName'], script_name, test_name)
    assert wait, f'Loading Users Add page timeout'
    # Enter User Full name
    browser.find_element_by_xpath(xpaths['newUserName']).send_keys(newuserfn)
    # clear user name and enter new Username
    browser.find_element_by_xpath(xpaths['newUser']).clear()
    browser.find_element_by_xpath(xpaths['newUser']).send_keys(newuser)

    # Enter Password
    browser.find_element_by_xpath(xpaths['newUserPass']).send_keys(newuserpassword)
    # Enter Password Conf
    browser.find_element_by_xpath(xpaths['newUserPassConf']).send_keys(newuserpassword)
    # Click on create new User button
    assert is_element_present(browser, xpaths['saveButton']) is True
    browser.find_element_by_xpath(xpaths['saveButton']).click()
    browser.find_element_by_xpath(xpaths['cancelButton']).click()
    # wait on the fabAction
    xpath = xpaths['fabAction']
    wait = wait_on_element(browser, xpath, script_name, test_name)
    assert wait, f'Loading Users page timeout'
    # taking screenshot
    take_screenshot(browser, script_name, test_name)
    no_error = error_check(browser)
    assert no_error['result'], no_error['traceback']


def test_06_create_newuser_suggested_name(browser):
    test_name = sys._getframe().f_code.co_name
    # Click create new user option
    browser.find_element_by_xpath(xpaths['fabAction']).click()
    # wait on the page to load
    wait = wait_on_element(browser, xpaths['newUserName'], script_name, test_name)
    assert wait, f'Loading Users Add page timeout'
    # Enter User Full name
    browser.find_element_by_xpath(xpaths['newUserName']).send_keys(nouserfn)

    browser.find_element_by_xpath(xpaths['newUserEmail']).send_keys(newuseremail)
    # Enter Password
    browser.find_element_by_xpath(xpaths['newUserPass']).send_keys(newuserpassword)
    # Enter Password Conf
    browser.find_element_by_xpath(xpaths['newUserPassConf']).send_keys(newuserpassword)
    # Click on create new User button
    assert is_element_present(browser, xpaths['saveButton']) is True
    browser.find_element_by_xpath(xpaths['saveButton']).click()
    # wait on the fabAction
    xpath = xpaths['fabAction']
    wait = wait_on_element(browser, xpath, script_name, test_name)
    assert wait, f'Loading Users page timeout'
    # taking screenshot
    take_screenshot(browser, script_name, test_name)
    no_error = error_check(browser)
    assert no_error['result'], no_error['traceback']
