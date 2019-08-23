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
    'disconnectPool1': f"//button[@id='action_button_Export/Disconnect__{pool1}']/span",
    'disconnectPool2': f"//button[@id='action_button_Export/Disconnect__{pool2}']/span"
}


def test_01_nav_store_pool(browser):
    test_name = sys._getframe().f_code.co_name
    # Wait for xpath to be available
    wait_on_element(browser, xpaths['navStorage'], script_name, test_name)
    # Click Storage menu
    browser.find_element_by_xpath(xpaths['navStorage']).click()
    # Click Pool submenu
    browser.find_element_by_xpath(xpaths['submenuPool']).click()
    # get the ui element
    ui_element = browser.find_element_by_xpath(xpaths['breadcrumbBar1'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert "Storage" in page_data, page_data
    # get the ui element
    ui_element = browser.find_element_by_xpath(xpaths['breadcrumbBar2'])
    # get the weather data
    element_text = ui_element.text
    # assert response
    assert "Pools" in element_text, element_text
    # taking screenshot
    take_screenshot(browser, script_name, test_name)


def test_02_wait_for_pool1_to_appear(browser):
    test_name = sys._getframe().f_code.co_name
    xpath = xpaths['foldPoolTable']
    wait = wait_on_element(browser, xpath, script_name, test_name)
    assert wait, 'Loading pool table timeout'
    # get the ui element
    ui_element = browser.find_element_by_xpath(xpaths['foldPoolTable'])
    element_text = ui_element.text
    # assert response
    assert pool1 in element_text, element_text
    # taking screenshot
    take_screenshot(browser, script_name, test_name)


def test_03_click_on_pool1_operation(browser):
    test_name = sys._getframe().f_code.co_name
    # Wait for xpath to be available
    element_present = is_element_present(browser, xpaths['poolID'])
    assert element_present, f'XPath Not Found: {xpaths["poolID"]}'
    pool_xpath = f"//mat-icon[@id='table_actions_menu_button__name_{pool1}']"
    element_present = is_element_present(browser, pool_xpath)
    assert element_present, f'XPath Not Found: {pool_xpath}'
    browser.find_element_by_xpath(pool_xpath).click()
    wait_on_element(browser, xpaths['disconnectPool1'], script_name, test_name)
    take_screenshot(browser, script_name, test_name)
    element_present = is_element_present(browser, pool_xpath)
    assert element_present, f'XPath Not Found: {xpaths["disconnectPool1"]}'


def test_04_click_disconect_pool(browser):
    test_name = sys._getframe().f_code.co_name
    browser.find_element_by_xpath(xpaths['disconnectPool1']).click()
    wait = wait_on_element(
        browser,
        xpaths['pooldestroyCheckbox'],
        script_name,
        test_name
    )
    take_screenshot(browser, script_name, test_name)
    assert wait is True, f'XPath Not Found: {xpaths["pooldestroyCheckbox"]}'


def test_05_set_destroy_data_and_Confirm_press_export_disconnect(browser):
    test_name = sys._getframe().f_code.co_name
    browser.find_element_by_xpath(xpaths['pooldestroyCheckbox']).click()
    browser.find_element_by_xpath(xpaths['poolconfirmCheckbox']).click()
    element_present = is_element_present(browser, xpaths['confirmButton'])
    take_screenshot(browser, script_name, test_name)
    assert element_present, f'XPath Not Found: {xpaths["confirmButton"]}'
    browser.find_element_by_xpath(xpaths['confirmButton']).click()


def test_06_close_disconnect_pool1_window(browser):
    test_name = sys._getframe().f_code.co_name
    # Wait for xpath to be available
    wait = wait_on_element(
        browser,
        xpaths['closeButton'],
        script_name,
        test_name
    )
    take_screenshot(browser, script_name, test_name)
    assert wait is True, f'XPath Not Found: {xpaths["closeButton"]}'
    browser.find_element_by_xpath(xpaths['closeButton']).click()


def test_07_looking_for_pool2(browser):
    test_name = sys._getframe().f_code.co_name
    xpath = xpaths['topPoolTable']
    wait = wait_on_element(browser, xpath, script_name, test_name)
    assert wait, 'Loading pool table timeout'
    # get the ui element
    ui_element = browser.find_element_by_xpath(xpaths['topPoolTable'])
    element_text = ui_element.text
    # assert response
    assert pool2 in element_text, element_text
    # taking screenshot
    take_screenshot(browser, script_name, test_name)


def test_08_click_on_pool2_operation(browser):
    test_name = sys._getframe().f_code.co_name
    # Wait for xpath to be available
    element_present = is_element_present(browser, xpaths['poolID'])
    assert element_present, f'XPath Not Found: {xpaths["poolID"]}'
    pool_xpath = f"//mat-icon[@id='table_actions_menu_button__name_{pool2}']"
    element_present = is_element_present(browser, pool_xpath)
    assert element_present, f'XPath Not Found: {pool_xpath}'
    browser.find_element_by_xpath(pool_xpath).click()
    wait_on_element(browser, xpaths['disconnectPool2'], script_name, test_name)
    take_screenshot(browser, script_name, test_name)
    element_present = is_element_present(browser, pool_xpath)
    assert element_present, f'XPath Not Found: {xpaths["disconnectPool2"]}'


def test_09_click_disconect_pool(browser):
    test_name = sys._getframe().f_code.co_name
    browser.find_element_by_xpath(xpaths['disconnectPool2']).click()
    wait = wait_on_element(
        browser,
        xpaths['pooldestroyCheckbox'],
        script_name,
        test_name
    )
    take_screenshot(browser, script_name, test_name)
    assert wait is True, f'XPath Not Found: {xpaths["pooldestroyCheckbox"]}'


def test_10_set_destroy_data_and_Confirm_press_export_disconnect(browser):
    test_name = sys._getframe().f_code.co_name
    browser.find_element_by_xpath(xpaths['pooldestroyCheckbox']).click()
    browser.find_element_by_xpath(xpaths['poolconfirmCheckbox']).click()
    element_present = is_element_present(browser, xpaths['confirmButton'])
    take_screenshot(browser, script_name, test_name)
    assert element_present, f'XPath Not Found: {xpaths["confirmButton"]}'
    browser.find_element_by_xpath(xpaths['confirmButton']).click()


def test_11_close_disconect_pool2_window(browser):
    test_name = sys._getframe().f_code.co_name
    # Wait for xpath to be available
    wait = wait_on_element(
        browser,
        xpaths['closeButton'],
        script_name,
        test_name
    )
    take_screenshot(browser, script_name, test_name)
    assert wait is True, f'XPath Not Found: {xpaths["closeButton"]}'
    browser.find_element_by_xpath(xpaths['closeButton']).click()


def test_12_verify_that_there_is_no_pool(browser):
    test_name = sys._getframe().f_code.co_name
    xpath = xpaths['noPool']
    wait = wait_on_element(browser, xpath, script_name, test_name)
    assert wait, 'Loading pool table timeout'
    # get the ui element
    ui_element = browser.find_element_by_xpath(xpaths['noPool'])
    element_text = ui_element.text
    # assert response
    assert 'No pools' in element_text, element_text
    # taking screenshot
    take_screenshot(browser, script_name, test_name)


def test_13_close_navStorage(browser):
    browser.find_element_by_xpath(xpaths['navStorage']).click()
    test_name = sys._getframe().f_code.co_name
    take_screenshot(browser, script_name, test_name)


def test_14_return_to_dashboard(browser):
    # Close the System Tab
    browser.find_element_by_xpath(xpaths['toDashboard']).click()
    time.sleep(1)
    # get the ui element
    ui_element = browser.find_element_by_xpath(xpaths['breadcrumbBar1'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert page_data == "Dashboard", page_data
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(browser, script_name, test_name)
