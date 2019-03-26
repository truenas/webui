# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 10

import sys
import os
import time
cwd = str(os.getcwd())
sys.path.append(cwd)
from function import take_screenshot, pool1, pool2

skip_mesages = "Skipping first run"
script_name = os.path.basename(__file__).partition('.')[0]


xpaths = {
    'navStorage': '//*[@id="nav-5"]/div/a[1]',
    'submenuPool': '//*[@id="5-0"]',
    'submenuDisks': '//*[@id="5-3"]',
    'confirmCheckbox': '//*[contains(@name, "confirm_checkbox")]',
    'deleteButton': '//*[contains(@name, "ok_button")]',
    'breadcrumbBar': "//*[@id='breadcrumb-bar']/ul/li[2]/a",
    'poolID': '//*[@id="expansionpanel_zfs_',
    'poolDetach': '//*[@id="action_button_Detach"]',
    'pooldestroyCheckbox': '//*[@id="destroy"]/mat-checkbox/label/div',
    'poolconfirmCheckbox': '//*[@id="confirm"]/mat-checkbox/label/div',
    'detachButton': '//*[contains(@name, "Detach_button")]',
    'closeButton': '//*[contains(text(), "Close")]',
}


def test_00_set_implicitly_wait(wb_driver):
    wb_driver.implicitly_wait(1)


def test_01_nav_store_pool(wb_driver):
    # Click  Storage menu
    print(" navigating to the Pool submenu")
    # allowing the button to load
    time.sleep(1)
    # Click Storage menu
    wb_driver.find_element_by_xpath(xpaths['navStorage']).click()
    # Click Pool submenu
    wb_driver.find_element_by_xpath(xpaths['submenuPool']).click()
    # get the ui element
    ui_element = wb_driver.find_element_by_xpath(xpaths['breadcrumbBar'])
    # get the weather data
    page_data = ui_element.text
    print("the Page now is: " + page_data)
    # assert response
    assert "Pools" in page_data, page_data
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_02_delete_pool1(wb_driver):
    print(" deleting a pool: " + pool1)
    time.sleep(2)
    pool_detach(wb_driver, pool1)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_03_delete_pool2(wb_driver):
    print(" deleting a pool: " + pool2)
    time.sleep(2)
    pool_detach(wb_driver, pool2)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_04_close_navStorage(wb_driver):
    print(" closing Storage menu")
    wb_driver.find_element_by_xpath(xpaths['navStorage']).click()
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
    time.sleep(20)


def pool_detach(wb_driver, name):
    # path plugs in the xpath of user or group , sub-menu{User/Group}
    # num specifies the column of the 3 dots which is different in user/group
    # delNum specifies the option number where delete is after clicking on
    # the 3 dots

    # Click Pool submenu
    wb_driver.find_element_by_xpath(xpaths['submenuPool']).click()
    # wait till the list is loaded
    wb_driver.find_element_by_xpath(xpaths['poolID'] + name + '"]').click()
    time.sleep(1)
    xpath = '"]/div/div/div[1]/div/app-entity-table-actions/div/mat-icon'
    pool_xpath = xpaths['poolID'] + name + xpath
    wb_driver.find_element_by_xpath(pool_xpath).click()
    wb_driver.find_element_by_xpath(xpaths['poolDetach']).click()
    wb_driver.find_element_by_xpath(xpaths['pooldestroyCheckbox']).click()
    wb_driver.find_element_by_xpath(xpaths['poolconfirmdCheckbox']).click()
    time.sleep(3)
    print("clicking on detach")
    if wb_driver.find_element_by_xpath(xpaths['detachButton']):
        print("detach button found")
        wb_driver.find_element_by_xpath(xpaths['detachButton']).click()
        print(" clicked on detach")
    time.sleep(32)
    print("clicking on close")
    wb_driver.find_element_by_xpath(xpaths['closeButton']).click()
    print("already clicked on detach")
