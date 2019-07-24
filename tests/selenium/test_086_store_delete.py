# Author: Rishabh Chauhan
# License: BSD

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
    'breadcrumbBar1': "//div[@id='breadcrumb-bar']/ul/li/a",
    'breadcrumbBar2': "//*[@id='breadcrumb-bar']/ul/li[2]/a",
    'poolID': '//mat-expansion-panel-header/span[2]',
    'poolDetach': "//button[@id='action_button_Export/Disconnect__name_",
    'pooldestroyCheckbox': '//*[@id="destroy"]/mat-checkbox/label/div',
    'poolconfirmCheckbox': '//*[@id="confirm"]/mat-checkbox/label/div',
    'confirmButton': '//div[3]/button[2]/span',
    'closeButton': '//div[2]/button/span',
    'foldPoolTable': "//mat-panel-title",
    'topPoolTable': '//td',
    'noPool': '//mat-card-content',
    'toDashboard': "//span[contains(.,'Dashboard')]"
}


def test_01_nav_store_pool(wb_driver):
    test_name = sys._getframe().f_code.co_name
    # Wait for xpath to be available
    wait_on_element(wb_driver, xpaths['navStorage'], script_name, test_name)
    # Click Storage menu
    wb_driver.find_element_by_xpath(xpaths['navStorage']).click()
    # Click Pool submenu
    wb_driver.find_element_by_xpath(xpaths['submenuPool']).click()
    # get the ui element
    ui_element = wb_driver.find_element_by_xpath(xpaths['breadcrumbBar1'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert "Storage" in page_data, page_data
    # get the ui element
    ui_element = wb_driver.find_element_by_xpath(xpaths['breadcrumbBar2'])
    # get the weather data
    element_text = ui_element.text
    # assert response
    assert "Pools" in element_text, element_text
    # taking screenshot
    take_screenshot(wb_driver, script_name, test_name)


def test_02_looking_for_pool1(wb_driver):
    test_name = sys._getframe().f_code.co_name
    xpath = xpaths['foldPoolTable']
    wait = wait_on_element(wb_driver, xpath, script_name, test_name)
    assert wait, 'Loading pool table timeout'
    # get the ui element
    ui_element = wb_driver.find_element_by_xpath(xpaths['foldPoolTable'])
    element_text = ui_element.text
    # assert response
    assert pool1 in element_text, element_text
    # taking screenshot
    take_screenshot(wb_driver, script_name, test_name)


def test_03_delete_pool1(wb_driver):
    test_name = sys._getframe().f_code.co_name
    # Wait for xpath to be available
    wait_on_element(wb_driver, xpaths['poolID'], script_name, test_name)
    # wb_driver.find_element_by_xpath(xpaths['poolID']).click()
    time.sleep(1)
    pool_detach(wb_driver, pool1, script_name, test_name)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_04_looking_for_pool2(wb_driver):
    test_name = sys._getframe().f_code.co_name
    xpath = xpaths['topPoolTable']
    wait = wait_on_element(wb_driver, xpath, script_name, test_name)
    assert wait, 'Loading pool table timeout'
    # get the ui element
    ui_element = wb_driver.find_element_by_xpath(xpaths['topPoolTable'])
    element_text = ui_element.text
    # assert response
    assert pool2 in element_text, element_text
    # taking screenshot
    take_screenshot(wb_driver, script_name, test_name)


def test_05_delete_pool2(wb_driver):
    test_name = sys._getframe().f_code.co_name
    pool_detach(wb_driver, pool2, script_name, test_name)
    # taking screenshot
    take_screenshot(wb_driver, script_name, test_name)


def test_06_looking_for_pool2(wb_driver):
    test_name = sys._getframe().f_code.co_name
    xpath = xpaths['noPool']
    wait = wait_on_element(wb_driver, xpath, script_name, test_name)
    assert wait, 'Loading pool table timeout'
    # get the ui element
    ui_element = wb_driver.find_element_by_xpath(xpaths['noPool'])
    element_text = ui_element.text
    # assert response
    assert 'No pools' in element_text, element_text
    # taking screenshot
    take_screenshot(wb_driver, script_name, test_name)


def test_07_close_navStorage(wb_driver):
    wb_driver.find_element_by_xpath(xpaths['navStorage']).click()
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_08_return_to_dashboard(wb_driver):
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


def pool_detach(wb_driver, name, scriptname, testname):
    pool_xpath = f"//mat-icon[@id='table_actions_menu_button__name_{name}']"
    # Wait for xpath to be available
    wait_on_element(wb_driver, pool_xpath, scriptname, testname)
    wb_driver.find_element_by_xpath(pool_xpath).click()
    xpath = "//button[@id='action_button___']/span"
    wb_driver.find_element_by_xpath(xpath).click()
    wb_driver.find_element_by_xpath(xpaths['pooldestroyCheckbox']).click()
    wb_driver.find_element_by_xpath(xpaths['poolconfirmCheckbox']).click()
    if wb_driver.find_element_by_xpath(xpaths['confirmButton']):
        wb_driver.find_element_by_xpath(xpaths['confirmButton']).click()
    # Wait for xpath to be available
    wait_on_element(wb_driver, xpaths['closeButton'], scriptname, testname)
    wb_driver.find_element_by_xpath(xpaths['closeButton']).click()
