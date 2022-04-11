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


@scenario('features/NAS-T1250.feature', 'Verify that you can create a new group')
def test_verify_that_you_can_create_a_new_group():
    """Verify that you can create a new group."""


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
        assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('on the dashboard click on Credentials and Local Groups')
def on_the_dashboard_click_on_credentials_and_local_groups(driver):
    """on the dashboard click on Credentials and Local Groups."""
    assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
    assert wait_on_element(driver, 10, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Groups"]', 'clickable')
    driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Groups"]').click()


@then('on the Groups page, close the note and click Add')
def on_the_groups_page_close_the_note_and_click_add(driver):
    """on the Groups page, close the note and click Add."""
    if is_element_present(driver, '//h1[contains(.,"Display Note")]'):
        assert wait_on_element(driver, 5, '//span[contains(text(),"CLOSE")]', 'clickable')
        driver.find_element_by_xpath('//span[contains(text(),"CLOSE")]').click() 
    assert wait_on_element(driver, 10, '//h1[contains(text(),"Groups")]')
    assert wait_on_element(driver, 10, '//button[@ix-auto="button__Groups_ADD"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__Groups_ADD"]').click()


@then('input the group name and click save')
def input_the_group_name_and_click_save(driver):
    """input the group name and click save."""
    assert wait_on_element(driver, 7, '//h3[contains(.,"Add Group")]')
    assert wait_on_element(driver, 7, '//ix-input[@formcontrolname="name"]//input', 'inputable')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="name"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="name"]//input').send_keys('qetest')
    assert wait_on_element(driver, 7, '//span[contains(text(),"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save")]').click()


@then('verify the group was added')
def verify_the_group_was_added(driver):
    """verify the group was added."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//h1[contains(.,"Groups")]')
    assert wait_on_element(driver, 10, '//div[contains(.,"qetest")]')
