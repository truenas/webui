
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
    'configButton': "//button[@id='action-button__NFS']/span/mat-icon",
    'breadcrumbBar1': "//div[@id='breadcrumb-bar']/ul/li/a",
    'breadcrumbBar2': "//*[@id='breadcrumb-bar']/ul/li[2]/a",
    'nsfv4Checkbox': '//div[5]/form-checkbox/div/mat-checkbox/label/div',
    'verifyNsfv4Check': '//div[5]/form-checkbox/div/mat-checkbox'
}


def test_01_navigate_service(wb_driver):
    # click Service Menu
    wb_driver.find_element_by_xpath(xpaths['navService']).click()
    # allowing the button to load
    time.sleep(1)
    # get the ui element
    ui_element = wb_driver.find_element_by_xpath(xpaths['breadcrumbBar1'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert "Services" in page_data, page_data


def test_02_navigate_to_configure_nfs(wb_driver):
    # click on configure button
    wb_driver.find_element_by_xpath(xpaths['configButton']).click()
    ui_element = wb_driver.find_element_by_xpath(xpaths['breadcrumbBar1'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert "Services" in page_data, page_data
    ui_element = wb_driver.find_element_by_xpath(xpaths['breadcrumbBar2'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert "NFS" in page_data, page_data
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_03_check_enable_nfsv4(wb_driver):
    # unchecked on Login as Root with Password
    wb_driver.find_element_by_xpath(xpaths['nsfv4Checkbox']).click()
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
    root_checkbox = wb_driver.find_element_by_xpath(xpaths['verifyNsfv4Check'])
    class_value = root_checkbox.get_attribute('class')
    assert 'mat-checkbox-checked' in class_value, class_value
