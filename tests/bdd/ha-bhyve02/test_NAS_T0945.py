# coding=utf-8
"""High Availability (tn09) feature tests."""

import pytest
import reusableSeleniumCode as rsc
import time
import xpaths
from selenium.common.exceptions import ElementClickInterceptedException
from function import (
    wait_on_element,
    wait_for_attribute_value,
    attribute_value_exist,
    ssh_cmd,
    wait_on_element_disappear
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@pytest.mark.dependency(name='Setup_SSH')
@scenario('features/NAS-T945.feature', 'Verify SSH Access with Root works')
def test_verify_ssh_access_with_root_works(driver):
    """Verify SSH Access with Root works."""


@given(parsers.parse('the browser is open navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url):
    """the browser is open navigate to "{nas_url}"."""
    if nas_url not in driver.current_url:
        driver.get(f"{nas_url}/ui/sessions/signin")


@when(parsers.parse('login appear enter "{user}" and "{password}"'))
def login_appear_enter_root_and_password(driver, user, password):
    """login appear enter "{user}" and "{password}"."""
    assert wait_on_element(driver, 10, xpaths.login.user_Input)
    driver.find_element_by_xpath(xpaths.login.user_Input).clear()
    driver.find_element_by_xpath(xpaths.login.user_Input).send_keys(user)
    driver.find_element_by_xpath(xpaths.login.password_Input).clear()
    driver.find_element_by_xpath(xpaths.login.password_Input).send_keys(password)
    assert wait_on_element(driver, 4, xpaths.login.signin_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.login.signin_Button).click()


@then('you should see the dashboard')
def you_should_see_the_dashboard(driver):
    """you should see the dashboard."""
    rsc.Verify_The_Dashboard(driver)
    if wait_on_element(driver, 2, '//h1[contains(.,"End User License Agreement - TrueNAS")]'):
        try:
            assert wait_on_element(driver, 2, '//button[@ix-auto="button__I AGREE"]', 'clickable')
            driver.find_element_by_xpath('//button[@ix-auto="button__I AGREE"]').click()
            if wait_on_element(driver, 2, xpaths.button.close, 'clickable'):
                driver.find_element_by_xpath(xpaths.button.close).click()
        except ElementClickInterceptedException:
            assert wait_on_element(driver, 2, xpaths.button.close, 'clickable')
            driver.find_element_by_xpath(xpaths.button.close).click()
            assert wait_on_element(driver, 2, '//button[@ix-auto="button__I AGREE"]', 'clickable')
            driver.find_element_by_xpath('//button[@ix-auto="button__I AGREE"]').click()


@then('go to System Settings, click Services')
def go_to_system_settings_click_services(driver):
    """go to System Settings, click Services."""
    rsc.Go_To_Service(driver)


@then('the service page should open')
def the_service_page_should_open(driver):
    """the service page should open."""
    assert wait_on_element(driver, 5, xpaths.services.title)
    time.sleep(1)


@then('press on configure(pencil) SSH')
def press_on_configure_ssh(driver):
    """press on configure(pencil) SSH."""
    assert wait_on_element(driver, 5, xpaths.services.ssh_Service_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.services.ssh_Service_Button).click()


@then('the SSH General Options page should open')
def the_ssh_general_options_page_should_open(driver):
    """the SSH General Options page should open."""
    assert wait_on_element(driver, 5, '//h1[text()="SSH"]')
    assert wait_on_element(driver, 5, '//legend[contains(.,"General Options")]')


@then('click the checkbox "Log in as root with password"')
def click_the_checkbox_log_in_as_root_with_password(driver):
    """click the checkbox "Log in as root with password"."""
    assert wait_on_element(driver, 5, '//mat-checkbox[contains(.,"Log in as Root with Password")]', 'clickable')
    time.sleep(0.5)
    value_exist = attribute_value_exist(driver, '//mat-checkbox[contains(.,"Log in as Root with Password")]', 'class', 'mat-checkbox-checked')
    if not value_exist:
        driver.find_element_by_xpath('//mat-checkbox[contains(.,"Log in as Root with Password")]').click()
    wait_for_value = wait_for_attribute_value(driver, 7, '//mat-checkbox[contains(.,"Log in as Root with Password")]', 'class', 'mat-checkbox-checked')
    assert wait_for_value


@then('click Save')
def click_save(driver):
    """click Save."""
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 10, xpaths.popup.please_Wait)


@then('click Start Automatically SSH checkbox and enable the SSH service')
def click_start_automatically_ssh_checkbox_and_enable_the_ssh_service(driver):
    """click Start Automatically SSH checkbox and enable the SSH service."""
    assert wait_on_element(driver, 5, xpaths.services.title)
    time.sleep(1)
    assert wait_on_element(driver, 5, '//tr[contains(.,"SSH")]//mat-checkbox')
    value_exist = attribute_value_exist(driver, '//tr[contains(.,"SSH")]//mat-checkbox', 'class', 'mat-checkbox-checked')
    if not value_exist:
        driver.find_element_by_xpath('//tr[contains(.,"SSH")]//mat-checkbox').click()
    assert wait_on_element(driver, 5, '//tr[contains(.,"SSH")]//mat-slide-toggle/label', 'clickable')
    value_exist = attribute_value_exist(driver, xpaths.services.ssh_Service_Toggle, 'class', 'mat-checked')
    if not value_exist:
        driver.find_element_by_xpath('//tr[contains(.,"SSH")]//mat-slide-toggle/label').click()
    time.sleep(1)


@then('the service should be enabled with no errors')
def the_service_should_be_enabled_with_no_errors(driver):
    """the service should be enabled with no errors."""
    assert wait_on_element_disappear(driver, 30, xpaths.progress.spinner)
    assert wait_for_attribute_value(driver, 20, xpaths.services.ssh_Service_Toggle, 'class', 'mat-checked')


@then(parsers.parse('run ssh root@"{host}" with root password "{password}"'))
def run_ssh_root_host_with_root_password(driver, host, password):
    """run ssh root@"{host}" with root password "{password}"."""
    global ssh_result
    ssh_result = ssh_cmd('ls -la', 'root', password, host)


@then('the root user should be able to login with ssh')
def the_root_user_should_be_able_to_login_with_ssh(driver):
    """the root user should be able to login with ssh."""
    assert ssh_result['result'], ssh_result['output']
    assert '..' in ssh_result['output'], ssh_result['output']
