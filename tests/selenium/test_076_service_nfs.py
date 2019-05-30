
import sys
import os
import time
from selenium.webdriver.common.keys import Keys
cwd = str(os.getcwd())
sys.path.append(cwd)
from function import take_screenshot, status_change, status_check
from function import is_element_present, ssh_test
from config import ip
skip_mesages = "Skipping first run"
script_name = os.path.basename(__file__).partition('.')[0]

xpaths = {
    'navService': '//*[@id="nav-8"]/div/a[1]',
    'configButton': "//button[@id='action-button__NFS']/span/mat-icon",
    'breadcrumbBar1': "//div[@id='breadcrumb-bar']/ul/li/a",
    'breadcrumbBar2': "//*[@id='breadcrumb-bar']/ul/li[2]/a",
    'nsfv4Checkbox': '//div[5]/form-checkbox/div/mat-checkbox/label/div',
    'verifyNsfv4Check': '//div[5]/form-checkbox/div/mat-checkbox',
    'saveButton': "//button[@id='save_button']/span",
    'nsfCheckbox': "//mat-checkbox[@id='checkbox__NFS']/label/div",
    'verifyNsfCheck': '//datatable-row-wrapper[2]/datatable-body-row/div[2]/datatable-body-cell[3]/div/mat-checkbox',
    'nfsSwitch': '//*[@id="slide-toggle__NFS"]'
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


def test_04_save_nfs_configuration(wb_driver):
    # click on save button
    wb_driver.find_element_by_xpath(xpaths['saveButton']).click()
    time.sleep(5)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
    assert is_element_present(wb_driver, xpaths['breadcrumbBar2']) is False


def test_05_enable_nfs_service(wb_driver):
    wb_driver.find_element_by_xpath(xpaths['nsfCheckbox']).click()
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
    root_checkbox = wb_driver.find_element_by_xpath(xpaths['verifyNsfCheck'])
    class_value = root_checkbox.get_attribute('class')
    # assert 'mat-checkbox-checked' in class_value, class_value


def test_06_start_nfs_service(wb_driver):
    time.sleep(2)
    status_change(wb_driver, "nfs", "start")
    time.sleep(2)
    status_check(wb_driver, "nfs")
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_07_checking_if_sysctl_vfs_nfsd_server_max_nfsvers_is_4():
    cmd = 'sysctl -n vfs.nfsd.server_max_nfsvers'
    results = ssh_test(cmd, 'root', 'testing', ip)
    assert results['result'] is True, results['output']
    assert results['output'].strip() == '4', results['output']


def test_08_stop_nfs_service(wb_driver):
    time.sleep(2)
    status_change(wb_driver, "nfs", "start")
    time.sleep(2)
    status_check(wb_driver, "nfs")
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_09_disable_nfs_service(wb_driver):
    wb_driver.find_element_by_xpath(xpaths['nsfCheckbox']).click()
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
    root_checkbox = wb_driver.find_element_by_xpath(xpaths['verifyNsfCheck'])
    class_value = root_checkbox.get_attribute('class')
    assert 'mat-checkbox-checked' not in class_value, class_value


def test_10_navigate_back_to_configure_nfs(wb_driver):
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


def test_11_uncheck_enable_nfsv4(wb_driver):
    # unchecked on Login as Root with Password
    wb_driver.find_element_by_xpath(xpaths['nsfv4Checkbox']).click()
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
    root_checkbox = wb_driver.find_element_by_xpath(xpaths['verifyNsfv4Check'])
    class_value = root_checkbox.get_attribute('class')
    assert 'mat-checkbox-checked' not in class_value, class_value


def test_12_save_nfs_configuration(wb_driver):
    # click on save button
    wb_driver.find_element_by_xpath(xpaths['saveButton']).click()
    time.sleep(5)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
    assert is_element_present(wb_driver, xpaths['breadcrumbBar2']) is False
