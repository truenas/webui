# coding=utf-8
"""SCALE UI: feature tests."""

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


@scenario('features/NAS-T1104.feature', 'Setup AD and verify it is working')
def test_setup_ad_and_verify_it_is_working():
    """Setup AD and verify it is working."""


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
        assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('on the Dashboard, click Network on the left sidebar.')
def on_the_dashboard_click_network_on_the_left_sidebar(driver):
    """on the Dashboard, click Network on the left sidebar.."""
    assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//span[contains(text(),"System Information")]')
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Network"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Network"]').click()


@then('on the network page, click on setting on the Global Configuration card.')
def on_the_network_page_click_on_setting_on_the_global_configuration_card(driver):
    """on the network page, click on setting on the Global Configuration card.."""
    time.sleep(2)
    assert wait_on_element(driver, 7, '//h1[contains(.,"Network")]')
    assert wait_on_element(driver, 10, '//button[contains(.,"Settings")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"Settings")]').click()


@then(parsers.parse('on the Network Global Configuration page, change the first nameserver to "{nameserver1}".'))
def on_the_network_global_configuration_page_change_the_first_nameserver_to_nameserver1(driver, nameserver1):
    """on the Network Global Configuration page, change the first nameserver to "{nameserver1}".."""
    time.sleep(2)
    assert wait_on_element(driver, 10, '//h3[contains(.,"Global Configuration")]')
    assert wait_on_element(driver, 7, '//ix-input[contains(.,"Nameserver 1")]//input', 'inputable')
    driver.find_element_by_xpath('//ix-input[contains(.,"Nameserver 1")]//input').clear()
    driver.find_element_by_xpath('//ix-input[contains(.,"Nameserver 1")]//input').send_keys(nameserver1)


@then(parsers.parse('change the Domain for "{ad_domain}", and click Save.'))
def change_the_domain_for_ad_domain_and_click_save(driver, ad_domain):
    """change the Domain for "{ad_domain}", and click Save.."""
    time.sleep(2)
    global domain
    domain = ad_domain
    assert wait_on_element(driver, 5, '//ix-input[contains(.,"Domain")]')
    driver.find_element_by_xpath('//ix-input[contains(.,"Domain")]//input').clear()
    driver.find_element_by_xpath('//ix-input[contains(.,"Domain")]//input').send_keys(ad_domain)
    assert wait_on_element(driver, 7, '//button[contains(.,"Save")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"Save")]').click()


@then('Please wait should appear while settings are being applied.')
def please_wait_should_appear_while_settings_are_being_applied(driver):
    """Please wait should appear while settings are being applied.."""
    assert wait_on_element_disappear(driver, 20, '//div[contains(@class,"mat-progress-bar-element")]')
    assert wait_on_element(driver, 10, '//h1[contains(.,"Network")]')


@then('after, click on Credentials on the left sidebar, then Directory Services.')
def after_click_on_credentials_on_the_left_sidebar_then_directory_services(driver):
    """after, click on Credentials on the left sidebar, then Directory Services.."""
    time.sleep(2)
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
    assert wait_on_element(driver, 7, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Directory Services"]', 'clickable')
    driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Directory Services"]').click()


@then('on the Directory Services page, click Setting on the Active Directory card.')
def on_the_directory_services_page_click_setting_on_the_active_directory_card(driver):
    """on the Directory Services page, click Setting on the Active Directory card.."""
    time.sleep(2)
    assert wait_on_element(driver, 7, '//h1[contains(.,"Directory Services")]')
    assert wait_on_element(driver, 7, '//span[contains(text(),"Configure Active Directory")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Configure Active Directory")]').click()


@then(parsers.parse('on the Active Directory page, input the Domain name "{ad_domain}".'))
def on_the_active_directory_page_input_the_domain_name_ad_domain(driver, ad_domain):
    """on the Active Directory page, input the Domain name "{ad_domain}".."""
    time.sleep(2)
    global domain
    domain = ad_domain
    assert wait_on_element(driver, 5, '//h3[@class="formtitle" and text()="Active Directory"]')
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Domain Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain Name"]').send_keys(ad_domain)


@then(parsers.parse('input the Account name "{ad_user}", the Password "{ad_password}".'))
def input_the_account_name_ad_user_the_password_ad_password(driver, ad_user, ad_password):
    """input the Account name "{ad_user}", the Password "{ad_password}".."""
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain Account Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain Account Name"]').send_keys(ad_user)
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain Account Password"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain Account Password"]').send_keys(ad_password)


@then(parsers.parse('click advanced, and input the Computer Account OU "{ca_ou}".'))
def click_advanced_and_input_the_computer_account_ou_ca_ou(driver, ca_ou):
    """click advanced, and input the Computer Account OU "{ca_ou}".."""
    if is_element_present(driver, '//button[@ix-auto="button__ADVANCED OPTIONS"]'):
        driver.find_element_by_xpath('//button[@ix-auto="button__ADVANCED OPTIONS"]').click()
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Computer Account OU"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Computer Account OU"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Computer Account OU"]').send_keys(ca_ou)


@then('check the Enable box and click SAVE.')
def check_the_enable_box_and_click_save(driver):
    """check the Enable box and click SAVE.."""
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Enable (requires password or Kerberos principal)"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


@then('the Active Directory setup should successfully save without an error.')
def the_active_directory_setup_should_successfully_save_without_an_error(driver):
    """the Active Directory setup should successfully save without an error.."""
    assert wait_on_element_disappear(driver, 30, '//h6[contains(.,"Please wait")]')
    assert wait_on_element_disappear(driver, 30, '//h1[text()="Start"]')
    assert wait_on_element(driver, 7, f'//span[text()="{domain.upper()}"]')


@then(parsers.parse('run "{cmd1}" and verify that "{ad_object1}" is in output.'))
def run_cmd1_and_verify_that_ad01administrator_is_in__output(driver, cmd1, root_password, nas_ip, ad_object1):
    """verify that "AD01\administrator" is in output.."""
    global ssh_result
    ssh_result = ssh_cmd(cmd1, 'root', root_password, nas_ip)
    assert ssh_result['result'], ssh_result['output']
    assert ad_object1 in ssh_result['output'], ssh_result['output']


@then(parsers.parse('Run "{cmd3}"'))
def run_cmd3(driver, cmd3, root_password, nas_ip):
    """run cmd3"""
    global ssh_result
    ssh_result = ssh_cmd(cmd3, 'root', root_password, nas_ip)
    assert ssh_result['result'], ssh_result['output']
    assert "succeeded" in ssh_result['output'], ssh_result['output']


@then('after open the Storage page and click on the system 3 dots button, select Add Dataset.')
def after_open_the_storage_page_and_click_on_the_system_3_dots_button_select_add_dataset(driver):
    """after open the Storage page and click on the system 3 dots button, select Add Dataset.."""
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 7, '//h1[text()="Storage"]')
    # This will wait for the spinner to go away and looks like this xpath work for all spinners.
    assert wait_on_element_disappear(driver, 15, '//mat-spinner[@role="progressbar"]')
    assert wait_on_element(driver, 5, '//tr[contains(.,"system")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"system")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 4, '//button[normalize-space(text())="Add Dataset"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="Add Dataset"]').click()


@then(parsers.parse('on the Add Dataset page, input the dataset name "{dataset_name}".'))
def on_the_add_dataset_page_input_the_dataset_name_dataset_name(driver, dataset_name):
    """on the Add Dataset page, input the dataset name "{dataset_name}".."""
    assert wait_on_element(driver, 5, '//h3[text()="Add Dataset"]')
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys(dataset_name)
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Share Type"]')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Share Type"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Share Type_SMB"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Share Type_SMB"]').click()


@then(parsers.parse('click Summit the "{dataset_name}" data should be created.'))
def click_summit_the_dataset_name_data_should_be_created(driver, dataset_name):
    """click Summit the "{dataset_name}" data should be created.."""
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')


@then(parsers.parse('click on the "{dataset_name}" 3 dots button, select Edit Permissions.'))
def click_on_the_dataset_name_3_dots_button_select_edit_permissions(driver, dataset_name):
    """click on the "{dataset_name}" 3 dots button, select Edit Permissions.."""
    assert wait_on_element(driver, 7, '//h1[text()="Storage"]')
    assert wait_on_element_disappear(driver, 15, '//mat-spinner[@role="progressbar"]')
    assert wait_on_element(driver, 10, '//div[contains(text(),"my_acl_dataset")]')
    assert wait_on_element(driver, 5, '//tr[contains(.,"my_acl_dataset")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"my_acl_dataset")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 5, '//button[normalize-space(text())="View Permissions"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="View Permissions"]').click()
    assert wait_on_element(driver, 5, '//mat-icon[normalize-space(text())="edit"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[normalize-space(text())="edit"]').click()


@then(parsers.parse('The Edit ACL page should open, select OPEN for Default ACL Option, select "{group_name}" for Group name, check the Apply Group.'))
def the_edit_acl_page_should_open_select_open_for_default_acl_option_select_group_name_for_group_name_check_the_apply_group(driver, group_name):
    """The Edit ACL page should open, select OPEN for Default ACL Option, select "{group_name}" for Group name, check the Apply Group.."""
    assert wait_on_element(driver, 5, '//h1[text()="Edit ACL"]')
    assert wait_on_element(driver, 5, '//ix-combobox[@formcontrolname = "ownerGroup"]//input', 'inputable')
    driver.find_element_by_xpath('//ix-combobox[@formcontrolname = "ownerGroup"]//input').click()
    driver.find_element_by_xpath('//ix-combobox[@formcontrolname = "ownerGroup"]//input').clear()
    driver.find_element_by_xpath('//ix-combobox[@formcontrolname = "ownerGroup"]//input').send_keys(group_name)
    assert wait_on_element(driver, 5, '//span[contains(text(),"Save Access Control List")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save Access Control List")]').click()
    assert wait_on_element(driver, 7, '//h1[text()="Storage"]')
    assert wait_on_element_disappear(driver, 15, '//mat-spinner[@role="progressbar"]')
    assert wait_on_element(driver, 5, '//tr[contains(.,"my_acl_dataset")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"my_acl_dataset")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 5, '//button[normalize-space(text())="View Permissions"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="View Permissions"]').click()
    assert wait_on_element(driver, 5, '//div[contains(text(),"Dataset Permissions")]')
    assert wait_on_element(driver, 5, '//mat-icon[normalize-space(text())="edit"]')
    driver.find_element_by_xpath('//mat-icon[normalize-space(text())="edit"]').click()
    assert wait_on_element(driver, 5, '//ix-select[@formcontrolname = "tag"]//mat-select')
    driver.find_element_by_xpath('//ix-select[@formcontrolname = "tag"]//mat-select').click()
    driver.find_element_by_xpath('//span[contains(text(),"Group")]').click()
    assert wait_on_element(driver, 5, '//ix-combobox[@formcontrolname="group"]//input', 'inputable')
    driver.find_element_by_xpath('//ix-combobox[@formcontrolname="group"]//input').clear()
    driver.find_element_by_xpath('//ix-combobox[@formcontrolname="group"]//input').send_keys(group_name)
    assert wait_on_element(driver, 5, '//ix-select[@formcontrolname="basicPermission"]//mat-select', 'clickable')
    driver.find_element_by_xpath('//ix-select[@formcontrolname="basicPermission"]//mat-select').click()
    assert wait_on_element(driver, 5, '//div//mat-option//span[contains(text(),"Full Control")]', 'clickable')
    driver.find_element_by_xpath('//div//mat-option//span[contains(text(),"Full Control")]').click()


@then(parsers.parse('click the Save button, which should be returned to the storage page, on the Edit ACL page, verify that the group name is "{group_name}".'))
def click_the_save_button_which_should_be_returned_to_the_storage_page_on_the_edit_acl_page_verify_that_the_group_name_is_group_name(driver, group_name):
    """click the Save button, which should be returned to the storage page, on the Edit ACL page, verify that the group name is "{group_name}".."""
    assert wait_on_element(driver, 5, '//span[contains(text(),"Save Access Control List")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save Access Control List")]').click()
    assert wait_on_element_disappear(driver, 30, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//h1[text()="Storage"]')
    assert wait_on_element_disappear(driver, 15, '//mat-spinner[@role="progressbar"]')
    assert wait_on_element(driver, 10, '//div[contains(text(),"my_acl_dataset")]')
    assert wait_on_element(driver, 5, '//tr[contains(.,"my_acl_dataset")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"my_acl_dataset")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 5, '//button[normalize-space(text())="View Permissions"]')
    driver.find_element_by_xpath('//button[normalize-space(text())="View Permissions"]').click()
    assert wait_on_element(driver, 7, f'//div[text()="Group - {group_name}"]')
