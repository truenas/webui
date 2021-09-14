# coding=utf-8
"""Core UI feature tests."""

import time
from selenium.webdriver import ActionChains
from selenium.webdriver.common.keys import Keys
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


@scenario('features/NAS-T1012.feature', 'Create a new dataset with the LDAP user and group permissions')
def test_create_a_new_dataset_with_the_ldap_user_and_group_permissions(driver):
    """Create a new dataset with the LDAP user and group permissions."""


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
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Storage"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Pools"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Pools"]').click()


@then('the Pools page should open')
def the_pools_page_should_open(driver):
    """the Pools page should open."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Pools")]')


@then(parsers.parse('click on the {pool} three dots button, select Add Dataset'))
def click_on_the_tank_three_dots_button_select_add_dataset(driver, pool):
    """click on the tank three dots button, select Add Dataset."""
    assert wait_on_element(driver, 7, f'//mat-icon[@id="actions_menu_button__{pool}"]')
    driver.find_element_by_xpath(f'//mat-icon[@id="actions_menu_button__{pool}"]').click()
    assert wait_on_element(driver, 7, f'//button[@ix-auto="action__{pool}_Add Dataset"]')
    driver.find_element_by_xpath(f'//button[@ix-auto="action__{pool}_Add Dataset"]').click()


@then('the Add Dataset Name and Options page should open')
def the_add_dataset_name_and_options_page_should_open(driver):
    """the Add Dataset Name and Options page should open."""
    assert wait_on_element(driver, 7, '//h4[contains(.,"Name and Options")]')


@then(parsers.parse('input dataset name {dataset_name} and click save'))
def input_dataset_name_my_ldap_dataset_and_click_save(driver, dataset_name):
    """input dataset name my_ldap_dataset and click save."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Name"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys(dataset_name)
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()


@then(parsers.parse('{dataset_name} should be created'))
def my_ldap_dataset_should_be_created(driver, dataset_name):
    """my_ldap_dataset should be created."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, f'//span[contains(.,"{dataset_name}")]')


@then(parsers.parse('click on the {dataset_name} three dots button, select Edit Permissions'))
def click_on_the_my_ldap_dataset_three_dots_button_select_edit_permissions(driver, dataset_name):
    """click on the my_ldap_dataset three dots button, select Edit Permissions."""
    assert wait_on_element(driver, 7, f'//mat-icon[@ix-auto="options__{dataset_name}"]', 'clickable')
    driver.find_element_by_xpath(f'//mat-icon[@id="actions_menu_button__{dataset_name}"]').click()
    assert wait_on_element(driver, 7, f'//button[@ix-auto="action__{dataset_name}_Edit Permissions"]', 'clickable')
    driver.find_element_by_xpath(f'//button[@ix-auto="action__{dataset_name}_Edit Permissions"]').click()


@then('the Edit Permissions page should open')
def the_edit_permissions_page_should_open(driver):
    """the Edit Permissions page should open."""
    assert wait_on_element(driver, 7, '//h4[contains(.,"Dataset Path")]')
    time.sleep(0.5)


@then(parsers.parse('select {ldap_user} for User, click on the Apply User checkbox'))
def select_ldap_user_for_user_click_on_the_apply_user_checkbox(driver, ldap_user):
    """select ldap_user for User, click on the Apply User checkbox."""
    assert wait_on_element(driver, 7, '//input[@placeholder="User"]', 'clickable')
    driver.find_element_by_xpath('//input[@placeholder="User"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="User"]').send_keys(ldap_user)
    assert wait_on_element(driver, 7, f'//mat-option[@ix-auto="option__{ldap_user}"]')
    ActionChains(driver).send_keys(Keys.ESCAPE).perform()
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Apply User"]/label/div', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Apply User"]/label/div').click()


@then(parsers.parse('select {ldap_user} for Group name, click on the Apply Group checkbox'))
def select_ldap_user_for_group_name_click_on_the_apply_group_checkbox(driver, ldap_user):
    """select ldap_user for Group name, click on the Apply Group checkbox."""
    assert wait_on_element(driver, 7, '//input[@placeholder="Group"]', 'clickable')
    driver.find_element_by_xpath('//input[@placeholder="Group"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Group"]').send_keys(ldap_user)
    assert wait_on_element(driver, 7, f'//mat-option[@ix-auto="option__{ldap_user}"]')
    ActionChains(driver).send_keys(Keys.ESCAPE).perform()
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Apply Group"]/label/div', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Apply Group"]/label/div').click()


@then('click the Save button, should be returned to the pool page')
def click_the_save_button_should_be_returned_to_the_pool_page(driver):
    """click the Save button, should be returned to the pool page."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    wait_on_element_disappear(driver, 30, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//mat-panel-title[contains(.,"tank")]')
    driver.find_element_by_xpath('//td[@ix-auto="value__tank_name"]')


@then(parsers.parse('verify that user and group name is {ldap_user}'))
def verify_that_user_and_group_name_is_ldap_user(driver, ldap_user):
    """verify that user and group name is ldap_user."""
    assert wait_on_element(driver, 7, '//h4[contains(.,"Dataset Path")]')
    time.sleep(0.5)
    assert wait_on_element(driver, 7, '//input[@placeholder="User"]', 'clickable')
    assert attribute_value_exist(driver, '//input[@placeholder="User"]', 'value', ldap_user)
    assert attribute_value_exist(driver, '//input[@placeholder="Group"]', 'value', ldap_user)
