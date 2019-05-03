# Author: Rishabh Chauhan
# License: BSD

import sys
import os
import time
cwd = str(os.getcwd())
sys.path.append(cwd)
from function import take_screenshot, wait_on_element, error_check

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
    'breadcrumbBar': "//*[@id='breadcrumb-bar']/ul/li[2]/a",
    'pool1Table': f"//mat-panel-title[contains(.,'{pool1}')]",
    'pool2Table': f"//mat-panel-title[contains(.,'{pool2}')]"
}


def test_01_nav_store_pool(wb_driver):
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


def test_02_create_a_pool(wb_driver):
    test_name = sys._getframe().f_code.co_name
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
    xpath = xpaths['addAction']
    wait = wait_on_element(wb_driver, xpath, script_name, test_name)
    assert wait, f'Creating the new pool {pool1} timeout'
    # taking screenshot
    take_screenshot(wb_driver, script_name, test_name)
    no_error = error_check(wb_driver)
    assert no_error['result'], no_error['traceback']


def test_03_looking_if_the_new_pool_exist(wb_driver):
    test_name = sys._getframe().f_code.co_name
    xpath = xpaths['pool1Table']
    wait = wait_on_element(wb_driver, xpath, script_name, test_name)
    assert wait, 'Loading pool table timeout'
    # get the ui element
    ui_element = wb_driver.find_element_by_xpath(xpaths['pool1Table'])
    element_text = ui_element.text
    # assert response
    assert pool1 in element_text, element_text
    # taking screenshot
    take_screenshot(wb_driver, script_name, test_name)


def test_04_create_newpool2(wb_driver):
    test_name = sys._getframe().f_code.co_name
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
    # check box confirmation
    wb_driver.find_element_by_xpath(xpaths['confirmCheckbox']).click()
    # Click OK Button
    wb_driver.find_element_by_xpath(xpaths['createpoolButton']).click()
    xpath = xpaths['addAction']
    wait = wait_on_element(wb_driver, xpath, script_name, test_name)
    assert wait, f'Creating the new pool {pool2} timeout'
    # taking screenshot
    take_screenshot(wb_driver, script_name, test_name)
    no_error = error_check(wb_driver)
    assert no_error['result'], no_error['traceback']


def test_05_looking_if_the_new_pool_exist(wb_driver):
    test_name = sys._getframe().f_code.co_name
    xpath = xpaths['pool2Table']
    wait = wait_on_element(wb_driver, xpath, script_name, test_name)
    assert wait, 'Loading pool table timeout'
    # get the ui element
    ui_element = wb_driver.find_element_by_xpath(xpaths['pool2Table'])
    element_text = ui_element.text
    # assert response
    assert pool2 in element_text, element_text
    # taking screenshot
    take_screenshot(wb_driver, script_name, test_name)
    # taking screenshot
    take_screenshot(wb_driver, script_name, test_name)


def test_06_close_navStorage(wb_driver):
    test_name = sys._getframe().f_code.co_name
    # Wait for xpath to be available
    wait_on_element(wb_driver, xpaths['navStorage'], script_name, test_name)
    wb_driver.find_element_by_xpath(xpaths['navStorage']).click()
    take_screenshot(wb_driver, script_name, test_name)
