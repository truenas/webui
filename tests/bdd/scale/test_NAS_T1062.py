# coding=utf-8
"""SCALE UI feature tests."""

import time
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_on_element_disappear,
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)


@scenario('features/NAS-T1062.feature', 'Verify SSH Access with root works')
def test_verify_ssh_access_with_root_works(driver):
    """Verify SSH Access with root works."""
    pass


@given('the browser is open, navigate to the SCALE URL')
def the_browser_is_open_navigate_to_the_scale_url(driver, nas_ip, root_password):
    """the browser is open, navigate to the SCALE URL."""
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


@when('on the login page, enter the root user and is password')
def on_the_login_page_enter_the_root_user_and_is_password(driver):
    """on the login page, enter the root user and is password."""


@then('on the dashboard click on the System Settings side menu, then click services')
def on_the_dashboard_click_on_the_system_settings_side_menu_then_click_services(driver):
    """on the dashboard click on the System Settings side menu, then click services."""


@then('on the service page, press on configure(pencil) SSH')
def on_the_service_page_press_on_configurepencil_ssh(driver):
    """on the service page, press on configure(pencil) SSH."""


@then('the SSH General Options page should open')
def the_ssh_general_options_page_should_open(driver):
    """the SSH General Options page should open."""


@then('click the checkbox "Log in as root with password"')
def click_the_checkbox_log_in_as_root_with_password(driver):
    """click the checkbox "Log in as root with password"."""


@then('verify the checkbox works and click Save')
def verify_the_checkbox_works_and_click_save(driver):
    """verify the checkbox works and click Save."""


@then('click the Start Automatically SSH checkbox and enable the SSH service')
def click_the_start_automatically_ssh_checkbox_and_enable_the_ssh_service(driver):
    """click the Start Automatically SSH checkbox and enable the SSH service."""


@then('the service should be enabled with no errors')
def the_service_should_be_enabled_with_no_errors(driver):
    """the service should be enabled with no errors."""


@then('ssh to a NAS with root and the root password should work')
def ssh_to_a_nas_with_root_and_the_root_password_should_work(driver):
    """ssh to a NAS with root and the root password should work."""


