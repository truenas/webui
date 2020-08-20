# coding=utf-8
"""High Availability (tn09) feature tests."""

import time
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.keys import Keys
from function import wait_on_element, is_element_present, wait_on_element_disappear
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T926.feature', 'Setting up Active Directory with the new system dataset')
def test_setting_up_active_directory_with_the_new_system_dataset(driver):
    """Setting up Active Directory with the new system dataset."""


@given(parsers.parse('the browser is open navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url):
    """the browser is open navigate to "{nas_url}"."""
    if nas_url not in driver.current_url:
        driver.get(f"http://{nas_url}/ui/sessions/signin")
        time.sleep(3)


@when(parsers.parse('if login page appear enter "{user}" and "{password}"'))
def if_login_page_appear_enter_root_and_password(driver, user, password):
    """if login page appear enter "{user}" and "{password}"."""
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 1, 10, '//input[@placeholder="Username"]')
        driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys(user)
        driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys(password)
        assert wait_on_element(driver, 0.5, 4, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(0.5)
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@then('you should see the dashboard and "System Information"')
def you_should_see_the_dashboard_and_system_information(driver):
    """you should see the dashboard and "System Information"."""
    assert wait_on_element(driver, 0.5, 5, '//span[contains(.,"System Information")]')


@then('navigate to Network then Global Configuration')
def navigate_to_network_then_global_configuration(driver):
    """navigate to Network then Global Configuration."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Network"]').click()
    assert wait_on_element(driver, 0.5, 30, '//mat-list-item[@ix-auto="option__Global Configuration"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Global Configuration"]').click()


@then('the Network Global Configuration page should open')
def the_network_global_configuration_page_should_open(driver):
    """the Network Global Configuration page should open."""
    assert wait_on_element(driver, 0.5, 30, '//a[contains(.,"Global Configuration")]')


@then(parsers.parse('change the first nameserver to "{ad_nameserver}" and Dommain to "{ad_domain}"'))
def change_the_first_nameserver_to_ad_nameserver_and_dommain_to_ad_domain(driver, ad_nameserver, ad_domain):
    """change the first nameserver to "{ad_nameserver}" and Dommain to "{ad_domain}"."""
    driver.find_element_by_xpath('//input[@placeholder="Nameserver 1"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Nameserver 1"]').send_keys(ad_nameserver)
    driver.find_element_by_xpath('//input[@placeholder="Domain"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Domain"]').send_keys(ad_domain)


@then('click SAVE "Please wait" should appear while settings are being applied')
def click_save_please_wait_should_appear_while_settings_are_being_applied(driver):
    """click SAVE "Please wait" should appear while settings are being applied."""
    assert wait_on_element(driver, 0.5, 30, '//button[@ix-auto="button__SAVE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 0.5, 30, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 0.5, 30, '//div[contains(.,"Settings saved.")]')


@then('navigate to Directory Services then Active Directory')
def navigate_to_directory_services_then_active_directory(driver):
    """navigate to Directory Services then Active Directory."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Directory Services"]').click()
    assert wait_on_element(driver, 0.5, 30, '//mat-list-item[@ix-auto="option__Active Directory"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Active Directory"]').click()


@then('the Domain Credentials page should open')
def the_domain_credentials_page_should_open(driver):
    """the Domain Credentials page should open."""
    assert wait_on_element(driver, 0.5, 30, '//h4[contains(.,"Domain Credentials")]')


@then(parsers.parse('input Domain name "{ad_domain}", Account name "{ad_user}", Password "{ad_password}"'))
def input_domain_name_ad_domain_account_name_ad_user_password_ad_pasword(driver, ad_domain, ad_user, ad_password):
    """input Domain name "{ad_domain}", Account name "{ad_user}", Password "ad_password"."""
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain Name"]').send_keys(ad_domain)
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain Account Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain Account Name"]').send_keys(ad_user)
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain Account Password"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain Account Password"]').send_keys(ad_password)


@then(parsers.parse('click advanced, and input "{ca_ou}" to Computer Account OU'))
def click_advanced_and_input_truenas_servers_to_computer_account_ou(driver, ca_ou):
    """click advanced, and input "{ca_ou}" to Computer Account OU."""
    if is_element_present(driver, '//button[@ix-auto="button__ADVANCED OPTIONS"]'):
        driver.find_element_by_xpath('//button[@ix-auto="button__ADVANCED OPTIONS"]').click()
    driver.find_element_by_xpath('//input[@ix-auto="input__Computer Account OU"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Computer Account OU"]').send_keys(ca_ou)


@then('check the Enable box and click SAVE')
def check_the_enable_box_and_click_save(driver):
    """check the Enable box and click SAVE."""
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Enable (requires password or Kerberos principal)"]').click()
    assert wait_on_element(driver, 0.5, 30, '//button[@ix-auto="button__SAVE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


@then('active Directory should successfully save and start without an error')
def active_directory_should_successfully_save_and_start_without_an_error(driver):
    """active Directory should successfully save and start without an error."""
    assert wait_on_element_disappear(driver, 0.5, 30, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 0.5, 10, '//div[contains(.,"Settings saved.")]')


@then('navigate to Shell')
def navigate_to_shell(driver):
    """navigate to Shell."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Shell"]').click()


@then('the Shell page should open')
def the_shell_should_should_open(driver):
    """the Shell page should open."""
    assert wait_on_element(driver, 4, 5, '//span[@class="reverse-video terminal-cursor"]')


@then(parsers.parse('input "{cmd}"'))
def input_wbinfo_u(driver, cmd):
    """input "wbinfo -u"."""
    actions = ActionChains(driver)
    actions.send_keys(cmd, Keys.ENTER)
    actions.perform()


@then(parsers.parse('verify that "{ad_object}" is in  wbinfo -u output'))
def verify_that_ad_object_is_in__wbinfo_u_output(driver, ad_object):
    """verify that "{ad_object}" is in  wbinfo -u output."""
    assert wait_on_element(driver, 1, 5, f'//span[contains(.,"{ad_object}")]')


@then(parsers.parse('input "{cmd}"'))
def input_wbinfo_g(driver, cmd):
    """input "wwbinfo -g"."""
    actions = ActionChains(driver)
    actions.send_keys(cmd, Keys.ENTER)
    actions.perform()


@then(parsers.parse('verify that "{ad_object}" is in wbinfo -g output'))
def verify_that_ad01domain_admin_is_in_wbinfo_g_output(driver, ad_object):
    """verify that "{ad_object}" is in wbinfo -g output."""
    split_ad_object = ad_object.split()
    wait_on_element(driver, 1, 5, f'//span[contains(.,"{split_ad_object[0]}") and contains(.,"{split_ad_object[1]}")]')


@then(parsers.parse('input "{cmd}"'))
def input_wbinfo_t(driver, cmd):
    """input "wbinfo -t"."""
    actions = ActionChains(driver)
    actions.send_keys(cmd, Keys.ENTER)
    actions.perform()


@then('verify that the trust secret succeeded')
def verify_that_the_trust_secret_succeeded(driver):
    """verify that the trust secret succeeded."""
    assert wait_on_element(driver, 1, 5, '//span[contains(.,"succeeded")]')


@then('navigate to Storage click Pools')
def navigate_to_storage_click_pools(driver):
    """navigate to Storage click Pools."""
    # Scroll up the mat-list-item
    element = driver.find_element_by_xpath('//span[contains(.,"root")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 0.5, 7, '//mat-list-item[@ix-auto="option__Pools"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Pools"]').click()


@then('the Pools page should open')
def the_pools_page_should_open(driver):
    """the Pools page should open."""
    assert wait_on_element(driver, 0.5, 5, '//div[contains(.,"Pools")]')


@then('click on the dozer 3 dots button, select Add Dataset')
def click_on_the_dozer_3_dots_button_select_add_dataset(driver):
    """click on the dozer 3 dots button, select Add Dataset."""
    assert wait_on_element(driver, 1, 5, '//mat-icon[@ix-auto="options__dozer"]')
    driver.find_element_by_xpath('//mat-icon[@ix-auto="options__dozer"]').click()
    assert wait_on_element(driver, 1, 5, '//button[@ix-auto="action__dozer_Add Dataset"]')
    driver.find_element_by_xpath('//button[@ix-auto="action__dozer_Add Dataset"]').click()


@then('the Add Dataset Name and Options page should open')
def the_add_dataset_name_and_options_page_should_open(driver):
    """the Add Dataset Name and Options page should open."""
    assert wait_on_element(driver, 0.5, 5, '//h4[contains(.,"Name and Options")]')


@then(parsers.parse('input dataset name "{dataset_name}" and click save'))
def input_dataset_name_my_acl_dataset_and_click_save(driver, dataset_name):
    """input dataset name "{dataset_name}" and click save."""
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys(dataset_name)
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()


@then(parsers.parse('"{dataset_name}" should be created'))
def my_acl_dataset_should_be_created(driver, dataset_name):
    """"my_acl_dataset" should be created."""
    assert wait_on_element_disappear(driver, 0.5, 30, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 0.5, 10, f'//span[contains(.,"{dataset_name}")]')


@then('click on "my_acl_dataset" 3 dots button, select Edit Permissions')
def click_on_my_acl_dataset_3_dots_button_select_edit_permissions(driver):
    """click on "my_acl_dataset" 3 dots button, select Edit Permissions."""


@then('the Edit Permissions page should open')
def the_edit_permissions_page_should_open(driver):
    """the Edit Permissions page should open."""


@then('click on Use ACL Manager')
def click_on_use_acl_manager(driver):
    """click on Use ACL Manager."""


@then('the Edit ACL page should open')
def the_edit_acl_page_should_open(driver):
    """the Edit ACL page should open."""


@then(parsers.parse('setting permissions set User to root and then select "{group_name}" for Groups, check the Apply Group and select OPEN for Default ACL Option'))
def setting_permissions_set_user_to_root_and_then_select_goup_name_for_groups_check_the_apply_group_and_select_open_for_default_acl_option(driver):
    """setting permissions set User to root and then select "{group_name}" for Groups, check the Apply Group and select OPEN for Default ACL Option."""


@then('click the Save button')
def click_the_save_button(driver):
    """click the Save button."""
