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



@then('click Storage on the side menu and click on the "{dataset_name}" 3 dots button, select Edit Permissions')
def click_storage_on_the_side_menu_and_click_on_the_dataset_napme_3_dots_button_select_edit_permission(driver, dataset_name):
    """click Storage on the side menu and click on the "{dataset_name}" 3 dots button, select Edit Permissions"""




@then('the Edit ACL page should open')
def the_edit_acl_page_should_open():
    """the Edit ACL page should open."""



@then('click on Add ACL Item, click on select User, User input should appear, enter "{input}" and select "{user}"')
def click_on_add_acl_item_click_on_select_user_user_input_should_appear_enter_eric_and_select_ericbsd(driver, input, user):
    """click on Add ACL Item, click on select User, User input should appear, enter "{input}" and select "{user}"."""



@then('click the Save button, return to the Pools page, click on the "tank_acl_dataset" 3 dots button, select Edit Permissions')
def click_the_save_button_return_to_the_pools_page_click_on_the_tank_acl_dataset_3_dots_button_select_edit_permissions():
    """click the Save button, return to the Pools page, click on the "tank_acl_dataset" 3 dots button, select Edit Permissions."""



@then('Click on "my_acl_dataset" 3 dots button, select Edit Permissions')
def click_on_my_acl_dataset_3_dots_button_select_edit_permissions(driver):
    """Click on "my_acl_dataset" 3 dots button, select Edit Permissions."""



@then(parsers.parse('the Edit ACL page should open, verify the new ACL item for user "{user}" exists'))
def the_edit_acl_page_should_open_verify_the_new_acl_item_for_user_ericbsd_exists(driver, user):
    """the Edit ACL page should open, verify the new ACL item for user "{user}" exists."""
    assert wait_on_element(driver, 5, '//h4[contains(.,"File Information")]')
    assert wait_on_element(driver, 5, '(//input[@placeholder="User"])[2]')
    assert attribute_value_exist(driver, '(//input[@placeholder="User"])[2]', 'value', user)
    ## return to dashboard
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    time.sleep(1)