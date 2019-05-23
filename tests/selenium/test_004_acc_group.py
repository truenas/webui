# !/usr/bin/env python
# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 5

import sys
import os
import time
cwd = str(os.getcwd())
sys.path.append(cwd)
from function import take_screenshot, error_check, wait_on_element
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
    'cancelButton': "//button[@id='goback_button']/span",
    'permitsudoCheckbox': '//*[@id="bsdgrp_sudo"]/mat-checkbox/label/div',
    'breadcrumbBar': "//*[@id='breadcrumb-bar']/ul/li[2]/a",
    'toDashboard': "//span[contains(.,'Dashboard')]",
    'breadcrumbBar1': '//li/a'
}


# Test navigation Account>Users>Hover>New User and enter user-name, full-name,
# password, confirmation and wait till user is  visible in the list
def test_01_navigate_to_account_groups(wb_driver):
    # Click User submenu
    wb_driver.find_element_by_xpath(xpaths['submenuGroup']).click()
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
    test_name = sys._getframe().f_code.co_name
    # Click create new group option
    wb_driver.find_element_by_xpath(xpaths['fabAction']).click()
    # Enter New Groupname
    wb_driver.find_element_by_xpath(xpaths['newGroupName']).send_keys(newgroupname)
    # Click on save new Group button
    wb_driver.find_element_by_xpath(xpaths['saveButton']).click()
    # wait on the fabAction
    xpath = xpaths['fabAction']
    wait = wait_on_element(wb_driver, xpath, script_name, test_name)
    assert wait, f'Loading Users page timeout'
    # taking screenshot
    take_screenshot(wb_driver, script_name, test_name)
    no_error = error_check(wb_driver)
    assert no_error['result'], no_error['traceback']


def test_03_create_supergroup(wb_driver):
    test_name = sys._getframe().f_code.co_name
    # Click create new group option
    wb_driver.find_element_by_xpath(xpaths['fabAction']).click()
    # Enter New Groupname
    wb_driver.find_element_by_xpath(xpaths['newGroupName']).send_keys(supergroupname)
    # Check Permit sudo  checkbox
    wb_driver.find_element_by_xpath(xpaths['permitsudoCheckbox']).click()
    # Click on save new Group button
    wb_driver.find_element_by_xpath(xpaths['saveButton']).click()
    # wait on the fabAction
    xpath = xpaths['fabAction']
    wait = wait_on_element(wb_driver, xpath, script_name, test_name)
    assert wait, f'Loading Users page timeout'
    # taking screenshot
    take_screenshot(wb_driver, script_name, test_name)
    no_error = error_check(wb_driver)
    assert no_error['result'], no_error['traceback']


def test_04_create_duplicategroup(wb_driver):
    test_name = sys._getframe().f_code.co_name
    # Click create new group option
    wb_driver.find_element_by_xpath(xpaths['fabAction']).click()
    # Enter New Groupname
    wb_driver.find_element_by_xpath(xpaths['newGroupName']).send_keys(newgroupname)
    # Click on save new Group button
    if wb_driver.find_element_by_xpath(xpaths['saveButton']):
        print("found the save button")
        wb_driver.find_element_by_xpath(xpaths['saveButton']).click()
    else:
        print("could not find the save button and clicking")
    wb_driver.find_element_by_xpath(xpaths['cancelButton']).click()
    # wait on the fabAction
    xpath = xpaths['fabAction']
    wait = wait_on_element(wb_driver, xpath, script_name, test_name)
    assert wait, f'Loading Users page timeout'
    # taking screenshot
    take_screenshot(wb_driver, script_name, test_name)
    no_error = error_check(wb_driver)
    assert no_error['result'], no_error['traceback']


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
