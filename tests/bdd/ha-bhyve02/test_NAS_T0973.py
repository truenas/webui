# coding=utf-8
"""High Availability (tn-bhyve03) feature tests."""

import reusableSeleniumCode as rsc
import xpaths
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


@scenario('features/NAS-T973.feature', 'Create a 1gb zvol tank/ds1 for iscsi testing')
def test_create_a_1gb_zvol_tank_ds1_for_iscsi_testing(driver):
    """Create a 1gb zvol tank/ds1 for iscsi testing."""


@given(parsers.parse('The browser is open navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url):
    """The browser is open navigate to "{nas_url}"."""
    if nas_url not in driver.current_url:
        driver.get(f"http://{nas_url}/ui/dashboard/")
        time.sleep(1)


@when(parsers.parse('If login page appear enter "{user}" and "{password}"'))
def if_login_appear_enter_user_and_password(driver, user, password):
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
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Storage"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Pools"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Pools"]').click()


@then('The Pools page should open')
def the_pools_page_should_open(driver):
    """The Pools page should open."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Pools")]')


@then('Click on the tank 3 dots button, select Add Zvol')
def click_on_the_tank_3_dots_button_select_add_zvol(driver):
    """Click on the tank 3 dots button, select Add Zvol."""
    assert wait_on_element(driver, 7, '//mat-icon[@id="actions_menu_button__tank"]')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__tank"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="action__tank_Add Zvol"]')
    driver.find_element_by_xpath('//button[@ix-auto="action__tank_Add Zvol"]').click()


@then('The Add Zvol page should open')
def the_add_zvol_page_should_open(driver):
    """The Add Zvol page should open."""
    assert wait_on_element(driver, 7, '//a[contains(.,"Add Zvol")]')


@then(parsers.parse('Input "{zvol_name}" for Zvol Name and "{zvol_size}" for Zvol Size'))
def input_ds1_for_zvol_name_and_1_gib_for_zvol_size(driver, zvol_name, zvol_size):
    """Input "ds1" for Zvol Name and "1 GiB" for Zvol Size."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Zvol name"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Zvol name"]').send_keys(zvol_name)
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Size for this zvol"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Size for this zvol"]').send_keys(zvol_size)
    assert wait_on_element(driver, 7, xpaths.button.summit)
    rsc.click_The_Summit_Button(driver)


@then(parsers.parse('"{zvol_name}" should be created'))
def ds1_should_be_created(driver, zvol_name):
    """"ds1" should be created."""
    assert wait_on_element_disappear(driver, 20, xpaths.popup.please_wait)
    assert wait_on_element(driver, 10, f'//span[contains(.,"{zvol_name}")]')
