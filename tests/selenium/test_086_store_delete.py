# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 10

import sys
import os
import time
cwd = str(os.getcwd())
sys.path.append(cwd)
from function import take_screenshot, pool1, pool2, wait_on_element

skip_mesages = "Skipping first run"
script_name = os.path.basename(__file__).partition('.')[0]


xpaths = {
    'navStorage': '//*[@id="nav-5"]/div/a[1]',
    'submenuPool': '//*[@id="5-0"]',
    'submenuDisks': '//*[@id="5-3"]',
    'confirmCheckbox': '//*[contains(@name, "confirm_checkbox")]',
    'deleteButton': '//*[contains(@name, "ok_button")]',
    'breadcrumbBar': "//*[@id='breadcrumb-bar']/ul/li[2]/a",
    'poolID': '//mat-expansion-panel-header/span[2]',
    'poolDetach': "//button[@id='action_button_Export/Disconnect__name_",
    'pooldestroyCheckbox': '//*[@id="destroy"]/mat-checkbox/label/div',
    'poolconfirmCheckbox': '//*[@id="confirm"]/mat-checkbox/label/div',
    'confirmButton': '//div[3]/button[2]/span',
    'closeButton': '//div[2]/button/span',
}


def test_00_set_implicitly_wait(wb_driver):
    wb_driver.implicitly_wait(1)


def test_01_nav_store_pool(wb_driver):
    # Wait for xpath to be available
    wait_on_element(wb_driver, xpaths['navStorage'])
    # Click Storage menu
    wb_driver.find_element_by_xpath(xpaths['navStorage']).click()
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


def test_02_delete_pool1(wb_driver):
    # Wait for xpath to be available
    wait_on_element(wb_driver, xpaths['poolID'])
    wb_driver.find_element_by_xpath(xpaths['poolID']).click()
    time.sleep(1)
    pool_detach(wb_driver, pool1)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_03_delete_pool2(wb_driver):
    time.sleep(1)
    pool_detach(wb_driver, pool2)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_04_close_navStorage(wb_driver):
    wb_driver.find_element_by_xpath(xpaths['navStorage']).click()
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def pool_detach(wb_driver, name):
    time.sleep(1)
    pool_xpath = f"//mat-icon[@id='table_actions_menu_button__name_{name}']"
    # Wait for xpath to be available
    wait_on_element(wb_driver, pool_xpath)
    wb_driver.find_element_by_xpath(pool_xpath).click()
    xpath = xpaths['poolDetach'] + name + "']/span"
    wb_driver.find_element_by_xpath(xpath).click()
    wb_driver.find_element_by_xpath(xpaths['pooldestroyCheckbox']).click()
    wb_driver.find_element_by_xpath(xpaths['poolconfirmCheckbox']).click()
    time.sleep(1)
    if wb_driver.find_element_by_xpath(xpaths['confirmButton']):
        wb_driver.find_element_by_xpath(xpaths['confirmButton']).click()
    # Wait for xpath to be available
    wait_on_element(wb_driver, xpaths['closeButton'])
    wb_driver.find_element_by_xpath(xpaths['closeButton']).click()
    time.sleep(1)
