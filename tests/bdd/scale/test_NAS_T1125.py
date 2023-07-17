# coding=utf-8
"""SCALE UI: feature tests."""

import pytest
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
from pytest_dependency import depends


@pytest.mark.dependency(name='LDAP_SETUP')
@scenario('features/NAS-T1125.feature', 'Setting up LDAP and verify that it is setup on the NAS')
def test_scale_ui_setting_up_ldap_and_verify_that_it_is_setup_on_the_nas():
    """Setting up LDAP and verify that it is setup on the NAS."""


@given('the browser is open, the TrueNAS URL and logged in')
def the_browser_is_open_the_truenas_url_and_logged_in(driver, nas_ip, root_password, request):
    """the browser is open, the TrueNAS URL and logged in."""
    depends(request, ['AD_Setup', 'AD_SMB'], scope='session')
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, xpaths.login.user_Input)
    if not is_element_present(driver, xpaths.side_Menu.dashboard):
        assert wait_on_element(driver, 10, xpaths.login.user_Input)
        driver.find_element_by_xpath(xpaths.login.user_Input).clear()
        driver.find_element_by_xpath(xpaths.login.user_Input).send_keys('root')
        driver.find_element_by_xpath(xpaths.login.password_Input).clear()
        driver.find_element_by_xpath(xpaths.login.password_Input).send_keys(root_password)
        assert wait_on_element(driver, 5, xpaths.login.signin_Button)
        driver.find_element_by_xpath(xpaths.login.signin_Button).click()
    else:
        assert wait_on_element(driver, 5, xpaths.side_Menu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.side_Menu.dashboard).click()


@when('you should be on the dashboard, click on Credentials and then Directory Services.')
def you_should_be_on_the_dashboard_click_on_credentials_and_then_directory_services(driver):
    """you should be on the dashboard, click on Credentials and then Directory Services.."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.system_Info_Card_Title)
    assert wait_on_element(driver, 7, xpaths.side_Menu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.credentials).click()
    assert wait_on_element(driver, 7, xpaths.side_Menu.directory_Services, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.directory_Services).click()


@then('the Directory Services page should open, then click LDAP settings button')
def the_directory_services_page_should_open_then_click_ldap_settings_button(driver):
    """the Directory Services page should open, then click LDAP settings button."""
    # Verify the page is starting to load
    assert wait_on_element(driver, 5, xpaths.directory_Services.title)
    assert wait_on_element(driver, 10, xpaths.directory_Services.directory_Disable_Title)
    assert wait_on_element(driver, 7, xpaths.directory_Services.configure_Ldap_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.directory_Services.configure_Ldap_Button).click()


@then(parsers.parse('input "{hostname}" for Hostname'))
def input_hostname_for_hostname(driver, hostname):
    """input "{hostname}" for Hostname."""
    # Verify the LDAP box is starting to load
    assert wait_on_element(driver, 5, xpaths.ldap.title)
    assert wait_on_element(driver, 5, xpaths.directory_Services.configure_Ldap_Button, 'clickable')
    assert wait_on_element(driver, 5, xpaths.ldap.hostname_Input, 'inputable')
    driver.find_element_by_xpath(xpaths.ldap.hostname_Input).clear()
    driver.find_element_by_xpath(xpaths.ldap.hostname_Input).send_keys(hostname)


@then(parsers.parse('input "{base_DN}" Base DN'))
def input__base_DN_base_dn(driver, base_DN):
    """input "{base_DN}" Base DN."""
    driver.find_element_by_xpath(xpaths.ldap.basedn_Input).clear()
    driver.find_element_by_xpath(xpaths.ldap.basedn_Input).send_keys(base_DN)


@then(parsers.parse('input "{bind_DN}" for Bind DN'))
def input__bind_DN_for_bind_dn(driver, bind_DN):
    """input "{bind_DN}" for Bind DN."""
    driver.find_element_by_xpath(xpaths.ldap.binddn_Input).clear()
    driver.find_element_by_xpath(xpaths.ldap.binddn_Input).send_keys(bind_DN)


@then(parsers.parse('input "{bind_password}" for Bind Password'))
def input_bind_password_for_bind_password(driver, bind_password):
    """input "{bind_password}" for Bind Password."""
    driver.find_element_by_xpath(xpaths.ldap.bindpw_Input).clear()
    driver.find_element_by_xpath(xpaths.ldap.bindpw_Input).send_keys(bind_password)


@then('click Advanced Options, then click Enable checkbox, then check Samba Schema, select ON for Encryption Mode, then click save')
def click_advanced_options_then_click_enable_checkbox_then_check_samba_schema_select_on_for_encryption_mode_then_click_save(driver):
    """click Advanced Options, then click Enable checkbox, then check Samba Schema, select ON for Encryption Mode, then click save."""
    assert wait_on_element(driver, 10, xpaths.checkbox.enable, 'clickable')
    driver.find_element_by_xpath(xpaths.checkbox.enable).click()
    assert wait_on_element(driver, 10, xpaths.button.advanced_Option, 'clickable')
    driver.find_element_by_xpath(xpaths.button.advanced_Option).click()
    assert wait_on_element(driver, 5, xpaths.ldap.samba_Schema_Checkbox, 'clickable')
    checkbox_checked = attribute_value_exist(driver, xpaths.ldap.samba_Schema_Checkbox, 'class', 'mat-mdc-checkbox-checked')
    if not checkbox_checked:
        driver.find_element_by_xpath(xpaths.ldap.samba_Schema_Checkbox).click()
    assert wait_on_element(driver, 10, xpaths.ldap.encryption_Mode_Select, 'clickable')
    driver.find_element_by_xpath(xpaths.ldap.encryption_Mode_Select).click()
    assert wait_on_element(driver, 10, xpaths.ldap.encryption_Mode_On_Option, 'clickable')
    driver.find_element_by_xpath(xpaths.ldap.encryption_Mode_On_Option).click()

    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then(parsers.parse('wait for Please wait should appear while settings are applied, then after settings are applied, you should see "{hostname}" Settings saved'))
def wait_for_please_wait_should_appear_while_settings_are_applied_then_after_settings_are_applied_you_should_see_hostname_settings_saved(driver, hostname):
    """wait for Please wait should appear while settings are applied, then after settings are applied, you should see "{hostname}" Settings saved."""
    assert wait_on_element_disappear(driver, 30, xpaths.progress.progressbar)
    assert wait_on_element_disappear(driver, 30, xpaths.popup.setting_Ldap)
    assert wait_on_element(driver, 5, xpaths.directory_Services.ldap_Card_Title)
    assert wait_on_element(driver, 5, xpaths.directory_Services.service_Status)
    assert wait_on_element(driver, 20, xpaths.directory_Services.ldap_Hostname(hostname))


@then(parsers.parse('run {command} trough ssh, the ssh result should pass and return {user} info'))
def run_command_trough_ssh_the_ssh_result_should_pass_and_return_user_info(driver, command, root_password, nas_ip, user):
    """run {command} trough ssh, the ssh result should pass and return {user} info."""
    global ssh_result
    ssh_result = ssh_cmd(command, 'root', root_password, nas_ip)
    assert ssh_result['result'], ssh_result['output']
    assert "eturgeon" in ssh_result['output'], ssh_result['output']
