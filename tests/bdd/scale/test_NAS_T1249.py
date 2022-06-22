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


@scenario('features/NAS-T1249.feature', 'Verify a dataset can be deleted')
def test_verify_a_dataset_can_be_deleted():
    """Verify a dataset can be deleted."""


@given('the browser is open, navigate to the SCALE URL, and login')
def the_browser_is_open_navigate_to_the_scale_url_and_login(driver, nas_ip, root_password):
    """the browser is open, navigate to the SCALE URL, and login."""
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


@when('on the dashboard click on storage')
def on_the_dashboard_click_on_storage(driver):
    """on the dashboard click on storage."""
    assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()


@then('the storage page opens click the pool config button')
def the_storage_page_opens_click_the_pool_config_button(driver):
    """the storage page opens click the pool config button."""
    assert wait_on_element(driver, 10, '//mat-icon[@id="encrypted_tank_settings_button"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="encrypted_tank_settings_button"]').click()


@then('in the dropdown click Export Disconnect')
def in_the_dropdown_click_export_disconnect(driver):
    """in the dropdown click Export Disconnect."""
    assert wait_on_element(driver, 10, '//span[contains(text(),"Export/Disconnect")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Export/Disconnect")]').click()


@then('click the checkboxes, enter name, and click export')
def click_the_checkboxes_enter_name_and_click_export(driver):
    """click the checkboxes, enter name, and click export."""
    assert wait_on_element(driver, 5, '//ix-checkbox[@formcontrolname = "destroy"]//mat-checkbox', 'clickable')
    driver.find_element_by_xpath('//ix-checkbox[@formcontrolname = "destroy"]//mat-checkbox').click()   
    assert wait_on_element(driver, 5, '//ix-input[@formcontrolname = "nameInput"]//input', 'inputable')
    driver.find_element_by_xpath('//ix-input[@formcontrolname = "nameInput"]//input').click()
    #driver.find_element_by_xpath('//ix-input[@formcontrolname = "nameInput"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname = "nameInput"]//input').send_keys("encrypted_tank")
    assert wait_on_element(driver, 10, '//ix-checkbox[@formcontrolname = "confirm"]//mat-checkbox', 'clickable')
    driver.find_element_by_xpath('//ix-checkbox[@formcontrolname = "confirm"]//mat-checkbox').click()   
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__EXPORT/DISCONNECT"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__EXPORT/DISCONNECT"]').click()


@then('storage page should load and the pool should be gone')
def storage_page_should_load_and_the_pool_should_be_gone(driver):
    """storage page should load and the pool should be gone."""
    assert wait_on_element(driver, 20, '//button[@ix-auto="button__CLOSE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    assert wait_on_element_disappear(driver, 10, '//div[contains(.,"encrypted_tank")]')
