# coding=utf-8
"""High Availability (tn-bhyve03) feature tests."""

import time
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


@scenario('features/NAS-T940.feature', 'Setting up LDAP')
def test_setting_up_ldap(driver):
    """Setting up LDAP."""


@given(parsers.parse('The browser is open navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url):
    """The browser is open navigate to "{nas_url}"."""
    if nas_url not in driver.current_url:
        driver.get(f"http://{nas_url}/ui/sessions/signin")
        time.sleep(1)


@when(parsers.parse('If login page appear enter "{user}" and "{password}"'))
def if_login_page_appear_enter_root_and_password(driver, user, password):
    """If login page appear enter "user" and "password"."""
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 10, '//input[@placeholder="Username"]')
        driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys(user)
        driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys(password)
        assert wait_on_element(driver, 4, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(0.5)
        assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@then('You should see the dashboard and "System Information"')
def you_should_see_the_dashboard_and_system_information(driver):
    """You should see the dashboard and "System Information"."""
    assert wait_on_element(driver, 5, '//span[contains(.,"System Information")]')


@then('Go to Directory Services and select LDAP')
def go_to_directory_services_and_select_ldap(driver):
    """Go to Directory Services and select LDAP."""
    assert wait_on_element(driver, 5, '//span[contains(.,"root")]')
    element = driver.find_element_by_xpath('//span[contains(.,"root")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Directory Services"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__LDAP"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__LDAP"]').click()


@then('The LDAP page should open')
def the_ldap_page_should_open(driver):
    """The LDAP page should open."""
    assert wait_on_element(driver, 5, '//div[contains(.,"Server Credentials")]')


@then(parsers.parse('Input "{hostname}" for Hostname, "{base_dn}" Base DN'))
def input_ldap_hostname_for_hostname_ldap_base_dn(driver, hostname, base_dn):
    """Input "hostname" for Hostname, "base_dn" Base DN."""
    assert wait_on_element(driver, 5, '//input[@placeholder="Hostname"]', 'clickable')
    driver.find_element_by_xpath('//input[@placeholder="Hostname"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Hostname"]').send_keys(hostname)
    driver.find_element_by_xpath('//input[@placeholder="Base DN"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Base DN"]').send_keys(base_dn)


@then(parsers.parse('Input "{bind_dn}" for Bind DN and "{password}" for Bind Password'))
def input_ldap_bind_dn_and_bind_password(driver, bind_dn, password):
    """Input "bind_dn" for Bind DN and "password" for Bind Password."""
    driver.find_element_by_xpath('//input[@placeholder="Bind DN"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Bind DN"]').send_keys(bind_dn)
    driver.find_element_by_xpath('//input[@placeholder="Bind Password"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Bind Password"]').send_keys(password)


@then('Click Advanced Options')
def click_advanced_options(driver):
    """Click Advanced Options."""
    driver.find_element_by_xpath('//button[@ix-auto="button__ADVANCED OPTIONS"]').click()


@then('Click Enable checkbox, then Samba Schema and select ON for Encryption Mode')
def click_enable_checkbox_then_samba_schema_and_select_on_for_encryption_mode(driver):
    """Click Enable checkbox, then Samba Schema and select ON for Encryption Mode."""
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Encryption Mode"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Enable"]').click()
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Samba Schema (DEPRECATED - see help text)"]').click()
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Encryption Mode"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Encryption Mode_ON"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Encryption Mode_ON"]').click()


@then('Click SAVE "Please wait" should appear while settings are applied')
def click_save_please_wait_should_appear_while_settings_are_applied(driver):
    """Click SAVE "Please wait" should appear while settings are applied."""
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 30, '//h6[contains(.,"Please wait")]')


@then('After settings are applied you should see "Settings saved."')
def after_settings_are_applied_you_should_see_settings_saved(driver):
    """After settings are applied you should see "Settings saved."."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Settings saved.")]')


@then(parsers.parse('run "{command}" trough ssh at "{host}" with "{password}"'))
def run_command_trough_ssh(driver, command, host, password):
    """run "command" trough ssh."""
    global ssh_result
    ssh_result = ssh_cmd(command, 'root', password, host)
    assert ssh_result['result'], ssh_result['output']


@then(parsers.parse('the ssh result should pass and return "{user}" info'))
def the_ssh_result_should_pass_and_return_user_info(driver, user):
    """the ssh result should pass and return "user" info."""
    assert user in ssh_result['output'], ssh_result['output']
