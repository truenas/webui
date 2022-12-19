# coding=utf-8
"""SCALE UI: feature tests."""

import xpaths
from function import (
    wait_on_element,
    is_element_present
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
        driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()


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
    assert wait_on_element(driver, 10, '//button[contains(.,"Disks")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"Disks")]').click()
    assert wait_on_element(driver, 10, '//a[@ix-auto="button__STORAGE_IMPORT_DISK"]', 'clickable')
    driver.find_element_by_xpath('//a[@ix-auto="button__STORAGE_IMPORT_DISK"]').click()


@then('verify that the import disk page opens.')
def verify_that_the_import_disk_page_opens(driver):
    """verify that the import disk page opens.."""
    assert wait_on_element(driver, 10, '//h1[contains(text(),"Import Disk")]')
