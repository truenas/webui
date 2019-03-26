# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 5

import sys
import os
import time
from selenium.webdriver.common.keys import Keys
cwd = str(os.getcwd())
sys.path.append(cwd)
from function import take_screenshot, status_change, status_check

skip_mesages = "Skipping first run"
script_name = os.path.basename(__file__).partition('.')[0]


xpaths = {
    'navService': '//*[@id="nav-8"]/div/a[1]',
    'turnoffConfirm': '//*[contains(text(), "OK")]',
    'configButton': '/html/body/app-root/app-admin-layout/mat-sidenav-container/mat-sidenav-content/div/services/div/div[14]/entity-card/div[1]/div/mat-card[1]/div/div[2]/div[3]/button',
    'rootCheckbox': '//*[@id="ssh_rootlogin"]/mat-checkbox/label/div',
    'breadcrumbBar': "//div[@id='breadcrumb-bar']/ul/li/a",
    'saveButton': '//*[@id="save_button"]'
}


def test_00_set_implicitly_wait(wb_driver):
    wb_driver.implicitly_wait(1)


def test_01_turnon_ssh(wb_driver):
    # click Service Menu
    wb_driver.find_element_by_xpath(xpaths['navService']).click()
    # allowing the button to load
    time.sleep(1)
    # scroll down
    wb_driver.find_element_by_tag_name('body').send_keys(Keys.END)
    time.sleep(2)
    status_change(wb_driver, "14", "start")
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_02_checkif_ssh_on(wb_driver):
    time.sleep(2)
    # status check
    status_check(wb_driver, "14")
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_03_configure_ssh(wb_driver):
    time.sleep(2)
    # click on configure button
    wb_driver.find_element_by_xpath(xpaths['configButton']).click()
    # unchecked on Login as Root with Password
    wb_driver.find_element_by_xpath(xpaths['rootCheckbox']).click()
    # click on save button
    wb_driver.find_element_by_xpath(xpaths['saveButton']).click()
    time.sleep(5)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_04_turnoff_ssh(wb_driver):
    # click Service Menu
    wb_driver.find_element_by_xpath(xpaths['navService']).click()
    # allowing the button to load
    time.sleep(1)
    # scroll down
    wb_driver.find_element_by_tag_name('html').send_keys(Keys.END)
    time.sleep(2)
    status_change(wb_driver, "14", "stop")
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_05_checkif_ssh_off(wb_driver):
    time.sleep(2)
    # status check
    status_check(wb_driver, "14")
    time.sleep(10)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
