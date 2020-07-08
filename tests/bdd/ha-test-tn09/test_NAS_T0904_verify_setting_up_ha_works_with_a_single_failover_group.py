# coding=utf-8
"""High Availability feature tests."""

import time
from function import wait_on_element
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T904.feature', 'Verify setting up HA works with a single failover group')
def test_high_availability_verify_setting_up_ha_works_with_a_single_failover_group(driver):
    """High Availability: Verify setting up HA works with a single failover group."""


@given(parsers.parse('The browser is open navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_url(driver, nas_url):
    """The browser is open navigate to "url"."""
    driver.get(f"{nas_url}ui/sessions/signin")
    time.sleep(5)


@when(parsers.parse('Login appear enter "root" and "{password}"'))
def login_appear_enter_root_and_password(driver, password):
    """Login appear enter "root" and "password"."""
    wait_on_element(driver, 0.5, 30, 'xpath', '//input[@placeholder="Username"]')
    driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys('root')
    driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys(password)
    wait_on_element(driver, 0.5, 30, 'xpath', '//button[@name="signin_button"]')
    driver.find_element_by_xpath('//button[@name="signin_button"]').click()


@then(parsers.parse('You should see the dashboard and serial number should show "{serial1}"'))
def you_should_see_the_dashboard_and_serial_number_should_show_serial1(driver, serial1):
    """You should see the dashboard and serial number should show "serial1"."""
    wait_on_element(driver, 0.5, 30, 'xpath', '//button[@ix-auto="button__CLOSE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    wait_on_element(driver, 0.5, 30, 'xpath', '//li[@ix-auto="option__Dashboard"]')
    driver.find_element_by_xpath('//li[@ix-auto="option__Dashboard"]')
    wait_on_element(driver, 1, 30, 'xpath', f'//span[contains(.,"{serial1}")]')
    driver.find_element_by_xpath(f'//span[contains(.,"{serial1}")]')


@then('Navigate to System and click Support')
def navigate_to_system_and_click_support(driver):
    """Navigate to System and click Support."""
    driver.find_element_by_xpath('//a[@name="System-menu"]').click()
    wait_on_element(driver, 0.5, 30, 'xpath', '//a[contains(.,"Support")]')
    driver.find_element_by_xpath('//a[contains(.,"Support")]').click()


@then('The Support page License Information should load')
def the_support_page_license_information_should_load(driver):
    """The Support page License Information should load."""
    wait_on_element(driver, 0.5, 30, 'xpath', '//p[contains(.,"License Information")]')
    driver.find_element_by_xpath('//p[contains(.,"License Information")]')


@then('Click UPDATE LICENSE')
def click_update_license(driver):
    """Click UPDATE LICENSE."""
    driver.find_element_by_xpath('//button[@id="update-license-btn"]').click()


@then('The "Update License" widget should open')
def the_update_license_widget_should_open(driver):
    """The "Update License" widget should open."""
    wait_on_element(driver, 0.5, 30, 'xpath', '//h1[contains(.,"Update License")]')
    driver.find_element_by_xpath('//h1[contains(.,"Update License")]')


@then(parsers.parse('Enter "{License}"'))
def enter_license(driver, License):
    """Enter "license"."""
    driver.find_element_by_xpath('//textarea[@placeholder="License"]').clear()
    driver.find_element_by_xpath('//textarea[@placeholder="License"]').send_keys(License)


@then('Click SAVE LICENSE')
def click_save_license(driver):
    """Click SAVE LICENSE."""
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE LICENSE"]').click()


@then('The following should appear "Reload the page for the license to take effect"')
def the_following_should_appear_reload_the_page_for_the_license_to_take_effect(driver):
    """The following should appear "Reload the page for the license to take effect"."""
    wait_on_element(driver, 0.5, 30, 'xpath', '//h1[contains(.,"Reload the page")]')
    driver.find_element_by_xpath('//h1[contains(.,"Reload the page")]')


@then('Click reload now')
def click_reload_now(driver):
    """Click reload now."""
    driver.find_element_by_xpath('//button[@ix-auto="button__RELOAD NOW"]').click()


@then('We should return to login prompt')
def we_should_return_to_login_prompt(driver):
    """We should return to login prompt."""
    wait_on_element(driver, 0.5, 30, 'xpath', '//input[@placeholder="Username"]')
    driver.find_element_by_xpath('//input[@placeholder="Username"]')


@then(parsers.parse('Login as "root" with "{password}"'))
def login_as_root_with_password(driver, password):
    """Login as "root" with "password"."""
    driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys('root')
    driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys(password)
    wait_on_element(driver, 0.5, 30, 'xpath', '//button[@name="signin_button"]')
    driver.find_element_by_xpath('//button[@name="signin_button"]').click()


@then('"{agreement}" should appear')
def end_user_license_agreement_truenas_should_appear(driver, agreement):
    """"End User License Agreement - TrueNAS" should appear."""
    wait_on_element(driver, 0.5, 30, 'xpath', f'//h1[contains(.,"{agreement}")]')
    driver.find_element_by_xpath(f'//h1[contains(.,"{agreement}")]')


@then('Click Agree')
def click_agree(driver):
    """Click Agree."""
    wait_on_element(driver, 0.5, 30, 'xpath', '//button[@ix-auto="button__I AGREE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__I AGREE"]').click()


@then('We should be returned to license information')
def we_should_be_returned_to_license_information(driver):
    """We should be returned to license information."""
    wait_on_element(driver, 0.5, 30, 'xpath', '//p[contains(.,"License Information")]')
    driver.find_element_by_xpath('//p[contains(.,"License Information")]')


@then(parsers.parse('both serials show show under System Serial "{serial1}" and "{serial2}"'))
def both_serials_show_show_under_system_serial_serial1_and_serial2(driver, serial1, serial2):
    """both serials show show under System Serial "serial1" and "serial2"."""
    driver.find_element_by_xpath(f'//span[contains(.,"{serial1} / {serial2}")]')
