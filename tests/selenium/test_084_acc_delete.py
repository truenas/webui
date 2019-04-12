# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 11

import sys
import os
import time
cwd = str(os.getcwd())
sys.path.append(cwd)
from function import take_screenshot, user_delete
from source import newusername, newgroupname, superusername, newusernameuncheck
from source import supergroupname

skip_mesages = "Skipping first run"
script_name = os.path.basename(__file__).partition('.')[0]

xpaths = {
    'navAccount': '//*[@id="nav-1"]/div/a[1]',
    'submenuUser': '//*[@id="1-1"]',
    'submenuGroup': '//*[@id="1-0"]',
    'confirmCheckbox': '//*[contains(@name, "confirm_checkbox")]',
    'deleteButton': '//*[contains(@name, "ok_button")]',
    'breadcrumbBar': '//*[@id="breadcrumb-bar"]/ul/li[2]/a'
}


def test_00_set_implicitly_wait(wb_driver):
    wb_driver.implicitly_wait(1)


def test_01_nav_acc_user(wb_driver):
    # Click  Account menu
    # allowing the button to load
    time.sleep(1)
    # Click User sub-menu
    wb_driver.find_element_by_xpath(xpaths['submenuUser']).click()
    # get the ui element
    ui_element = wb_driver.find_element_by_xpath(xpaths['breadcrumbBar'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert "User" in page_data, page_data
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_02_delete_user(wb_driver):
    time.sleep(2)
    user_delete(wb_driver, "user", newusername)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_04_delete_user(wb_driver):
    time.sleep(2)
    user_delete(wb_driver, "user", newusernameuncheck)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_05_delete_user(wb_driver):
    time.sleep(2)
    user_delete(wb_driver, "user", superusername)
    time.sleep(2)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_06_delete_user(wb_driver):
    time.sleep(2)
    user_delete(wb_driver, "user", "unas")
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_07_nav_acc_group(wb_driver):
    # Click  Account menu
    # Click User submenu
    wb_driver.find_element_by_xpath(xpaths['submenuGroup']).click()
    # get the ui element
    ui_element = wb_driver.find_element_by_xpath(xpaths['breadcrumbBar'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert "Group" in page_data, page_data
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_08_delete_group(wb_driver):
    time.sleep(2)
    user_delete(wb_driver, "group", newusername)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_09_delete_group(wb_driver):
    time.sleep(2)
    user_delete(wb_driver, "group", superusername)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_10_delete_group(wb_driver):
    time.sleep(2)
    user_delete(wb_driver, "group", newgroupname)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_11_delete_group(wb_driver):
    time.sleep(2)
    user_delete(wb_driver, "group", supergroupname)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_12_close_navAccount(wb_driver):
    wb_driver.find_element_by_xpath(xpaths['navAccount']).click()
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
