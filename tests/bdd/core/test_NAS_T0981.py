# coding=utf-8
"""Core UI feature tests."""

import time
from function import (
    wait_on_element,
    attribute_value_exist,
    wait_for_attribute_value,
    wait_on_element_disappear,
    ssh_cmd
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when
)
import pytest

pytestmark = [pytest.mark.debug_test]


@scenario('features/NAS-T981.feature', 'Verify SSH Access with root works')
def test_verify_ssh_access_with_root_works(driver):
    """Verify SSH Access with root works."""
    pass


@given('the browser is open, navigate to the FreeNAS URL')
def the_browser_is_open_navigate_to_the_freenas_url(driver, nas_ip):
    """the browser is open, navigate to the FreeNAS URL."""
    driver.get(f"http://{nas_ip}/ui/sessions/signin")
    assert wait_on_element(driver, 20, '//input[@placeholder="Username"]')
    time.sleep(1)


@when('login appears, enter the root user and is password')
def login_appears_enter_the_root_user_and_is_password(driver, root_password):
    """login appears, enter the root user and is password."""
    assert wait_on_element(driver, 5, '//input[@placeholder="Username"]')
    driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys('root')
    driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys(root_password)
    assert wait_on_element(driver, 4, '//button[@name="signin_button"]')
    driver.find_element_by_xpath('//button[@name="signin_button"]').click()


@then('you should see the dashboard')
def you_should_see_the_dashboard(driver):
    """you should see the dashboard."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    if wait_on_element(driver, 10, '//div[contains(.,"Looking for help?")]'):
        assert wait_on_element(driver, 10, '//button[@ix-auto="button__CLOSE"]')
        driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    assert wait_on_element(driver, 5, '//span[contains(.,"System Information")]')


@then('click on the Services side tab')
def click_on_the_services_side_tab(driver):
    """click on the Services side tab."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Services"]').click()


@then('the service page should open')
def the_service_page_should_open(driver):
    """the service page should open."""
    assert wait_on_element(driver, 5, '//li[contains(.,"Services")]')


@then('press on configure(pencil) SSH')
def press_on_configure_pencil_ssh(driver):
    """press on configure(pencil) SSH."""
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__S3_Actions"]')
    # Scroll to SSH service
    element = driver.find_element_by_xpath('//button[@ix-auto="button__S3_Actions"]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(1)
    driver.find_element_by_xpath('//button[@ix-auto="button__SSH_Actions"]').click()


@then('the SSH General Options page should open')
def the_ssh_general_options_page_should_open(driver):
    """the SSH General Options page should open."""
    assert wait_on_element(driver, 5, '//h4[contains(text(),"General Options")]')


@then('click the checkbox "Log in as root with password"')
def click_the_checkbox_log_in_as_root_with_password(driver):
    """click the checkbox "Log in as root with password"."""
    value_exist = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Log in as Root with Password"]', 'class', 'mat-checkbox-checked')
    if not value_exist:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Log in as Root with Password"]').click()


@then('verify the checkbox works and click Save')
def verify_the_checkbox_works_and_click_save(driver):
    """verify the checkbox works and click Save."""
    wait_for_value = wait_for_attribute_value(driver, 5, '//mat-checkbox[@ix-auto="checkbox__Log in as Root with Password"]', 'class', 'mat-checkbox-checked')
    assert wait_for_value
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')


@then('click the Start Automatically SSH checkbox and enable the SSH service')
def click_the_start_automatically_ssh_checkbox_and_enable_the_ssh_service(driver):
    """click the Start Automatically SSH checkbox and enable the SSH service."""
    assert wait_on_element(driver, 5, '//li[contains(.,"Services")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__S3_Actions"]')
    # Scroll to SSH service
    element = driver.find_element_by_xpath('//button[@ix-auto="button__S3_Actions"]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(1)
    driver.find_element_by_xpath('//div[@ix-auto="value__SSH"]')
    value_exist = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__SSH_Start Automatically"]', 'class', 'mat-checkbox-checked')
    if not value_exist:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__SSH_Start Automatically"]').click()
    value_exist = attribute_value_exist(driver, '//mat-slide-toggle[@ix-auto="slider__SSH_Running"]', 'class', 'mat-checked')
    if not value_exist:
        driver.find_element_by_xpath('//div[@ix-auto="overlay__SSH_Running"]').click()
    time.sleep(1)


@then('the service should be enabled with no errors')
def the_service_should_be_enabled_with_no_errors(driver):
    """the service should be enabled with no errors."""
    wait_on_element_disappear(driver, 15, '//mat-spinner[@role="progressbar"]')
    wait_for_value = wait_for_attribute_value(driver, 7, '//mat-slide-toggle[@ix-auto="slider__SSH_Running"]', 'class', 'mat-checked')
    assert wait_for_value
    # scroll back up the mat-list-item
    element = driver.find_element_by_xpath('//span[contains(.,"root")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@then('ssh in the NAS with root and run beadm list command')
def ssh_in_the_NAS_with_root_and_run_beadm_list_command(driver, root_password, nas_ip):
    """ssh in the NAS with root and run beadm list command."""
    global ssh_result
    ssh_result = ssh_cmd('beadm list', 'root', root_password, nas_ip)


@then('verify the ssh connection is successful and the boot environments are listed')
def verify_the_ssh_connection_is_successful_and_the_boot_environments_are_listed(driver):
    """verify the ssh connection is successful and the boot environments are listed."""
    assert ssh_result['result'], ssh_result['output']
    assert 'default' in ssh_result['output'], ssh_result['output']
