# coding=utf-8
"""SCALE UI: feature tests."""

import pytest
import time
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_on_element_disappear,
    ssh_cmd,
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@pytest.mark.dependency(name='LDAP_SETUP')
@scenario('features/NAS-T1125.feature', 'Setting up LDAP and verify that it is setup on the NAS')
def test_scale_ui_setting_up_ldap_and_verify_that_it_is_setup_on_the_nas():
    """Setting up LDAP and verify that it is setup on the NAS."""
    pass


@given('the browser is open, the FreeNAS URL and logged in')
def the_browser_is_open_the_freenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open, the FreeNAS URL and logged in."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, xpaths.login.user_input)
    if not is_element_present(driver, xpaths.sideMenu.dashboard):
        assert wait_on_element(driver, 10, xpaths.login.user_input)
        driver.find_element_by_xpath(xpaths.login.user_input).clear()
        driver.find_element_by_xpath(xpaths.login.user_input).send_keys('root')
        driver.find_element_by_xpath(xpaths.login.password_input).clear()
        driver.find_element_by_xpath(xpaths.login.password_input).send_keys(root_password)
        assert wait_on_element(driver, 5, xpaths.login.signin_button)
        driver.find_element_by_xpath(xpaths.login.signin_button).click()
    else:
        assert wait_on_element(driver, 5, xpaths.sideMenu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()


@when('you should be on the dashboard, click on Credentials and then Directory Services.')
def you_should_be_on_the_dashboard_click_on_credentials_and_then_directory_services(driver):
    """you should be on the dashboard, click on Credentials and then Directory Services.."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    """click on the Credentials on the side menu, click on Local Users."""
    assert wait_on_element(driver, 7, xpaths.sideMenu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.credentials).click()
    assert wait_on_element(driver, 7, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Directory Services"]', 'clickable')
    driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Directory Services"]').click()


@then('the Directory Services page should open, then click LDAP settings button')
def the_directory_services_page_should_open_then_click_ldap_settings_button(driver):
    """the Directory Services page should open, then click LDAP settings button."""
    # Verify the page is starting to load
    assert wait_on_element(driver, 5, '//h1[text()="Directory Services"]')
    assert wait_on_element(driver, 10, '//h3[text()="Active Directory and LDAP are disabled."]')
    assert wait_on_element(driver, 7, '//span[contains(text(),"Configure LDAP")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Configure LDAP")]').click()
    # Verify the LDAP box is starting to load
    assert wait_on_element(driver, 5, '//h3[text()="LDAP"]')


@then(parsers.parse('input "{hostname}" for Hostname'))
def input_hostname_for_hostname(driver, hostname):
    """input "{hostname}" for Hostname."""
    assert wait_on_element(driver, 5, '//span[contains(text(),"Configure LDAP")]', 'clickable')
    assert wait_on_element(driver, 5, '//input[@placeholder="Hostname"]', 'inputable')
    driver.find_element_by_xpath('//input[@placeholder="Hostname"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Hostname"]').send_keys(hostname)


@then(parsers.parse('input "{base_DN}" Base DN'))
def input__base_DN_base_dn(driver, base_DN):
    """input "{base_DN}" Base DN."""
    driver.find_element_by_xpath('//input[@ix-auto="input__Base DN"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Base DN"]').send_keys(base_DN)


@then(parsers.parse('input "{bind_DN}" for Bind DN'))
def input__bind_DN_for_bind_dn(driver, bind_DN):
    """input "{bind_DN}" for Bind DN."""
    driver.find_element_by_xpath('//input[@ix-auto="input__Bind DN"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Bind DN"]').send_keys(bind_DN)


@then(parsers.parse('input "{bind_password}" for Bind Password'))
def input_bind_password_for_bind_password(driver, bind_password):
    """input "{bind_password}" for Bind Password."""
    driver.find_element_by_xpath('//input[@ix-auto="input__Bind Password"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Bind Password"]').send_keys(bind_password)


@then('click Advanced Options, then click Enable checkbox, then check Samba Schema, select ON for Encryption Mode, then click save')
def click_advanced_options_then_click_enable_checkbox_then_check_samba_schema_select_on_for_encryption_mode_then_click_save(driver):
    """click Advanced Options, then click Enable checkbox, then check Samba Schema, select ON for Encryption Mode, then click save."""
    assert wait_on_element(driver, 10, '//mat-checkbox[@ix-auto="checkbox__Enable"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Enable"]').click()
    assert wait_on_element(driver, 10, '//span[contains(text(),"Advanced Options")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Advanced Options")]').click()
    assert wait_on_element(driver, 5, '//mat-checkbox[contains(@ix-auto, "Samba Schema")]', 'clickable')
    checkbox_checked = attribute_value_exist(driver, '//mat-checkbox[contains(@ix-auto, "Samba Schema")]', 'class', 'mat-checkbox-checked')
    if not checkbox_checked:
        driver.find_element_by_xpath('//mat-checkbox[contains(@ix-auto, "Samba Schema")]').click()
    time.sleep(5)
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Encryption Mode"]').click()
    assert wait_on_element(driver, 10, '//span[contains(.,"ON")]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Encryption Mode_ON"]').click()
    element = driver.find_element_by_xpath('//span[contains(text(),"Basic Options")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then(parsers.parse('wait for Please wait should appear while settings are applied, then after settings are applied, you should see "{hostname}" Settings saved'))
def wait_for_please_wait_should_appear_while_settings_are_applied_then_after_settings_are_applied_you_should_see_hostname_settings_saved(driver, hostname):
    """wait for Please wait should appear while settings are applied, then after settings are applied, you should see "{hostname}" Settings saved."""
    assert wait_on_element_disappear(driver, 20, xpaths.popup.pleaseWait)
    # Add validation of elements
    assert wait_on_element(driver, 20, '//mat-card//span[contains(text(),"Hostname:")]')


@then(parsers.parse('run {command} trough ssh, the ssh result should pass and return {user} info'))
def run_command_trough_ssh_the_ssh_result_should_pass_and_return_user_info(driver, command, root_password, nas_ip, user):
    """run {command} trough ssh, the ssh result should pass and return {user} info."""
    global ssh_result
    ssh_result = ssh_cmd(command, 'root', root_password, nas_ip)
    assert ssh_result['result'], ssh_result['output']
    assert "eturgeon" in ssh_result['output'], ssh_result['output']
