# coding=utf-8
"""SCALE High Availability (tn-bhyve01) feature tests."""

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


@scenario('features/NAS-T962.feature', 'Verify Active Directory works after failover with new system dataset')
def test_verify_active_directory_works_after_failover_with_new_system_dataset(driver):
    """Verify Active Directory works after failover with new system dataset."""
    pass


@given(parsers.parse('the browser is open, navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url):
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
    assert wait_on_element(driver, 10, '//span[contains(.,"System Information")]')
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Network"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Network"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')


@then('on the network page, click on setting on the Global Configuration card')
def on_the_network_page_click_on_setting_on_the_global_configuration_card(driver):
    """on the network page, click on setting on the Global Configuration card."""
    assert wait_on_element(driver, 7, '//h1[contains(.,"Network")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__globalSettings"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__globalSettings"]').click()


@then(parsers.parse('on the Network Global Configuration page, change the first nameserver to "{nameserver1}"'))
def on_the_network_global_configuration_page_change_the_first_nameserver_to_nameserver1(driver, nameserver1):
    """on the Network Global Configuration page, change the first nameserver to "{nameserver1}"."""
    global nameserver_1
    nameserver_1 = nameserver1
    assert wait_on_element(driver, 7, '//h4[contains(.,"Hostname and Domain")]')
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Nameserver 1"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Nameserver 1"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Nameserver 1"]').send_keys(nameserver1)


@then(parsers.parse('change the Domain for "{ad_domain}", and click Save'))
def change_the_Domain_for_ad_domain_and_click_Save(driver, ad_domain):
    """change the Domain for "ad_domain", and click Save."""
    global domain
    domain = ad_domain
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Domain"]')
    # driver.find_element_by_xpath('//input[@ix-auto="input__Domain"]').clear()
    # driver.find_element_by_xpath('//input[@ix-auto="input__Domain"]').send_keys(ad_domain)
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


@then('"Please wait" should appear while settings are being applied')
def please_wait_should_appear_while_settings_are_being_applied(driver):
    """"Please wait" should appear while settings are being applied."""
    assert wait_on_element_disappear(driver, 60, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, f'//span[text()="{nameserver_1}"]')


@then('after, click on Credentials on the left sidebar, then Directory Services')
def after_click_on_credentials_on_the_left_sidebar_then_directory_services(driver):
    """after, click on Credentials on the left sidebar, then Directory Services."""
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
    assert wait_on_element(driver, 7, '//div[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Directory Services"]')
    driver.find_element_by_xpath('//div[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Directory Services"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')


@then('on the Directory Services page, click Setting on the Active Directory card')
def on_the_directory_services_page_click_setting_on_the_active_directory_card(driver):
    """on the Directory Services page, click Setting on the Active Directory card."""
    assert wait_on_element(driver, 7, '//h1[text()="Directory Services"]')
    assert wait_on_element(driver, 5, '//h3[text()="Active Directory and LDAP are disabled."]')
    assert wait_on_element(driver, 5, '//button[contains(.,"Configure Active Directory")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"Configure Active Directory")]').click()


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


@then(parsers.parse('click advanced, and input the Computer Account OU "{ca_ou}"'))
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
    assert wait_on_element_disappear(driver, 30, '//h1[text()="Start"]')
    assert wait_on_element(driver, 7, f'//span[text()="{domain.upper()}"]')


@then(parsers.parse('run "{cmd}" on the NAS with ssh'))
def run_cmd_on_the_nas_with_ssh(driver, cmd):
    """run "cmd" on the NAS with ssh."""
    global results
    results = ssh_cmd(cmd, 'root', 'testing', host)
    assert results['result'], f'STDOUT: {results["output"]}, STDERR: {results["stderr"]}'


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
    assert wait_on_element(driver, 60, '//mat-icon[@svgicon="ix:ha_enabled"]')
    assert wait_on_element(driver, 10, '//span[text()="(Standby)"]')
    assert wait_on_element(driver, 10, '//button[.//text()="Initiate Failover" and contains(@class,"mat-default")]', 'clickable')
    driver.find_element_by_xpath('//button[.//text()="Initiate Failover" and contains(@class,"mat-default")]').click()
    assert wait_on_element(driver, 5, '//h1[text()="Initiate Failover"]')
    assert wait_on_element(driver, 5, '//mat-checkbox[contains(@class,"confirm-checkbox")]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[contains(@class,"confirm-checkbox")]').click()
    assert wait_on_element(driver, 5, '//button[.//text()="FAILOVER"]', 'clickable')
    driver.find_element_by_xpath('//button[.//text()="FAILOVER"]').click()


@then('wait for the login page to appear')
def wait_for_the_login_page_to_appear(driver):
    """Wait for the login page to appear."""
    # to make sure the UI is refresh for the login page
    assert wait_on_element(driver, 240, '//input[@data-placeholder="Username"]')
    assert wait_on_element(driver, 240, '//p[text()="HA is enabled."]')


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
    time.sleep(2)


@then('on the Dashboard, wait for the Active Directory service')
def on_the_dashboard_wait_for_the_active_directory_service(driver):
    """on the Dashboard, wait for the Active Directory service."""
    assert wait_on_element(driver, 60, '//h1[text()="Dashboard"]')
    assert wait_on_element(driver, 120, '//span[contains(.,"System Information")]')
    # Make sure HA is enable before going forward
    assert wait_on_element(driver, 180, '//mat-icon[@svgicon="ix:ha_enabled"]')
    if wait_on_element(driver, 3, '//button[@ix-auto="button__I AGREE"]', 'clickable'):
        driver.find_element_by_xpath('//button[@ix-auto="button__I AGREE"]').click()
    # Wait for the directories service manager button
    assert wait_on_element(driver, 180, '//button[@id="dirservices-manager"]')
    # Verify HA enabled again
    assert wait_on_element(driver, 120, '//mat-icon[@svgicon="ix:ha_enabled"]')


@then('after click Storage on the left sidebar Storage')
def after_click_storage_on_the_left_sidebar_storage(driver):
    """after click Storage on the left sidebar Storage."""
    assert wait_on_element(driver, 20, '//h1[text()="Dashboard"]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()


@then('on the Storage page, click on the dozer 3 dots button, select Add Dataset')
def on_the_storage_page_click_on_the_dozer_3_dots_button_select_add_dataset(driver):
    """on the Storage page, click on the dozer 3 dots button, select Add Dataset."""
    assert wait_on_element(driver, 7, '//h1[text()="Storage"]')
    assert wait_on_element(driver, 5, '//tr[contains(.,"dozer")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"dozer")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 4, '//button[normalize-space(text())="Add Dataset"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="Add Dataset"]').click()


@then(parsers.parse('on the Add Dataset page, input the dataset name "{dataset_name}"'))
def on_the_add_dataset_page_input_the_dataset_name_my_acl_dataset(driver, dataset_name):
    """on the Add Dataset page, input the dataset name "my_acl_dataset"."""
    assert wait_on_element(driver, 5, '//h3[text()="Add Dataset"]')
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys(dataset_name)
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Share Type"]')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Share Type"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Share Type_SMB"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Share Type_SMB"]').click()


@then(parsers.parse('click Summit the "{dataset_name}" data should be created'))
def click_summit_the_my_acl_dataset_data_should_be_created(driver, dataset_name):
    """click Summit the "my_acl_dataset" data should be created."""
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, f'//div[contains(text(),"{dataset_name}")]')


@then(parsers.parse('click on the "{dataset_name}" 3 dots button, select View Permissions'))
def click_on_the_my_acl_dataset_3_dots_button_select_view_permissions(driver, dataset_name):
    """click on the "my_acl_dataset" 3 dots button, select View Permissions."""
    assert wait_on_element(driver, 5, f'//tr[contains(.,"{dataset_name}")]//mat-icon[text()="more_vert"]')
    driver.find_element_by_xpath(f'//tr[contains(.,"{dataset_name}")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 5, '//button[normalize-space(text())="View Permissions"]')
    driver.find_element_by_xpath('//button[normalize-space(text())="View Permissions"]').click()


@then('the Dataset Permissions side box should open')
def the_dataset_permissions_side_box_should_open(driver):
    """the Dataset Permissions side box should open."""
    assert wait_on_element(driver, 5, '//div[text()="Dataset Permissions"]')


@then('click on the pencil beside Dataset Permissions')
def click_on_the_pencil_beside_dataset_permissions(driver):
    """click on the pencil beside Dataset Permissions."""
    assert wait_on_element(driver, 5, '//mat-icon[text()="edit"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[text()="edit"]').click()


@then('at the bottom of the Edit Permissions page, click on Set ACL')
def at_the_bottom_of_the_Edit_Permissions_page_click_on_Set_ACL(driver):
    """at the bottom of the Edit Permissions page, click on Set ACL."""
    assert wait_on_element(driver, 5, '//h1[text()="Edit Permissions"]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SET ACL"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SET ACL"]').click()
    time.sleep(1)
    assert wait_on_element_disappear(driver, 30, '//h6[contains(.,"Please wait")]')


@then('select NFS4_OPEN for Default ACL Option, then click continue')
def select_NFS4_OPEN_for_Default_ACL_Option_then_click_continue(driver):
    """select NFS4_OPEN for Default ACL Option, then click continues."""
    assert wait_on_element(driver, 5, '//h1[text()="Select a preset ACL"]')
    assert wait_on_element(driver, 5, '//mat-radio-button[@ix-auto="radio__usePreset_Select a preset ACL"]', 'clickable')
    driver.find_element_by_xpath('//mat-radio-button[@ix-auto="radio__usePreset_Select a preset ACL"]').click()
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Default ACL Options"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Default ACL Options"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Default ACL Options_NFS4_OPEN"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Default ACL Options_NFS4_OPEN"]').click()
    assert wait_on_element(driver, 5, '//button[contains(.,"Continue")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"Continue")]').click()
    time.sleep(1)
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')


@then(parsers.parse('on the Edit ACL, select "{user_name}" for User name'))
def on_the_edit_acl_select_the_user_name(driver, user_name):
    """On the Edit ACL, select "{user_name}" for User name."""
    assert wait_on_element(driver, 5, '//h1[text()="Edit ACL"]')
    assert wait_on_element(driver, 5, '//div[contains(.,"Owner:") and contains(@class,"control")]//input', 'inputable')
    driver.find_element_by_xpath('//div[contains(.,"Owner:") and contains(@class,"control")]//input').clear()
    driver.find_element_by_xpath('//div[contains(.,"Owner:") and contains(@class,"control")]//input').send_keys(user_name)


@then(parsers.parse('select "{group_name}" for Group name'))
def select_the_group_name(driver, group_name):
    """select "{group_name}" for Group name."""
    assert wait_on_element(driver, 5, '//div[contains(.,"Owner Group:") and contains(@class,"control")]//input', 'inputable')
    driver.find_element_by_xpath('//div[contains(.,"Owner Group:") and contains(@class,"control")]//input').clear()
    driver.find_element_by_xpath('//div[contains(.,"Owner Group:") and contains(@class,"control")]//input').send_keys(group_name)


@then('click the Save Access Control List button, permission should be Save')
def click_the_save_button_which_should_be_returned_to_the_storage_page(driver):
    """click the Save Access Control List button, permission should be Save."""
    assert wait_on_element(driver, 5, '//button[contains(.,"Save Access Control List")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"Save Access Control List")]').click()
    time.sleep(1)
    assert wait_on_element_disappear(driver, 30, '//h6[contains(.,"Please wait")]')


@then(parsers.parse('click on the "{dataset_name}" 3 dots button, select View Permissions'))
def click_on_the_my_ad_dataset_3_dots_button_select_view_permissions(driver, dataset_name):
    """click on the "my_ad_dataset" 3 dots button, select View Permissions."""
    assert wait_on_element(driver, 15, f'//div[contains(text(),"{dataset_name}")]')
    assert wait_on_element(driver, 5, f'//tr[contains(.,"{dataset_name}")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath(f'//tr[contains(.,"{dataset_name}")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 5, '//button[normalize-space(text())="View Permissions"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="View Permissions"]').click()


@then(parsers.parse('on the permission box, verify that the user is "{use_name}"'))
def on_the_permission_box_verify_that_the_user_is_user_name(driver, user_name):
    """on the permission box, verify that the user is "{user_name}"."""
    assert wait_on_element(driver, 5, f'//div[text()="{user_name}"]')


@then(parsers.parse('verify the group name is "{group_name}"'))
def verify_the_group_name_is_group_name(driver, group_name):
    """verify the group name is "{group_name}"."""
    assert wait_on_element(driver, 5, f'//div[text()="{group_name}" and @class="item-value"]')
