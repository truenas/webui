# coding=utf-8
"""Core UI feature tests."""

import time
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    attribute_value_exist
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T1009.feature', 'Add an ACL Item and verify is preserve on the system ACL dataset')
def test_add_an_acl_item_and_verify_is_preserve_on_the_system_acl_dataset(driver):
    """Add an ACL Item and verify is preserve on the system ACL dataset."""


@given('the browser is open on the TrueNAS URL and logged in')
def the_browser_is_open_on_the_truenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open on the TrueNAS URL and logged in."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, '//input[@placeholder="Username"]')
        time.sleep(1)
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 10, '//input[@placeholder="Username"]')
        driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys('root')
        driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys(root_password)
        assert wait_on_element(driver, 4, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(0.5)
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('you should be on the dashboard')
def you_should_be_on_the_dashboard(driver):
    """you should be on the dashboard."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"System Information")]')


@then('click Storage on the side menu and click Pools')
def click_storage_on_the_side_menu_and_click_pools(driver):
    """click Storage on the side menu and click Pools."""
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Storage"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Pools"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Pools"]').click()


@then('the Pools page should appear')
def the_pools_page_should_appear(driver):
    """the Pools page should appear."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Pools")]')


@then(parsers.parse('click on the "{dataset_name}" 3 dots button, select Edit Permissions'))
def click_on_the_tank_acl_dataset_3_dots_button_select_edit_permissions(driver, dataset_name):
    """click on the "tank_acl_dataset" 3 dots button, select Edit Permissions."""
    assert wait_on_element(driver, 7, f'//mat-icon[@id="actions_menu_button__{dataset_name}"]')
    driver.find_element_by_xpath(f'//mat-icon[@id="actions_menu_button__{dataset_name}"]').click()
    assert wait_on_element(driver, 7, f'//button[@ix-auto="action__{dataset_name}_Edit Permissions"]')
    driver.find_element_by_xpath(f'//button[@ix-auto="action__{dataset_name}_Edit Permissions"]').click()


@then('the Edit ACL page should open')
def the_edit_acl_page_should_open(driver):
    """the Edit ACL page should open."""
    assert wait_on_element(driver, 7, '//h4[contains(.,"File Information")]')
    time.sleep(1)


@then('click on Add ACL Item')
def click_on_add_acl_item(driver):
    """click on Add ACL Item."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__ADD ACL ITEM"]', 'clickable')
    element = driver.find_element_by_xpath('//button[@ix-auto="button__ADD ACL ITEM"]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    driver.find_element_by_xpath('//button[@ix-auto="button__ADD ACL ITEM"]').click()


@then('the new ACL item should appear')
def the_new_acl_item_should_appear(driver):
    """the new ACL item should appear."""
    assert wait_on_element(driver, 7, '//mat-select[@ix-auto="select__Who"]/div/div/span[contains(.,"Who")]')


@then('click on who select User')
def click_on_who_select_user(driver):
    """click on who select User."""
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Who"]/div/div/span[contains(.,"Who")]').click()
    assert wait_on_element(driver, 7, '//mat-option[@ix-auto="option__Who_User"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Who_User"]').click()


@then('the User input should appear')
def the_user_input_should_appear(driver):
    """the User input should appear."""
    assert wait_on_element(driver, 7, '//div[contains(.,"User *") and contains(@class,"mat-form-field-infix")]//input')


@then(parsers.parse('in User input, enter "{user_input}" and select "{user}"'))
def in_user_input_enter_eric_and_select_ericbsd(driver, user_input, user):
    """in User input, enter "eric" and select "ericbsd"."""
    driver.find_element_by_xpath('//div[contains(.,"User *") and contains(@class,"mat-form-field-infix")]//input').send_keys(user_input)
    assert wait_on_element(driver, 7, f'//mat-option[@ix-auto="option__{user}"]')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__{user}"]').click()


@then('click the Save button, should be returned to the Pools page')
def click_the_save_button_should_be_returned_to_the_pools_page(driver):
    """click the Save button, should be returned to the Pools page."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//mat-panel-title[contains(.,"tank")]')
    driver.find_element_by_xpath('//td[@ix-auto="value__tank_name"]')


@then(parsers.parse('verify the new ACL item for user "{user}" still exist'))
def verify_the_new_acl_item_for_user_ericbsd_still_exist(driver, user):
    """verify the new ACL item for user "ericbsd" still exist."""
    assert wait_on_element(driver, 5, '//h4[contains(.,"File Information")]')
    assert wait_on_element(driver, 5, '//div[contains(.,"User *") and contains(@class,"mat-form-field-infix")]//input')
    assert attribute_value_exist(driver, '//div[contains(.,"User *") and contains(@class,"mat-form-field-infix")]//input', 'value', user)
