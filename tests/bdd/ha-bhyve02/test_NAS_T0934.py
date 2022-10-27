# coding=utf-8
"""High Availability (tn-bhyve02) feature tests."""

import xpaths
import time
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist
)
from pytest_dependency import depends
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T934.feature', 'Add an ACL Item and verify is preserve')
def test_add_an_acl_item_and_verify_is_preserve():
    """Add an ACL Item and verify is preserve."""


@given(parsers.parse('The browser is open navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url, request):
    """The browser is open navigate to "{nas_url}"."""
    depends(request, ['NAS-T933'], scope='session')
    if nas_url not in driver.current_url:
        driver.get(f"http://{nas_url}/ui/dashboard/")
        time.sleep(1)


@when(parsers.parse('If login page appear enter "{user}" and "{password}"'))
def if_login_page_appear_enter_root_and_password(driver, user, password):
    """If login page appear enter "{user}" and "{password}"."""
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 10, xpaths.login.user_input)
        driver.find_element_by_xpath(xpaths.login.user_input).clear()
        driver.find_element_by_xpath(xpaths.login.user_input).send_keys(user)
        driver.find_element_by_xpath(xpaths.login.password_input).clear()
        driver.find_element_by_xpath(xpaths.login.password_input).send_keys(password)
        assert wait_on_element(driver, 4, xpaths.login.signin_button)
        driver.find_element_by_xpath(xpaths.login.signin_button).click()
    if not is_element_present(driver, '//li[contains(.,"Dashboard")]'):
        assert wait_on_element(driver, 10, '//span[contains(.,"root")]')
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@then('You should see the dashboard and "System Information"')
def you_should_see_the_dashboard_and_system_information(driver):
    """You should see the dashboard and "System Information"."""
    assert wait_on_element(driver, 7, '//a[text()="Dashboard"]')
    assert wait_on_element(driver, 5, xpaths.dashboard.system_information)


@then('Navigate to Storage click Pools')
def navigate_to_storage_click_pools(driver):
    """Navigate to Storage click Pools."""
    assert wait_on_element(driver, 5, '//span[contains(.,"root")]')
    element = driver.find_element_by_xpath('//span[contains(.,"root")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Pools"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Pools"]').click()


@then('The Pools page should open')
def the_pools_page_should_open(driver):
    """The Pools page should open."""
    assert wait_on_element(driver, 5, '//div[contains(.,"Pools")]')


@then('On the dozer pool click on "my_acl_dataset" 3 dots button, select Edit Permissions')
def on_the_dozer_pool_click_on_my_acl_dataset_3_dots_button_select_edit_permissions(driver):
    """On the dozer pool click on "my_acl_dataset" 3 dots button, select Edit Permissions."""
    assert wait_on_element(driver, 5, '//mat-icon[@id="actions_menu_button__my_acl_dataset"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__my_acl_dataset"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__my_acl_dataset_Edit Permissions"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__my_acl_dataset_Edit Permissions"]').click()


@then('The Edit ACL page should open')
def the_edit_acl_page_should_open(driver):
    """The Edit ACL page should open."""
    if wait_on_element(driver, 2, '//button[@ix-auto="button__USE ACL MANAGER"]', 'clickable'):
        driver.find_element_by_xpath('//button[@ix-auto="button__USE ACL MANAGER"]').click()
    assert wait_on_element(driver, 5, '//h4[contains(.,"File Information")]')


@then('Click on Add ACL Item')
def click_on_add_acl_item(driver):
    """Click on Add ACL Item."""
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__ADD ACL ITEM"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__ADD ACL ITEM"]').click()


@then('The new ACL item should be added')
def the_new_acl_item_should_be_added(driver):
    """The new ACL item should be added."""
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Who"]/div/div/span[contains(.,"Who")]')


@then('Click on who select User')
def click_on_who_select_user(driver):
    """Click on who select User."""
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Who"]/div/div/span[contains(.,"Who")]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Who_User"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Who_User"]').click()


@then('The User input should appear')
def the_user_input_should_appear(driver):
    """The User input should appear."""
    assert wait_on_element(driver, 5, '//div[contains(.,"User") and @id="user"]//input')


@then(parsers.parse('In User Input enter "{input}" and select "{user}"'))
def in_user_input_enter_eric_and_select_ericbsd(driver, input, user):
    """In User Input enter "{input}" and select "{user}"."""
    driver.find_element_by_xpath('//div[contains(.,"User") and @id="user"]//input').send_keys(input)
    assert wait_on_element(driver, 5, f'//mat-option[@ix-auto="option__{user}"]')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__{user}"]').click()


@then('Click the Save button, should be return to pool page')
def click_the_save_button_should_be_return_to_pool_page(driver):
    """Click the Save button, should be return to pool page."""
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element(driver, 5, '//mat-panel-title[contains(.,"dozer")]')
    driver.find_element_by_xpath('//td[@ix-auto="value__dozer_name"]')


@then('Click on "my_acl_dataset" 3 dots button, select Edit Permissions')
def click_on_my_acl_dataset_3_dots_button_select_edit_permissions(driver):
    """Click on "my_acl_dataset" 3 dots button, select Edit Permissions."""
    assert wait_on_element(driver, 5, '//mat-icon[@id="actions_menu_button__my_acl_dataset"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__my_acl_dataset"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__my_acl_dataset_Edit Permissions"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__my_acl_dataset_Edit Permissions"]').click()


@then(parsers.parse('Verify the new ACL item for user "{user}" still exist'))
def verify_the_new_acl_item_for_user_name_still_exist(driver, user):
    """Verify the new ACL item for user "{user}" still exist."""
    assert wait_on_element(driver, 5, '//h4[contains(.,"File Information")]')
    assert wait_on_element(driver, 5, '//div[contains(.,"User") and @id="user"]//input')
    assert attribute_value_exist(driver, '//div[contains(.,"User") and @id="user"]//input', 'value', user)


@then('Navigate to Dashboard')
def navigate_to_dashboard(driver):
    """Navigate to Dashboard."""
    element = driver.find_element_by_xpath('//span[contains(.,"root")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    assert wait_on_element(driver, 10, xpaths.dashboard.system_information)
