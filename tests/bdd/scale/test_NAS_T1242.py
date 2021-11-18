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


@scenario('features/NAS-T1242.feature', 'Verify an encrypted pool can be created')
def test_verify_an_encrypted_pool_can_be_created():
    """Verify an encrypted pool can be created."""


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


@when('you are on the dashboard, click Storage on the side menu')
def you_are_on_the_dashboard_click_storage_on_the_side_menu(driver):
    """you are on the dashboard, click Storage on the side menu."""
    assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()


@then('the pools page appears click create pool')
def the_pools_page_appears_click_create_pool(driver):
    """the pools page appears click create pool."""
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage")]')
    assert wait_on_element(driver, 10, '//a[@ix-auto="button___POOL_CREATE"]', 'clickable')
    driver.find_element_by_xpath('//a[@ix-auto="button___POOL_CREATE"]').click()

@then('the Pool Manager appears, enter encrypted_tank for pool name')
def the_pool_manager_appears_enter_encrypted_tank_for_pool_name(driver):
    """the Pool Manager appears, enter encrypted_tank for pool name."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Pool Manager")]')
    assert wait_on_element(driver, 10, '//input[@id="pool-manager__name-input-field"]', 'inputable')
    driver.find_element_by_xpath('//input[@id="pool-manager__name-input-field"]').send_keys('encrypted_tank')

@then('click encryption and confirm popup')
def click_encryption_and_confirm_popup(driver):
    """click encryption and confirm popup."""
    assert wait_on_element(driver, 10, '//mat-checkbox[@id="pool-manager__encryption-checkbox"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@id="pool-manager__encryption-checkbox"]').click()
    assert wait_on_element(driver, 10, '//mat-checkbox[@id="confirm-dialog__confirm-checkbox"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@id="confirm-dialog__confirm-checkbox"]').click()    
    assert wait_on_element(driver, 10, '//button[@ix-auto="button__I UNDERSTAND"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__I UNDERSTAND"]').click() 


@then('click a drive checkbox and press the right arrow')
def click_a_drive_checkbox_and_press_the_right_arrow(driver):
    """click a drive checkbox and press the right arrow."""
    assert wait_on_element(driver, 10, '//datatable-body[contains(.,"sd")]//mat-checkbox[1]', 'clickable')
    driver.find_element_by_xpath('//datatable-body[contains(.,"sd")]//mat-checkbox[1]').click()
    assert wait_on_element(driver, 5, '//button[@id="vdev__add-button"]', 'clickable')
    driver.find_element_by_xpath('//button[@id="vdev__add-button"]').click()
    assert wait_on_element(driver, 7, '//mat-checkbox[@id="pool-manager__force-submit-checkbox"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@id="pool-manager__force-submit-checkbox"]').click()



@then('click create confirm the warning checkbox and click CREATE POOL')
def click_create_confirm_the_warning_checkbox_and_click_create_pool(driver):
    """click create confirm the warning checkbox and click CREATE POOL."""
    assert wait_on_element(driver, 10, '//h1[contains(.,"Warning")]')
    assert wait_on_element(driver, 7, '//mat-checkbox[@name="confirm_checkbox"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@name="confirm_checkbox"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()
    assert wait_on_element(driver, 5, '//button[@id="pool-manager__create-button"]', 'clickable')
    driver.find_element_by_xpath('//button[@id="pool-manager__create-button"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Warning")]')
    assert wait_on_element(driver, 7, '//mat-checkbox[@name="confirm_checkbox"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@name="confirm_checkbox"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__CREATE POOL"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CREATE POOL"]').click()
    assert wait_on_element_disappear(driver, 60, '//h6[contains(.,"Create Pool")]')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__DONE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__DONE"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage")]')

@then('the pool should be listed on the storage page')
def the_pool_should_be_listed_on_the_storage_page(driver):
    """the pool should be listed on the storage page."""
    assert wait_on_element(driver, 7, '//div[contains(.,"encrypted_tank")]')