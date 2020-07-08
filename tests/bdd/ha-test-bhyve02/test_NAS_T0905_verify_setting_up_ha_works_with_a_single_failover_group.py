# coding=utf-8
"""High Availability feature tests."""

import time
from function import wait_on_element
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T905.feature', 'Verify setting up HA works with a single failover group (tn-bhyve02)')
def test_verify_setting_up_ha_works_with_a_single_failover_group_tn_bhyve02(driver):
    """Verify setting up HA works with a single failover group (tn-bhyve02)."""


@given(parsers.parse('The browser is open navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_url(driver, nas_url):
    """The browser is open navigate to "url"."""
    driver.get(f"http://{nas_url}/ui/sessions/signin")
    time.sleep(5)


@when(parsers.parse('Login appear enter "root" and "{password}"'))
def login_appear_enter_root_and_password(driver, password):
    """Login appear enter "root" and "password"."""
    wait_on_element(driver, 0.5, 30, 'xpath', '//input[@placeholder="Username"]')
    driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys('root')
    driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys(password)
    wait_on_element(driver, 0.5, 30, 'xpath', '//button[@name="signin_button"]')
    driver.find_element_by_xpath('//button[@name="signin_button"]').click()


@then(parsers.parse('You should see the dashboard and "{information}"'))
def you_should_see_the_dashboard_and_serial_number_should_show_serial1(driver, information):
    """You should see the dashboard and "information"."""
    wait_on_element(driver, 0.5, 30, 'xpath', '//button[@ix-auto="button__CLOSE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    wait_on_element(driver, 0.5, 30, 'xpath', '//li[@ix-auto="option__Dashboard"]')
    driver.find_element_by_xpath('//li[@ix-auto="option__Dashboard"]')
    wait_on_element(driver, 1, 30, 'xpath', f'//span[contains(.,"{information}")]')
    driver.find_element_by_xpath(f'//span[contains(.,"{information}")]')


@then('Navigate to System and click Support')
def navigate_to_system_and_click_support(driver):
    """Navigate to System and click Support."""
    driver.find_element_by_xpath('//a[@name="System-menu"]').click()
    wait_on_element(driver, 0.5, 30, 'xpath', '//a[contains(.,"Support")]')
    driver.find_element_by_xpath('//a[contains(.,"Support")]').click()


@then('The Support page License Information should load')
def the_support_page_license_information_should_load(driver):
    """The Support page License Information should load."""
    wait_on_element(driver, 0.5, 30, 'xpath', '//p[contains(.,"License Information")]')
    driver.find_element_by_xpath('//p[contains(.,"License Information")]')


@then('Click UPDATE LICENSE')
def click_update_license(driver):
    """Click UPDATE LICENSE."""
    driver.find_element_by_xpath('//button[@id="update-license-btn"]').click()


@then('The "Update License" widget should open')
def the_update_license_widget_should_open(driver):
    """The "Update License" widget should open."""
    wait_on_element(driver, 0.5, 30, 'xpath', '//h1[contains(.,"Update License")]')
    driver.find_element_by_xpath('//h1[contains(.,"Update License")]')


@then(parsers.parse('Enter "{License}"'))
def enter_license(driver, License):
    """Enter "license"."""
    driver.find_element_by_xpath('//textarea[@placeholder="License"]').clear()
    driver.find_element_by_xpath('//textarea[@placeholder="License"]').send_keys(License)


@then('Click SAVE LICENSE')
def click_save_license(driver):
    """Click SAVE LICENSE."""
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE LICENSE"]').click()


@then('The following should appear "Reload the page for the license to take effect"')
def the_following_should_appear_reload_the_page_for_the_license_to_take_effect(driver):
    """The following should appear "Reload the page for the license to take effect"."""
    wait_on_element(driver, 0.5, 30, 'xpath', '//h1[contains(.,"Reload the page")]')
    driver.find_element_by_xpath('//h1[contains(.,"Reload the page")]')


@then('Click reload now')
def click_reload_now(driver):
    """Click reload now."""
    driver.find_element_by_xpath('//button[@ix-auto="button__RELOAD NOW"]').click()


@then('We should return to login prompt')
def we_should_return_to_login_prompt(driver):
    """We should return to login prompt."""
    wait_on_element(driver, 0.5, 30, 'xpath', '//input[@placeholder="Username"]')
    driver.find_element_by_xpath('//input[@placeholder="Username"]')


@then(parsers.parse('Login as "root" with "{password}"'))
def login_as_root_with_password(driver, password):
    """Login as "root" with "password"."""
    driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys('root')
    driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys(password)
    wait_on_element(driver, 0.5, 30, 'xpath', '//button[@name="signin_button"]')
    driver.find_element_by_xpath('//button[@name="signin_button"]').click()


@then(parsers.parse('"{agreement}" should appear'))
def end_user_license_agreement_truenas_should_appear(driver, agreement):
    """"End User License Agreement - TrueNAS" should appear."""
    wait_on_element(driver, 0.5, 30, 'xpath', f'//h1[contains(.,"{agreement}")]')
    driver.find_element_by_xpath(f'//h1[contains(.,"{agreement}")]')


@then('Click Agree')
def click_agree(driver):
    """Click Agree."""
    wait_on_element(driver, 0.5, 30, 'xpath', '//button[@ix-auto="button__I AGREE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__I AGREE"]').click()


@then('We should be returned to license information')
def we_should_be_returned_to_license_information(driver):
    """We should be returned to license information."""
    wait_on_element(driver, 0.5, 30, 'xpath', '//p[contains(.,"License Information")]')
    driver.find_element_by_xpath('//p[contains(.,"License Information")]')


@then(parsers.parse('both serials show show under System Serial "{serial1}" and "{serial2}"'))
def both_serials_show_show_under_system_serial_serial1_and_serial2(driver, serial1, serial2):
    """both serials show show under System Serial "serial1" and "serial2"."""
    driver.find_element_by_xpath(f'//span[contains(.,"{serial1} / {serial2}")]')


@then('Navigate to Network click Global Configuration')
def navigate_to_network_click_global_configuration(driver):
    """Navigate to Network click Global Configuration."""


@then(parsers.parse('Enter Hostname "{host1}", Hostname (TrueNAS Controller 2) "{host2}", Hostname (Virtual) "{vhost}", Domain "{domain}", Nameserver1 "{nameserver1}", Nameserver2 "{nameserver2}", IPv4 Default Gateway "{gatway}"'))
def enter_hostname_hostname_truenas_controller_2_hostname_virtual_domain_nameserver1_nameserver2_ipv4_default_gateway_(driver, host1, host2, vhost, domain, nameserver1, nameserver2, gatway):
    """Enter Hostname "{host1}", Hostname (TrueNAS Controller 2) "{host2}", Hostname (Virtual) "{vhost}", Domain "{domain}", Nameserver1 "{nameserver1}", Nameserver2 "{nameserver2}", IPv4 Default Gateway "{gatway}"."""


@then('click save when finished')
def click_save_when_finished(driver):
    """click save when finished."""


@then('"Please wait" should appear while settings are being applied You should be returned to the same Global Configuration screen and "Settings saved." should appear below the save button at the bottom')
def please_wait_should_appear_while_settings_are_being_applied_you_should_be_returned_to_the_same_global_configuration_screen_and_settings_saved_should_appear_below_the_save_button_at_the_bottom(driver):
    """"Please wait" should appear while settings are being applied You should be returned to the same Global Configuration screen and "Settings saved." should appear below the save button at the bottom."""


@then('Navigate to System then Failover, check disable failover, click save.')
def navigate_to_system_click_failover_click_disable_failover_click_save(driver):
    """Navigate to System click Failover, click disable failover, click save."""


@then('After settings are applied you should see "Settings applied"')
def after_settings_are_applied_you_should_see_settings_applied(driver):
    """After settings are applied you should see "Settings applied"."""


@then('Navigate to Network then Interfaces, click next to igb0, click edit')
def navigate_to_network_then_interfaces_click_next_to_igb0_click_edit(driver):
    """Navigate to Network then Interfaces, click next to igb0, click edit."""


@then('Interface Settings should appear')
def interface_settings_should_appear(driver):
    """Interface Settings should appear."""


@then(parsers.parse('Uncheck DHCP, check Critical, Select 1 for Failover Group, enter the Failover VHID "{vhid}", IP Address (This Controller) "{ip1}" then select /"{netmask1}", IP Address (TrueNAS Controller 2) "{ip2}" then select /"{netmask2}", Virtual IP Address, "{vip}"'))
def uncheck_dhcp_check_critical_select_1_for_failover_group_enter_the_failover_vhid_ip_address_this_controller__then_select_23_ip_address_truenas_controller_2_then_select_23_virtual_ip_address(driver, vhid, ip1, netmask1, ip2, netmask2, vip):
    """Uncheck DHCP, check Critical, Select 1 for Failover Group, enter the Failover VHID "{vhid}", IP Address (This Controller) "{ip1}" then select /"{netmask1}", IP Address (TrueNAS Controller 2) "{ip2}" then select /"{netmask2}", Virtual IP Address, "{vip}"."""


@then('Click Apply and "Please wait" should appear while settings are being applied.')
def click_apply_and_please_wait_should_appear_while_settings_are_being_applied(driver):
    """Click Apply and "Please wait" should appear while settings are being applied."""


@then('Click Test Changes, check Confirm, Click Test Changes again')
def click_test_changes_check_confirm_click_test_changes_again(driver):
    """Click Test Changes, check Confirm, Click Test Changes again."""


@then('Please wait should appear while settings are being applied')
def please_wait_should_appear_while_settings_are_being_applied(driver):
    """Please wait should appear while settings are being applied."""


@then('Navigate to Storage click Disks then click name several times to sort in alphabetical order')
def navigate_to_storage_click_disks_then_click_name_several_times_to_sort_in_alphabetical_order(driver):
    """Navigate to Storage click Disks then click name several times to sort in alphabetical order."""


@then('The list of disks should appear in alphabetical order starting with ada0-ada1 (the boot devices) and da0-da15 the disks we will wipe in next step to create pools')
def the_list_of_disks_should_appear_in_alphabetical_order_starting_with_ada0ada1_the_boot_devices_and_da0da15_the_disks_we_will_wipe_in_next_step_to_create_pools(driver):
    """The list of disks should appear in alphabetical order starting with ada0-ada1 (the boot devices) and da0-da15 the disks we will wipe in next step to create pools."""


@then('Starting with da0, click >, click wipe, check confirm, and click continue. Repeat steps for da1-da15 using the default quick wipe setting')
def starting_with_da0_click__click_wipe_check_confirm_and_click_continue_repeat_steps_for_da1da15_using_the_default_quick_wipe_setting(driver):
    """Starting with da0, click >, click wipe, check confirm, and click continue. Repeat steps for da1-da15 using the default quick wipe setting."""


@then('Navigate to Storage click Pools, click Add, select Create new pool')
def navigate_to_storage_click_pools_click_add_select_create_new_pool(driver):
    """Navigate to Storage click Pools, click Add, select Create new pool."""


@then('click create pool, enter tank for pool name, check the box next to da0, press under data vdev, click create, check confirm, click CREATE POOL')
def click_create_pool_enter_tank_for_pool_name_check_the_box_next_to_da0_press_under_data_vdev_click_create_check_confirm_click_create_pool(driver):
    """click create pool, enter tank for pool name, check the box next to da0, press under data vdev, click create, check confirm, click CREATE POOL."""


@then('Create Pool should appear while pool is being created. You should be returned to list of pools and tank should appear in the list.')
def create_pool_should_appear_while_pool_is_being_created_you_should_be_returned_to_list_of_pools_and_tank_should_appear_in_the_list(driver):
    """Create Pool should appear while pool is being created. You should be returned to list of pools and tank should appear in the list."""


@then('Navigate to System then Failover, uncheck disable failover, click save.')
def navigate_to_system_then_failover_click_disable_failover_click_save(driver):
    """Navigate to System then Failover, uncheck disable failover, click save."""


@then('Navigate to dashboard, and verify that both controllers show.')
def navigate_to_dashboard_and_verify_that_both_controllers_show(driver):
    """Navigate to dashboard, and verify that both controllers show."""


@then('Both controllers should show model, and version on the dashboard.')
def both_controllers_should_show_model_and_version_on_the_dashboard(driver):
    """Both controllers should show model, and version on the dashboard."""
