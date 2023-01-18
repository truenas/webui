# coding=utf-8
"""SCALE UI: feature tests."""

import pytest
import time
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
from pytest_dependency import depends


@pytest.mark.dependency(name='AD_Setup')
@scenario('features/NAS-T1104.feature', 'Setup AD and verify it is working')
def test_setup_ad_and_verify_it_is_working():
    """Setup AD and verify it is working."""


@given('the browser is open, the TrueNAS URL and logged in')
def the_browser_is_open_the_truenas_url_and_logged_in(driver, nas_ip, root_password, request):
    """the browser is open, the TrueNAS URL and logged in."""
    depends(request, ['system_pool'], scope='session')
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


@when('on the Dashboard, click Network on the left sidebar')
def on_the_dashboard_click_network_on_the_left_sidebar(driver):
    """on the Dashboard, click Network on the left sidebar."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.systemInfoCardTitle)
    assert wait_on_element(driver, 5, xpaths.sideMenu.network, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.network).click()


@then('on the network page, click on setting on the Global Configuration card')
def on_the_network_page_click_on_setting_on_the_global_configuration_card(driver):
    """on the network page, click on setting on the Global Configuration card."""
    assert wait_on_element(driver, 7, xpaths.network.title)
    assert wait_on_element(driver, 5, xpaths.button.settings)
    driver.find_element_by_xpath(xpaths.button.settings).click()


@then(parsers.parse('on the Network Global Configuration page, change the first nameserver to "{nameserver1}"'))
def on_the_network_global_configuration_page_change_the_first_nameserver_to_nameserver1(driver, nameserver1):
    """on the Network Global Configuration page, change the first nameserver to "{nameserver1}"."""
    assert wait_on_element(driver, 10, xpaths.global_configuration.title)
    assert wait_on_element(driver, 5, xpaths.global_configuration.nameserver1_input, 'inputable')
    driver.find_element_by_xpath(xpaths.global_configuration.nameserver1_input).clear()
    driver.find_element_by_xpath(xpaths.global_configuration.nameserver1_input).send_keys(nameserver1)


@then('delete nameserver 2 and nameserver 3 IPs in there input')
def delete_nameserver_2_and_nameserver_3_ips_in_there_input(driver):
    """delete nameserver 2 and nameserver 3 IPs in there input."""
    driver.find_element_by_xpath(xpaths.global_configuration.nameserver2_delete).click()
    driver.find_element_by_xpath(xpaths.global_configuration.nameserver3_delete).click()


@then('click Save, the progress bar should appear while settings are being applied')
def click_save_the_progress_bar_should_appear_while_settings_are_being_applied(driver):
    """click Save, the progress bar should appear while settings are being applied."""
    assert wait_on_element(driver, 7, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 20, xpaths.progress.progressbar)


@then('after, click on Credentials on the left sidebar, then Directory Services')
def after_click_on_credentials_on_the_left_sidebar_then_directory_services(driver):
    """after, click on Credentials on the left sidebar, then Directory Services."""
    assert wait_on_element(driver, 7, xpaths.sideMenu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.credentials).click()
    assert wait_on_element(driver, 7, xpaths.sideMenu.directory_services, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.directory_services).click()


@then('on the Directory Services page, click Setting on the Active Directory card')
def on_the_directory_services_page_click_setting_on_the_active_directory_card(driver):
    """on the Directory Services page, click Setting on the Active Directory card."""
    assert wait_on_element(driver, 7, xpaths.directory_services.title)
    assert wait_on_element(driver, 5, xpaths.directory_services.directory_disable_title)
    assert wait_on_element(driver, 7, xpaths.directory_services.configureAD_button, 'clickable')
    driver.find_element_by_xpath(xpaths.directory_services.configureAD_button).click()


@then(parsers.parse('on the Active Directory page, input the Domain name "{ad_domain}"'))
def on_the_active_directory_page_input_the_domain_name_ad_domain(driver, ad_domain):
    """on the Active Directory page, input the Domain name "ad_domain"."""
    global domain
    domain = ad_domain
    assert wait_on_element(driver, 5, xpaths.active_directory.title)
    time.sleep(1)
    assert wait_on_element(driver, 7, xpaths.active_directory.domain_input, 'inputable')
    driver.find_element_by_xpath(xpaths.active_directory.domain_input).clear()
    driver.find_element_by_xpath(xpaths.active_directory.domain_input).send_keys(ad_domain)


@then(parsers.parse('input the Account name "{ad_user}", the Password "{ad_password}"'))
def input_the_account_name_ad_user_the_password_ap_password(driver, ad_user, ad_password):
    """input the Account name "ad_user", the Password "ad_password"."""
    driver.find_element_by_xpath(xpaths.active_directory.account_input).clear()
    driver.find_element_by_xpath(xpaths.active_directory.account_input).send_keys(ad_user)
    driver.find_element_by_xpath(xpaths.active_directory.password_input).clear()
    driver.find_element_by_xpath(xpaths.active_directory.password_input).send_keys(ad_password)


@then(parsers.parse('click advanced, and input the Computer Account OU "{ca_ou}"'))
def click_advanced_and_input_the_computer_account_ou_truenas_servers(driver, ca_ou):
    """click advanced, and input the Computer Account OU "ca_ou"."""
    if is_element_present(driver, xpaths.button.advanced_option):
        driver.find_element_by_xpath(xpaths.button.advanced_option).click()
    assert wait_on_element(driver, 7, xpaths.active_directory.ca_ou_input, 'inputable')
    driver.find_element_by_xpath(xpaths.active_directory.ca_ou_input).clear()
    driver.find_element_by_xpath(xpaths.active_directory.ca_ou_input).send_keys(ca_ou)


@then('change the netbios for the hostname and check the Enable box then click SAVE')
def change_the_netbios_for_the_hostname_and_check_the_enable_box_then_click_save(driver, nas_hostname):
    """change the netbios for the hostname and check the Enable box then click SAVE."""
    driver.find_element_by_xpath(xpaths.active_directory.netbiosname_input).clear()
    driver.find_element_by_xpath(xpaths.active_directory.netbiosname_input).send_keys(nas_hostname)
    driver.find_element_by_xpath(xpaths.active_directory.enableCheckbox).click()
    assert wait_on_element(driver, 7, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('the Active Directory setup should successfully save without an error')
def the_active_directory_setup_should_successfully_save_without_an_error(driver):
    """the Active Directory setup should successfully save without an error."""
    assert wait_on_element_disappear(driver, 60, xpaths.progress.progressbar)
    assert wait_on_element_disappear(driver, 60, xpaths.popup.active_directory)
    assert wait_on_element(driver, 7, f'//span[text()="{domain.upper()}"]')
    assert wait_on_element(driver, 7, '//span[text()="HEALTHY" and @class="value"]')


@then(parsers.parse('run "{cmd1}" on the NAS with ssh and verify that "{ad_object1}" is in the output'))
def run_wbinfo_u_on_the_nas_with_ssh_and_verify_that_ad_object1_is_in_the_output(cmd1, ad_object1, root_password, nas_ip):
    """run "wbinfo -u" on the NAS with ssh and verify that "{ad_object1}" is in the output."""
    ssh_results = ssh_cmd(cmd1, 'root', root_password, nas_ip)
    assert ssh_results['result'], ssh_results['output']
    assert ad_object1 in ssh_results['output'], ssh_results['output']


@then(parsers.parse('run "{cmd2}" on the NAS with ssh and verify that "{ad_object2}" is in the output'))
def run_wbinfo_g_on_the_nas_with_ssh_and_verify_that_ad_object2_is_in_the_output(cmd2, ad_object2, root_password, nas_ip):
    """run "wbinfo -g" on the NAS with ssh and verify that "{ad_object2}" is in the output."""
    ssh_results = ssh_cmd(cmd2, 'root', root_password, nas_ip)
    assert ssh_results['result'], ssh_results['output']
    assert ad_object2 in ssh_results['output'], ssh_results['output']


@then(parsers.parse('run "{cmd3}" on the NAS with ssh and verify that the trust secret succeeded'))
def run_wbinfo_t_on_the_nas_with_ssh_and_verify_that_the_trust_secret_succeeded(cmd3, root_password, nas_ip):
    """run "wbinfo -t" on the NAS with ssh and verify that the trust secret succeeded."""
    ssh_results = ssh_cmd(cmd3, 'root', root_password, nas_ip)
    assert ssh_results['result'], ssh_results['output']
    assert 'RPC calls succeeded' in ssh_results['output'], ssh_results['output']
