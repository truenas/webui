# coding=utf-8
"""Core UI feature tests."""

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
import pytest

pytestmark = [pytest.mark.debug_test]


@scenario('features/NAS-T1003.feature', 'Setup AD and verify it is working')
def test_setup_acl_and_verify_it_is_working(driver):
    """Setup ACL and verify it is working."""


@given('the browser is open, the FreeNAS URL and logged in')
def the_browser_is_open_the_freenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open, the FreeNAS URL and logged in."""
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


@when('you see the dashboard')
def you_see_the_dashboard(driver):
    """you see the dashboard."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"System Information")]')


@then('click Network on the side menu and click Global Configuration')
def click_network_on_the_side_menu_and_click_global_configuration(driver):
    """click Network on the side menu and click Global Configuration."""
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Network"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Network"]').click()
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Global Configuration"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Global Configuration"]').click()


@then('the Network Global Configuration page should open')
def the_network_global_configuration_page_should_open(driver):
    """the Network Global Configuration page should open."""
    assert wait_on_element(driver, 7, '//a[contains(.,"Global Configuration")]')


@then(parsers.parse('change the first nameserver to "{ad_nameserver}" and Domain to "{ad_domain}"'))
def change_the_first_nameserver_and_domain(driver, ad_nameserver, ad_domain):
    """change the first nameserver to "ad_nameserver" and Domain to "ad_domain"."""
    assert wait_on_element(driver, 5, '//input[@placeholder="Nameserver 1"]', 'clickable')
    driver.find_element_by_xpath('//input[@placeholder="Nameserver 1"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Nameserver 1"]').send_keys(ad_nameserver)
    assert wait_on_element(driver, 5, '//input[@placeholder="Domain"]', 'clickable')
    driver.find_element_by_xpath('//input[@placeholder="Domain"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Domain"]').send_keys(ad_domain)


@then('click SAVE and "Please wait" should appear')
def click_save_and_please_wait_should_appear(driver):
    """click SAVE and "Please wait" should appear."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')


@then('Network Global Configuration changes should be saved without errors')
def network_global_configuration_changes_should_be_saved_without_errors(driver):
    """Network Global Configuration changes should be saved without errors."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Settings saved.")]')


@then('click Directory Services on the side menu and click Active Directory')
def click_directory_services_on_the_side_menu_and_click_active_directory(driver):
    """click Directory Services on the side menu and click Active Directory."""
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Directory Services"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Directory Services"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Active Directory"]', 'clickcable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Active Directory"]').click()


@then('the Domain Credentials page should open')
def the_domain_credentials_page_should_open(driver):
    """the Domain Credentials page should open."""
    assert wait_on_element(driver, 7, '//h4[contains(.,"Domain Credentials")]')
    time.sleep(0.5)


@then(parsers.parse('input Domain name "{ad_domain}", Account name "{ad_user}", Password "{ad_password}"'))
def input_domain_name_account_name_password(driver, ad_domain, ad_user, ad_password):
    """input Domain name "ad_domain", Account name "ad_user", Password "ad_password"."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Domain Name"]', 'clickable')
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Domain Account Name"]', 'clickable')
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Domain Account Password"]', 'clickable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain Name"]').send_keys(ad_domain)
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain Account Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain Account Name"]').send_keys(ad_user)
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain Account Password"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain Account Password"]').send_keys(ad_password)


@then(parsers.parse('click Advanced, and input "{ca_ou}" to Computer Account OU'))
def click_advanced_and_input_truenas_servers_to_computer_account_ou(driver, ca_ou):
    """click Advanced, and input "TRUENAS_SERVERS" to Computer Account OU."""
    if is_element_present(driver, '//button[@ix-auto="button__ADVANCED OPTIONS"]'):
        driver.find_element_by_xpath('//button[@ix-auto="button__ADVANCED OPTIONS"]').click()
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Computer Account OU"]', 'clickable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Computer Account OU"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Computer Account OU"]').send_keys(ca_ou)


@then('click the Enable checkbox and click SAVE')
def click_the_enable_checkbox_and_click_save(driver):
    """click the Enable checkbox and click SAVE."""
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Enable (requires password or Kerberos principal)"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Enable (requires password or Kerberos principal)"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


@then('Active Directory should successfully save and start without an error')
def active_directory_should_successfully_save_and_start_without_an_error(driver):
    """Active Directory should successfully save and start without an error."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//div[contains(.,"Settings saved.")]')
    assert wait_on_element_disappear(driver, 35, '//h1[contains(text(),"Configuring Active Directory")]')
    # This 5 seconds of sleep is to let the system ketchup.
    time.sleep(5)


@then(parsers.parse('run "{cmd}" on the NAS with ssh'))
def run_wbinfo_u_on_the_nas_with_ssh(driver, nas_ip, cmd):
    """run "wbinfo -u" on the NAS with ssh."""
    global results
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'], results['output']


@then(parsers.parse('verify that "{ad_object}" is in wbinfo -u output'))
def verify_that_ad_object_is_in_wbinfo_u_output(driver, ad_object):
    """verify that "{ad_object}" is in wbinfo -u output."""
    assert ad_object in results['output'], results['output']
    time.sleep(1)


@then(parsers.parse('run "{cmd}" on the NAS with ssh'))
def run_wbinfo_g_on_the_nas_with_ssh(driver, nas_ip, cmd):
    """run "wbinfo -g" on the NAS with ssh."""
    global results
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'], results['output']


@then(parsers.parse('verify that "{ad_object}" is in wbinfo -g output'))
def verify_that_ad_object_is_in_wbinfo_g_output(driver, ad_object):
    """verify that "{ad_object}" is in wbinfo -g output."""
    assert ad_object in results['output'], results['output']
    time.sleep(1)


@then(parsers.parse('run "{cmd}" on the NAS with ssh'))
def run_wbinfo_t_on_the_nas_with_ssh(driver, nas_ip, cmd):
    """run "wbinfo -t" on the NAS with ssh."""
    global results
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'], results['output']


@then('verify that the trust secret succeeded')
def verify_that_the_trust_secret_succeeded(driver):
    """verify that the trust secret succeeded."""
    assert 'via RPC calls succeeded' in results['output'], results['output']
