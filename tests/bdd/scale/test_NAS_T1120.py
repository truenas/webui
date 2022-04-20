# coding=utf-8
"""SCALE UI: feature tests."""

import time
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T1120.feature', 'Add an ACL Item and verify is preserve on the tank ACL dataset')
def test_add_an_acl_item_and_verify_is_preserve_on_the_tank_acl_dataset():
    """Add an ACL Item and verify is preserve on the tank ACL dataset."""


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


@when('you should be on the dashboard')
def you_should_be_on_the_dashboard(driver):
    """you should be on the dashboard."""
    assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@then('click Storage on the side menu and click on the "tank_acl_dataset" 3 dots button, select Edit Permissions')
def click_storage_on_the_side_menu_and_click_on_the_tank_acl_dataset_3_dots_button_select_edit_permissions(driver):
    """click Storage on the side menu and click on the "tank_acl_dataset" 3 dots button, select Edit Permissions."""
    assert wait_on_element(driver, 10, '//h1[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage")]')
    assert wait_on_element_disappear(driver, 15, '//mat-spinner[@role="progressbar"]')
    assert wait_on_element(driver, 5, '//tr[contains(.,"tank_acl_dataset")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"tank_acl_dataset")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 5, '//button[normalize-space(text())="View Permissions"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="View Permissions"]').click()
    assert wait_on_element(driver, 5, '//mat-icon[normalize-space(text())="edit"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[normalize-space(text())="edit"]').click()


@then('the Edit ACL page should open')
def the_edit_acl_page_should_open(driver):
    """the Edit ACL page should open."""
    assert wait_on_element(driver, 10, '//mat-card-title[contains(text(),"ACL Editor")]')


@then(parsers.parse('click on Add ACL Item, click on select User, User input should appear, enter "{input}" and select "{user}"'))
def click_on_add_acl_item_click_on_select_user_user_input_should_appear_enter_eric_and_select_ericbsd(driver, input, user):
    """click on Add ACL Item, click on select User, User input should appear, enter "{input}" and select "{user}"."""

    assert wait_on_element(driver, 5, '//span[contains(text(),"Add Item")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Add Item")]').click()
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Who"]/div/div/span[contains(.,"User")]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Who"]/div/div/span[contains(.,"User")]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Who_User"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Who_User"]').click()
    assert wait_on_element(driver, 5, '(//div[@ix-auto="combobox__User"]//mat-form-field//input[@data-placeholder="User"])', 'inputable')
    driver.find_element_by_xpath('(//div[@ix-auto="combobox__User"]//mat-form-field//input[@data-placeholder="User"])').send_keys(input)
    time.sleep(1)
    driver.find_element_by_xpath('(//div[@ix-auto="combobox__User"]//mat-form-field//input[@data-placeholder="User"])').click()

    assert wait_on_element(driver, 5, f'//mat-option[@ix-auto="option__{user}"]', 'clickable')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__{user}"]').click()


@then('click the Save button, return to the Pools page, click on the "tank_acl_dataset" 3 dots button, select Edit Permissions')
def click_the_save_button_return_to_the_pools_page_click_on_the_tank_acl_dataset_3_dots_button_select_edit_permissions(driver):
    """click the Save button, return to the Pools page, click on the "tank_acl_dataset" 3 dots button, select Edit Permissions."""
    assert wait_on_element(driver, 5, '//span[contains(text(),"Save Access Control List")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save Access Control List")]').click()
    assert wait_on_element(driver, 10, '//h1[text()="Storage"]')
    assert wait_on_element_disappear(driver, 15, '//mat-spinner[@role="progressbar"]')
    assert wait_on_element(driver, 5, '//mat-panel-title[contains(.,"tank")]')
    driver.find_element_by_xpath('//tr[contains(.,"tank_acl_dataset")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 5, '//button[normalize-space(text())="View Permissions"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="View Permissions"]').click()


@then('the Edit ACL page should open, verify the new ACL item for user ericbsd exists')
def the_edit_acl_page_should_open_verify_the_new_acl_item_for_user_ericbsd_exists(driver):
    """the Edit ACL page should open, verify the new ACL item for user ericbsd exists."""
    assert wait_on_element(driver, 5, '//div[contains(text(),"User - ericbsd")]')
    time.sleep(1)
