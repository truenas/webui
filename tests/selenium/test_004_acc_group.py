# !/usr/bin/env python
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
from function import take_screenshot, error_check
from source import newgroupname, supergroupname


skip_mesages = "Skipping first run"
script_name = os.path.basename(__file__).partition('.')[0]


xpaths = {
    'navAccount': "//span[contains(.,'Accounts')]",
    'submenuGroup': "//a[contains(.,'Groups')]",
    'newGroupName': "//div[@id='bsdgrp_group']/mat-form-field/div/div/div/input",
    'fabTrigger': '//*[@id="myFab"]/div/smd-fab-trigger/button',
    'fabAction': '//*[@id="add_action_button"]',
    'saveButton': '//*[@id="save_button"]',
    'permitsudoCheckbox': '//*[@id="bsdgrp_sudo"]/mat-checkbox/label/div',
    'breadcrumbBar': "//*[@id='breadcrumb-bar']/ul/li[2]/a"
}


# Test navigation Account>Users>Hover>New User and enter user-name, full-name,
# password, confirmation and wait till user is  visible in the list
def test_01_navigate_to_account_groups(wb_driver):
    # Click  Account menu
    wb_driver.find_element_by_xpath(xpaths['navAccount']).click()
    time.sleep(1)
    # Click User submenu
    wb_driver.find_element_by_xpath(xpaths['submenuGroup']).click()
    time.sleep(2)
    # get the ui element
    ui_element1 = wb_driver.find_element_by_xpath(xpaths['breadcrumbBar'])
    # get the weather data
    page_data = ui_element1.text
    # assert response
    assert "Group" in page_data, page_data
    # Taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_02_create_newgroup(wb_driver):
    # scroll down to find hover tab
    wb_driver.find_element_by_tag_name('html').send_keys(Keys.END)
    time.sleep(2)
    # Click create new group option
    wb_driver.find_element_by_xpath(xpaths['fabAction']).click()
    # Enter New Groupname
    time.sleep(1)
    wb_driver.find_element_by_xpath(xpaths['newGroupName']).send_keys(newgroupname)
    time.sleep(1)
    # Click on save new Group button
    wb_driver.find_element_by_xpath(xpaths['saveButton']).click()
    time.sleep(1)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
    # check if there is a generic error when making a duplicate group, and print the error
    no_error = error_check(wb_driver)
    assert no_error['result'], no_error['traceback']
    time.sleep(2)


def test_03_create_supergroup(wb_driver):
    time.sleep(1)
    # Click create new group option
    wb_driver.find_element_by_xpath(xpaths['fabAction']).click()
    # Enter New Groupname
    time.sleep(1)
    wb_driver.find_element_by_xpath(xpaths['newGroupName']).send_keys(supergroupname)
    # Check Permit sudo  checkbox
    wb_driver.find_element_by_xpath(xpaths['permitsudoCheckbox']).click()
    # Click on save new Group button
    wb_driver.find_element_by_xpath(xpaths['saveButton']).click()
    time.sleep(1)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
    # check if there is a generic error when making a duplicate group, and print the error
    no_error = error_check(wb_driver)
    assert no_error['result'], no_error['traceback']
    time.sleep(2)


def test_04_create_duplicategroup(wb_driver):
    # scroll down to find hover tab
    wb_driver.find_element_by_tag_name('html').send_keys(Keys.END)
    time.sleep(2)
    # Click create new group option
    wb_driver.find_element_by_xpath(xpaths['fabAction']).click()
    # Enter New Groupname
    time.sleep(1)
    wb_driver.find_element_by_xpath(xpaths['newGroupName']).send_keys(newgroupname)
    # Click on save new Group button
    wb_driver.find_element_by_xpath(xpaths['saveButton']).click()
    time.sleep(1)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
    # check if there is a generic error when making a duplicate group, and print the error
    no_error = error_check(wb_driver)
    assert no_error['result'], no_error['traceback']
    time.sleep(2)


def test_05_close_navAccount(wb_driver):
    wb_driver.find_element_by_xpath(xpaths['navAccount']).click()
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
