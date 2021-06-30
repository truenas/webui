# coding=utf-8
"""SCALE UI: feature tests."""

import time
from function import(
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_for_attribute_value,
    wait_on_element_disappear,
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
        assert wait_on_element(driver, 10, '//input[@data-placeholder="Username"]')
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 10, '//input[@data-placeholder="Username"]')
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').send_keys('root')
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').send_keys(root_password)
        assert wait_on_element(driver, 5, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('you should be on the dashboard, click Storage on the side menu')
def you_should_be_on_the_dashboard_click_storage_on_the_side_menu(driver):
    """you should be on the dashboard, click Storage on the side menu."""
    assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    time.sleep(1)
    assert wait_on_element(driver, 10, '//h1[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()


@when('the pools page appears click disk and select disks')
def the_pools_page_appears_click_disk_and_select_disks(driver):
    """the pools page appears click disk and select disks."""
    time.sleep(1)
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage")]')
    time.sleep(1)
    assert wait_on_element(driver, 10, '//button[contains(.,"Disks")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"Disks")]').click()
    time.sleep(1)
    assert wait_on_element(driver, 10, '//a[@ix-auto="button__STORAGE_DISKS"]', 'clickable')
    driver.find_element_by_xpath('//a[@ix-auto="button__STORAGE_DISKS"]').click()


@then('the disk manager appears, expand sdc and click wipe')
def the_disk_manager_appears_expand_sdc_and_click_wipe(driver):
    """the disk manager appears, expand sdc and click wipe."""
    time.sleep(1)
    assert wait_on_element(driver, 10, '//h1[contains(.,"Disks")]')
    time.sleep(2)
    assert wait_on_element(driver, 10, '//tr[@ix-auto="expander__sdc"]/td', 'clickable')
    driver.find_element_by_xpath('//tr[@ix-auto="expander__sdc"]/td').click()
    time.sleep(1)
    assert wait_on_element(driver, 10, '//button[@ix-auto="button__WIPE_sdc_sdc"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__WIPE_sdc_sdc"]').click()


@then('click wipe and conform, wait for popup, then click close')
def click_wipe_and_conform_wait_for_popup_then_click_close(driver):
    """click wipe and conform, wait for popup, then click close."""
    time.sleep(1)
    assert wait_on_element(driver, 10, '//button[@ix-auto="button__WIPE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__WIPE"]').click()
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()    
    assert wait_on_element(driver, 10, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()
    time.sleep(10)
    assert wait_on_element(driver, 10, '//button[contains(.,"CLOSE")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"CLOSE")]').click()
    time.sleep(1)
    assert wait_on_element(driver, 7, '//div[contains(.,"Disks")]')
    ## return to dashboard
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    time.sleep(1)