# coding=utf-8
"""High Availability (tn09) feature tests."""
import time
from function import wait_on_element, is_element_present, wait_on_element_disappear
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T920.feature', 'Verify vlan with lagg0 parent interface using secondary failover group functions')
def test_verify_vlan_with_lagg0_parent_interface_using_secondary_failover_group_functions(driver):
    """Verify vlan with lagg0 parent interface using secondary failover group functions."""


@given(parsers.parse('The browser is open navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url):
    """The browser is open navigate to "{nas_url}"."""
    if nas_url not in driver.current_url:
        driver.get(f"{nas_url}/ui/sessions/signin")
        time.sleep(5)


@when(parsers.parse('Login appear enter "{user}" and "{password}"'))
def login_appear_enter_user_and_password(driver, user, password):
    """Login appear enter "{user}" and "{password}"."""
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        wait_on_element(driver, 1, 10, '//input[@placeholder="Username"]')
        driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys(user)
        driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys(password)
        wait_on_element(driver, 0.5, 4, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(0.5)
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@then('You should see the dashboard')
def you_should_see_the_dashboard(driver):
    """You should see the dashboard."""
    wait_on_element(driver, 0.5, 30, '//span[contains(.,"System Information")]')
    driver.find_element_by_xpath('//span[contains(.,"System Information")]')


@then('Navigate to System then to Failover')
def navigate_to_system_then_to_failover(driver):
    """Navigate to System then to Failover."""
    # make sure to scroll back up the mat-list-item
    element = driver.find_element_by_xpath('//span[contains(.,"root")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System"]').click()
    wait_on_element(driver, 0.5, 30, '//mat-list-item[@ix-auto="option__Failover"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Failover"]').click()


@then('The Failover Page should open')
def the_failover_page_should_open(driver):
    """The Failover Page should open."""
    wait_on_element(driver, 0.5, 30, '//h4[contains(.,"Failover Configuration")]')
    driver.find_element_by_xpath('//h4[contains(.,"Failover Configuration")]')


@then('Check disable failover and click save Check confirm on the warning dialog and press OK')
def check_disable_failover_and_click_save_check_confirm_on_the_warning_dialog_and_press_ok(driver):
    """Check disable failover and click save Check confirm on the warning dialog and press OK."""
    element = driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Disable Failover"]')
    class_attribute = element.get_attribute('class')
    if 'mat-checkbox-checked' not in class_attribute:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Disable Failover"]').click()
    assert wait_on_element(driver, 0.5, 7, '//button[@ix-auto="button__SAVE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    if 'mat-checkbox-checked' not in class_attribute:
        assert wait_on_element(driver, 0.5, 4, '//h1[contains(.,"Disable Failover")]')
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
        driver.find_element_by_xpath('//button[@ix-auto="button__OK"]').click()


@then('A dialog should appear while applying settings')
def a_dialog_should_appear_while_applying_settings(driver):
    """A dialog should appear while applying settings."""
    wait_on_element_disappear(driver, 1, 30, '//h6[contains(.,"Please wait")]')
    wait_on_element(driver, 0.5, 30, '//h1[contains(.,"Settings saved")]')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()


@then('Navigate to Network then to Interfaces')
def navigate_to_network_then_to_interfaces(driver):
    """Navigate to Network then to Interfaces."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Network"]').click()
    wait_on_element(driver, 0.5, 30, '//mat-list-item[@ix-auto="option__Interfaces"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Interfaces"]').click()


@then('The interface page should open.')
def the_interface_page_should_open(driver):
    """The interface page should open."""
    wait_on_element(driver, 0.5, 30, '//div[contains(.,"Interfaces")]')
    driver.find_element_by_xpath('//div[contains(.,"Interfaces")]')


@then('Click Add')
def click_add(driver):
    """Click Add."""
    driver.find_element_by_xpath('//button[@ix-auto="button__Interfaces_ADD"]').click()


@then('The Interface Settings page should open')
def the_interface_settings_page_should_open(driver):
    """The Interface Settings page should open."""
    wait_on_element(driver, 0.5, 30, '//h4[contains(.,"Interface Settings")]')
    driver.find_element_by_xpath('//h4[contains(.,"Interface Settings")]')


@then('For type select link aggregation. For name enter lagg0')
def for_type_select_link_aggregation_for_name_enter_lagg0(driver):
    """For type select link aggregation. For name enter lagg0."""
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Type"]').click()
    wait_on_element(driver, 0.5, 5, '//mat-option[@ix-auto="option__Type_Link Aggregation"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Type_Link Aggregation"]').click()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys('lagg0')


@then(parsers.parse('For description enter "{description}" without quotes'))
def for_description_enter_lagg_for_functional_testing_without_quotes(driver, description):
    """For description enter "lagg for functional testing" without quotes."""
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').send_keys(description)


@then('For lagg protocol select LACP For lagg interfaces select cxl0, and cxl1')
def for_lagg_protocol_select_lacp_for_lagg_interfaces_select_cxl0_and_cxl1(driver):
    """For lagg protocol select LACP For lagg interfaces select cxl0, and cxl1."""
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Lagg Protocol"]').click()
    wait_on_element(driver, 0.5, 5, '//mat-option[@ix-auto="option__Lagg Protocol_LACP"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Lagg Protocol_LACP"]').click()
    wait_on_element(driver, 0.5, 5, '//mat-select[@ix-auto="select__Lagg Interfaces"]')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Lagg Interfaces"]').click()
    wait_on_element(driver, 0.5, 5, '//mat-option[@ix-auto="option__Lagg Interfaces_cxl0"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Lagg Interfaces_cxl0"]').click()
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Lagg Interfaces_cxl1"]').click()
    actions = ActionChains(driver)
    actions.send_keys(Keys.TAB)
    actions.perform()


@then('Press Apply')
def press_apply(driver):
    """Press Apply."""
    wait_on_element(driver, 0.5, 5, '//button[@ix-auto="button__APPLY"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__APPLY"]').click()


@then('The following message "There are unapplied network changes. Apply them now? Unapplied changes will be lost." should appear.')
def the_following_message_there_are_unapplied_network_changes_apply_them_now_unapplied_changes_will_be_lost_should_appear(driver):
    """The following message "There are unapplied network changes. Apply them now? Unapplied changes will be lost." should appear."""
    wait_on_element(driver, 0.5, 30, '//button[contains(.,"TEST CHANGES")]')
    driver.find_element_by_xpath('//button[contains(.,"TEST CHANGES")]').click()


@then('You should be able to confirm and close.')
def you_should_be_able_to_confirm_and_close(driver):
    """You should be able to confirm and close."""
    wait_on_element(driver, 0.5, 30, '//h1[contains(.,"Test Changes")]')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    driver.find_element_by_xpath('//button[@ix-auto="button__TEST CHANGES"]').click()
    wait_on_element_disappear(driver, 1, 30, '//h6[contains(.,"Please wait")]')


@then('The following message "Network changes have been applied. Keep changes permanently? Changes will be automatically discarded if they are not permanently applied." should appear')
def the_following_message_network_changes_have_been_applied_keep_changes_permanently_changes_will_be_automatically_discarded_if_they_are_not_permanently_applied_should_appear(driver):
    """The following message "Network changes have been applied. Keep changes permanently? Changes will be automatically discarded if they are not permanently applied." should appear."""
    wait_on_element(driver, 0.5, 30, '//button[contains(.,"SAVE CHANGES")]')
    driver.find_element_by_xpath('//button[contains(.,"SAVE CHANGES")]').click()


@then('You should be able to select keep network change permanently.')
def you_should_be_able_to_select_keep_network_change_permanently(driver):
    """You should be able to select keep network change permanently."""
    wait_on_element(driver, 0.5, 30, '//h1[contains(.,"Save Changes")]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


@then('Finally you should see a message indicating that network changes have been applied, and you should be able to close.')
def finally_you_should_see_a_message_indicating_that_network_changes_have_been_applied_and_you_should_be_able_to_close(driver):
    """Finally you should see a message indicating that network changes have been applied, and you should be able to close."""
    wait_on_element(driver, 0.5, 30, '//h1[contains(.,"Changes Saved")]')
    driver.find_element_by_xpath('//h1[contains(.,"Changes Saved")]')
    wait_on_element(driver, 0.5, 30, '//button[@ix-auto="button__CLOSE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()


@then('The lagg0 interface should be in the Interfaces list.')
def the_lagg0_interface_should_be_in_the_Interfaces_list(driver):
    """The lagg0 interface should be in the Interfaces list."""
    wait_on_element(driver, 0.5, 30, '//div[contains(.,"Interfaces")]')
    driver.find_element_by_xpath('//div[contains(.,"Interfaces")]')
    element_text = driver.find_element_by_xpath('//div[@ix-auto="value__lagg0_Name"]').text
    assert element_text == 'lagg0'


@then('For type select link vlan, For name enter vlan1043')
def for_type_select_link_vlan_for_name_enter_vlan1043(driver):
    """For type select link vlan, For name enter vlan1043."""
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Type"]').click()
    wait_on_element(driver, 0.5, 5, '//mat-option[@ix-auto="option__Type_VLAN"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Type_VLAN"]').click()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys('vlan1043')


@then(parsers.parse('For description enter "{description}" without quotes'))
def for_description_enter_vlan_for_functional_testing_without_quotes(driver, description):
    """For description enter "vlan for functional testing" without quotes."""
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').send_keys(description)


@then('Select critical, For failover group select 2')
def select_critical_for_failover_group_select_2(driver):
    """Select critical, For failover group select 2."""
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Critical"]').click()
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Failover Group"]').click()
    wait_on_element(driver, 0.5, 5, '//mat-option[@ix-auto="option__Failover Group_2"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Failover Group_2"]').click()


@then('For Failover VHID enter 30')
def for_failover_vhid_enter_30(driver):
    """For Failover VHID enter 30."""
    driver.find_element_by_xpath('//input[@ix-auto="input__Failover VHID"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Failover VHID"]').send_keys('30')


@then('For parent interface select lagg0 created by previous step')
def for_parent_interface_select_lagg0_created_by_previous_step(driver):
    """For parent interface select lagg0 created by previous step."""
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Parent Interface"]').click()
    wait_on_element(driver, 0.5, 5, '//mat-option[@ix-auto="option__Parent Interface_lagg0: lagg for functional testing"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Parent Interface_lagg0: lagg for functional testing"]').click()
    driver.find_element_by_xpath('//input[@ix-auto="input__Vlan Tag"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Vlan Tag"]').send_keys('1043')


@then(parsers.parse('For IP Address (This Conroller) enter "{ip}" select /"{netmask}" for netmask'))
def for_ip_address_this_conroller_enter_ip_select_28_for_netmask(driver, ip, netmask):
    """For IP Address (This Conroller) enter "{ip}" select /"{netmask}" for netmask."""
    driver.find_element_by_xpath('//input[@ix-auto="input__IP Address (This Controller)"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__IP Address (This Controller)"]').send_keys(ip)
    driver.find_element_by_xpath('//mat-select[@ix-auto="input__IP Address (This Controller)"]').click()
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__{netmask}"]').click()


@then(parsers.parse('For IP Address (TrueNAS Controller 2) enter "{ip}" select /"{netmask}" netmask'))
def for_ip_address_truenas_controller_2_enter_ip_select_28_netmask(driver, ip, netmask):
    """For IP Address (TrueNAS Controller 2) enter "{ip}" select /"{netmask}" netmask."""
    driver.find_element_by_xpath('//input[@ix-auto="input__Failover IP Address (TrueNAS Controller 2)"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Failover IP Address (TrueNAS Controller 2)"]').send_keys(ip)
    driver.find_element_by_xpath('//mat-select[@ix-auto="input__Failover IP Address (TrueNAS Controller 2)"]').click()
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__{netmask}"]').click()


@then(parsers.parse('For Virtual IP address enter "{vip}" and Press Apply'))
def for_virtual_ip_address_enter_vip_and_press_apply(driver, vip):
    """For Virtual IP address enter "{vip}" and Press Apply."""
    driver.find_element_by_xpath('//input[@ix-auto="input__Virtual IP Address"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Virtual IP Address"]').send_keys(vip)
    wait_on_element(driver, 0.5, 5, '//button[@ix-auto="button__APPLY"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__APPLY"]').click()


@then('The vlan1043 interface should be in the Interfaces list.')
def the_vlan1043_interface_should_be_in_the_Interfaces_list(driver):
    """The vlan1043 interface should be in the Interfaces list."""
    wait_on_element(driver, 0.5, 30, '//div[contains(.,"Interfaces")]')
    driver.find_element_by_xpath('//div[contains(.,"Interfaces")]')
    element_text = driver.find_element_by_xpath('//div[@ix-auto="value__vlan1043_Name"]').text
    assert element_text == 'vlan1043'


@then('Uncheck disable failover and click save Check confirm on the warning dialog and press OK')
def uncheck_disable_failover_and_click_save_check_confirm_on_the_warning_dialog_and_press_ok(driver):
    """Uncheck disable failover and click save Check confirm on the warning dialog and press OK."""
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Disable Failover"]').click()
    assert wait_on_element(driver, 0.5, 7, '//button[@ix-auto="button__SAVE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


@then('Logout and log back in')
def logout_and_log_back_in(driver):
    """Logout and log back in."""
    # make sure to scroll back up the mat-list-item
    element = driver.find_element_by_xpath('//span[contains(.,"root")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    wait_on_element(driver, 0.5, 5, '//button[@ix-auto="button__power"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__power"]').click()
    wait_on_element(driver, 0.5, 5, '//button[@ix-auto="option__Log Out"]')
    driver.find_element_by_xpath('//button[@ix-auto="option__Log Out"]').click()
    time.sleep(4)
    wait_on_element(driver, 1, 5, '//input[@placeholder="Username"]')
    driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys('root')
    driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys('abcd1234')
    wait_on_element(driver, 0.5, 30, '//button[@name="signin_button"]')
    driver.find_element_by_xpath('//button[@name="signin_button"]').click()


@then('You should be able to log in.')
def you_should_be_able_to_log_in(driver):
    """You should be able to log in."""
    wait_on_element(driver, 0.5, 30, '//span[contains(.,"System Information")]')
    driver.find_element_by_xpath('//span[contains(.,"System Information")]')


@then(parsers.parse('Verify both "{serial1}" and "{serial2}" controllers are on dashboard'))
def verify_both_controllers_are_on_dashboard(driver, serial1, serial2):
    """Verify both "{serial1}" and "{serial2}" controllers are on dashboard."""
    wait_on_element(driver, 1, 60, f'//span[contains(.,"{serial1}")]')
    driver.find_element_by_xpath(f'//span[contains(.,"{serial1}")]')
    wait_on_element(driver, 1, 90, f'//span[contains(.,"{serial2}")]')
    driver.find_element_by_xpath(f'//span[contains(.,"{serial2}")]')


@then('HA status icon should appear and it should reflect that HA is enabled when clicked')
def ha_status_icon_should_appear_and_it_should_reflect_that_ha_is_enabled_when_clicked(driver):
    """HA status icon should appear and it should reflect that HA is enabled when clicked."""
    wait_on_element(driver, 0.5, 5, '//button[@ix-auto="button__haStatus"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__haStatus"]').click()
    wait_on_element(driver, 0.5, 5, '//h1[contains(.,"HA Enabled)]')
    driver.find_element_by_xpath('//span[contains(.,"HA is enabled")]')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
