# coding=utf-8
"""High Availability (tn-bhyve02) feature tests."""

import pytest
import xpaths
import time
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    attribute_value_exist,
    ssh_cmd,
    refresh_if_element_missing
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@pytest.mark.dependency(name="NAS-T933")
@scenario('features/NAS-T933.feature', 'Verify Active Directory works after failover with new system dataset')
def test_setting_up_active_directory_with_the_new_system_dataset(driver):
    """Verify Active Directory works after failover with new system dataset."""


@given(parsers.parse('the browser is open navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url):
    """the browser is open navigate to "{nas_url}"."""
    global host
    host = nas_url
    if nas_url not in driver.current_url:
        driver.get(f"http://{nas_url}/ui/dashboard/")
        time.sleep(1)


@when(parsers.parse('If login page appear enter "{user}" and "{password}"'))
def if_login_page_appear_enter_root_and_password(driver, user, password):
    """If login page appear enter "{user}" and "{password}"."""
    global passwd
    passwd = password
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 10, xpaths.login.user_input)
        driver.find_element_by_xpath(xpaths.login.user_input).clear()
        driver.find_element_by_xpath(xpaths.login.user_input).send_keys(user)
        driver.find_element_by_xpath(xpaths.login.password_input).clear()
        driver.find_element_by_xpath(xpaths.login.password_input).send_keys(password)
        assert wait_on_element(driver, 4, xpaths.login.signin_button)
        driver.find_element_by_xpath(xpaths.login.signin_button).click()
    else:
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(1)
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@then('verify midclt call smb.get_smb_ha_mode return UNIFIED or LEGACY')
def verify_midclt_call_smb_get_smb_ha_mode_return_UNIFIED_or_LEGACY(driver):
    """verify midclt call smb.get_smb_ha_mode return UNIFIED or LEGACY."""
    cmd = "midclt call smb.get_smb_ha_mode"
    ssh_result = ssh_cmd(cmd, 'root', passwd, host)
    assert ssh_result['result'], ssh_result['output']
    assert 'UNIFIED' in ssh_result['output'], ssh_result['output']


@then('You should see the dashboard and "System Information"')
def you_should_see_the_dashboard_and_system_information(driver):
    """You should see the dashboard and "System Information"."""
    assert wait_on_element(driver, 7, '//a[text()="Dashboard"]')
    assert wait_on_element(driver, 5, xpaths.dashboard.system_information)


@then('Navigate to Network then Global Configuration')
def navigate_to_network_then_global_configuration(driver):
    """Navigate to Network then Global Configuration."""
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Network"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Network"]').click()
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Global Configuration"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Global Configuration"]').click()


@then('The Network Global Configuration page should open')
def the_network_global_configuration_page_should_open(driver):
    """The Network Global Configuration page should open."""
    assert wait_on_element(driver, 7, '//a[contains(.,"Global Configuration")]')


@then(parsers.parse('Change the first nameserver to "{ad_nameserver}" and Dommain to "{ad_domain}"'))
def change_the_first_nameserver_to_ad_nameserver_and_dommain_to_ad_domain(driver, ad_nameserver, ad_domain):
    """Change the first nameserver to "{ad_nameserver}" and Dommain to "{ad_domain}"."""
    assert wait_on_element(driver, 5, '//input[@placeholder="Nameserver 1"]')
    driver.find_element_by_xpath('//input[@placeholder="Nameserver 1"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Nameserver 1"]').send_keys(ad_nameserver)
    assert wait_on_element(driver, 5, '//input[@placeholder="Domain"]')
    driver.find_element_by_xpath('//input[@placeholder="Domain"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Domain"]').send_keys(ad_domain)


@then('Click SAVE "Please wait" should appear while settings are being applied')
def click_save_please_wait_should_appear_while_settings_are_being_applied(driver):
    """Click SAVE "Please wait" should appear while settings are being applied."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 20, xpaths.popupTitle.please_wait)
    assert wait_on_element(driver, 7, '//div[contains(.,"Settings saved.")]')


@then('Navigate to Directory Services then Active Directory')
def navigate_to_directory_services_then_active_directory(driver):
    """Navigate to Directory Services then Active Directory."""
    assert wait_on_element(driver, 7, xpaths.sideMenu.directory_services)
    driver.find_element_by_xpath(xpaths.sideMenu.directory_services).click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Active Directory"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Active Directory"]').click()


@then('The Domain Credentials page should open')
def the_domain_credentials_page_should_open(driver):
    """The Domain Credentials page should open."""
    assert wait_on_element(driver, 7, '//h4[contains(.,"Domain Credentials")]')


@then(parsers.parse('Input Domain name "{ad_domain}", Account name "{ad_user}", Password "{ad_password}"'))
def input_domain_name_ad_domain_account_name_ad_user_password_ad_pasword(driver, ad_domain, ad_user, ad_password):
    """Input Domain name "{ad_domain}", Account name "{ad_user}", Password "ad_password"."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Domain Name"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain Name"]').send_keys(ad_domain)
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain Account Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain Account Name"]').send_keys(ad_user)
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain Account Password"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain Account Password"]').send_keys(ad_password)


@then(parsers.parse('Click advanced, and input "{ca_ou}" to Computer Account OU'))
def click_advanced_and_input_truenas_servers_to_computer_account_ou(driver, ca_ou):
    """Click advanced, and input "{ca_ou}" to Computer Account OU."""
    if is_element_present(driver, '//button[@ix-auto="button__ADVANCED OPTIONS"]'):
        driver.find_element_by_xpath('//button[@ix-auto="button__ADVANCED OPTIONS"]').click()
    driver.find_element_by_xpath('//input[@ix-auto="input__Computer Account OU"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Computer Account OU"]').send_keys(ca_ou)


@then('Check the Enable box and click SAVE')
def check_the_enable_box_and_click_save(driver):
    """Check the Enable box and click SAVE."""
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Enable (requires password or Kerberos principal)"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    # This 5 seconds of sleep is to let the system ketchup.
    time.sleep(5)


@then('Active Directory should successfully save and start without an error')
def active_directory_should_successfully_save_and_start_without_an_error(driver):
    """Active Directory should successfully save and start without an error."""
    assert wait_on_element_disappear(driver, 20, xpaths.popupTitle.please_wait)
    assert wait_on_element(driver, 10, '//div[contains(.,"Settings saved.")]')
    assert wait_on_element_disappear(driver, 20, '//h1[contains(text(),"Configuring Active Directory")]')
    assert wait_on_element(driver, 7, '//div[contains(.,"Settings saved.")]')


@then('Navigate to Shell')
def navigate_to_shell(driver):
    """Navigate to Shell."""
    element = driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Reporting"]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(1)
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Shell"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Shell"]').click()


@then('The Shell page should open')
def the_shell_should_should_open(driver):
    """The Shell page should open."""
    assert wait_on_element(driver, 5, '//span[@class="reverse-video terminal-cursor"]')
    time.sleep(10)


@then(parsers.parse('input "{cmd}"'))
def input_wbinfo_u(driver, cmd):
    """Input "wbinfo -u"."""
    actions = ActionChains(driver)
    actions.send_keys(cmd, Keys.ENTER)
    actions.perform()


@then(parsers.parse('Verify that "{ad_object}" is in  wbinfo -u output'))
def verify_that_ad_object_is_in__wbinfo_u_output(driver, ad_object):
    """Verify that "{ad_object}" is in  wbinfo -u output."""
    assert wait_on_element(driver, 15, f'//span[contains(.,"{ad_object}")]')


@then(parsers.parse('Input "{cmd}"'))
def input_wbinfo_g(driver, cmd):
    """Input "wwbinfo -g"."""
    actions = ActionChains(driver)
    actions.send_keys(cmd, Keys.ENTER)
    actions.perform()


@then(parsers.parse('Verify that "{ad_object}" is in wbinfo -g output'))
def verify_that_ad01domain_admin_is_in_wbinfo_g_output(driver, ad_object):
    """Verify that "{ad_object}" is in wbinfo -g output."""
    split_ad_object = ad_object.split()
    assert wait_on_element(driver, 5, f'//span[contains(.,"{split_ad_object[0]}") and contains(.,"{split_ad_object[1]}")]')


@then(parsers.parse('Input "{cmd}"'))
def input_wbinfo_t(driver, cmd):
    """Input "wbinfo -t"."""
    actions = ActionChains(driver)
    actions.send_keys(cmd, Keys.ENTER)
    actions.perform()


@then('Verify that the trust secret succeeded')
def verify_that_the_trust_secret_succeeded(driver):
    """Verify that the trust secret succeeded."""
    assert wait_on_element(driver, 5, '//span[contains(.,"succeeded")]')


@then(parsers.parse('ssh and input {tdbdump_command} before failover'))
def ssh_and_input_tdbdump_command_before_failover(driver, tdbdump_command):
    """ssh and input {tdbdump_command} before failover."""
    global ssh_result1
    ssh_result1 = ssh_cmd(tdbdump_command, 'root', passwd, host)
    assert ssh_result1['result'], ssh_result1['output']


@then('tdbdump should output a machine account password')
def tdbdump_should_output_a_machine_account_password(driver):
    """tdbdump should output a machine account password."""
    assert '\\' in ssh_result1['output'], ssh_result1['output']


@then('Navigate to Dashboard')
def navigate_to_dashboard(driver):
    """Navigate to Dashboard"""
    element = driver.find_element_by_xpath('//span[contains(.,"root")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    assert wait_on_element(driver, 10, xpaths.dashboard.system_information)


@then('Press INITIATE FAILOVER, check confirm and press FAILOVER')
def press_initiate_failover_check_confirm_and_press_failover(driver):
    """Press INITIATE FAILOVER, check confirm and press FAILOVER"""
    # refresh_if_element_missing need to be replace with wait_on_element when NAS-118299
    assert refresh_if_element_missing(driver, 25, xpaths.topToolbar.ha_enable)
    assert wait_on_element(driver, 60, xpaths.button.initiate_failover, 'clickable')
    driver.find_element_by_xpath(xpaths.button.initiate_failover).click()
    assert wait_on_element(driver, 5, xpaths.popupTitle.initiate_failover)
    driver.find_element_by_xpath(xpaths.checkbox.confirm).click()
    assert wait_on_element(driver, 5, xpaths.button.failover)
    driver.find_element_by_xpath(xpaths.button.failover).click()


@then('Wait for the login page to appear')
def wait_for_the_login_page_to_appear(driver):
    """Wait for the login page to appear"""
    assert wait_on_element(driver, 120, xpaths.login.user_input)
    # wait for HA is enabled to avoid UI refreshing
    assert wait_on_element_disappear(driver, 300, xpaths.login.ha_status('HA is enabled'))


@then(parsers.parse('At the login page enter "{user}" and "{password}"'))
def at_the_login_page_enter_root_and_password(driver, user, password):
    """At the login page enter "{user}" and "{password}"."""
    assert wait_on_element(driver, 7, xpaths.login.user_input)
    driver.find_element_by_xpath(xpaths.login.user_input).clear()
    driver.find_element_by_xpath(xpaths.login.user_input).send_keys(user)
    driver.find_element_by_xpath(xpaths.login.password_input).clear()
    driver.find_element_by_xpath(xpaths.login.password_input).send_keys(password)
    assert wait_on_element(driver, 4, xpaths.login.signin_button)
    driver.find_element_by_xpath(xpaths.login.signin_button).click()
    assert wait_on_element(driver, 60, xpaths.dashboard.system_information)
    if wait_on_element(driver, 5, xpaths.popupTitle.help):
        assert wait_on_element(driver, 10, '//button[@ix-auto="button__CLOSE"]', 'clickable')
        driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    # refresh_if_element_missing need to be replace with wait_on_element when NAS-118299
    assert refresh_if_element_missing(driver, 25, xpaths.topToolbar.ha_enable)


@then(parsers.parse('ssh and input {tdbdump_command} after failover'))
def ssh_and_input_tdbdump_comman_dafter_failover(driver, tdbdump_command):
    """ssh and input {tdbdump_command} after failover."""
    global ssh_result2
    ssh_result2 = ssh_cmd(tdbdump_command, 'root', passwd, host)
    assert ssh_result2['result'], ssh_result2['output']
    assert '\\' in ssh_result1['output'], ssh_result1['output']


@then('tdbdump should output the same machine account password then before failover')
def tdbdump_should_output_the_same_machine_account_password_then_before_failover(driver):
    """tdbdump should output the same machine account password then before failover."""
    assert ssh_result2['output'] == ssh_result1['output']


@then('Navigate to Storage click Pools')
def navigate_to_storage_click_pools(driver):
    """Navigate to Storage click Pools."""
    # Scroll up the mat-list-item
    assert wait_on_element(driver, 5, '//span[contains(.,"root")]')
    element = driver.find_element_by_xpath('//span[contains(.,"root")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Pools"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Pools"]').click()


@then('The Pools page should open')
def the_pools_page_should_open(driver):
    """The Pools page should open."""
    assert wait_on_element(driver, 5, '//div[contains(.,"Pools")]')


@then('Click on the dozer 3 dots button, select Add Dataset')
def click_on_the_dozer_3_dots_button_select_add_dataset(driver):
    """Click on the dozer 3 dots button, select Add Dataset."""
    assert wait_on_element(driver, 5, '//mat-icon[@id="actions_menu_button__dozer"]')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__dozer"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__dozer_Add Dataset"]')
    driver.find_element_by_xpath('//button[@ix-auto="action__dozer_Add Dataset"]').click()


@then('The Add Dataset Name and Options page should open')
def the_add_dataset_name_and_options_page_should_open(driver):
    """The Add Dataset Name and Options page should open."""
    assert wait_on_element(driver, 5, '//h4[contains(.,"Name and Options")]')


@then(parsers.parse('Input dataset name "{dataset_name}" and click save'))
def input_dataset_name_my_acl_dataset_and_click_save(driver, dataset_name):
    """Input dataset name "{dataset_name}" and click save."""
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Name"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys(dataset_name)
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()


@then(parsers.parse('"{dataset_name}" should be created'))
def my_acl_dataset_should_be_created(driver, dataset_name):
    """"my_acl_dataset" should be created."""
    assert wait_on_element_disappear(driver, 20, xpaths.popupTitle.please_wait)
    assert wait_on_element(driver, 10, f'//span[contains(.,"{dataset_name}")]')


@then('Click on "my_acl_dataset" 3 dots button, select Edit Permissions')
def click_on_my_acl_dataset_3_dots_button_select_edit_permissions(driver):
    """Click on "my_acl_dataset" 3 dots button, select Edit Permissions."""
    assert wait_on_element(driver, 5, '//mat-icon[@id="actions_menu_button__my_acl_dataset"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__my_acl_dataset"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__my_acl_dataset_Edit Permissions"]')
    driver.find_element_by_xpath('//button[@ix-auto="action__my_acl_dataset_Edit Permissions"]').click()


@then('The Edit Permissions page should open')
def the_edit_permissions_page_should_open(driver):
    """The Edit Permissions page should open."""
    assert wait_on_element(driver, 5, '//h4[contains(.,"Dataset Path")]')


@then('Click on Use ACL Manager')
def click_on_use_acl_manager(driver):
    """Click on Use ACL Manager."""
    driver.find_element_by_xpath('//button[@ix-auto="button__USE ACL MANAGER"]').click()


@then('The Edit ACL page should open')
def the_edit_acl_page_should_open(driver):
    """The Edit ACL page should open."""
    assert wait_on_element(driver, 5, '//h4[contains(.,"File Information")]')


@then(parsers.parse('Select OPEN for Default ACL Option, then select "{group_name}" for Group name, check the Apply Group'))
def setting_permissions_set_user_to_root_and_then_select_AD01_administrator_for_groups_check_the_apply_group_and_select_open_for_default_acl_option(driver, group_name):
    """Select OPEN for Default ACL Option, then select "AD01\administrator" for Group name, check the Apply Group."""
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Default ACL Options"]')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Default ACL Options"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Default ACL Options_OPEN"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Default ACL Options_OPEN"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CONTINUE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()

    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__Apply Group"]/label/div', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Apply Group"]/label/div').click()
    assert wait_on_element(driver, 5, '//div[contains(.,"Group") and contains(@class,"mat-form-field-infix")]//input', 'inputable')
    driver.find_element_by_xpath('//div[contains(.,"Group") and contains(@class,"mat-form-field-infix")]//input').clear()
    driver.find_element_by_xpath('//div[contains(.,"Group") and contains(@class,"mat-form-field-infix")]//input').send_keys(group_name)


@then('Click the Save button, should be return to pool page')
def click_the_save_button(driver):
    """Click the Save button, should be return to pool page"""
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 20, xpaths.popupTitle.please_wait)
    assert wait_on_element(driver, 5, '//mat-panel-title[contains(.,"dozer")]')
    driver.find_element_by_xpath('//td[@ix-auto="value__dozer_name"]')


@then(parsers.parse('Verify that group name is "{group_name}"'))
def verify_that_group_name_is_AD01_administrator(driver, group_name):
    """Verify that group name is "AD01\administrator"."""
    time.sleep(1)
    assert wait_on_element(driver, 5, '//div[contains(.,"Group") and contains(@class,"mat-form-field-infix")]//input', 'clickable')
    assert attribute_value_exist(driver, '//div[contains(.,"Group") and contains(@class,"mat-form-field-infix")]//input', 'value', group_name)
