# coding=utf-8
"""SCALE High Availability (tn-bhyve01) feature tests."""

import time
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    attribute_value_exist,
    ssh_cmd
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T962.feature', 'Verify Active Directory works after failover with new system dataset')
def test_verify_active_directory_works_after_failover_with_new_system_dataset(driver):
    """Verify Active Directory works after failover with new system dataset."""
    pass


@given(parsers.parse('the browser is open, navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_tnbhyve01tnixsystemsnet(driver, nas_url):
    """the browser is open, navigate to "{nas_url}"."""
    global host
    host = nas_url
    if nas_url not in driver.current_url:
        driver.get(f"http://{nas_url}/ui/sessions/signin")
        assert wait_on_element(driver, 10, '//input[@data-placeholder="Username"]')


@when(parsers.parse('if the login page appears, enter "{user}" and "{password}"'))
def if_the_login_page_appears_enter_root_and_testing(driver, user, password):
    """if the login page appears, enter "root" and "testing"."""
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 10, '//input[@data-placeholder="Username"]')
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').send_keys(user)
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').send_keys(password)
        assert wait_on_element(driver, 5, '//button[@name="signin_button"]', 'clickable')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@then('on the Dashboard, click Network on the left sidebar')
def on_the_dashboard_click_network_on_the_left_sidebar(driver):
    """on the Dashboard, click Network on the left sidebar."""
    assert wait_on_element(driver, 7, '//span[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Network"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Network"]').click()


@then('on the network page, click on setting on the Global Configuration card')
def on_the_network_page_click_on_setting_on_the_global_configuration_card(driver):
    """on the network page, click on setting on the Global Configuration card."""
    assert wait_on_element(driver, 7, '//h1[contains(.,"Network")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__globalSettings"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__globalSettings"]').click()


@then(parsers.parse('on the Network Global Configuration page, change the first nameserver to "{nameserver1}"'))
def on_the_network_global_configuration_page_change_the_first_nameserver_to_nameserver1(driver, nameserver1):
    """on the Network Global Configuration page, change the first nameserver to "{nameserver1}"."""
    assert wait_on_element(driver, 7, '//h4[contains(.,"Hostname and Domain")]')
    assert wait_on_element(driver, 5, '//input[@id="nameserver1"]', 'inputable')
    driver.find_element_by_xpath('//input[@id="nameserver1"]').clear()
    driver.find_element_by_xpath('//input[@id="nameserver1"]').send_keys(nameserver1)


@then(parsers.parse('change the Domain for "{ad_domain}", and click Save'))
def change_the_Domain_for_ad_domain_and_click_Save(driver, ad_domain):
    """change the Domain for "ad_domain", and click Save."""
    global domain
    domain = ad_domain
    assert wait_on_element(driver, 5, '//input[@id="domain"]')
    driver.find_element_by_xpath('//input[@id="domain"]').clear()
    driver.find_element_by_xpath('//input[@id="domain"]').send_keys(ad_domain)
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


@then('"Please wait" should appear while settings are being applied')
def please_wait_should_appear_while_settings_are_being_applied(driver):
    """"Please wait" should appear while settings are being applied."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, f'//li[contains(.,"{domain}")]')


@then('after, click on Credentials on the left sidebar, then Directory Services')
def after_click_on_credentials_on_the_left_sidebar_then_directory_services(driver):
    """after, click on Credentials on the left sidebar, then Directory Services."""
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Directory Services"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Directory Services"]').click()


@then('on the Directory Services page, click Setting on the Active Directory card')
def on_the_directory_services_page_click_setting_on_the_active_directory_card(driver):
    """on the Directory Services page, click Setting on the Active Directory card."""
    assert wait_on_element(driver, 7, '//h1[contains(.,"Directory Services")]')
    assert wait_on_element(driver, 5, '//h3[text()="Active Directory"]')
    assert wait_on_element(driver, 7, '//mat-card[contains(.,"Active Directory")]//button[contains(.,"Settings")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"Active Directory")]//button[contains(.,"Settings")]').click()


@then(parsers.parse('on the Active Directory page, input the Domain name "{ad_domain}"'))
def on_the_active_directory_page_input_the_domain_name_ad_domain(driver, ad_domain):
    """on the Active Directory page, input the Domain name "ad_domain"."""
    global domain
    domain = ad_domain
    assert wait_on_element(driver, 5, '//h3[@class="formtitle" and text()="Active Directory"]')
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Domain Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain Name"]').send_keys(ad_domain)


@then(parsers.parse('input the Account name "{ad_user}", the Password "{ad_password}"'))
def input_the_account_name_ad_user_the_password_ap_password(driver, ad_user, ad_password):
    """input the Account name "ad_user", the Password "ad_password"."""
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain Account Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain Account Name"]').send_keys(ad_user)
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain Account Password"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain Account Password"]').send_keys(ad_password)


@then(parsers.parse('click advanced, and input the Computer Account OU "{ca_ou}'))
def click_advanced_and_input_the_computer_account_ou_truenas_servers(driver, ca_ou):
    """click advanced, and input the Computer Account OU "ca_ou"."""
    if is_element_present(driver, '//button[@ix-auto="button__ADVANCED OPTIONS"]'):
        driver.find_element_by_xpath('//button[@ix-auto="button__ADVANCED OPTIONS"]').click()
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Computer Account OU"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Computer Account OU"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Computer Account OU"]').send_keys(ca_ou)


@then('check the Enable box and click SAVE')
def check_the_enable_box_and_click_save(driver):
    """check the Enable box and click SAVE."""
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Enable (requires password or Kerberos principal)"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


@then('the Active Directory setup should successfully save without an error')
def the_active_directory_setup_should_successfully_save_without_an_error(driver):
    """the Active Directory setup should successfully save without an error."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, f'//span[text()="{domain.upper()}"]')


@then(parsers.parse('run "{cmd}" on the NAS with ssh'))
def run_cmd_on_the_nas_with_ssh(driver, cmd):
    """run "cmd" on the NAS with ssh."""
    global results
    results = ssh_cmd(cmd, 'root', 'testing', host)
    assert results['result'], results['output']


@then(parsers.parse('verify that "{ad_object}" is in  wbinfo -u output'))
def verify_that_ad01administrator_is_in__wbinfo_u_output(driver, ad_object):
    """verify that "ad_object" is in  wbinfo -u output."""
    assert ad_object in results['output'], results['output']
    time.sleep(1)


@then(parsers.parse('verify that "{ad_object}" is in wbinfo -g output'))
def verify_that_ad_object_is_in_wbinfo_g_output(driver, ad_object):
    """verify that "ad_object" is in wbinfo -g output."""
    assert ad_object in results['output'], results['output']
    time.sleep(1)


@then('verify that the trust secret succeeded')
def verify_that_the_trust_secret_succeeded(driver):
    """verify that the trust secret succeeded."""
    assert 'RPC calls succeeded' in results['output'], results['output']
    time.sleep(1)


@then('after, go to the Dashboard')
def after_go_to_the_dashboard(driver):
    """after, go to the Dashboard."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    assert wait_on_element(driver, 10, '//h1[text()="Dashboard"]')


@then('click INITIATE FAILOVER, click the confirm checkbox, and press FAILOVER')
def click_initiate_failover_click_the_confirm_checkbox_and_press_failover(driver):
    """click INITIATE FAILOVER, click the confirm checkbox, and press FAILOVER."""
    assert wait_on_element(driver, 60, '//button[@ix-auto="button__INITIATE FAILOVER"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__INITIATE FAILOVER"]').click()
    assert wait_on_element(driver, 5, '//h1[text()="Initiate Failover"]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__Initiate Failover"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[contains(@class,"confirm-checkbox")]').click()
    assert wait_on_element(driver, 5, '//button[.//text()="Failover"]', 'clickable')
    driver.find_element_by_xpath('//button[.//text()="Failover"]').click()


@then('wait for the login page to appear')
def wait_for_the_login_page_to_appear(driver):
    """Wait for the login page to appear."""
    assert wait_on_element(driver, 60, '//input[@data-placeholder="Username"]')


@then(parsers.parse('at the login page, enter "{user}" and "{password}"'))
def at_the_login_page_enter_user_and_password(driver, user, password):
    """At the login page, enter "user" and "password"."""
    assert wait_on_element(driver, 10, '//input[@data-placeholder="Username"]')
    driver.find_element_by_xpath('//input[@data-placeholder="Username"]').clear()
    driver.find_element_by_xpath('//input[@data-placeholder="Username"]').send_keys(user)
    driver.find_element_by_xpath('//input[@data-placeholder="Password"]').clear()
    driver.find_element_by_xpath('//input[@data-placeholder="Password"]').send_keys(password)
    assert wait_on_element(driver, 4, '//button[@name="signin_button"]', 'clickable')
    driver.find_element_by_xpath('//button[@name="signin_button"]').click()


@then('on the Dashboard, wait 5 second')
def on_the_dashboard_wait_5_second(driver):
    """on the Dashboard, wait 5 second."""
    assert wait_on_element(driver, 10, '//h1[text()="Dashboard"]')
    time.sleep(5)


@then('after click Storage on the left sidebar Storage')
def after_click_storage_on_the_left_sidebar_storage(driver):
    """after click Storage on the left sidebar Storage."""
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()


@then('on the Storage page, click on the dozer 3 dots button, select Add Dataset')
def on_the_storage_page_click_on_the_dozer_3_dots_button_select_add_dataset(driver):
    """on the Storage page, click on the dozer 3 dots button, select Add Dataset."""
    assert wait_on_element(driver, 7, '//h1[text()="Storage"]')
    assert wait_on_element(driver, 5, '//tr[contains(.,"dozer")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"dozer")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 4, '//button[normalize-space(text())="Add Dataset"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="Add Dataset"]').click()


@then(parsers.parse('on the Add Dataset page, input the dataset name "my_acl_dataset"'))
def on_the_add_dataset_page_input_the_dataset_name_my_acl_dataset(driver):
    """on the Add Dataset page, input the dataset name "my_acl_dataset"."""


@then(parsers.parse('click Summit the "my_acl_dataset" data should be created'))
def click_summit_the_my_acl_dataset_data_should_be_created(driver):
    """click Summit the "my_acl_dataset" data should be created."""


@then(parsers.parse('click on the "my_acl_dataset" 3 dots button, select Edit Permissions'))
def click_on_the_my_acl_dataset_3_dots_button_select_edit_permissions(driver):
    """click on the "my_acl_dataset" 3 dots button, select Edit Permissions."""


@then('on the Edit Permissions page should open click on Use ACL Manager')
def on_the_edit_permissions_page_should_open_click_on_use_acl_manager(driver):
    """on the Edit Permissions page should open click on Use ACL Manager."""


@then('the Edit ACL page should open')
def the_edit_acl_page_should_open(driver):
    """The Edit ACL page should open."""


@then('select OPEN for Default ACL Option')
def select_open_for_default_acl_option(driver):
    """Select OPEN for Default ACL Option."""


@then(parsers.parse('select "{group_name}" for Group name, check the Apply Group'))
def select_group_name_for_group_name_check_the_apply_group(driver, group_name):
    """select "{group_name}" for Group name, check the Apply Group."""


@then('click the Save button, which should be returned to the storage page')
def click_the_save_button_which_should_be_returned_to_the_storage_page(driver):
    """click the Save button, which should be returned to the storage page."""


@then(parsers.parse('on the Edit ACL page, verify that the group name is "{group_name}"'))
def on_the_edit_acl_page_verify_that_the_group_name_is_group_name(driver, group_name):
    """on the Edit ACL page, verify that the group name is "group_name"."""
