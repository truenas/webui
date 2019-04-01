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
from function import take_screenshot, is_element_present
from source import newgroupname, supergroupname


skip_mesages = "Skipping first run"
script_name = os.path.basename(__file__).partition('.')[0]


xpaths = {
    'navAccount': "//span[contains(.,'Accounts')]",
    'submenuGroup': '//*[@id="1-0"]',
    'newGroupName': "//div[@id='bsdgrp_group']/mat-form-field/div/div/div/input",
    'fabTrigger': '//*[@id="myFab"]/div/smd-fab-trigger/button',
    'fabAction': '//*[@id="add_action_button"]',
    'saveButton': '//*[@id="save_button"]',
    'permitsudoCheckbox': '//*[@id="bsdgrp_sudo"]/mat-checkbox/label/div',
    'breadcrumbBar': "//*[@id='breadcrumb-bar']/ul/li[2]/a"
}


def test_00_set_implicitly_wait(wb_driver):
    wb_driver.implicitly_wait(1)


# Test navigation Account>Users>Hover>New User and enter user-name, full-name,
# password, confirmation and wait till user is  visible in the list
def test_01_nav_acc_group(wb_driver):
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
    # Click on save new Group button
    wb_driver.find_element_by_xpath(xpaths['saveButton']).click()
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
    # check if there is a generic error when making a duplicate group, and print the error
    error_check(wb_driver)


def test_03_create_supergroup(wb_driver):
    time.sleep(1)
    # Click Group sub-menu
    wb_driver.find_element_by_xpath(xpaths['submenuGroup']).click()
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
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
    # check if there is a generic error when making a duplicate group, and print the error
    error_check(wb_driver)


def test_04_create_duplicategroup(wb_driver):
    # Click Group submenu
    wb_driver.find_element_by_xpath(xpaths['submenuGroup']).click()
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
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
    # check if there is a generic error when making a duplicate group, and print the error
    error_check(wb_driver)


def test_05_close_navAccount(wb_driver):
    wb_driver.find_element_by_xpath(xpaths['navAccount']).click()
    time.sleep(20)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)

# Next step-- To check if the new user is present in the list via automation


def error_check(wb_driver):
    if is_element_present(wb_driver, '//*[contains(text(), "Close")]'):
        if is_element_present(wb_driver, '/html/body/div[5]/div[2]/div/mat-dialog-container/error-dialog/h1'):
            ui_element = wb_driver.find_element_by_xpath('/html/body/div[5]/div[2]/div/mat-dialog-container/error-dialog/h1')
            error_element = ui_element.text
            print(error_element)
        wb_driver.find_element_by_xpath('//*[contains(text(), "Close")]').click()
        print("Duplicate user cannot be created")
    if is_element_present(wb_driver, '//*[contains(text(), "Close")]'):
        if is_element_present(wb_driver, '/html/body/div[5]/div[2]/div/mat-dialog-container/error-dialog/h1'):
            ui_element = wb_driver.find_element_by_xpath('/html/body/div[5]/div[2]/div/mat-dialog-container/error-dialog/h1')
            error_element = ui_element.text
            print(error_element)
        wb_driver.find_element_by_xpath('//*[contains(text(), "Close")]').click()
        print("Duplicate user cannot be created")
