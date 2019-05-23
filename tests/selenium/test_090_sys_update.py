# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 2

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
    'navSystem': "//*[@id='nav-2']/div/a[1]",
    'submenuUpdate': "//a[contains(text(),'Update')]",
    'buttonChecknow': "/html/body/app-root/app-admin-layout/mat-sidenav-container/mat-sidenav-content/div/app-update/mat-card/div/div[3]/div/button[1]",
    'breadcrumbBar1': "//div[@id='breadcrumb-bar']/ul/li/a",
    'breadcrumbBar2': "//*[@id='breadcrumb-bar']/ul/li[2]/a"
}


def test_01_nav_sys_update(wb_driver):
    # Click on the Update submenu
    wb_driver.find_element_by_xpath(xpaths['submenuUpdate']).click()
    error_check_sys(wb_driver)
    # cancelling the tour
    # get the ui element
    ui_element = wb_driver.find_element_by_xpath(xpaths['breadcrumbBar2'])
    # get the weather data
    page_data = ui_element.text
    # assert response
    assert "Update" in page_data, page_data
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


@pytest.mark.skip('Skipping until test is fix')
def test_02_check_update_now(wb_driver):
    # Click on the checknow button
    wb_driver.find_element_by_xpath(xpaths['buttonChecknow']).click()
    time.sleep(1)
    # get the ui element, check if first element is present, if yes, check value text if as expected
    if is_element_present(wb_driver, "/html/body/app-root/app-admin-layout/mat-sidenav-container/mat-sidenav-content/div/app-update/mat-card[1]/div/div[4]/div/table/tbody/tr[1]/td[1]"):
        ui_element = wb_driver.find_element_by_xpath("/html/body/app-root/app-admin-layout/mat-sidenav-container/mat-sidenav-content/div/app-update/mat-card[1]/div/div[4]/div/table/tbody/tr[1]/td[1]")
        update_data = ui_element.text
        if update_data == "Upgrade":
            print("There is an available upgrade")
            # assert response
            assert "Upgrade" in update_data, update_data
            error_check_sys()
        else:
            print("There is an unexpected issue: it is not an upgrade")
            error_check_sys()
    elif is_element_present(wb_driver, "/html/body/app-root/app-admin-layout/md-sidenav-container/div[6]/div/app-update/md-card/div/div[4]/div/div"):
        ui_element2 = wb_driver.find_element_by_xpath("/html/body/app-root/app-admin-layout/md-sidenav-container/div[6]/div/app-update/md-card/div/div[4]/div/div")
        update_data2 = ui_element2.text
        if "No" in update_data2:
            print("There is no update available")
            assert "No" in update_data2, update_data2
            error_check_sys()
        else:
            print("There is an unexpected issue: something wrong with no update available element:" + update_data2)
            error_check_sys()
    else:
        print("There is an unexpected issue")
        error_check_sys()
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def error_check_sys(wb_driver):
    if is_element_present(wb_driver, "//*[contains(text(), 'Close')]"):
        wb_driver.find_element_by_xpath("//*[contains(text(), 'Close')]").click()
