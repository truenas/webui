# Author: Rishabh Chauhan
# License: BSD

import sys
import os
import time
cwd = str(os.getcwd())
sys.path.append(cwd)
from function import take_screenshot, pool1, pool2, wait_on_element
from function import is_element_present

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
    'toDashboard': "//span[contains(.,'Dashboard')]",
    'disconnect': "//button[@id='action_button___']/span"
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


def test_02_wait_for_pool1_to_appear(wb_driver):
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


def test_03_click_on_pool1_operation(wb_driver):
    test_name = sys._getframe().f_code.co_name
    # Wait for xpath to be available
    wait = wait_on_element(wb_driver, xpaths['poolID'], script_name, test_name)
    assert wait, 'wait on pool ID timeout'
    pool_xpath = f"//mat-icon[@id='table_actions_menu_button__name_{pool1}']"
    element_present = is_element_present(wb_driver, pool_xpath)
    assert element_present, f'XPath Not Found: {pool_xpath}'
    wb_driver.find_element_by_xpath(pool_xpath).click()
    wait_on_element(wb_driver, xpaths['disconnect'], script_name, test_name)
    take_screenshot(wb_driver, script_name, test_name)
    element_present = is_element_present(wb_driver, pool_xpath)
    assert element_present, f'XPath Not Found: {xpaths["disconnect"]}'


def test_04_click_disconect_pool(wb_driver):
    test_name = sys._getframe().f_code.co_name
    wb_driver.find_element_by_xpath(xpaths['disconnect']).click()
    wait = wait_on_element(
        wb_driver,
        xpaths['pooldestroyCheckbox'],
        script_name,
        test_name
    )
    take_screenshot(wb_driver, script_name, test_name)
    assert wait is True, f'XPath Not Found: {xpaths["pooldestroyCheckbox"]}'


def test_05_set_destroy_data_and_Confirm_press_export_disconnect(wb_driver):
    test_name = sys._getframe().f_code.co_name
    wb_driver.find_element_by_xpath(xpaths['pooldestroyCheckbox']).click()
    wb_driver.find_element_by_xpath(xpaths['poolconfirmCheckbox']).click()
    element_present = is_element_present(wb_driver, xpaths['confirmButton'])
    take_screenshot(wb_driver, script_name, test_name)
    assert element_present, f'XPath Not Found: {xpaths["confirmButton"]}'
    wb_driver.find_element_by_xpath(xpaths['confirmButton']).click()


def test_06_close_diesconnect(wb_driver):
    test_name = sys._getframe().f_code.co_name
    # Wait for xpath to be available
    wait = wait_on_element(
        wb_driver,
        xpaths['closeButton'],
        script_name,
        test_name
    )
    take_screenshot(wb_driver, script_name, test_name)
    assert wait is True, f'XPath Not Found: {xpaths["closeButton"]}'
    wb_driver.find_element_by_xpath(xpaths['closeButton']).click()


def test_07_looking_for_pool2(wb_driver):
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


def test_08_click_on_pool2_operation(wb_driver):
    test_name = sys._getframe().f_code.co_name
    # Wait for xpath to be available
    wait = wait_on_element(wb_driver, xpaths['poolID'], script_name, test_name)
    assert wait, 'wait on pool ID timeout'
    pool_xpath = f"//mat-icon[@id='table_actions_menu_button__name_{pool2}']"
    element_present = is_element_present(wb_driver, pool_xpath)
    assert element_present, f'XPath Not Found: {pool_xpath}'
    wb_driver.find_element_by_xpath(pool_xpath).click()
    wait_on_element(wb_driver, xpaths['disconnect'], script_name, test_name)
    take_screenshot(wb_driver, script_name, test_name)
    element_present = is_element_present(wb_driver, pool_xpath)
    assert element_present, f'XPath Not Found: {xpaths["disconnect"]}'


def test_09_click_disconect_pool(wb_driver):
    test_name = sys._getframe().f_code.co_name
    wb_driver.find_element_by_xpath(xpaths['disconnect']).click()
    wait = wait_on_element(
        wb_driver,
        xpaths['pooldestroyCheckbox'],
        script_name,
        test_name
    )
    take_screenshot(wb_driver, script_name, test_name)
    assert wait is True, f'XPath Not Found: {xpaths["pooldestroyCheckbox"]}'


def test_10_set_destroy_data_and_Confirm_press_export_disconnect(wb_driver):
    test_name = sys._getframe().f_code.co_name
    wb_driver.find_element_by_xpath(xpaths['pooldestroyCheckbox']).click()
    wb_driver.find_element_by_xpath(xpaths['poolconfirmCheckbox']).click()
    element_present = is_element_present(wb_driver, xpaths['confirmButton'])
    take_screenshot(wb_driver, script_name, test_name)
    assert element_present, f'XPath Not Found: {xpaths["confirmButton"]}'
    wb_driver.find_element_by_xpath(xpaths['confirmButton']).click()


def test_11_close_disconect_pool2_window(wb_driver):
    test_name = sys._getframe().f_code.co_name
    # Wait for xpath to be available
    wait = wait_on_element(
        wb_driver,
        xpaths['closeButton'],
        script_name,
        test_name
    )
    take_screenshot(wb_driver, script_name, test_name)
    assert wait is True, f'XPath Not Found: {xpaths["closeButton"]}'
    wb_driver.find_element_by_xpath(xpaths['closeButton']).click()


def test_12_verify_that_there_is_no_pool(wb_driver):
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


def test_13_close_navStorage(wb_driver):
    wb_driver.find_element_by_xpath(xpaths['navStorage']).click()
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_14_return_to_dashboard(wb_driver):
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
