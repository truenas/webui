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
    'Setting': "//mat-icon[contains(.,'settings')]",
    'Preferences': "//button[@name='settings-preferences']",
    'SelectTheme': "//mat-select/div/div",
    'breadcrumbBar1': "//div[@id='breadcrumb-bar']/ul/li/a",
    'breadcrumbBar2': "//*[@id='breadcrumb-bar']/ul/li[2]/a"
}

theme_name = [
    'iX Official',
    'iX Blue',
    'Dracula',
    'Solarized Dark',
    'Midnight',
    'High Contrast',
    'iX Dark'
]

theme_name = {
    'iX Official': '//mat-option/span',
    'iX Blue': '//mat-option[3]/span',
    'Dracula': '//mat-option[4]/span',
    'Solarized Dark': '//mat-option[5]/span',
    'Midnight': '//mat-option[6]/span',
    'High Contrast': '//mat-option[7]/span',
    'iX Dark': '//mat-option[2]/span'
}


def test_01_go_settings_preferences(browser):
    browser.find_element_by_xpath(xpaths['Setting']).click()
    browser.find_element_by_xpath(xpaths['Preferences']).click()
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(browser, script_name, test_name)
    find_select = is_element_present(browser, xpaths['SelectTheme'])
    assert find_select is True, find_select


@pytest.mark.parametrize("theme", list(theme_name.keys()))
def test_02_change_theme_to_(browser, theme):
    browser.find_element_by_xpath(xpaths['SelectTheme']).click()
    time.sleep(1)
    find_theme = is_element_present(browser, theme_name[theme])
    assert find_theme is True, find_theme
    browser.find_element_by_xpath(theme_name[theme]).click()
    time.sleep(2)
    test_name = sys._getframe().f_code.co_name
    take_screenshot(browser, script_name, test_name)