# coding=utf-8
"""Setting up LDAP and verify that it is setup on the NAS feature tests."""

import time
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    run_cmd,
    post
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T1125.feature', 'Setting up LDAP and verify that it is setup on the NAS')
def test_scale_ui_setting_up_ldap_and_verify_that_it_is_setup_on_the_nas():
    """SCALE UI: Setting up LDAP and verify that it is setup on the NAS."""


@given('the browser is open, the FreeNAS URL and logged in')
def the_browser_is_open_the_freenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open, the FreeNAS URL and logged in."""
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


@when('you should be on the dashboard, click on Credentials and then Directory Services.')
def you_should_be_on_the_dashboard_click_on_credentials_and_then_directory_services(driver):
    """you should be on the dashboard, click on Credentials and then Directory Services.."""
    assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    time.sleep(2)
    """click on the Credentials on the side menu, click on Local Users."""
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
    time.sleep(2)
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Directory Services"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Directory Services"]').click()


@then('the Directory Services page should open, then click LDAP settings button')
def the_directory_services_page_should_open_then_click_ldap_settings_button(driver):
    """the Directory Services page should open, then click LDAP settings button."""
    time.sleep(1)
    assert wait_on_element(driver, 7, '//mat-card[contains(.,"Active Directory")]//button[contains(.,"Settings")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"Active Directory")]//button[contains(.,"Settings")]').click()


@then(parsers.parse('input {hostname} for Hostname, {base_DN} Base DN, input {bind_DN} for Bind DN, and input {bind_password} for Bind Password'))
def input_hostname_for_hostname_base_DN_base_dn_input_bind_DN_for_bind_dn_and_input_bind_password_for_bind_password(driver, hostname, base_DN, bind_DN, bind_password):
    """input {hostname} for Hostname, "{base_DN}" Base DN, input "{bind_DN}" for Bind DN, and input {bind_password} for Bind Password."""
    time.sleep(2)
    assert wait_on_element(driver, 10, '//input[contains(.,"Hostname")]')
    driver.find_element_by_xpath('//input[@placeholder="Hostname"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Hostname"]').send_keys(hostname)
    driver.find_element_by_xpath('//input[@ix-auto="input__Base DN"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Base DN"]').send_keys(base_DN)
    driver.find_element_by_xpath('//input[@ix-auto="input__Bind DN"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Bind DN"]').send_keys(bind_DN)
    driver.find_element_by_xpath('//input[@ix-auto="input__Bind Password"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Bind Password"]').send_keys(bind_password)    


@then('click Advanced Options, then click Enable checkbox, then check Samba Schema, select ON for Encryption Mode, then click save')
def click_advanced_options_then_click_enable_checkbox_then_check_samba_schema_select_on_for_encryption_mode_then_click_save(driver):
    """click Advanced Options, then click Enable checkbox, then check Samba Schema, select ON for Encryption Mode, then click save."""
    assert wait_on_element(driver, 10, '//button[@ix-auto="cust_button_Advanced Options"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="cust_button_Advanced Options"]').click()
    time.sleep(2)
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Enable"]').click()
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Samba Schema"]').click()
    time.sleep(5)
    driver.find_element_by_xpath('//mat-select[@ix-auto="sselect__Encryption Mode"]').click()
    assert wait_on_element(driver, 10, '//span[contains(.,"ON")]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Encryption Mode_ON"]').click()
    time.sleep(1)
    wait_on_element(driver, 10, '//button[@ix-auto="button"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button"]').click()


@then(parsers.parse('wait for Please wait should appear while settings are applied, then after settings are applied, you should see "{hostname}" Settings saved'))
def wait_for_please_wait_should_appear_while_settings_are_applied_then_after_settings_are_applied_you_should_see_hostname_settings_saved(driver, hostname):
    """wait for Please wait should appear while settings are applied, then after settings are applied, you should see "{hostname}" Settings saved."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    ## Add validtion of elements


@then(parsers.parse('run getent passwd eturgeon trough ssh, the ssh result should pass and return {user} info'))
def run_command_trough_ssh_the_ssh_result_should_pass_and_return_user_info(driver, command, root_password, nas_ip, user):
    """run {command} trough ssh, the ssh result should pass and return {user} info."""
    global ssh_result
    ssh_result = ssh_cmd(command, 'root', root_password, nas_ip)
    assert ssh_result['result'], ssh_result['output']
    assert user in ssh_result['output'], ssh_result['output']

    ## return to dashboard
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    time.sleep(1)