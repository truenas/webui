
# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 2

import sys
import os
import time
cwd = str(os.getcwd())
sys.path.append(cwd)
from function import take_screenshot, is_element_present

skip_mesages = "Skipping first run"
script_name = os.path.basename(__file__).partition('.')[0]

xpaths = {
    'navGuide': '//*[@id="nav-15"]/div/a[1]',
    'version': '/html/body/div/nav/div[1]/a',
    'breadcrumbBar': "//div[@id='breadcrumb-bar']/ul/li/a"
}


def test_00_set_implicitly_wait(browser):
    browser.implicitly_wait(1)


def test_01_nav_guide(browser):
    # Click an element indirectly
    browser.find_element_by_xpath(xpaths['navGuide']).click()
    # allowing page to load by giving explicit time(in seconds)
    time.sleep(1)
    # get the ui element
    ui_element = browser.find_element_by_xpath(xpaths['breadcrumbBar'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert "Guide" in page_data, page_data
    # Taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(browser, script_name, test_name)


def test_02_check_version(browser):
    # cancelling the tour
    if is_element_present(browser, '/html/body/div[6]/div[1]/button'):
        browser.find_element_by_xpath('/html/body/div[6]/div[1]/button').click()

    # driver.find_element_by_xpath("/html/body/div/nav/div[2]/ul/li[1]/a").click()
    # ui_element=driver.find_element_by_xpath("/html/body/div/section/div/div/div[2]/div/p[5]")
    # get the weather data
    # page_data=ui_element.text
    # print ("The version of FreeNAS guide is:  " + page_data)
    # assert response to check version of freenas guide
    # self.assertTrue("FreeNAS" in page_data)
    # time.sleep(10)
    # Taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(browser, script_name, test_name)
