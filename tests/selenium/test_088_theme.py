# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 7

import pytest
import sys
import os
import time
cwd = str(os.getcwd())
sys.path.append(cwd)
from function import take_screenshot, is_element_present

skip_mesages = "Skipping first run"
script_name = os.path.basename(__file__).partition('.')[0]

xpaths = {
    'themeBar': "//*[@id='schemeToggle']/span/mat-icon",
    'breadcrumbBar': '//*[@id="breadcrumb-bar"]/ul/li[2]/a'
}

theme_name = [
    'iX Blue',
    'Dracula',
    'Solarized Dark',
    'Solarized light',
    'High Contrast',
    'iX Dark'
]


def test_00_set_implicitly_wait(wb_driver):
    wb_driver.implicitly_wait(1)


@pytest.mark.parametrize("theme", theme_name)
def test_01_change_theme_to_(wb_driver, theme):
    theme_change(wb_driver, theme)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def theme_change(wb_driver, theme):
    # Click on the theme Button
    wb_driver.find_element_by_xpath(xpaths['themeBar']).click()
    time.sleep(1)
    xpath = "//*[contains(text(), \'" + theme + "\'  )]"
    ixblue = "//*[contains(text(), 'iX Blue')]"
    if is_element_present(wb_driver, xpath):
        print("attempting to click on theme: " + theme)
        wb_driver.find_element_by_xpath(xpath).click()
        time.sleep(2)
    else:
        print(" Theme not present so making theme default iX Blue")
        wb_driver.find_element_by_xpath(ixblue).click()
        time.sleep(2)
