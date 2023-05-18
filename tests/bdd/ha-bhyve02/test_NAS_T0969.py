# coding=utf-8
"""High Availability (tn-bhyve03) feature tests."""

import reusableSeleniumCode as rsc
import xpaths
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


@scenario('features/NAS-T969.feature', 'Create a new dataset with access permission to only ericbsd')
def test_create_a_new_dataset_with_access_permission_to_only_ericbsd():
    """Create a new dataset with access permission to only ericbsd."""


@given(parsers.parse('The browser is open navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url):
    """The browser is open navigate to "{nas_url}"."""
    if nas_url not in driver.current_url:
        driver.get(f"http://{nas_url}/ui/dashboard/")
        time.sleep(1)


@when(parsers.parse('If login page appear enter "{user}" and "{password}"'))
def if_login_page_appear_enter_root_and_password(driver, user, password):
    """If login page appear enter "user" and "password"."""
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
    assert wait_on_element(driver, 7, xpaths.dashboard.system_information)


@then('Go to Storage click Pools')
def go_to_storage_click_pools(driver):
    """Go to Storage click Pools."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Pools"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Pools"]').click()


@then('The Pools page should open')
def the_pools_page_should_open(driver):
    """The Pools page should open."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Pools")]')


@then('Click on the tank 3 dots button, select Add Dataset')
def click_on_the_tank_3_dots_button_select_add_dataset(driver):
    """Click on the tank 3 dots button, select Add Dataset."""
    assert wait_on_element(driver, 7, '//mat-icon[@id="actions_menu_button__tank"]')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__tank"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="action__tank_Add Dataset"]')
    driver.find_element_by_xpath('//button[@ix-auto="action__tank_Add Dataset"]').click()


@then('The Add Dataset Name and Options page should open')
def the_add_dataset_name_and_options_page_should_open(driver):
    """The Add Dataset Name and Options page should open."""
    assert wait_on_element(driver, 7, '//h4[contains(.,"Name and Options")]')


@then(parsers.parse('Input dataset name "{dataset_name}" and click save'))
def input_dataset_name_my_wheel_dataset_and_click_save(driver, dataset_name):
    """Input dataset name "{dataset_name}" and click save."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Name"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys(dataset_name)
    rsc.click_The_Summit_Button(driver)


@then(parsers.parse('"{dataset_name}" should be created'))
def my_wheel_dataset_should_be_created(driver, dataset_name):
    """"{dataset_name}" should be created."""
    assert wait_on_element_disappear(driver, 20, xpaths.popup.please_wait)
    assert wait_on_element(driver, 10, f'//span[contains(.,"{dataset_name}")]')


@then(parsers.parse('Click on "{dataset_name}" 3 dots button, select Edit Permissions'))
def click_on_my_wheel_dataset_3_dots_button_select_edit_permissions(driver, dataset_name):
    """Click on "{dataset_name}" 3 dots button, select Edit Permissions."""
    assert wait_on_element(driver, 7, f'//mat-icon[@ix-auto="options__{dataset_name}"]')
    driver.find_element_by_xpath(f'//mat-icon[@id="actions_menu_button__{dataset_name}"]').click()
    assert wait_on_element(driver, 7, f'//button[@ix-auto="action__{dataset_name}_Edit Permissions"]')
    driver.find_element_by_xpath(f'//button[@ix-auto="action__{dataset_name}_Edit Permissions"]').click()


@then('The Edit Permissions page should open')
def the_edit_permissions_page_should_open(driver):
    """The Edit Permissions page should open."""
    assert wait_on_element(driver, 7, '//h4[contains(.,"Dataset Path")]')


@then(parsers.parse('Select "{user}" for User, check the Apply User then select "{group}" for Group name, check the Apply Group'))
def select_root_for_user_check_the_apply_user_then_select_wheel_for_group_name_check_the_apply_group(driver, user, group):
    """Select "root" for User, check the Apply User then select "wheel" for Group name, check the Apply Group."""
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Apply User"]/label/div')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Apply User"]/label/div').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"User") and contains(@class,"mat-form-field-infix")]//input')
    driver.find_element_by_xpath('//div[contains(.,"User") and contains(@class,"mat-form-field-infix")]//input').clear()
    driver.find_element_by_xpath('//div[contains(.,"User") and contains(@class,"mat-form-field-infix")]//input').send_keys(user)
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Apply Group"]/label/div')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Apply Group"]/label/div').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Group") and contains(@class,"mat-form-field-infix")]//input')
    driver.find_element_by_xpath('//div[contains(.,"Group") and contains(@class,"mat-form-field-infix")]//input').clear()
    driver.find_element_by_xpath('//div[contains(.,"Group") and contains(@class,"mat-form-field-infix")]//input').send_keys(group)


@then('Uncheck on Other Read Access and uncheck Other Execute')
def uncheck_on_other_read_access_and_uncheck_other_execute(driver):
    """Uncheck on Other Read Access and uncheck Other Execute."""
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__mode_otherRead"]').click()
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__mode_otherExec"]').click()


@then('Click the Save button, should be return to pool page')
def click_the_save_button_should_be_return_to_pool_page(driver):
    """Click the Save button, should be return to pool page."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 20, xpaths.popup.please_wait)
    assert wait_on_element(driver, 7, '//mat-panel-title[contains(.,"tank")]')
    driver.find_element_by_xpath('//td[@ix-auto="value__tank_name"]')


@then(parsers.parse('Verify that users is "{user}" and groups is "{group}"'))
def verify_that_users_is_root_and_groups_is_wheel(driver, user, group):
    """Verify that users is "root" and groups is "wheel"."""
    assert wait_on_element(driver, 7, '//div[contains(.,"User") and contains(@class,"mat-form-field-infix")]//input')
    assert attribute_value_exist(driver, '//div[contains(.,"User") and contains(@class,"mat-form-field-infix")]//input', 'value', user)
    assert attribute_value_exist(driver, '//div[contains(.,"Group") and contains(@class,"mat-form-field-infix")]//input', 'value', group)
