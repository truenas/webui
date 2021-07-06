# coding=utf-8
"""SCALE UI: feature tests."""

import time
from selenium.webdriver.common.keys import Keys
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    attribute_value_exist,
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
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
def you_should_be_on_the_dashboard():
    """you should be on the dashboard."""
    assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@then('click Storage on the side menu and click on the "{dataset_name}" 3 dots button, select Edit Permissions')
def click_storage_on_the_side_menu_and_click_on_the_dataset_name_3_dots_button_select_edit_permission(driver, dataset_name):
    """click Storage on the side menu and click on the "{dataset_name}" 3 dots button, select Edit Permissions"""
    time.sleep(1)
    assert wait_on_element(driver, 10, '//h1[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    time.sleep(1)
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage")]')
    assert wait_on_element(driver, 5, f'//tr[contains(.,"{dataset_name}")]//mat-icon[text()="more_vert"]')
    driver.find_element_by_xpath(f'//tr[contains(.,"{dataset_name}")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 5, '//button[normalize-space(text())="Edit Permissions"]')
    driver.find_element_by_xpath('//button[normalize-space(text())="Edit Permissions"]').click()



@then('the Edit ACL page should open')
def the_edit_acl_page_should_open():
    """the Edit ACL page should open."""
    if wait_on_element(driver, 2, '//button[@ix-auto="button__USE ACL MANAGER"]'):
        driver.find_element_by_xpath('//button[@ix-auto="button__USE ACL MANAGER"]').click()
    assert wait_on_element(driver, 5, '//h4[contains(.,"File Information")]')


@then('click on Add ACL Item, click on select User, User input should appear, enter "{input}" and select "{user}"')
def click_on_add_acl_item_click_on_select_user_user_input_should_appear_enter_eric_and_select_ericbsd(driver, input, user):
    """click on Add ACL Item, click on select User, User input should appear, enter "{input}" and select "{user}"."""
    time.sleep(1)
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__ADD ACL ITEM"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__ADD ACL ITEM"]').click()
    time.sleep(1)
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Who"]/div/div/span[contains(.,"Who")]')
    time.sleep(1)
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Who"]/div/div/span[contains(.,"Who")]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Who_User"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Who_User"]').click()
    time.sleep(1)
    assert wait_on_element(driver, 5, '(//input[@placeholder="User"])[2]')
    time.sleep(1)
    driver.find_element_by_xpath('(//input[@placeholder="User"])[2]').send_keys(input)
    assert wait_on_element(driver, 5, f'//mat-option[@ix-auto="option__{user}"]')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__{user}"]').click()


@then('click the Save button, return to the Pools page, click on the "tank_acl_dataset" 3 dots button, select Edit Permissions')
def click_the_save_button_return_to_the_pools_page_click_on_the_tank_acl_dataset_3_dots_button_select_edit_permissions():
    """click the Save button, return to the Pools page, click on the "tank_acl_dataset" 3 dots button, select Edit Permissions."""
    time.sleep(1)
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element(driver, 5, '//mat-panel-title[contains(.,"tank")]')
    driver.find_element_by_xpath('//td[@ix-auto="tank_name"]')


@then('Click on "my_acl_dataset" 3 dots button, select Edit Permissions')
def click_on_my_acl_dataset_3_dots_button_select_edit_permissions(driver):
    """Click on "my_acl_dataset" 3 dots button, select Edit Permissions."""
    assert wait_on_element(driver, 5, '//mat-icon[@id="actions_menu_button__my_acl_dataset"]')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__my_acl_dataset"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__my_acl_dataset_Edit Permissions"]')
    driver.find_element_by_xpath('//button[@ix-auto="action__my_acl_dataset_Edit Permissions"]').click()


@then(parsers.parse('the Edit ACL page should open, verify the new ACL item for user "{user}" exists'))
def the_edit_acl_page_should_open_verify_the_new_acl_item_for_user_ericbsd_exists(driver, user):
    """the Edit ACL page should open, verify the new ACL item for user "{user}" exists."""
    assert wait_on_element(driver, 5, '//h4[contains(.,"File Information")]')
    assert wait_on_element(driver, 5, '(//input[@placeholder="User"])[2]')
    assert attribute_value_exist(driver, '(//input[@placeholder="User"])[2]', 'value', user)
