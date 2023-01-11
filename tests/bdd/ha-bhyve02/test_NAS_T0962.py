# coding=utf-8
"""SCALE High Availability (tn-bhyve01) feature tests."""

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


@pytest.mark.dependency(name='Active_Directory', scope='session')
@scenario('features/NAS-T962.feature', 'Verify Active Directory works after failover with new system dataset')
def test_verify_active_directory_works_after_failover_with_new_system_dataset(driver):
    """Verify Active Directory works after failover with new system dataset."""


@given(parsers.parse('the browser is open, navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url, request):
    """the browser is open, navigate to "{nas_url}"."""
    depends(request, ["System_Dataset", 'Setup_SSH'], scope='session')
    global host
    host = nas_url
    if nas_url not in driver.current_url:
        driver.get(f"http://{nas_url}/ui/sessions/signin")
        assert wait_on_element(driver, 10, xpaths.login.user_input)


@when(parsers.parse('if the login page appears, enter "{user}" and "{password}"'))
def if_the_login_page_appears_enter_root_and_testing(driver, user, password):
    """if the login page appears, enter "root" and "testing"."""
    global root_password
    root_password = password
    if not is_element_present(driver, xpaths.sideMenu.dashboard):
        assert wait_on_element(driver, 10, xpaths.login.user_input)
        driver.find_element_by_xpath(xpaths.login.user_input).clear()
        driver.find_element_by_xpath(xpaths.login.user_input).send_keys(user)
        driver.find_element_by_xpath(xpaths.login.password_input).clear()
        driver.find_element_by_xpath(xpaths.login.password_input).send_keys(password)
        assert wait_on_element(driver, 5, xpaths.login.signin_button, 'clickable')
        driver.find_element_by_xpath(xpaths.login.signin_button).click()
    else:
        assert wait_on_element(driver, 10, xpaths.sideMenu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()


@then('on the Dashboard, click Network on the left sidebar')
def on_the_dashboard_click_network_on_the_left_sidebar(driver):
    """on the Dashboard, click Network on the left sidebar."""
    assert wait_on_element(driver, 7, xpaths.dashboard.title)
    if wait_on_element(driver, 2, '//button[@ix-auto="button__I AGREE"]', 'clickable'):
        driver.find_element_by_xpath('//button[@ix-auto="button__I AGREE"]').click()
    assert wait_on_element(driver, 10, xpaths.dashboard.systemInfoCardTitle)
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Network"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Network"]').click()
    assert wait_on_element_disappear(driver, 20, xpaths.popup.pleaseWait)


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
    assert wait_on_element(driver, 7, xpaths.globalConfiguration.title)
    assert wait_on_element(driver, 7, '//legend[contains(.,"DNS Servers")]')
    assert wait_on_element(driver, 5, '//ix-input[contains(.,"Nameserver 1")]//input', 'inputable')
    driver.find_element_by_xpath('//ix-input[contains(.,"Nameserver 1")]//input').clear()
    driver.find_element_by_xpath('//ix-input[contains(.,"Nameserver 1")]//input').send_keys(nameserver1)


@then('click Save, the progress bar should appear while settings are being applied')
def click_save_the_progress_bar_should_appear_while_settings_are_being_applied(driver):
    """click Save, the progress bar should appear while settings are being applied."""
    assert wait_on_element(driver, 7, '//button[contains(.,"Save")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"Save")]').click()
    assert wait_on_element_disappear(driver, 60, xpaths.progress.progressbar)
    assert wait_on_element(driver, 7, '//h1[contains(.,"Network")]')
    assert wait_on_element(driver, 10, f'//span[contains(text(),"{nameserver_1}")]')


@then('after, click on Credentials on the left sidebar, then Directory Services')
def after_click_on_credentials_on_the_left_sidebar_then_directory_services(driver):
    """after, click on Credentials on the left sidebar, then Directory Services."""
    assert wait_on_element(driver, 7, xpaths.sideMenu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.credentials).click()
    assert wait_on_element(driver, 7, xpaths.sideMenu.directoryServices)
    driver.find_element_by_xpath(xpaths.sideMenu.directoryServices).click()
    assert wait_on_element_disappear(driver, 20, xpaths.popup.pleaseWait)


@then('on the Directory Services page, click Setting on the Active Directory card')
def on_the_directory_services_page_click_setting_on_the_active_directory_card(driver):
    """on the Directory Services page, click Setting on the Active Directory card."""
    assert wait_on_element(driver, 7, xpaths.directoryServices.title)
    assert wait_on_element(driver, 5, xpaths.directoryServices.directory_disable_title)
    assert wait_on_element(driver, 5, '//button[contains(.,"Configure Active Directory")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"Configure Active Directory")]').click()


@then(parsers.parse('on the Active Directory page, input the Domain name "{ad_domain}"'))
def on_the_active_directory_page_input_the_domain_name_ad_domain(driver, ad_domain):
    """on the Active Directory page, input the Domain name "ad_domain"."""
    global domain
    domain = ad_domain
    assert wait_on_element(driver, 5, xpaths.activeDirectory.title)
    assert wait_on_element(driver, 7, '//ix-input[@formcontrolname="domainname"]//input', 'inputable')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="domainname"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="domainname"]//input').send_keys(ad_domain)


@then(parsers.parse('input the Account name "{ad_user}", the Password "{ad_password}"'))
def input_the_account_name_ad_user_the_password_ap_password(driver, ad_user, ad_password):
    """input the Account name "ad_user", the Password "ad_password"."""
    driver.find_element_by_xpath('//ix-input[@formcontrolname="bindname"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="bindname"]//input').send_keys(ad_user)
    driver.find_element_by_xpath('//ix-input[@formcontrolname="bindpw"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="bindpw"]//input').send_keys(ad_password)


@then(parsers.parse('click advanced, and input the Computer Account OU "{ca_ou}"'))
def click_advanced_and_input_the_computer_account_ou_truenas_servers(driver, ca_ou):
    """click advanced, and input the Computer Account OU "ca_ou"."""
    if is_element_present(driver, '//button[contains(*/text(),"Advanced Options")]'):
        driver.find_element_by_xpath('//button[contains(*/text(),"Advanced Options")]').click()
    assert wait_on_element(driver, 7, '//ix-input[@formcontrolname="createcomputer"]//input', 'inputable')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="createcomputer"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="createcomputer"]//input').send_keys(ca_ou)


@then('check the Enable box and click SAVE')
def check_the_enable_box_and_click_save(driver):
    """check the Enable box and click SAVE."""
    assert wait_on_element(driver, 7, xpaths.activeDirectory.enableCheckbox, 'clickable')
    driver.find_element_by_xpath(xpaths.activeDirectory.enableCheckbox).click()
    assert wait_on_element(driver, 7, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('the Active Directory setup should successfully save without an error')
def the_active_directory_setup_should_successfully_save_without_an_error(driver):
    """the Active Directory setup should successfully save without an error."""
    assert wait_on_element_disappear(driver, 60, xpaths.progress.progressbar)
    assert wait_on_element_disappear(driver, 60, xpaths.popup.activeDirectory)
    assert wait_on_element(driver, 7, f'//span[text()="{domain.upper()}"]')
    assert wait_on_element(driver, 7, '//span[text()="HEALTHY" and @class="value"]')


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
    driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()
    assert wait_on_element(driver, 10, xpaths.dashboard.title)


@then('click INITIATE FAILOVER, click the confirm checkbox, and press FAILOVER')
def click_initiate_failover_click_the_confirm_checkbox_and_press_failover(driver):
    """click INITIATE FAILOVER, click the confirm checkbox, and press FAILOVER."""
    assert wait_on_element(driver, 60, xpaths.toolbar.ha_enabled)
    assert wait_on_element(driver, 10, '//span[contains(.,"System Information Standby")]')
    assert wait_on_element(driver, 10, '//button[contains(*/text(),"Initiate Failover") and contains(@class,"mat-default")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(*/text(),"Initiate Failover") and contains(@class,"mat-default")]').click()
    assert wait_on_element(driver, 5, '//h1[text()="Initiate Failover"]')
    assert wait_on_element(driver, 5, '//mat-checkbox[contains(@class,"confirm-checkbox")]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[contains(@class,"confirm-checkbox")]').click()
    assert wait_on_element(driver, 5, '//button[span/text()=" Failover "]', 'clickable')
    driver.find_element_by_xpath('//button[span/text()=" Failover "]').click()
    time.sleep(10)


@then('wait for the login page to appear')
def wait_for_the_login_page_to_appear(driver):
    """Wait for the login page to appear."""
    # to make sure the UI is refresh for the login page
    assert wait_on_element(driver, 240, xpaths.login.user_input)
    assert wait_on_element(driver, 240, '//p[text()="HA is enabled."]')


@then(parsers.parse('at the login page, enter "{user}" and "{password}"'))
def at_the_login_page_enter_user_and_password(driver, user, password):
    """At the login page, enter "user" and "password"."""
    assert wait_on_element(driver, 10, xpaths.login.user_input, 'inputable')
    driver.find_element_by_xpath(xpaths.login.user_input).clear()
    driver.find_element_by_xpath(xpaths.login.user_input).send_keys(user)
    driver.find_element_by_xpath(xpaths.login.password_input).clear()
    driver.find_element_by_xpath(xpaths.login.password_input).send_keys(password)
    assert wait_on_element(driver, 4, xpaths.login.signin_button, 'clickable')
    driver.find_element_by_xpath(xpaths.login.signin_button).click()


@then('on the Dashboard, wait for the Active Directory service')
def on_the_dashboard_wait_for_the_active_directory_service(driver):
    """on the Dashboard, wait for the Active Directory service."""
    assert wait_on_element(driver, 60, xpaths.dashboard.title)
    assert wait_on_element(driver, 120, xpaths.dashboard.systemInfoCardTitle)
    # Make sure HA is enable before going forward
    assert wait_on_element(driver, 180, xpaths.toolbar.ha_enabled)
    if wait_on_element(driver, 3, '//button[@ix-auto="button__I AGREE"]', 'clickable'):
        driver.find_element_by_xpath('//button[@ix-auto="button__I AGREE"]').click()
    # Wait for the directories service manager button
    assert wait_on_element(driver, 180, '//button[@id="dirservices-manager"]')
    # Verify HA enabled again
    assert wait_on_element(driver, 120, xpaths.toolbar.ha_enabled)


@then('after click Dataset on the left sidebar')
def after_click_dataset_on_the_left_sidebar(driver):
    """after click Dataset on the left sidebar."""
    assert wait_on_element(driver, 20, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.sideMenu.datasets, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.datasets).click()


@then('on the Dataset page, click on the dozer tree and click Add Dataset')
def on_the_dataset_page_click_on_the_dozer_tree_and_click_add_dataset(driver):
    """on the Dataset page, click on the dozer tree and click Add Dataset."""
    assert wait_on_element(driver, 7, xpaths.dataset.title)
    assert wait_on_element(driver, 7, '//span[text()=" dozer " and contains(@class,"name")]')
    driver.find_element_by_xpath('//ix-dataset-node[contains(.,"dozer")]/div').click()
    assert wait_on_element(driver, 7, '//span[text()="dozer" and contains(@class,"own-name")]')
    assert wait_on_element(driver, 5, xpaths.dataset.add_dataset_button, 'clickable')
    driver.find_element_by_xpath(xpaths.dataset.add_dataset_button).click()


@then(parsers.parse('on the Add Dataset slide, input Name "{dataset_name}" and Share Type SMB'))
def on_the_add_dataset_slide_input_name_my_ad_dataset_and_share_type_smb(driver, dataset_name):
    """on the Add Dataset slide, input Name "my_ad_dataset" and Share Type SMB."""
    assert wait_on_element(driver, 5, xpaths.addDataset.title)
    assert wait_on_element(driver, 5, xpaths.addDataset.name_textarea, 'inputable')
    driver.find_element_by_xpath(xpaths.addDataset.name_textarea).clear()
    driver.find_element_by_xpath(xpaths.addDataset.name_textarea).send_keys(dataset_name)
    assert wait_on_element(driver, 5, xpaths.addDataset.select_share_type)
    driver.find_element_by_xpath(xpaths.addDataset.select_share_type).click()
    assert wait_on_element(driver, 5, xpaths.addDataset.shareTypeSMB_option, 'clickable')
    driver.find_element_by_xpath(xpaths.addDataset.shareTypeSMB_option).click()


@then(parsers.parse('click Save the "{dataset_name}" data should be created'))
def click_save_the_my_ad_dataset_data_should_be_created(driver, dataset_name):
    """click Save the "my_ad_dataset" data should be created."""
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 20, xpaths.popup.pleaseWait)
    assert wait_on_element(driver, 10, xpaths.dataset.dataset_name(dataset_name))


@then(parsers.parse('click on the "{dataset_name}" tree, click on Edit beside Permissions'))
def click_on_the_my_ad_dataset_tree_click_on_edit_beside_permissions(driver, dataset_name):
    """click on the "my_ad_dataset" tree, click on Edit beside Permissions."""
    assert wait_on_element(driver, 5, xpaths.dataset.dataset_tree(dataset_name))
    driver.find_element_by_xpath(xpaths.dataset.dataset_tree(dataset_name)).click()
    assert wait_on_element(driver, 5, xpaths.dataset.permission_tile)
    assert wait_on_element(driver, 5, xpaths.dataset.permission_edit_button)
    driver.find_element_by_xpath(xpaths.dataset.permission_edit_button).click()


@then(parsers.parse('on the Edit ACL page, input "{user_name}" for User name'))
def on_the_edit_acl_input_the_user_name(driver, user_name):
    """On the Edit ACL, input "{user_name}" for User name."""
    assert wait_on_element(driver, 5, xpaths.editAcl.title)
    assert wait_on_element(driver, 5, xpaths.editAcl.owner_combobox, 'inputable')
    driver.find_element_by_xpath(xpaths.editAcl.owner_combobox).clear()
    driver.find_element_by_xpath(xpaths.editAcl.owner_combobox).send_keys(user_name)
    assert wait_on_element(driver, 5, xpaths.editAcl.combobox_option(user_name), 'clickable')
    driver.find_element_by_xpath(xpaths.editAcl.combobox_option(user_name)).click()
    assert wait_on_element(driver, 5, xpaths.editAcl.ownerApply_checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.editAcl.ownerApply_checkbox).click()


@then(parsers.parse('input "{group_name}" for Group name'))
def input_the_group_name(driver, group_name):
    """input "{group_name}" for Group name."""
    assert wait_on_element(driver, 5, xpaths.editAcl.group_combobox, 'inputable')
    driver.find_element_by_xpath(xpaths.editAcl.group_combobox).clear()
    driver.find_element_by_xpath(xpaths.editAcl.group_combobox).send_keys(group_name)
    assert wait_on_element(driver, 5, xpaths.editAcl.combobox_option(group_name), 'clickable')
    driver.find_element_by_xpath(xpaths.editAcl.combobox_option(group_name)).click()
    assert wait_on_element(driver, 5, xpaths.editAcl.gourpApply_checkbox)
    driver.find_element_by_xpath(xpaths.editAcl.gourpApply_checkbox).click()


@then('click the Save Access Control List button')
def click_the_save_access_control_list_button(driver):
    """click the Save Access Control List button."""
    assert wait_on_element(driver, 5, xpaths.editAcl.saveAcl_button, 'clickable')
    driver.find_element_by_xpath(xpaths.editAcl.saveAcl_button).click()
    time.sleep(1)
    assert wait_on_element_disappear(driver, 60, xpaths.popup.updatingAcl)


@then(parsers.parse('on the Dataset page click on the "{dataset_name}" tree'))
def on_the_dataset_page_click_on_the_my_ad_dataset_tree(driver, dataset_name):
    """on the Dataset page click on the "my_ad_dataset" tree."""
    assert wait_on_element(driver, 7, xpaths.dataset.title)
    assert wait_on_element(driver, 7, '//span[text()=" dozer " and contains(@class,"name")]')
    assert wait_on_element(driver, 10, xpaths.dataset.dataset_name(dataset_name))
    assert wait_on_element(driver, 5, xpaths.dataset.dataset_tree(dataset_name))
    driver.find_element_by_xpath(xpaths.dataset.dataset_tree(dataset_name)).click()


@then(parsers.parse('on the permission card, verify the user is "{user_name}"'))
def on_the_permission_card_verify_the_user_is_user_name(driver, user_name):
    """on the permission card, verify the user is "{user_name}"."""
    element = driver.find_element_by_xpath(xpaths.dataset.permission_tile)
    driver.execute_script("arguments[0].scrollIntoView();", element)
    assert wait_on_element(driver, 5, xpaths.dataset.permissionAtOwner(user_name))


@then(parsers.parse('verify the group name is "{group_name}"'))
def verify_the_group_name_is_group_name(driver, group_name):
    """verify the group name is "{group_name}"."""
    assert wait_on_element(driver, 5, xpaths.dataset.permissionAtGroup(group_name))
