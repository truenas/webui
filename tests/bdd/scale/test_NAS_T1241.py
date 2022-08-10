# coding=utf-8
"""SCALE UI: feature tests."""

import time
from function import (
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


@scenario('features/NAS-T1241.feature', 'Verify that Storage Import Disks Page Opens')
def test_verify_that_storage_import_disks_page_opens():
    """Verify that Storage Import Disks Page Opens."""

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


@when('you are on the dashboard click on storage in the side menu')
def you_are_on_the_dashboard_click_on_storage_in_the_side_menu(driver):
    """you are on the dashboard click on storage in the side menu."""
    assert wait_on_element(driver, 10, '//h1[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage")]')


@then('Click on dropdown and import disk.')
def click_on_dropdown_and_import_disk(driver):
    """Click on dropdown and import disk.."""
    assert wait_on_element(driver, 10, '//span[contains(.,"Disks")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Disks")]').click()
    assert wait_on_element(driver, 10, '//a[@ix-auto="button__STORAGE_IMPORT_DISK"]', 'clickable')
    driver.find_element_by_xpath('//a[@ix-auto="button__STORAGE_IMPORT_DISK"]').click()


@then('verify that the import disk page opens.')
def verify_that_the_import_disk_page_opens(driver):
    """verify that the import disk page opens.."""
    assert wait_on_element(driver, 10, '//h1[contains(text(),"Import Disk")]')
