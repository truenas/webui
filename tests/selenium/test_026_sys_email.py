# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 2

import sys
import os
import time
cwd = str(os.getcwd())
sys.path.append(cwd)
from function import take_screenshot


skip_mesages = "Skipping first run"
script_name = os.path.basename(__file__).partition('.')[0]

xpaths = {
    'outgoingMail': "//div[@id='em_outgoingserver']/mat-form-field/div/div/div/input",
    'navSystem': "//span[contains(.,'System')]",
    'submenuEmail': "//a[contains(.,'Email')]",
    'breadcrumbBar': "//*[@id='breadcrumb-bar']/ul/li[2]/a"
}


def test_01_nav_system_email(wb_driver):
    # driver.find_element_by_xpath(xpaths['navSystem']).click()
    time.sleep(1)
    wb_driver.find_element_by_xpath(xpaths['submenuEmail']).click()
    # get the ui element
    ui_element = wb_driver.find_element_by_xpath(xpaths['breadcrumbBar'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert "Email" in page_data, page_data
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_02_configure_email(wb_driver):
    # Close the System Tab
    wb_driver.find_element_by_xpath(xpaths['outgoingMail']).clear()
    wb_driver.find_element_by_xpath(xpaths['outgoingMail']).send_keys("test@ixsystems.com")
    wb_driver.find_element_by_xpath('//*[@id="save_button"]').click()
    time.sleep(5)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
