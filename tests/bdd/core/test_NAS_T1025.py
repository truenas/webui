# coding=utf-8
"""Core UI feature tests."""

import time
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


@scenario('features/NAS-T1025.feature', 'Create a 1gb zvol call noauth1 for the no auth iscsi test case')
def test_create_a_1gb_zvol_call_noauth1_for_the_no_auth_iscsi_test_case():
    """Create a 1gb zvol call noauth1 for the no auth iscsi test case."""


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


@then('click on the tank three dots button, select Add Zvol')
def click_on_the_tank_three_dots_button_select_add_zvol(driver):
    """click on the tank three dots button, select Add Zvol."""
    assert wait_on_element(driver, 7, '//mat-icon[@id="actions_menu_button__tank"]')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__tank"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="action__tank_Add Zvol"]')
    driver.find_element_by_xpath('//button[@ix-auto="action__tank_Add Zvol"]').click()


@then('the Add Zvol page should open')
def the_add_zvol_page_should_open(driver):
    """the Add Zvol page should open."""
    assert wait_on_element(driver, 7, '//a[contains(.,"Add Zvol")]')


@then(parsers.parse('input {zvol_name} for Zvol Name and "{zvol_size}" for Zvol Size'))
def input_nopeer1_for_zvol_name_and_1_gib_for_zvol_size(driver, zvol_name, zvol_size):
    """input nopeer1 for Zvol Name and "1 GiB" for Zvol Size."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Zvol name"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Zvol name"]').send_keys(zvol_name)
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Size for this zvol"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Size for this zvol"]').send_keys(zvol_size)


@then('click the SUBMIT button, Please wait should appear')
def click_the_submit_button_Please_wait_should_appear(driver):
    """click the SUBMIT button, Please wait should appear."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SUBMIT"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')


@then(parsers.parse('the {zvol_name} zvol should be created, and the list of tank zvols'))
def the_nopeer1_zvol_should_be_created_and_the_list_of_tank_zvols(driver, zvol_name):
    """the nopeer1 zvol should be created, and the list of tank zvols."""
    assert wait_on_element(driver, 10, f'//span[contains(.,"{zvol_name}")]')
