# coding=utf-8
"""SCALE High Availability (tn-bhyve06) feature tests."""

import os
import pytest
import reusableSeleniumCode as rsc
import time
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    ssh_cmd,
    service_Start
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)
from pytest_dependency import depends


@pytest.mark.dependency(name='Active_Directory', scope='session')
@scenario('features/NAS-T962.feature', 'Verify Active Directory works after failover with new system dataset')
def test_verify_active_directory_works_after_failover_with_new_system_dataset(driver):
    """Verify Active Directory works after failover with new system dataset."""


@given(parsers.parse('the browser is open, navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_vip, request):
    """the browser is open, navigate to "{nas_url}"."""
    depends(request, ["System_Dataset", 'Setup_SSH'], scope='session')
    if nas_vip not in driver.current_url:
        driver.get(f"http://{nas_vip}/ui/signin")
        assert wait_on_element(driver, 10, xpaths.login.user_Input)


@when(parsers.parse('if the login page appears, enter "{user}" and "{password}"'))
def if_the_login_page_appears_enter_root_and_testing(driver, user, password, nas_vip):
    """if the login page appears, enter "root" and "testing"."""
    global root_password
    root_password = password
    rsc.Login_If_Not_On_Dashboard(driver, user, password)
    service_Start(nas_vip, (user, password), 'cifs')


@then('on the Dashboard, click Network on the left sidebar')
def on_the_dashboard_click_network_on_the_left_sidebar(driver):
    """on the Dashboard, click Network on the left sidebar."""
    assert wait_on_element(driver, 7, xpaths.dashboard.title)
    if wait_on_element(driver, 2, '//button[@ix-auto="button__I AGREE"]', 'clickable'):
        driver.find_element_by_xpath('//button[@ix-auto="button__I AGREE"]').click()
    assert wait_on_element(driver, 10, xpaths.dashboard.help_Card_Title)
    assert wait_on_element(driver, 5, xpaths.side_Menu.network, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.network).click()
    assert wait_on_element_disappear(driver, 20, xpaths.popup.please_Wait)


@then('on the network page, click on setting on the Global Configuration card')
def on_the_network_page_click_on_setting_on_the_global_configuration_card(driver):
    """on the network page, click on setting on the Global Configuration card."""
    assert wait_on_element(driver, 7, '//h1[contains(.,"Network")]')
    assert wait_on_element(driver, 7, '//h3[text()="Global Configuration"]')
    assert wait_on_element(driver, 7, '//div[text()="Nameservers"]')
    assert wait_on_element(driver, 7, xpaths.button.settings, 'clickable')
    driver.find_element_by_xpath(xpaths.button.settings).click()


@then(parsers.parse('on the Network Global Configuration page, change the first nameserver to "{nameserver1}"'))
def on_the_network_global_configuration_page_change_the_first_nameserver_to_nameserver1(driver, nameserver1):
    """on the Network Global Configuration page, change the first nameserver to "{nameserver1}"."""
    global nameserver_1
    nameserver_1 = nameserver1
    assert wait_on_element(driver, 10, xpaths.global_Configuration.title)
    assert wait_on_element(driver, 5, xpaths.global_Configuration.nameserver1_Input, 'inputable')
    driver.find_element_by_xpath(xpaths.global_Configuration.nameserver1_Input).clear()
    driver.find_element_by_xpath(xpaths.global_Configuration.nameserver1_Input).send_keys(nameserver1)


@then('remove nameserver 2 and nameserver 3 IPs')
def remove_nameserver_2_and_nameserver_3_ips(driver):
    """remove nameserver 2 and nameserver 3 IPs."""
    if is_element_present(driver, xpaths.global_Configuration.nameserver2_Delete):
        driver.find_element_by_xpath(xpaths.global_Configuration.nameserver2_Delete).click()
    if is_element_present(driver, xpaths.global_Configuration.nameserver3_Delete):
        driver.find_element_by_xpath(xpaths.global_Configuration.nameserver3_Delete).click()


@then('click Save, the progress bar should appear while settings are being applied')
def click_save_the_progress_bar_should_appear_while_settings_are_being_applied(driver):
    """click Save, the progress bar should appear while settings are being applied."""
    assert wait_on_element(driver, 7, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 60, xpaths.progress.progressbar)
    assert wait_on_element(driver, 7, '//h1[contains(.,"Network")]')
    assert wait_on_element(driver, 10, f'//span[contains(text(),"{nameserver_1}")]')


@then('after, click on Credentials on the left sidebar, then Directory Services')
def after_click_on_credentials_on_the_left_sidebar_then_directory_services(driver):
    """after, click on Credentials on the left sidebar, then Directory Services."""
    assert wait_on_element(driver, 7, xpaths.side_Menu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.credentials).click()
    assert wait_on_element(driver, 7, xpaths.side_Menu.directory_Services)
    driver.find_element_by_xpath(xpaths.side_Menu.directory_Services).click()
    assert wait_on_element_disappear(driver, 20, xpaths.popup.please_Wait)


@then('on the Directory Services page, click Setting on the Active Directory card')
def on_the_directory_services_page_click_setting_on_the_active_directory_card(driver):
    """on the Directory Services page, click Setting on the Active Directory card."""
    assert wait_on_element(driver, 7, xpaths.directory_Services.title)
    assert wait_on_element(driver, 5, xpaths.directory_Services.directory_Disable_Title)
    assert wait_on_element(driver, 5, '//button[contains(.,"Configure Active Directory")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"Configure Active Directory")]').click()


@then(parsers.parse('on the Active Directory page, input the Domain name "{ad_domain}"'))
def on_the_active_directory_page_input_the_domain_name_ad_domain(driver, ad_domain):
    """on the Active Directory page, input the Domain name "ad_domain"."""
    global domain
    domain = ad_domain
    assert wait_on_element(driver, 5, xpaths.active_Directory.title)
    assert wait_on_element(driver, 7, xpaths.active_Directory.domain_Input, 'inputable')
    driver.find_element_by_xpath(xpaths.active_Directory.domain_Input).clear()
    driver.find_element_by_xpath(xpaths.active_Directory.domain_Input).send_keys(ad_domain)


@then(parsers.parse('input the Account name "{ad_user}", the Password "{ad_password}"'))
def input_the_account_name_ad_user_the_password_ap_password(driver, ad_user, ad_password):
    """input the Account name "ad_user", the Password "ad_password"."""
    os.environ["ad_user"] = ad_user
    os.environ["ad_password"] = ad_password
    driver.find_element_by_xpath(xpaths.active_Directory.account_Input).clear()
    driver.find_element_by_xpath(xpaths.active_Directory.account_Input).send_keys(ad_user)
    driver.find_element_by_xpath(xpaths.active_Directory.password_Input).clear()
    driver.find_element_by_xpath(xpaths.active_Directory.password_Input).send_keys(ad_password)


@then(parsers.parse('click advanced, and input the Computer Account OU "{ca_ou}"'))
def click_advanced_and_input_the_computer_account_ou_truenas_servers(driver, ca_ou):
    """click advanced, and input the Computer Account OU "ca_ou"."""
    if is_element_present(driver, xpaths.button.advanced_Option):
        driver.find_element_by_xpath(xpaths.button.advanced_Option).click()
    assert wait_on_element(driver, 7, xpaths.active_Directory.ca_Ou_Input, 'inputable')
    driver.find_element_by_xpath(xpaths.active_Directory.ca_Ou_Input).clear()
    driver.find_element_by_xpath(xpaths.active_Directory.ca_Ou_Input).send_keys(ca_ou)


@then(parsers.parse('change netbios to "{hostname}" and check the Enable box then click SAVE'))
def change_netbios_to_hostname_and_check_the_enable_box_then_click_save(driver, hostname):
    """change netbios to "{hostname}" and check the Enable box then click SAVE."""
    driver.find_element_by_xpath(xpaths.active_Directory.netbios_Name_Input).clear()
    driver.find_element_by_xpath(xpaths.active_Directory.netbios_Name_Input).send_keys(hostname)
    assert wait_on_element(driver, 7, xpaths.active_Directory.enable_Checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.active_Directory.enable_Checkbox).click()
    assert wait_on_element(driver, 7, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('the Active Directory setup should successfully save without an error')
def the_active_Directory_setup_should_successfully_save_without_an_error(driver):
    """the Active Directory setup should successfully save without an error."""
    assert wait_on_element_disappear(driver, 60, xpaths.progress.progressbar)
    assert wait_on_element_disappear(driver, 60, xpaths.popup.active_Directory)
    assert wait_on_element(driver, 7, xpaths.directory_Services.ad_Domain(domain.upper()))
    assert wait_on_element(driver, 7, xpaths.directory_Services.service_Status)


@then(parsers.parse('run "{cmd}" on the NAS with ssh'))
def run_cmd_on_the_nas_with_ssh(nas_vip, cmd):
    """run "cmd" on the NAS with ssh."""
    global results
    results = ssh_cmd(cmd, 'root', 'testing', nas_vip)
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
    rsc.Click_On_Element(driver, xpaths.side_Menu.old_dashboard)
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    time.sleep(20)


@then('click INITIATE FAILOVER, click the confirm checkbox, and press FAILOVER')
def click_initiate_failover_click_the_confirm_checkbox_and_press_failover(driver):
    """click INITIATE FAILOVER, click the confirm checkbox, and press FAILOVER."""
    rsc.Trigger_Failover(driver)

    rsc.Confirm_Failover(driver)


@then('wait for the login page to appear')
def wait_for_the_login_page_to_appear(driver):
    """Wait for the login page to appear."""
    # to make sure the UI is refresh for the login page
    rsc.HA_Login_Status_Enable(driver)


@then(parsers.parse('at the login page, enter "{user}" and "{password}"'))
def at_the_login_page_enter_user_and_password(driver, user, password):
    """At the login page, enter "user" and "password"."""
    rsc.Login(driver, user, password)


@then('on the Dashboard, wait for the Active Directory service')
def on_the_dashboard_wait_for_the_active_directory_service(driver):
    """on the Dashboard, wait for the Active Directory service."""
    assert wait_on_element(driver, 60, xpaths.dashboard.title)
    assert wait_on_element(driver, 120, xpaths.dashboard.system_Info_Card_Title)
    # Make sure HA is enabled before going forward
    assert wait_on_element(driver, 180, xpaths.toolbar.ha_Enabled)
    # Wait for the directories service manager button
    assert wait_on_element(driver, 180, '//button[@id="dirservices-manager"]')
    # Verify HA enabled again
    assert wait_on_element(driver, 120, xpaths.toolbar.ha_Enabled)


@then('after click Dataset on the left sidebar')
def after_click_dataset_on_the_left_sidebar(driver):
    """after click Dataset on the left sidebar."""
    assert wait_on_element(driver, 20, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.side_Menu.datasets, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.datasets).click()


@then('on the Dataset page, click on the dozer tree and click Add Dataset')
def on_the_dataset_page_click_on_the_dozer_tree_and_click_add_dataset(driver):
    """on the Dataset page, click on the dozer tree and click Add Dataset."""
    assert wait_on_element(driver, 7, xpaths.dataset.title)
    assert wait_on_element(driver, 7, xpaths.dataset.pool_Tree_Name('dozer'))
    driver.find_element_by_xpath(xpaths.dataset.pool_Tree('dozer')).click()
    assert wait_on_element(driver, 7, xpaths.dataset.pool_Selected('dozer'))
    assert wait_on_element(driver, 5, xpaths.dataset.add_Dataset_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.dataset.add_Dataset_Button).click()


@then(parsers.parse('on the Add Dataset slide, input Name "{dataset_name}" and Share Type SMB'))
def on_the_add_dataset_slide_input_name_my_ad_dataset_and_share_type_smb(driver, dataset_name):
    """on the Add Dataset slide, input Name "my_ad_dataset" and Share Type SMB."""
    assert wait_on_element(driver, 5, xpaths.add_Dataset.title)
    assert wait_on_element_disappear(driver, 15, xpaths.progress.progressbar)
    assert wait_on_element(driver, 5, xpaths.add_Dataset.name_Textarea, 'inputable')
    driver.find_element_by_xpath(xpaths.add_Dataset.name_Textarea).clear()
    driver.find_element_by_xpath(xpaths.add_Dataset.name_Textarea).send_keys(dataset_name)
    rsc.Scroll_To(driver, xpaths.add_Dataset.share_Type_Select)
    assert wait_on_element(driver, 5, xpaths.add_Dataset.share_Type_Select, 'clickable')
    driver.find_element_by_xpath(xpaths.add_Dataset.share_Type_Select).click()
    assert wait_on_element(driver, 5, xpaths.add_Dataset.share_Type_SMB_Option, 'clickable')
    driver.find_element_by_xpath(xpaths.add_Dataset.share_Type_SMB_Option).click()
    rsc.Click_On_Element(driver, xpaths.add_Dataset.create_Smb_Checkbox)


@then(parsers.parse('click Save the "{dataset_name}" data should be created'))
def click_save_the_my_ad_dataset_data_should_be_created(driver, dataset_name):
    """click Save the "my_ad_dataset" data should be created."""
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 60, xpaths.progress.progressbar)
    assert wait_on_element(driver, 10, xpaths.dataset.dataset_Name(dataset_name))


@then(parsers.parse('click on the "{dataset_name}" tree, click on Edit beside Permissions'))
def click_on_the_my_ad_dataset_tree_click_on_edit_beside_permissions(driver, dataset_name):
    """click on the "my_ad_dataset" tree, click on Edit beside Permissions."""
    assert wait_on_element(driver, 5, xpaths.dataset.dataset_Tree(dataset_name))
    driver.find_element_by_xpath(xpaths.dataset.dataset_Tree(dataset_name)).click()
    assert wait_on_element(driver, 5, xpaths.dataset.permission_Title)
    assert wait_on_element(driver, 5, xpaths.dataset.permission_Edit_Button)
    driver.find_element_by_xpath(xpaths.dataset.permission_Edit_Button).click()


@then(parsers.parse('on the Edit ACL page, input "{user_name}" for User name'))
def on_the_edit_acl_input_the_user_name(driver, user_name):
    """On the Edit ACL, input "{user_name}" for User name."""
    assert wait_on_element(driver, 5, xpaths.edit_Acl.title)
    assert wait_on_element(driver, 5, xpaths.edit_Acl.owner_Combobox, 'inputable')
    driver.find_element_by_xpath(xpaths.edit_Acl.owner_Combobox).clear()
    driver.find_element_by_xpath(xpaths.edit_Acl.owner_Combobox).send_keys(user_name)
    assert wait_on_element(driver, 5, xpaths.edit_Acl.combobox_Option(user_name), 'clickable')
    driver.find_element_by_xpath(xpaths.edit_Acl.combobox_Option(user_name)).click()
    assert wait_on_element(driver, 5, xpaths.edit_Acl.owner_Apply_Checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.edit_Acl.owner_Apply_Checkbox).click()


@then(parsers.parse('input "{group_name}" for Group name'))
def input_the_group_name(driver, group_name):
    """input "{group_name}" for Group name."""
    assert wait_on_element(driver, 5, xpaths.edit_Acl.group_Combobox, 'inputable')
    driver.find_element_by_xpath(xpaths.edit_Acl.group_Combobox).clear()
    driver.find_element_by_xpath(xpaths.edit_Acl.group_Combobox).send_keys(group_name)
    assert wait_on_element(driver, 5, xpaths.edit_Acl.combobox_Option(group_name), 'clickable')
    driver.find_element_by_xpath(xpaths.edit_Acl.combobox_Option(group_name)).click()
    assert wait_on_element(driver, 5, xpaths.edit_Acl.group_Apply_Checkbox)
    driver.find_element_by_xpath(xpaths.edit_Acl.group_Apply_Checkbox).click()


@then('click the Save Access Control List button')
def click_the_save_access_control_list_button(driver):
    """click the Save Access Control List button."""
    assert wait_on_element(driver, 5, xpaths.edit_Acl.save_Acl_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.edit_Acl.save_Acl_Button).click()
    time.sleep(1)
    assert wait_on_element_disappear(driver, 60, xpaths.popup.updating_Acl)


@then(parsers.parse('on the Dataset page click on the "{dataset_name}" tree'))
def on_the_dataset_page_click_on_the_my_ad_dataset_tree(driver, dataset_name):
    """on the Dataset page click on the "my_ad_dataset" tree."""
    assert wait_on_element(driver, 7, xpaths.dataset.title)
    assert wait_on_element(driver, 7, '//span[text()=" dozer " and contains(@class,"name")]')
    assert wait_on_element(driver, 10, xpaths.dataset.dataset_Name(dataset_name))
    assert wait_on_element(driver, 5, xpaths.dataset.dataset_Tree(dataset_name))
    driver.find_element_by_xpath(xpaths.dataset.dataset_Tree(dataset_name)).click()


@then(parsers.parse('on the permission card, verify the user is "{user_name}"'))
def on_the_permission_card_verify_the_user_is_user_name(driver, user_name):
    """on the permission card, verify the user is "{user_name}"."""
    rsc.Scroll_To(driver, xpaths.dataset.permission_Title)
    assert wait_on_element(driver, 5, xpaths.dataset.permission_At_Owner(user_name))


@then(parsers.parse('verify the group name is "{group_name}"'))
def verify_the_group_name_is_group_name(driver, group_name):
    """verify the group name is "{group_name}"."""
    assert wait_on_element(driver, 5, xpaths.dataset.permission_At_Group(group_name))
