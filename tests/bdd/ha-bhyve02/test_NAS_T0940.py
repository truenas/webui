# coding=utf-8
"""High Availability (tn-bhyve03) feature tests."""

import pytest
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


@pytest.mark.dependency(name='NAS-T940')
@scenario('features/NAS-T940.feature', 'Setting up LDAP and verify that LDAP still work after failover')
def test_setting_up_ldap_and_verify_that_ldap_still_work_after_failover():
    """Setting up LDAP and verify that LDAP still work after failover."""


@given(parsers.parse('the browser is open on "{virtual_hostname}" and logged in'))
def the_browser_is_open_on_virtual_hostname_and_logged_in(driver, virtual_hostname):
    """the browser is open on "{virtual_hostname}" and logged in."""
    if virtual_hostname not in driver.current_url:
        driver.get(f"http://{virtual_hostname}/ui/dashboard/")
        time.sleep(1)
    if not is_element_present(driver, xpaths.sideMenu.dashboard):
        assert wait_on_element(driver, 10, xpaths.login.user_input)
        driver.find_element_by_xpath(xpaths.login.user_input).clear()
        driver.find_element_by_xpath(xpaths.login.user_input).send_keys('root')
        driver.find_element_by_xpath(xpaths.login.password_input).clear()
        driver.find_element_by_xpath(xpaths.login.password_input).send_keys('testing')
        assert wait_on_element(driver, 4, xpaths.login.signin_button)
        driver.find_element_by_xpath(xpaths.login.signin_button).click()
    if not is_element_present(driver, xpaths.breadcrumb.dashboard):
        assert wait_on_element(driver, 10, xpaths.sideMenu.root)
        element = driver.find_element_by_xpath(xpaths.sideMenu.root)
        driver.execute_script("arguments[0].scrollIntoView();", element)
        assert wait_on_element(driver, 5, xpaths.sideMenu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()


@when('you see the Dashboard go to Directory Services and select LDAP')
def you_see_the_dashboard_go_to_directory_services_and_select_ldap(driver):
    """you see the Dashboard go to Directory Services and select LDAP."""
    assert wait_on_element(driver, 7, xpaths.breadcrumb.dashboard)
    assert wait_on_element(driver, 5, xpaths.dashboard.system_information)
    assert wait_on_element(driver, 5, xpaths.sideMenu.directory_services, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.directory_services).click()
    assert wait_on_element(driver, 7, xpaths.sideMenu.directory_services_ldap)
    driver.find_element_by_xpath(xpaths.sideMenu.directory_services_ldap).click()


@then('on the LDAP page input the <ldap_hostname>, <base_dn>, <bind_dn>')
def on_the_ldap_page_input_the_ldap_hostname_base_dn_bind_dn(driver, ldap_hostname, base_dn, bind_dn):
    """on the LDAP page input the <ldap_hostname>, <base_dn>, <bind_dn>."""
    assert wait_on_element(driver, 5, '//li[span/a/text()="LDAP"]')
    assert wait_on_element(driver, 5, '//div[contains(.,"Server Credentials")]')
    assert wait_on_element(driver, 5, '//input[@placeholder="Hostname"]', 'inputable')
    driver.find_element_by_xpath('//input[@placeholder="Hostname"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Hostname"]').send_keys(ldap_hostname)
    driver.find_element_by_xpath('//input[@placeholder="Base DN"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Base DN"]').send_keys(base_dn)
    driver.find_element_by_xpath('//input[@placeholder="Bind DN"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Bind DN"]').send_keys(bind_dn)


@then('input <bind_password> then click Enable checkbox and Advanced Options')
def input_bind_password_then_click_enable_checkbox_and_advanced_options(driver, bind_password):
    """input <bind_password> then click Enable checkbox and Advanced Options."""
    driver.find_element_by_xpath('//input[@placeholder="Bind Password"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Bind Password"]').send_keys(bind_password)
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Enable"]').click()
    driver.find_element_by_xpath(xpaths.button.advanced_options).click()
    time.sleep(1)


@then('click to enable Samba Schema and ensure Encryption Mode is ON')
def click_to_enable_samba_schema_and_ensure_encryption_mode_is_on(driver):
    """click to enable Samba Schema and ensure Encryption Mode is ON."""
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__Samba Schema (DEPRECATED - see help text)"]', 'clickable')
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Encryption Mode"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Samba Schema (DEPRECATED - see help text)"]').click()
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Encryption Mode"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Encryption Mode_ON"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Encryption Mode_ON"]').click()


@then('click SAVE, then "Please wait" should appear, and you should see "Settings saved."')
def click_save_then_please_wait_should_appear_and_you_should_see_settings_saved(driver):
    """click SAVE, then "Please wait" should appear, and you should see "Settings saved."."""
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 30, xpaths.popup.please_wait)
    assert wait_on_element(driver, 7, '//div[contains(.,"Settings saved.")]')
    # allow time for the NAS to settle down
    time.sleep(5)


@then(parsers.parse('ssh to virtual node and run "{pdbedit_cmd}", return "{ldap_user}" info'))
def ssh_to_virtual_node_and_run_pdbedit_cmd_return_ldap_user_info(pdbedit_cmd, ldap_user, virtual_hostname):
    """ssh to virtual node and run "{pdbedit_cmd}", return "{ldap_user}" info."""
    ssh_result = ssh_cmd(pdbedit_cmd, 'root', 'testing', virtual_hostname)
    assert ssh_result['result'] is True, str(ssh_result['output'])
    assert ldap_user in ssh_result['output'], str(ssh_result['output'])


@then(parsers.parse('run "{getent_cmd}" and verify it return LDAP user info'))
def run_getent_cmd_and_verify_it_return_ldap_user_info(getent_cmd, ldap_user, virtual_hostname):
    """run "{getent_cmd}" and verify it return LDAP user info."""
    ssh_result = ssh_cmd(getent_cmd, 'root', 'testing', virtual_hostname)
    assert ssh_result['result'], ssh_result['output']
    assert ldap_user in ssh_result['output'], ssh_result['output']


@then('go to the Dashboard, verify HA is enabled, then Trigger failover')
def go_to_the_dashboard_verify_ha_is_enabled_then_trigger_failover(driver):
    """Go to the Dashboard, verify HA is enabled, then Trigger failover."""
    assert wait_on_element(driver, 10, xpaths.sideMenu.root)
    element = driver.find_element_by_xpath(xpaths.sideMenu.root)
    driver.execute_script("arguments[0].scrollIntoView();", element)
    assert wait_on_element(driver, 5, xpaths.sideMenu.dashboard, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()
    assert wait_on_element(driver, 7, xpaths.breadcrumb.dashboard)
    # wait_on_element need to be replace with wait_on_element when NAS-118299
    assert wait_on_element(driver, 10, xpaths.topToolbar.ha_enable)
    time.sleep(5)
    assert wait_on_element(driver, 60, xpaths.button.initiate_failover, 'clickable')
    driver.find_element_by_xpath(xpaths.button.initiate_failover).click()
    assert wait_on_element(driver, 5, xpaths.popup.initiate_failover)
    driver.find_element_by_xpath(xpaths.checkbox.confirm).click()
    assert wait_on_element(driver, 5, xpaths.button.failover)
    driver.find_element_by_xpath(xpaths.button.failover).click()


@then('on the login, wait to see HA is enabled before login')
def on_the_login_wait_to_see_ha_is_enabled_before_login(driver):
    """on the login, wait to see HA is enabled before login."""
    assert wait_on_element(driver, 120, xpaths.login.user_input)
    # wait for HA is enabled to avoid UI refreshing
    assert wait_on_element(driver, 300, xpaths.login.ha_status('HA is enabled'))
    assert wait_on_element(driver, 7, xpaths.login.user_input)
    driver.find_element_by_xpath(xpaths.login.user_input).clear()
    driver.find_element_by_xpath(xpaths.login.user_input).send_keys('root')
    driver.find_element_by_xpath(xpaths.login.password_input).clear()
    driver.find_element_by_xpath(xpaths.login.password_input).send_keys('testing')
    assert wait_on_element(driver, 4, xpaths.login.signin_button, 'clickable')
    driver.find_element_by_xpath(xpaths.login.signin_button).click()


@then('on the Dashboard, make sure HA is enabled')
def on_the_dashboard_make_sure_ha_is_enabled(driver):
    """on the Dashboard, make sure HA is enabled."""
    assert wait_on_element(driver, 7, xpaths.breadcrumb.dashboard)
    assert wait_on_element(driver, 60, xpaths.dashboard.system_information)
    if wait_on_element(driver, 5, xpaths.popup.help):
        assert wait_on_element(driver, 10, xpaths.button.close, 'clickable')
        driver.find_element_by_xpath(xpaths.button.close).click()
    # wait_on_element need to be replace with wait_on_element when NAS-118299
    assert wait_on_element(driver, 30, xpaths.topToolbar.ha_enable)
    time.sleep(5)


@then('ssh to the virtual node again to verify the pdbedit command still works')
def ssh_to_the_virtual_node_again_to_verify_the_pdbedit_command_still_works(pdbedit_cmd, ldap_user, virtual_hostname):
    """ssh to the virtual node again to verify the pdbedit command still works."""
    ssh_result = ssh_cmd(pdbedit_cmd, 'root', 'testing', virtual_hostname)
    assert ssh_result['result'] is True, str(ssh_result)
    assert ldap_user in ssh_result['output'], str(ssh_result)


@then('rerun the getent command to verify it return LDAP user info')
def rerun_the_getent_command_to_verify_it_return_ldap_user_info(getent_cmd, ldap_user, virtual_hostname):
    """rerun the getent command to verify it return LDAP user info."""
    ssh_result = ssh_cmd(getent_cmd, 'root', 'testing', virtual_hostname)
    assert ssh_result['result'], str(ssh_result)
    assert ldap_user in ssh_result['output'], str(ssh_result)
