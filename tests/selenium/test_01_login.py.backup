# !/usr/bin/env python
# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 1

import sys
import os
import time
from selenium.webdriver.common.by import By
cwd = str(os.getcwd())
sys.path.append(cwd)
from function import take_screenshot, is_element_present
from source import username, password


skip_mesages = "Skipping first run"
script_name = os.path.basename(__file__).partition('.')[0]

xpaths = {
    'usernameTxtBox': "//input[@id='mat-input-0']",
    'passwordTxtBox': "//input[@id='mat-input-1']",
    'submitButton': "//button[@id='signin_button']"
}


def test_00_open_web_browser(wb_driver, ui_url):
    wb_driver.get(ui_url)


def test_01_login(wb_driver):
    # enter username in the username textbox
    wb_driver.find_element_by_xpath(xpaths['usernameTxtBox']).clear()
    wb_driver.find_element_by_xpath(xpaths['usernameTxtBox']).send_keys(username)
    # enter password in the password textbox
    wb_driver.find_element_by_xpath(xpaths['passwordTxtBox']).clear()
    wb_driver.find_element_by_xpath(xpaths['passwordTxtBox']).send_keys(password)
    # click
    wb_driver.find_element_by_xpath(xpaths['submitButton']).click()
    # check if the dashboard opens
    time.sleep(1)
    # get the ui element
    ui_element = wb_driver.find_element_by_xpath('//li/a')
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert "Dashboard" in page_data, page_data
    # canceling the tour
    if is_element_present(wb_driver, By.XPATH, '/html/body/div[5]/div[1]/button'):
        wb_driver.find_element_by_xpath('/html/body/div[5]/div[1]/button').click()
    wb_driver.execute_script("document.body.style.zoom='50 %'")
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def error_check(wb_driver):
    if is_element_present(wb_driver, By.XPATH, '//*[contains(text(), "Close")]'):
        if is_element_present(wb_driver, By.XPATH, '/html/body/div[5]/div[2]/div/mat-dialog-container/error-dialog/h1'):
            ui_element = wb_driver.find_element_by_xpath('/html/body/div[5]/div[2]/div/mat-dialog-container/error-dialog/h1')
            error_element = ui_element.text
            print(error_element)
        wb_driver.find_element_by_xpath('//*[contains(text(), "Close")]').click()
        print("rdd error closed")
