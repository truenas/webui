# coding=utf-8
"""Core UI feature tests."""

import time
from selenium.webdriver import ActionChains
from selenium.webdriver.common.keys import Keys
import reusableSeleniumCode as rsc
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    wait_for_attribute_value
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T1004.feature', 'Create an Active Directory dataset on a system dataset')
def test_create_an_active_directory_dataset_on_a_system_dataset(driver):
    """Create an Active Directory dataset on a system dataset."""


@given('the browser is open, the FreeNAS URL and logged in')
def the_browser_is_open_the_freenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open, the FreeNAS URL and logged in."""
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
    if not is_element_present(driver, '//li[contains(.,"Dashboard")]'):
        assert wait_on_element(driver, 10, '//span[contains(.,"root")]')
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(0.5)
        assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('you should be on the dashboard')
def you_should_be_on_the_dashboard(driver):
    """you should be on the dashboard."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"System Information")]')


@then('click Storage on the side menu and click Pools')
def click_storage_on_the_side_menu_and_click_pools(driver):
    """click Storage on the side menu and click Pools."""
    assert wait_on_element(driver, 7, '//span[contains(.,"root")]')
    element = driver.find_element_by_xpath('//span[contains(.,"root")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Pools"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Pools"]').click()


@then('the Pools page should appear')
def the_pools_page_should_appear(driver):
    """the Pools page should appear."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Pools")]')


@then('click on the system 3 dots button, and select Add Dataset')
def click_on_the_system_3_dots_button_and_select_add_dataset(driver):
    """click on the system 3 dots button, and select Add Dataset."""
    assert wait_on_element(driver, 7, '//mat-icon[@id="actions_menu_button__system"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__system"]').click()
    assert wait_on_element(driver, 7, '//div[@class="title" and contains(.,"Dataset Actions")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__system_Create Snapshot"]', 'clickable')
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__system_Add Dataset"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__system_Add Dataset"]').click()


@then('the Add Dataset Name and Options page should open')
def the_add_dataset_name_and_options_page_should_open(driver):
    """the Add Dataset Name and Options page should open."""
    assert wait_on_element(driver, 7, '//h4[contains(.,"Name and Options")]')


@then(parsers.parse('input dataset name "{dataset_name}" and click save'))
def input_dataset_name_system_acl_dataset_and_click_save(driver, dataset_name):
    """input dataset name "system_acl_dataset" and click save."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Name"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys(dataset_name)
    rsc.click_The_Summit_Button(driver)


@then(parsers.parse('"{dataset_name}" should be created'))
def system_acl_dataset_should_be_created(driver, dataset_name):
    """"system_acl_dataset" should be created."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, f'//span[contains(.,"{dataset_name}")]')


@then(parsers.parse('click on the "{dataset_name}" 3 dots button, select Edit Permissions'))
def click_on_the_system_acl_dataset_3_dots_button_select_edit_permissions(driver, dataset_name):
    """click on the "system_acl_dataset" 3 dots button, select Edit Permissions."""
    assert wait_on_element(driver, 7, f'//mat-icon[@id="actions_menu_button__{dataset_name}"]')
    driver.find_element_by_xpath(f'//mat-icon[@id="actions_menu_button__{dataset_name}"]').click()
    assert wait_on_element(driver, 7, f'//button[@ix-auto="action__{dataset_name}_Edit Permissions"]')
    driver.find_element_by_xpath(f'//button[@ix-auto="action__{dataset_name}_Edit Permissions"]').click()


@then('the Edit Permissions page should open')
def the_edit_permissions_page_should_open(driver):
    """the Edit Permissions page should open."""
    assert wait_on_element(driver, 7, '//h4[contains(.,"Dataset Path")]')


@then('click on Use ACL Manager')
def click_on_use_acl_manager(driver):
    """click on Use ACL Manager."""
    driver.find_element_by_xpath('//button[@ix-auto="button__USE ACL MANAGER"]').click()


@then('the Edit ACL page should open')
def the_edit_acl_page_should_open(driver):
    """the Edit ACL page should open."""
    assert wait_on_element(driver, 7, '//h4[contains(.,"File Information")]')


@then(parsers.parse('select OPEN for Default ACL Option, select "{group_name}" for Group name'))
def select_open_for_default_acl_option_select_group_name_for_group_name(driver, group_name):
    """select OPEN for Default ACL Option, select "group_name" for Group name."""
    assert wait_on_element(driver, 7, '//mat-select[@ix-auto="select__Default ACL Options"]')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Default ACL Options"]').click()
    assert wait_on_element(driver, 7, '//mat-option[@ix-auto="option__Default ACL Options_OPEN"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Default ACL Options_OPEN"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__CONTINUE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()
    time.sleep(0.5)
    assert wait_on_element(driver, 7, '//div[contains(.,"Group") and contains(@class,"mat-form-field-infix")]//input')
    driver.find_element_by_xpath('//div[contains(.,"Group") and contains(@class,"mat-form-field-infix")]//input').clear()
    driver.find_element_by_xpath('//div[contains(.,"Group") and contains(@class,"mat-form-field-infix")]//input').send_keys(group_name)
    assert wait_on_element(driver, 7, f'//mat-option[@ix-auto="option__{group_name}"]')
    ActionChains(driver).send_keys(Keys.ESCAPE).perform()


@then('click the Apply Group checkbox and click the Save button')
def click_the_apply_group_checkbox_and_click_the_save_button(driver):
    """click the Apply Group checkbox and click the Save button."""
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Apply Group"]/label/div')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Apply Group"]/label/div').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


@then('you should return to the pool page')
def you_should_return_to_the_pool_page(driver):
    """you should return to the pool page."""
    assert wait_on_element(driver, 7, '//mat-panel-title[contains(.,"system")]')
    driver.find_element_by_xpath('//td[@ix-auto="value__system_name"]')


@then(parsers.parse('Verify that the group name is "{group_name}"'))
def verify_that_the_group_name_is_ad01administrator(driver, group_name):
    """Verify that the group name is "group_name"."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Group") and contains(@class,"mat-form-field-infix")]//input')
    assert wait_for_attribute_value(driver, 5, '//div[contains(.,"Group") and contains(@class,"mat-form-field-infix")]//input', 'value', group_name)
