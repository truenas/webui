# coding=utf-8
"""Core UI feature tests."""

import time
import reusableSeleniumCode as rsc
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T1029.feature', 'Create a zvol on a dataset')
def test_create_a_zvol_on_a_dataset():
    """Create a zvol on a dataset."""


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


@then('click on the Storage on the side menu, click on Pools')
def click_on_the_storage_on_the_side_menu_click_on_pools(driver):
    """click on the Storage on the side menu, click on Pools."""
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Storage"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Pools"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Pools"]').click()


@then('the Pools page should open')
def the_pools_page_should_open(driver):
    """the Pools page should open."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Pools")]')


@then('click on the tank three dots button, select Add Dataset')
def click_on_the_tank_three_dots_button_select_add_dataset(driver):
    """click on the tank three dots button, select Add Dataset."""
    assert wait_on_element(driver, 7, '//mat-icon[@id="actions_menu_button__tank"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__tank"]').click()
    assert wait_on_element(driver, 7, '//div[@class="title" and contains(.,"Dataset Actions")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__tank_Create Snapshot"]', 'clickable')
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__tank_Add Dataset"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__tank_Add Dataset"]').click()


@then('the Add Dataset Name and Options page should open')
def the_add_dataset_name_and_options_page_should_open(driver):
    """the Add Dataset Name and Options page should open."""
    assert wait_on_element(driver, 7, '//h4[contains(.,"Name and Options")]')


@then(parsers.parse('input dataset name {dataset_name} and click save'))
def input_dataset_name_luns_and_click_save(driver, dataset_name):
    """input dataset name luns and click save."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Name"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys(dataset_name)
    rsc.click_The_Summit_Button(driver)


@then(parsers.parse('the {dataset_name} dataset should be created and be in the tank dataset list'))
def the_luns_dataset_should_be_created_and_be_in_the_tank_dataset_list(driver, dataset_name):
    """the luns dataset should be created and be in the tank dataset list."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, f'//span[contains(.,"{dataset_name}")]')


@then(parsers.parse('click on the {dataset_name} dataset three dots button, select Add Zvol'))
def click_on_the_luns_dataset_three_dots_button_select_add_zvol(driver, dataset_name):
    """click on the luns dataset three dots button, select Add Zvol."""
    assert wait_on_element(driver, 7, f'//mat-icon[@id="actions_menu_button__{dataset_name}"]')
    driver.find_element_by_xpath(f'//mat-icon[@id="actions_menu_button__{dataset_name}"]').click()
    assert wait_on_element(driver, 7, f'//button[@ix-auto="action__{dataset_name}_Add Zvol"]')
    driver.find_element_by_xpath(f'//button[@ix-auto="action__{dataset_name}_Add Zvol"]').click()


@then('the Add Zvol page should open')
def the_add_zvol_page_should_open(driver):
    """the Add Zvol page should open."""
    assert wait_on_element(driver, 7, '//a[contains(.,"Add Zvol")]')


@then(parsers.parse('input {zvol_name} for Zvol Name and "{zvol_size}" for Zvol Size'))
def input_ds3_for_zvol_name_and_1_gib_for_zvol_size(driver, zvol_name, zvol_size):
    """input ds3 for Zvol Name and "1 GiB" for Zvol Size."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Zvol name"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Zvol name"]').send_keys(zvol_name)
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Size for this zvol"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Size for this zvol"]').send_keys(zvol_size)


@then('click the SUBMIT button. Please wait should appear')
def click_the_submit_button_please_wait_should_appear(driver):
    """click the SUBMIT button. Please wait should appear."""
    rsc.click_The_Summit_Button(driver)
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')


@then(parsers.parse('the {zvol_name} zvol should be created, and in the list under luns dataset'))
def the_ds3_zvol_should_be_created_and_in_the_list_under_luns_dataset(driver, zvol_name, ):
    """the ds3 zvol should be created, and in the list under luns dataset."""
    assert wait_on_element(driver, 10, '//p-treetabletoggler[@ix-auto="expander__luns"]')
    driver.find_element_by_xpath('//p-treetabletoggler[@ix-auto="expander__luns"]').click()
    assert wait_on_element(driver, 10, f'//span[contains(.,"{zvol_name}")]')
