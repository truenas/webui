# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 5

import sys
import os
import time
cwd = str(os.getcwd())
sys.path.append(cwd)
from function import take_screenshot, error_check, is_element_present
from source import newuser, newuserfn, newgroup

skip_mesages = "Skipping first run"
script_name = os.path.basename(__file__).partition('.')[0]

xpaths = {
    'navAccount': '//*[@id="nav-1"]/div/a[1]',
    'submenuUser': '//*[@id="1-1"]',
    'submenuGroup': '//*[@id="1-0"]',
    'email': "//div[@id='email']/mat-form-field/div/div/div/input",
    'groupSudo': '//*[@id="bsdgrp_sudo"]/mat-checkbox/label/div',
    'breadcrumbBar1': "//div[@id='breadcrumb-bar']/ul/li/a",
    'breadcrumbBar2': "//*[@id='breadcrumb-bar']/ul/li[2]/a",
    'permitSudo': "//div[5]/form-checkbox/div/mat-checkbox/label/div",
    'newuserUserMenu': f"(.//*[normalize-space(text()) and normalize-space(.)='{newuserfn}'])[1]/following::a[1]",
    'newuserUserEdit': f"//button[@id='action_button_edit__{newuser}']/span/div/p",
    'newuserEmail': "(.//*[normalize-space(text()) and normalize-space(.)='Email:'])[1]/following::p[1]",
    'newuserPermitSudo': "(.//*[normalize-space(text()) and normalize-space(.)='Permit Sudo:'])[1]/following::p[1]",
    'newgroupGroupMenu': f"//*[@id='table_actions_menu_button__bsdgrp_group_{newgroup}']",
    'newgroupGroupEdit': f"//*[@id='action_button_edit__{newgroup}']",
    'newgroupPermitSudo': f"(.//*[normalize-space(text()) and normalize-space(.)='{newgroup}'])[1]/following::span[3]"
}


def test_01_navigate_to_account_user(wb_driver):
    # Click  Account menu
    wb_driver.find_element_by_xpath(xpaths['navAccount']).click()
    # allowing the button to load
    time.sleep(1)
    # Click User submenu
    wb_driver.find_element_by_xpath(xpaths['submenuUser']).click()
    # get the ui element
    ui_element = wb_driver.find_element_by_xpath(xpaths['breadcrumbBar1'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert "Account" in page_data, page_data
    # get the ui element
    ui_element = wb_driver.find_element_by_xpath(xpaths['breadcrumbBar2'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert "User" in page_data, page_data
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_02_edit_usernas_email(wb_driver):
    assert is_element_present(wb_driver, xpaths['newuserUserMenu'])
    wb_driver.find_element_by_xpath(xpaths['newuserUserMenu']).click()
    assert is_element_present(wb_driver, xpaths['newuserUserEdit'])
    wb_driver.find_element_by_xpath(xpaths['newuserUserEdit']).click()
    ui_email = wb_driver.find_element_by_xpath(xpaths['email'])
    ui_email.clear()
    ui_email.send_keys("test2@ixsystems.com")
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
    # click save
    wb_driver.find_element_by_xpath('//*[@id="save_button"]').click()
    no_error = error_check(wb_driver)
    assert no_error['result'], no_error['traceback']


def test_03_verify_usernas_email_changed(wb_driver):
    assert is_element_present(wb_driver, xpaths['newuserUserMenu'])
    wb_driver.find_element_by_xpath(xpaths['newuserUserMenu']).click()
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
    ui_element = wb_driver.find_element_by_xpath(xpaths['newuserEmail'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert page_data == "test2@ixsystems.com", page_data
    wb_driver.find_element_by_xpath(xpaths['newuserUserMenu']).click()


def test_04_edit_usernas_permit_sudo(wb_driver):
    assert is_element_present(wb_driver, xpaths['newuserUserMenu'])
    wb_driver.find_element_by_xpath(xpaths['newuserUserMenu']).click()
    assert is_element_present(wb_driver, xpaths['newuserUserEdit'])
    wb_driver.find_element_by_xpath(xpaths['newuserUserEdit']).click()
    wb_driver.find_element_by_xpath(xpaths['permitSudo']).click()
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
    # click save
    wb_driver.find_element_by_xpath('//*[@id="save_button"]').click()
    no_error = error_check(wb_driver)
    assert no_error['result'], no_error['traceback']


def test_05_verify_usernas_permit_sudo_is_true(wb_driver):
    assert is_element_present(wb_driver, xpaths['newuserUserMenu'])
    wb_driver.find_element_by_xpath(xpaths['newuserUserMenu']).click()
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
    ui_element = wb_driver.find_element_by_xpath(xpaths['newuserPermitSudo'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert page_data == "true", page_data
    wb_driver.find_element_by_xpath(xpaths['newuserUserMenu']).click()


def test_06_navigate_to_account_group(wb_driver):
    # Click User submenu
    wb_driver.find_element_by_xpath(xpaths['submenuGroup']).click()
    # get the ui element
    ui_element = wb_driver.find_element_by_xpath(xpaths['breadcrumbBar2'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert "Group" in page_data, page_data
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_07_edit_groupnas_permit_sudo(wb_driver):
    assert is_element_present(wb_driver, xpaths['newgroupGroupMenu'])
    wb_driver.find_element_by_xpath(xpaths['newgroupGroupMenu']).click()
    assert is_element_present(wb_driver, xpaths['newgroupGroupEdit'])
    wb_driver.find_element_by_xpath(xpaths['newgroupGroupEdit']).click()
    assert is_element_present(wb_driver, xpaths['groupSudo'])
    wb_driver.find_element_by_xpath(xpaths['groupSudo']).click()
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
    # click save
    wb_driver.find_element_by_xpath('//*[@id="save_button"]').click()
    time.sleep(5)
    no_error = error_check(wb_driver)
    assert no_error['result'], no_error['traceback']


def test_08_verify_groupnas_permit_sudo_is_yes(wb_driver):
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)

    ui_element = wb_driver.find_element_by_xpath(xpaths['newgroupPermitSudo'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert page_data == "yes", page_data
