# coding=utf-8
"""SCALE UI: feature tests."""

import time
import xpaths
from function import (
    wait_on_element,
    is_element_present,
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)


@scenario('features/NAS-T1101.feature', 'Wipe one disk not in a pool')
def test_wipe_one_disk_not_in_a_pool():
    """Wipe one disk not in a pool."""


@given('the browser is open, the FreeNAS URL and logged in')
def the_browser_is_open_the_freenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open, the FreeNAS URL and logged in."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, xpaths.login.user_input)
    if not is_element_present(driver, xpaths.sideMenu.dashboard):
        assert wait_on_element(driver, 10, xpaths.login.user_input)
        driver.find_element_by_xpath(xpaths.login.user_input).clear()
        driver.find_element_by_xpath(xpaths.login.user_input).send_keys('root')
        driver.find_element_by_xpath(xpaths.login.password_input).clear()
        driver.find_element_by_xpath(xpaths.login.password_input).send_keys(root_password)
        assert wait_on_element(driver, 5, xpaths.login.signin_button)
        driver.find_element_by_xpath(xpaths.login.signin_button).click()
    else:
        assert wait_on_element(driver, 10, xpaths.sideMenu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()


@when('you should be on the dashboard, click Storage on the side menu')
def you_should_be_on_the_dashboard_click_storage_on_the_side_menu(driver):
    """you should be on the dashboard, click Storage on the side menu."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.sideMenu.storage, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.storage).click()


@when('the pools page appears click disk and select disks')
def the_pools_page_appears_click_disk_and_select_disks(driver):
    """the pools page appears click disk and select disks."""
    assert wait_on_element(driver, 10, xpaths.storage.title)
    assert wait_on_element(driver, 10, '//button[contains(.,"Disks")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"Disks")]').click()
    assert wait_on_element(driver, 10, '//a[@ix-auto="button__STORAGE_DISKS"]', 'clickable')
    driver.find_element_by_xpath('//a[@ix-auto="button__STORAGE_DISKS"]').click()


@then('the disk manager appears, expand sdc and click wipe')
def the_disk_manager_appears_expand_sdc_and_click_wipe(driver):
    """the disk manager appears, expand sdc and click wipe."""
    assert wait_on_element(driver, 10, '//h1[contains(.,"Disks")]')
    time.sleep(1)
    disk_list = []
    disk_elements = driver.find_elements_by_xpath('//div[contains(text(),"sd")]')
    for disk_element in disk_elements:
        disk = disk_element.text
        if is_element_present(driver, f'//tr[contains(.,"{disk}")]//div[text()="N/A"]'):
            disk_list.append(disk)
    for disk in disk_list:
        assert wait_on_element(driver, 7, f'//tr[@ix-auto="expander__{disk}"]/td[2]', 'clickable')
        driver.find_element_by_xpath(f'//tr[@ix-auto="expander__{disk}"]/td[2]').click()
        assert wait_on_element(driver, 7, f'//button[@ix-auto="button__WIPE_{disk}_{disk}"]', 'clickable')
        driver.find_element_by_xpath(f'//button[@ix-auto="button__WIPE_{disk}_{disk}"]').click()
        assert wait_on_element(driver, 7, f'//h1[contains(.,"Wipe Disk {disk}")]')
        assert wait_on_element(driver, 7, '//button[@ix-auto="button__WIPE"]', 'clickable')
        driver.find_element_by_xpath('//button[@ix-auto="button__WIPE"]').click()
        assert wait_on_element(driver, 7, f'//h1[contains(.,"Wipe Disk {disk}")]')
        assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
        assert wait_on_element(driver, 7, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
        driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()
        assert wait_on_element(driver, 15, '//span[contains(.,"Disk Wiped successfully")]')
        assert wait_on_element(driver, 5, '//button[contains(.,"CLOSE")]', 'clickable')
        driver.find_element_by_xpath('//button[contains(.,"CLOSE")]').click()


@then('click wipe and conform, wait for popup, then click close')
def click_wipe_and_conform_wait_for_popup_then_click_close(driver):
    """click wipe and conform, wait for popup, then click close."""
    time.sleep(1)
    assert wait_on_element(driver, 7, '//div[contains(.,"Disks")]')
