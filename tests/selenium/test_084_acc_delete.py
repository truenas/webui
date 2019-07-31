# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 11

import pytest
import sys
import os
import time
cwd = str(os.getcwd())
sys.path.append(cwd)
from function import take_screenshot, user_delete, is_element_present
from source import newuser, newgroup, superuser, uncheckuser, supergroup
from source import newuserfn, nouserfn, uncheckuserfn, superuserfn

skip_mesages = "Skipping first run"
script_name = os.path.basename(__file__).partition('.')[0]

xpaths = {
    'navAccount': '//*[@id="nav-1"]/div/a[1]',
    'submenuUser': '//*[@id="1-1"]',
    'submenuGroup': '//*[@id="1-0"]',
    # 'confirmCheckbox': '//*[contains(@name, "confirm_checkbox")]',
    'deleteButton': '//*[contains(@name, "ok_button")]',
    'breadcrumbBar1': "//div[@id='breadcrumb-bar']/ul/li/a",
    'breadcrumbBar2': "//*[@id='breadcrumb-bar']/ul/li[2]/a",
    'toDashboard': "//span[contains(.,'Dashboard')]",
    'newuserUserMenu': f"(.//*[normalize-space(text()) and normalize-space(.)='{newuserfn}'])[1]/following::a[1]",
    'uncheckuserUserMenu': f"(.//*[normalize-space(text()) and normalize-space(.)='{uncheckuserfn}'])[1]/following::a[1]",
    'superuserUserMenu': f"(.//*[normalize-space(text()) and normalize-space(.)='{superuserfn}'])[1]/following::a[1]",
    'nouserUserMenu': f"(.//*[normalize-space(text()) and normalize-space(.)='{nouserfn}'])[1]/following::a[1]",
    'newuserUserDelete': f"(//button[@id='action_button_edit__{newuser}']/span/div/p)[2]",
    'uncheckuserUserDelete': f"(//button[@id='action_button_edit__{uncheckuser}']/span/div/p)[2]",
    'superuserUserDelete': f"(//button[@id='action_button_edit__{superuser}']/span/div/p)[2]",
    'nouserUserDelete': f"(//button[@id='action_button_edit__nuser']/span/div/p)[2]",
    'newuserGroupMenu': f"//mat-icon[@id='table_actions_menu_button__bsdgrp_group_{newuser}']",
    'superuserGroupMenu': f"//mat-icon[@id='table_actions_menu_button__bsdgrp_group_{superuser}']",
    'newgroupGroupMenu': f"//mat-icon[@id='table_actions_menu_button__bsdgrp_group_{newgroup}']",
    'supergroupGroupMenu': f"//mat-icon[@id='table_actions_menu_button__bsdgrp_group_{supergroup}']",
    'newuserGrourDelete': f"//button[@id='action_button_delete__{newuser}']/span",
    'superuserGroupDelete': f"//button[@id='action_button_delete__{superuser}']/span",
    'newgroupGroupDelete': f"//button[@id='action_button_delete__{newgroup}']/span",
    'supergroupGroupDelete': f"//button[@id='action_button_delete__{supergroup}']/span",
    'deleteButton': '//*[contains(@name, "ok_button")]',
    'confirmCheckbox': '//*[@id="confirm-dialog__confirm-checkbox"]/label/div',
    'confirmsecondaryCheckbox': '//*[@id="confirm-dialog__secondary-checkbox"]/label/div'
}

user_list = ['newuser', 'uncheckuser', 'nouser']
group_list = ['superuser', 'newgroup', 'supergroup']


def test_01_nav_acc_user(wb_driver):
    # Click  Account menu
    # allowing the button to load
    time.sleep(1)
    # Click User sub-menu
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


@pytest.mark.parametrize('user', user_list)
def test_02_delete_user_(wb_driver, user):
    assert is_element_present(wb_driver, xpaths[f'{user}UserMenu']) is True
    wb_driver.find_element_by_xpath(xpaths[f'{user}UserMenu']).click()
    assert is_element_present(wb_driver, xpaths[f'{user}UserDelete']) is True
    wb_driver.find_element_by_xpath(xpaths[f'{user}UserDelete']).click()
    assert is_element_present(wb_driver, xpaths['confirmCheckbox']) is True
    wb_driver.find_element_by_xpath(xpaths['confirmsecondaryCheckbox']).click()
    wb_driver.find_element_by_xpath(xpaths['confirmCheckbox']).click()
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, f"{test_name}_before")
    wb_driver.find_element_by_xpath(xpaths['deleteButton']).click()
    time.sleep(5)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, f"{test_name}_after")


def test_03_nav_acc_group(wb_driver):
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


@pytest.mark.parametrize('group', group_list)
def test_04_delete_group_(wb_driver, group):
    assert is_element_present(wb_driver, xpaths[f'{group}GroupMenu']) is True
    wb_driver.find_element_by_xpath(xpaths[f'{group}GroupMenu']).click()
    wb_driver.find_element_by_xpath(xpaths[f'{group}GroupDelete']).click()
    assert is_element_present(wb_driver, xpaths['confirmCheckbox']) is True
    wb_driver.find_element_by_xpath(xpaths['confirmsecondaryCheckbox']).click()
    wb_driver.find_element_by_xpath(xpaths['confirmCheckbox']).click()
    time.sleep(1)
    wb_driver.find_element_by_xpath(xpaths['deleteButton']).click()
    time.sleep(5)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_05_return_to_dashboard(wb_driver):
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
