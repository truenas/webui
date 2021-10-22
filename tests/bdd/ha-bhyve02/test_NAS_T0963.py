# coding=utf-8
"""SCALE High Availability (tn-bhyve01) feature tests."""
import pytest
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

# Comment pytestmark to stop skipping this test
pytestmark = pytest.mark.skip('Skip for testing')


@scenario('features/NAS-T963.feature', 'Add an ACL Item and verify is preserve')
def test_add_an_acl_item_and_verify_is_preserve(driver):
    """Add an ACL Item and verify is preserve."""


@given(parsers.parse('the browser is open, navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url):
    """the browser is open, navigate to "{nas_url}"."""
    if nas_url not in driver.current_url:
        driver.get(f"http://{nas_url}/ui/sessions/signin")
        assert wait_on_element(driver, 10, '//input[@data-placeholder="Username"]')


@when(parsers.parse('if the login page appears, enter "{user}" and "{password}"'))
def if_the_login_page_appears_enter__user_and_password(driver, user, password):
    """if the login page appears, enter "{user}" and "{password}."""
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 10, '//input[@data-placeholder="Username"]')
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').send_keys(user)
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').send_keys(password)
        assert wait_on_element(driver, 5, '//button[@name="signin_button"]', 'clickable')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@then('on the Dashboard, click Storage on the left sidebar')
def on_the_dashboard_click_storage_on_the_left_sidebar(driver):
    """on the Dashboard, click Storage on the left sidebar."""
    assert wait_on_element(driver, 7, '//span[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"System Information")]')
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()


@then(parsers.parse('on the Storage page, click on the "{dataset_name}" 3 dots button,'))
def on_the_storage_page_click_on_the_my_ad_dataset_3_dots_button(driver, dataset_name):
    """on the Storage page, click on the "my_ad_dataset" 3 dots button,."""
    assert wait_on_element(driver, 7, '//h1[text()="Storage"]')
    assert wait_on_element(driver, 7, f'//div[contains(text(),"{dataset_name}")]')
    assert wait_on_element(driver, 7, f'//tr[contains(.,"{dataset_name}")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath(f'//tr[contains(.,"{dataset_name}")]//mat-icon[text()="more_vert"]').click()


@then('select View Permissions, and click on the pencil beside Dataset Permissions')
def select_view_permissions_and_click_on_the_pencil_beside_dataset_permissions(driver):
    """select View Permissions, and click on the pencil beside Dataset Permissions."""
    assert wait_on_element(driver, 5, '//button[normalize-space(text())="View Permissions"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="View Permissions"]').click()
    assert wait_on_element(driver, 5, '//div[text()="Dataset Permissions"]')
    assert wait_on_element(driver, 5, '//mat-icon[text()="edit"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[text()="edit"]').click()


@then('on the Edit ACL page, click on Add Item')
def on_the_edit_acl_page_click_on_add_item(driver):
    """on the Edit ACL page, click on Add Item."""
    assert wait_on_element(driver, 7, '//h1[text()="Edit ACL"]')
    assert wait_on_element(driver, 5, '//button[contains(.,"Add Item")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"Add Item")]').click()


@then('the new ACL item should appear')
def the_new_acl_item_should_appear(driver):
    """the new ACL item should appear."""
    assert wait_on_element(driver, 7, '//div[text()="User - ?"]')
    assert wait_on_element(driver, 7, '//mat-error[normalize-space(text())="User is required."]')


@then('click on who select User')
def click_on_who_select_user(driver):
    """click on who select User."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Who") and @id="tag"]//mat-select', 'clickable')
    driver.find_element_by_xpath('//div[contains(.,"Who") and @id="tag"]//mat-select').click()
    assert wait_on_element(driver, 5, '//mat-option[contains(.,"User")]', 'clickable')
    driver.find_element_by_xpath('//mat-option[contains(.,"User")]').click()


@then(parsers.parse('in User input, enter "{name}"'))
def in_user_input_enter_ericb_and_select_ericbsd(driver, name):
    """in User input, enter "ericb" and select "ericbsd"."""
    assert wait_on_element(driver, 7, '//input[@data-placeholder="User"]', 'inputable')
    driver.find_element_by_xpath('//input[@data-placeholder="User"]').send_keys(name)
    assert wait_on_element(driver, 7, '//div[text()="User - ericbsd"]')


@then('click the Save button, should be returned to the Storage page')
def click_the_save_button_should_be_returned_to_the_storage_page(driver):
    """click the Save button, should be returned to the Storage page."""
    assert wait_on_element(driver, 5, '//button[contains(.,"Save Access Control List")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"Save Access Control List")]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//h1[text()="Storage"]')


@then(parsers.parse('click on the "{dataset_name}" 3 dots button, select view Permissions'))
def click_on_the_my_acl_dataset_3_dots_button_select_view_permissions(driver, dataset_name):
    """click on the "my_acl_dataset" 3 dots button, select view Permissions."""
    assert wait_on_element(driver, 7, f'//div[contains(text(),"{dataset_name}")]')
    assert wait_on_element(driver, 7, f'//tr[contains(.,"{dataset_name}")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath(f'//tr[contains(.,"{dataset_name}")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 5, '//button[normalize-space(text())="View Permissions"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="View Permissions"]').click()


@then('the Dataset Permissions box should appear')
def the_dataset_permissions_box_should_appear(driver):
    """the Dataset Permissions box should appear."""
    assert wait_on_element(driver, 5, '//div[text()="Dataset Permissions"]')


@then(parsers.parse('verify the new ACL item for user "{name}" still exist'))
def verify_the_new_acl_item_for_user_ericbsd_still_exist(driver, name):
    """verify the new ACL item for user "ericbsd" still exist."""
    assert wait_on_element(driver, 5, '//div[text()="User - ericbsd"]')
