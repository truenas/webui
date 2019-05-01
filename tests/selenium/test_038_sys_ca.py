# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 1

import sys
import os
cwd = str(os.getcwd())
sys.path.append(cwd)
from function import take_screenshot

skip_mesages = "Skipping first run"
script_name = os.path.basename(__file__).partition('.')[0]

xpaths = {
    'navSystem': '//*[@id="nav-2"]/div/a[1]',
    'submenuCA': "//a[contains(text(),'Certificate Authorities')]",
    'breadcrumbBar': "//*[@id='breadcrumb-bar']/ul/li[2]/a"
}


def test_00_set_implicitly_wait(wb_driver):
    wb_driver.implicitly_wait(1)


def test_01_nav_system_CAs(wb_driver):
    wb_driver.find_element_by_xpath(xpaths['submenuCA']).click()
    # get the ui element
    ui_element = wb_driver.find_element_by_xpath(xpaths['breadcrumbBar'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert "Certificate Authorities" in page_data
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
