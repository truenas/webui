# coding=utf-8
"""SCALE UI feature tests."""

import reusableSeleniumCode as rsc
import time
import xpaths
from function import (
    wait_on_element,
    attribute_value_exist,
    wait_for_attribute_value,
    wait_on_element_disappear,
    ssh_cmd,
    get,
    put
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)
import pytest
pytestmark = [pytest.mark.debug_test]


@pytest.mark.dependency(name='Setup_SSH')
@scenario('features/NAS-T1062.feature', 'Verify SSH Access with root works')
def test_verify_ssh_access_with_root_works(driver):
    """Verify SSH Access with root works."""


@given('the browser is open, navigate to the SCALE URL, and login')
def the_browser_is_open_navigate_to_the_scale_url(driver, nas_ip, root_password):
    """the browser is open, navigate to the SCALE URL."""
    driver.get(f"http://{nas_ip}")
    assert wait_on_element(driver, 10, xpaths.login.user_Input)
    driver.find_element_by_xpath(xpaths.login.user_Input).clear()
    driver.find_element_by_xpath(xpaths.login.user_Input).send_keys('root')
    driver.find_element_by_xpath(xpaths.login.password_Input).clear()
    driver.find_element_by_xpath(xpaths.login.password_Input).send_keys(root_password)
    assert wait_on_element(driver, 4, xpaths.login.signin_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.login.signin_Button).click()


@when('on the dashboard, verify the Welcome box is loaded, click Close')
def on_the_dashboard_verify_the_welcome_box_is_loaded_click_close(driver):
    """on the dashboard, verify the Welcome box is loaded, click Close."""
    rsc.Verify_The_Dashboard(driver)
    if wait_on_element(driver, 5, '//div[contains(.,"Looking for help?")]'):
        assert wait_on_element(driver, 10, xpaths.button.close, 'clickable')
        driver.find_element_by_xpath(xpaths.button.close).click()


@then('on the dashboard click on the System Settings side menu, then click services')
def on_the_dashboard_click_on_the_system_settings_side_menu_then_click_services(driver):
    """on the dashboard click on the System Settings side menu, then click services."""
    rsc.Go_To_Service(driver)


@then('on the service page, press on configure(pencil) SSH')
def on_the_service_page_press_on_configurepencil_ssh(driver):
    """on the service page, press on configure(pencil) SSH."""
    assert wait_on_element(driver, 5, xpaths.services.title)
    assert wait_on_element(driver, 5, '//td[contains(text(),"SSH")]')
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
    value_exist = attribute_value_exist(driver, '//mat-checkbox[contains(.,"Log in as Root with Password")]', 'class', 'mat-mdc-checkbox-checked')
    if not value_exist:
        driver.find_element_by_xpath('//mat-checkbox[contains(.,"Log in as Root with Password")]').click()


@then('verify the checkbox works and click Save')
def verify_the_checkbox_works_and_click_save(driver, nas_ip, root_password):
    """verify the checkbox works and click Save."""
    wait_for_value = wait_for_attribute_value(driver, 5, '//ix-checkbox[@formcontrolname="rootlogin"]//mat-checkbox', 'class', 'mat-mdc-checkbox-checked')
    assert wait_for_value
    time.sleep(1)
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 10, xpaths.popup.please_Wait)


@then('click the Start Automatically SSH checkbox and enable the SSH service')
def click_the_start_automatically_ssh_checkbox_and_enable_the_ssh_service(driver):
    """click the Start Automatically SSH checkbox and enable the SSH service."""
    assert wait_on_element(driver, 5, xpaths.services.title)
    assert wait_on_element(driver, 5, xpaths.services.ssh_Service)
    assert wait_on_element(driver, 5, xpaths.services.ssh_Service_Checkbox, 'clickable')
    value_exist = attribute_value_exist(driver, xpaths.services.ssh_Service_Checkbox, 'class', 'mat-mdc-checkbox-checked')
    if not value_exist:
        driver.find_element_by_xpath(xpaths.services.ssh_Service_Checkbox).click()
    assert wait_on_element(driver, 5, xpaths.services.ssh_Service_Toggle, 'clickable')
    value_exist = attribute_value_exist(driver, xpaths.services.ssh_Service_Toggle, 'class', 'mdc-switch--checked')
    if not value_exist:
        driver.find_element_by_xpath(xpaths.services.ssh_Service_Toggle).click()
    time.sleep(1)


@then('the service should be enabled with no errors')
def the_service_should_be_enabled_with_no_errors(driver):
    """the service should be enabled with no errors."""
    wait_on_element_disappear(driver, 30, xpaths.progress.spinner)
    assert wait_for_attribute_value(driver, 20, xpaths.services.ssh_Service_Toggle, 'class', 'mdc-switch--checked')


@then('ssh to a NAS with root and the root password should work')
def ssh_to_a_nas_with_root_and_the_root_password_should_work(driver, root_password, nas_ip):
    """ssh to a NAS with root and the root password should work."""
    global ssh_result
    ssh_result = ssh_cmd('ls', 'root', root_password, nas_ip)
    assert ssh_result['result'], ssh_result['output']
    assert 'tdb' in ssh_result['output'], ssh_result['output']
