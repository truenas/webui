# !/usr/bin/env python
# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 6

import sys
import os
import time
from selenium.webdriver.common.keys import Keys
cwd = str(os.getcwd())
sys.path.append(cwd)
from function import take_screenshot, is_element_present
from source import pool1, pool2


skip_mesages = "Skipping first run"
script_name = os.path.basename(__file__).partition('.')[0]

xpaths = {
    'navStorage': '//*[@id="nav-5"]/div/a[1]',
    'submenuPool': '//*[@id="5-0"]',
    'addAction': '//*[@id="add_action_button"]',
    'forwardButton': '//*[@id="custom_button"]',
    'newpoolName': '//*[@id="pool-manager__name-input-field"]',
    'disk1Checkbox': "//mat-checkbox[@id='pool-manager__disks-ada1']/label/div",
    'disk2Checkbox': "//mat-checkbox[@id='pool-manager__disks-ada2']/label/div",
    'disk3Checkbox': "//mat-checkbox[@id='pool-manager__disks-ada3']/label/div",
    'diskselectedmoveButton': '//*[@id="vdev__add-button"]',
    'createButton': '//*[@id="pool-manager__create-button"]',
    # very important and useful
    # 'confirmCheckbox': '//*[contains(@name, "confirm_checkbox")]',
    # or
    'confirmCheckbox': '//*[@id="confirm-dialog__confirm-checkbox"]/label/div',
    # 'createpoolButton': '//*[contains(text(), "CREATE POOL")]'
    # or
    'createpoolButton': '//*[@id="confirm-dialog__action-button"]/span',
    'breadcrumbBar': "//*[@id='breadcrumb-bar']/ul/li[2]/a"
}


def test_00_set_implicitly_wait(wb_driver):
    wb_driver.implicitly_wait(1)


def test_01_nav_store_pool(wb_driver):
    error_check(wb_driver)
    # Click  Storage menu
    a = wb_driver.find_element_by_xpath(xpaths['navStorage'])
    a.click()
    # allowing the button to load
    time.sleep(1)
    # Click Pool submenu
    wb_driver.find_element_by_xpath(xpaths['submenuPool']).click()
    # get the ui element
    ui_element = wb_driver.find_element_by_xpath(xpaths['breadcrumbBar'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert "Pools" in page_data, page_data
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_02_create_newpool(wb_driver):
    time.sleep(1)
    # Click create new pool option
    wb_driver.find_element_by_xpath(xpaths['addAction']).click()
    # Click create Pool Button
    wb_driver.find_element_by_xpath(xpaths['forwardButton']).click()
    # Enter User Full name
    wb_driver.find_element_by_xpath(xpaths['newpoolName']).send_keys(pool1)
    # Select the disk
    wb_driver.find_element_by_xpath(xpaths['disk1Checkbox']).click()
    # Select the disk
    wb_driver.find_element_by_xpath(xpaths['diskselectedmoveButton']).click()
    # Click on create new Pool button
    wb_driver.find_element_by_xpath(xpaths['createButton']).click()
    # checkbox confirmation
    wb_driver.find_element_by_xpath(xpaths['confirmCheckbox']).click()
    # Click Ok Button
    wb_driver.find_element_by_xpath(xpaths['createpoolButton']).click()
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
    error_check(wb_driver)


def test_03_create_newpool2(wb_driver):
    time.sleep(1)
    # Click create new pool option
    wb_driver.find_element_by_xpath(xpaths['addAction']).click()
    # Click create Pool Button
    wb_driver.find_element_by_xpath(xpaths['forwardButton']).click()
    # Enter User Full name
    wb_driver.find_element_by_xpath(xpaths['newpoolName']).send_keys(pool2)
    # Select the 2 disks
    wb_driver.find_element_by_xpath(xpaths['disk2Checkbox']).click()
    wb_driver.find_element_by_xpath(xpaths['disk3Checkbox']).click()
    # Select the disk
    wb_driver.find_element_by_xpath(xpaths['diskselectedmoveButton']).click()
    # Click on create new Pool button
    wb_driver.find_element_by_xpath(xpaths['createButton']).click()
    # checkbox confirmation
    wb_driver.find_element_by_xpath(xpaths['confirmCheckbox']).click()
    # Click Ok Button
    wb_driver.find_element_by_xpath(xpaths['createpoolButton']).click()
    time.sleep(60)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
    error_check(wb_driver)


def test_04_close_navStorage(wb_driver):
    wb_driver.find_element_by_xpath(xpaths['navStorage']).click()
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
    time.sleep(20)

# Next step-- To check if the new user is present in the list via automation


def error_check(wb_driver):
    if is_element_present(wb_driver, '//*[contains(text(), "Close")]'):
        if is_element_present(wb_driver,'/html/body/div[5]/div[2]/div/mat-dialog-container/error-dialog/h1'):
            ui_element = wb_driver.find_element_by_xpath('/html/body/div[5]/div[2]/div/mat-dialog-container/error-dialog/h1')
            error_element = ui_element.text
            print(error_element)
        wb_driver.find_element_by_xpath('//*[contains(text(), "Close")]').click()
        print("Duplicate user cannot be created")
    if is_element_present(wb_driver, '//*[contains(text(), "Close")]'):
        if is_element_present(wb_driver,'/html/body/div[5]/div[2]/div/mat-dialog-container/error-dialog/h1'):
            ui_element = wb_driver.find_element_by_xpath('/html/body/div[5]/div[2]/div/mat-dialog-container/error-dialog/h1')
            error_element = ui_element.text
            print(error_element)
        wb_driver.find_element_by_xpath('//*[contains(text(), "Close")]').click()
        print("Duplicate user cannot be created")
