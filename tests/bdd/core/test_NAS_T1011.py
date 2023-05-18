# coding=utf-8
"""Core UI feature tests."""

import time
import reusableSeleniumCode as rsc
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    ssh_cmd
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T1011.feature', 'Setting up LDAP and verify that it is setup on the NAS')
def test_setting_up_ldap_and_verify_that_it_is_setup_on_the_nas(driver):
    """Setting up LDAP and verify that it is setup on the NAS."""


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


@then('click on Directory Services on the side menu and click LDAP')
def click_on_directory_services_on_the_side_menu_and_click_ldap(driver):
    """click on Directory Services on the side menu and click LDAP."""
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Directory Services"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Directory Services"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__LDAP"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__LDAP"]').click()


@then('the LDAP page should open')
def the_ldap_page_should_open(driver):
    """the LDAP page should open."""
    assert wait_on_element(driver, 5, '//div[contains(.,"Server Credentials")]')


@then(parsers.parse('input {hostname} for Hostname, "{base_dn}" Base DN'))
def input_hostname_and_base_dn(driver, hostname, base_dn):
    """input hostname for Hostname, base_dn Base DN."""
    assert wait_on_element(driver, 5, '//input[@placeholder="Hostname"]')
    driver.find_element_by_xpath('//input[@placeholder="Hostname"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Hostname"]').send_keys(hostname)
    driver.find_element_by_xpath('//input[@placeholder="Base DN"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Base DN"]').send_keys(base_dn)


@then(parsers.parse('input "{bind_dn}" for Bind DN'))
def input_bind_dn_for_bind_dn(driver, bind_dn):
    """input bind_dn for Bind DN."""
    driver.find_element_by_xpath('//input[@placeholder="Bind DN"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Bind DN"]').send_keys(bind_dn)


@then(parsers.parse('input {password} for Bind Password'))
def input_password_for_bind_password(driver, password):
    """input password for Bind Password."""
    driver.find_element_by_xpath('//input[@placeholder="Bind Password"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Bind Password"]').send_keys(password)


@then('click Advanced Options')
def click_advanced_options(driver):
    """click Advanced Options."""
    driver.find_element_by_xpath(xpaths.button.advanced_options).click()


@then('click Enable checkbox, then Samba Schema and select ON for Encryption Mode')
def click_enable_checkbox_then_samba_schema_and_select_on_for_encryption_mode(driver):
    """click Enable checkbox, then Samba Schema and select ON for Encryption Mode."""
    assert wait_on_element(driver, 7, '//mat-select[@ix-auto="select__Encryption Mode"]')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Enable"]').click()
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Samba Schema (DEPRECATED - see help text)"]').click()
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Encryption Mode"]').click()
    assert wait_on_element(driver, 7, '//mat-option[@ix-auto="option__Encryption Mode_ON"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Encryption Mode_ON"]').click()


@then('click SAVE Please wait should appear while settings are applied')
def click_save_please_wait_should_appear_while_settings_are_applied(driver):
    """click SAVE Please wait should appear while settings are applied."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')


@then('after settings are applied, you should see Settings saved')
def after_settings_are_applied_you_should_see_settings_saved(driver):
    """after settings are applied, you should see Settings saved."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Settings saved.")]')


@then(parsers.parse('run {command} trough ssh'))
def run_command_trough_ssh(driver, command, root_password, nas_ip):
    """run command trough ssh."""
    global ssh_result
    ssh_result = ssh_cmd(command, 'root', root_password, nas_ip)
    assert ssh_result['result'], ssh_result['output']


@then(parsers.parse('the ssh result should pass and return {user} info'))
def the_ssh_result_should_pass_and_return_user_info(driver, user):
    """the ssh result should pass and return user info."""
    assert user in ssh_result['output'], ssh_result['output']
