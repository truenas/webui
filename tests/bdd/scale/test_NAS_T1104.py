# coding=utf-8
"""SCALE UI: feature tests."""

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
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('on the Dashboard, click Network on the left sidebar.')
def on_the_dashboard_click_network_on_the_left_sidebar(driver):
    """on the Dashboard, click Network on the left sidebar.."""
    time.sleep(2)
    assert wait_on_element(driver, 7, '//span[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Network"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Network"]').click()


@then('on the network page, click on setting on the Global Configuration card.')
def on_the_network_page_click_on_setting_on_the_global_configuration_card(driver):
    """on the network page, click on setting on the Global Configuration card.."""
    time.sleep(2)
    assert wait_on_element(driver, 7, '//h1[contains(.,"Network")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__globalSettings"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__globalSettings"]').click()


@then(parsers.parse('on the Network Global Configuration page, change the first nameserver to "{nameserver1}".'))
def on_the_network_global_configuration_page_change_the_first_nameserver_to_nameserver1(driver, nameserver1):
    """on the Network Global Configuration page, change the first nameserver to "{nameserver1}".."""
    time.sleep(2)
    assert wait_on_element(driver, 7, '//h4[contains(.,"Hostname and Domain")]')
    assert wait_on_element(driver, 5, '//input[@id="nameserver1"]', 'inputable')
    driver.find_element_by_xpath('//input[@id="nameserver1"]').clear()
    driver.find_element_by_xpath('//input[@id="nameserver1"]').send_keys(nameserver1)


@then(parsers.parse('change the Domain for "{ad_domain}", and click Save.'))
def change_the_domain_for_ad_domain_and_click_save(driver, ad_domain):
    """change the Domain for "{ad_domain}", and click Save.."""
    time.sleep(2)
    global domain
    domain = ad_domain
    assert wait_on_element(driver, 5, '//input[@id="domain"]')
    driver.find_element_by_xpath('//input[@id="domain"]').clear()
    driver.find_element_by_xpath('//input[@id="domain"]').send_keys(ad_domain)
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


@then('Please wait should appear while settings are being applied.')
def please_wait_should_appear_while_settings_are_being_applied(driver):
    """Please wait should appear while settings are being applied.."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, f'//li[contains(.,"{domain}")]')


@then('after, click on Credentials on the left sidebar, then Directory Services.')
def after_click_on_credentials_on_the_left_sidebar_then_directory_services(driver):
    """after, click on Credentials on the left sidebar, then Directory Services.."""
    time.sleep(2)
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Directory Services"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Directory Services"]').click()


@then('on the Directory Services page, click Setting on the Active Directory card.')
def on_the_directory_services_page_click_setting_on_the_active_directory_card(driver):
    """on the Directory Services page, click Setting on the Active Directory card.."""
    assert wait_on_element(driver, 7, '//h1[contains(.,"Directory Services")]')
    assert wait_on_element(driver, 5, '//h3[text()="Active Directory"]')
    assert wait_on_element(driver, 7, '//mat-card[contains(.,"Active Directory")]//button[contains(.,"Settings")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"Active Directory")]//button[contains(.,"Settings")]').click()


@then(parsers.parse('on the Active Directory page, input the Domain name "{ad_domain}".'))
def on_the_active_directory_page_input_the_domain_name_ad_domain(driver, ad_domain):
    """on the Active Directory page, input the Domain name "{ad_domain}".."""
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
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, f'//span[text()="{domain.upper()}"]')


@then(parsers.parse('Navigate to Shell and run "{cmd1}"'))
def navigate_to_shell_and_run_cmd1(driver, cmd1):
    """Navigate to Shell and run cmd1"""
    time.sleep(10)
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__System Settings"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System Settings"]').click()    
    time.sleep(1)
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Shell"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Shell"]').click()
    time.sleep(2)
    actions = ActionChains(driver)
    actions.send_keys(cmd1, Keys.ENTER)
    actions.perform()


@then(parsers.parse('verify that "{ad_object1}" is in wbinfo -u output.'))
def verify_that_ad01administrator_is_in_wbinfo_u_output(driver, ad_object1):
    """verify that "AD01\administrator" is in wbinfo -u output.."""
    #assert wait_on_element(driver, 15, f'//span[contains(.,"{ad_object1}")]')
    #time.sleep(1)


@then(parsers.parse('Run "{cmd2}"'))
def run_cmd2(driver, cmd2):
    """run cmd2"""
    #time.sleep(2)
    #actions = ActionChains(driver)
    #actions.send_keys(cmd2, Keys.ENTER)
    #actions.perform()


@then(parsers.parse('verify that "{ad_object2}" is in wbinfo -g output.'))
def verify_that_ad01domain_admin_is_in_wbinfo_g_output(driver, ad_object2):
    """verify that "AD01\domain admin" is in wbinfo -g output.."""
    #time.sleep(1)
    #split_ad_object2 = ad_object2.split()
    #assert wait_on_element(driver, 5, f'//span[contains(.,"{split_ad_object2[0]}") and contains(.,"{split_ad_object2[1]}")]')


@then(parsers.parse('Run "{cmd3}"'))
def run_cmd3(driver, cmd3):
    """run cmd3"""
    #time.sleep(2)
    #actions = ActionChains(driver)
    #actions.send_keys(cmd3, Keys.ENTER)
    #actions.perform()
    #assert wait_on_element(driver, 5, '//span[contains(.,"succeeded")]')
    

@then('after open the Storage page and click on the system 3 dots button, select Add Dataset.')
def after_open_the_storage_page_and_click_on_the_system_3_dots_button_select_add_dataset(driver):
    """after open the Storage page and click on the system 3 dots button, select Add Dataset.."""
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 7, '//h1[text()="Storage"]')
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
    assert wait_on_element(driver, 10, f'//div[contains(text(),"{dataset_name}")]')


@then(parsers.parse('click on the "{dataset_name}" 3 dots button, select Edit Permissions.'))
def click_on_the_dataset_name_3_dots_button_select_edit_permissions(driver, dataset_name):
    """click on the "{dataset_name}" 3 dots button, select Edit Permissions.."""
    assert wait_on_element(driver, 5, f'//tr[contains(.,"{dataset_name}")]//mat-icon[text()="more_vert"]')
    driver.find_element_by_xpath(f'//tr[contains(.,"{dataset_name}")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 5, '//button[normalize-space(text())="Edit Permissions"]')
    driver.find_element_by_xpath('//button[normalize-space(text())="Edit Permissions"]').click()


@then(parsers.parse('The Edit ACL page should open, select OPEN for Default ACL Option, select "{group_name}" for Group name, check the Apply Group.'))
def the_edit_acl_page_should_open_select_open_for_default_acl_option_select_group_name_for_group_name_check_the_apply_group(driver, group_name):
    """The Edit ACL page should open, select OPEN for Default ACL Option, select "{group_name}" for Group name, check the Apply Group.."""
    assert wait_on_element(driver, 5, '//h1[text()="Edit ACL"]')
    assert wait_on_element(driver, 5, '//h4[text()="File Information"]')
    time.sleep(1)
    assert wait_on_element(driver, 5, '//button[@id="cust_button_Select an ACL Preset"]', 'clickable')
    driver.find_element_by_xpath('//button[@id="cust_button_Select an ACL Preset"]').click()
    time.sleep(1)
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Default ACL Options"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Default ACL Options"]').click()
    time.sleep(1)
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Default ACL Options_NFS4_OPEN"]').click()
    time.sleep(1)
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()
    time.sleep(1)
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__Apply Group"]/label/div', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Apply Group"]/label/div').click()
    assert wait_on_element(driver, 5, '//input[@data-placeholder="Group"]')
    driver.find_element_by_xpath('//input[@data-placeholder="Group"]').clear()
    driver.find_element_by_xpath('//input[@data-placeholder="Group"]').send_keys('AD01\\administrator')


@then(parsers.parse('click the Save button, which should be returned to the storage page, on the Edit ACL page, verify that the group name is "{group_name}".'))
def click_the_save_button_which_should_be_returned_to_the_storage_page_on_the_edit_acl_page_verify_that_the_group_name_is_group_name(driver, group_name):
    """click the Save button, which should be returned to the storage page, on the Edit ACL page, verify that the group name is "{group_name}".."""
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    time.sleep(8)
    assert wait_on_element(driver, 10, '//div[contains(text(),"my_acl_dataset")]')
    assert wait_on_element(driver, 5, '//input[@data-placeholder="Group"]')
    assert attribute_value_exist(driver, '//input[@data-placeholder="Group"]', 'value', group_name)


    ## return to dashboard
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    time.sleep(1)