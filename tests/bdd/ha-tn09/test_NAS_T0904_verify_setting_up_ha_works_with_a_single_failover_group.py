# coding=utf-8
"""High Availability (tn09) feature tests."""

import time
from function import wait_on_element, wait_on_element_disappear
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T904.feature', 'Verify setting up HA works with a single failover group')
def test_verify_setting_up_ha_works_with_a_single_failover_group(driver):
    """Verify setting up HA works with a single failover group."""


@given(parsers.parse('The browser is open navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_url(driver, nas_url):
    """The browser is open navigate to "url"."""
    driver.get(f"{nas_url}ui/sessions/signin")
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


@then(parsers.parse('You should see the dashboard and serial number should show "{serial1}"'))
def you_should_see_the_dashboard_and_serial_number_should_show_serial1(driver, serial1):
    """You should see the dashboard and serial number should show "serial1"."""
    wait_on_element(driver, 0.5, 30, 'xpath', '//button[@ix-auto="button__CLOSE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    wait_on_element(driver, 0.5, 30, 'xpath', '//li[@ix-auto="option__Dashboard"]')
    driver.find_element_by_xpath('//li[@ix-auto="option__Dashboard"]')
    wait_on_element(driver, 1, 30, 'xpath', f'//span[contains(.,"{serial1}")]')
    driver.find_element_by_xpath(f'//span[contains(.,"{serial1}")]')


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
    # source the for later
    global serial_one, serial_two
    serial_one = serial1
    serial_two = serial2
    driver.find_element_by_xpath(f'//span[contains(.,"{serial1} / {serial2}")]')


@then('Navigate to Network click Global Configuration')
def navigate_to_network_click_global_configuration(driver):
    """Navigate to Network click Global Configuration."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Network"]').click()
    wait_on_element(driver, 0.5, 30, 'xpath', '//mat-list-item[@ix-auto="option__Global Configuration"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Global Configuration"]').click()


@then(parsers.parse('Enter Hostname "{host1}", Hostname (TrueNAS Controller 2) "{host2}", Hostname (Virtual) "{vhost}", Domain "{domain}", Nameserver1 "{nameserver1}", Nameserver2 "{nameserver2}", IPv4 Default Gateway "{gatway}"'))
def enter_hostname_hostname_truenas_controller_2_hostname_virtual_domain_nameserver1_nameserver2_ipv4_default_gateway_(driver, host1, host2, vhost, domain, nameserver1, nameserver2, gatway):
    """Enter Hostname "{host1}", Hostname (TrueNAS Controller 2) "{host2}", Hostname (Virtual) "{vhost}", Domain "{domain}", Nameserver1 "{nameserver1}", Nameserver2 "{nameserver2}", IPv4 Default Gateway "{gatway}"."""
    wait_on_element(driver, 0.5, 30, 'xpath', '//a[contains(.,"Global Configuration")]')
    driver.find_element_by_xpath('//input[@placeholder="Hostname"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Hostname"]').send_keys(host1)
    driver.find_element_by_xpath('//input[@placeholder="Hostname (TrueNAS Controller 2)"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Hostname (TrueNAS Controller 2)"]').send_keys(host2)
    driver.find_element_by_xpath('//input[@placeholder="Hostname (Virtual)"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Hostname (Virtual)"]').send_keys(vhost)
    driver.find_element_by_xpath('//input[@placeholder="Domain"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Domain"]').send_keys(domain)
    driver.find_element_by_xpath('//input[@placeholder="IPv4 Default Gateway"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="IPv4 Default Gateway"]').send_keys(gatway)
    driver.find_element_by_xpath('//input[@placeholder="Nameserver 1"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Nameserver 1"]').send_keys(nameserver1)
    driver.find_element_by_xpath('//input[@placeholder="Nameserver 2"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Nameserver 2"]').send_keys(nameserver2)


@then('click save when finished')
def click_save_when_finished(driver):
    """click save when finished."""
    wait_on_element(driver, 0.5, 30, 'xpath', '//button[@ix-auto="button__SAVE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


@then('"Please wait" should appear while settings are being applied You should be returned to the same Global Configuration screen and "Settings saved." should appear below the save button at the bottom')
def please_wait_should_appear_while_settings_are_being_applied_you_should_be_returned_to_the_same_global_configuration_screen_and_settings_saved_should_appear_below_the_save_button_at_the_bottom(driver):
    """"Please wait" should appear while settings are being applied You should be returned to the same Global Configuration screen and "Settings saved." should appear below the save button at the bottom."""
    wait_on_element(driver, 0.5, 30, 'xpath', '//h6[contains(.,"Please wait")]')
    wait_on_element(driver, 0.5, 30, 'xpath', '//div[contains(.,"Settings saved.")]')
    driver.find_element_by_xpath('//div[contains(.,"Settings saved.")]')


@then('Navigate to System click Failover, check disable failover, click save.')
def navigate_to_system_click_failover_click_disable_failover_click_save(driver):
    """Navigate to System click Failover, click disable failover, click save."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System"]').click()
    wait_on_element(driver, 0.5, 30, 'xpath', '//mat-list-item[@ix-auto="option__Failover"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Failover"]').click()
    wait_on_element(driver, 0.5, 30, 'xpath', '//h4[contains(.,"Failover Configuration")]')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Disable Failover"]').click()
    wait_on_element(driver, 0.5, 30, 'xpath', '//button[@ix-auto="button__SAVE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    wait_on_element(driver, 0.5, 30, 'xpath', '//h1[contains(.,"Disable Failover")]')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    driver.find_element_by_xpath('//button[@ix-auto="button__OK"]').click()


@then('After settings are applied you should see "Settings applied"')
def after_settings_are_applied_you_should_see_settings_applied(driver):
    """After settings are applied you should see "Settings applied"."""
    wait_on_element(driver, 0.5, 30, 'xpath', '//h1[contains(.,"Settings saved")]')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()


@then('Navigate to Network then Interfaces, click next to igb0, click edit')
def navigate_to_network_then_interfaces_click_next_to_igb0_click_edit(driver):
    """Navigate to Network then Interfaces, click next to igb0, click edit."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Network"]').click()
    wait_on_element(driver, 0.5, 30, 'xpath', '//mat-list-item[@ix-auto="option__Interfaces"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Interfaces"]').click()
    wait_on_element(driver, 0.5, 30, 'xpath', '//div[contains(.,"Interfaces")]')
    driver.find_element_by_xpath('//a[@ix-auto-type="expander"]').click()
    wait_on_element(driver, 0.5, 30, 'xpath', '//button[@ix-auto="button__EDIT_vtnet0_vtnet0"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__EDIT_vtnet0_vtnet0"]').click()


@then('Interface Settings should appear')
def interface_settings_should_appear(driver):
    """Interface Settings should appear."""
    wait_on_element(driver, 0.5, 30, 'xpath', '//h4[contains(.,"Interface Settings")]')
    driver.find_element_by_xpath('//h4[contains(.,"Interface Settings")]')


@then(parsers.parse('Uncheck DHCP, check Critical, Select 1 for Failover Group, enter the Failover VHID "{vhid}", IP Address (This Controller) "{ip1}", then select /"{netmask1}", IP Address (TrueNAS Controller 2) "{ip2}", then select /"{netmask2}", Virtual IP Address "{vip}"'))
def uncheck_dhcp_check_critical_select_1_for_failover_group_enter_the_failover_vhid_ip_address_this_controller__then_select_23_ip_address_truenas_controller_2_then_select_23_virtual_ip_address(driver, vhid, ip1, netmask1, ip2, netmask2, vip):
    """Uncheck DHCP, check Critical, Select 1 for Failover Group, enter the Failover VHID "{vhid}", IP Address (This Controller) "{ip1}" then select /"{netmask1}", IP Address (TrueNAS Controller 2) "{ip2}" then select /"{netmask2}", Virtual IP Address, "{vip}"."""
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__DHCP"]').click()
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Critical"]').click()
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Failover Group"]').click()
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Failover Group_1"]').click()
    driver.find_element_by_xpath('//input[@ix-auto="input__Failover VHID"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Failover VHID"]').send_keys(vhid)
    driver.find_element_by_xpath('//input[@ix-auto="input__IP Address (This Controller)"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__IP Address (This Controller)"]').send_keys(ip1)
    driver.find_element_by_xpath('//mat-select[@ix-auto="input__IP Address (This Controller)"]').click()
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__{netmask1}"]').click()
    driver.find_element_by_xpath('//input[@ix-auto="input__Failover IP Address (TrueNAS Controller 2)"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Failover IP Address (TrueNAS Controller 2)"]').send_keys(ip2)
    driver.find_element_by_xpath('//mat-select[@ix-auto="input__Failover IP Address (TrueNAS Controller 2)"]').click()
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__{netmask2}"]').click()
    driver.find_element_by_xpath('//input[@ix-auto="input__Virtual IP Address"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Virtual IP Address"]').send_keys(vip)


@then('Click Apply and "Please wait" should appear while settings are being applied.')
def click_apply_and_please_wait_should_appear_while_settings_are_being_applied(driver):
    """Click Apply and "Please wait" should appear while settings are being applied."""
    wait_on_element(driver, 0.5, 30, 'xpath', '//button[@ix-auto="button__APPLY"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__APPLY"]').click()
    wait_on_element(driver, 0.5, 30, 'xpath', '//h6[contains(.,"Please wait")]')


@then('Click Test Changes, check Confirm, Click Test Changes again')
def click_test_changes_check_confirm_click_test_changes_again(driver):
    """Click Test Changes, check Confirm, Click Test Changes again."""
    wait_on_element(driver, 0.5, 30, 'xpath', '//button[contains(.,"TEST CHANGES")]')
    driver.find_element_by_xpath('//button[contains(.,"TEST CHANGES")]').click()
    wait_on_element(driver, 0.5, 30, 'xpath', '//h1[contains(.,"Test Changes")]')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    driver.find_element_by_xpath('//button[@ix-auto="button__TEST CHANGES"]').click()


@then('Please wait should appear while settings are being applied')
def please_wait_should_appear_while_settings_are_being_applied(driver):
    """Please wait should appear while settings are being applied."""
    wait_on_element(driver, 0.5, 30, 'xpath', '//h6[contains(.,"Please wait")]')
    wait_on_element(driver, 0.5, 30, 'xpath', '//button[contains(.,"SAVE CHANGES")]')
    driver.find_element_by_xpath('//button[contains(.,"SAVE CHANGES")]').click()
    wait_on_element(driver, 0.5, 30, 'xpath', '//h1[contains(.,"Save Changes")]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    wait_on_element(driver, 0.5, 30, 'xpath', '//button[@ix-auto="button__CLOSE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()


@then('Navigate to Storage click Disks then click name several times to sort in alphabetical order')
def navigate_to_storage_click_disks_then_click_name_several_times_to_sort_in_alphabetical_order(driver):
    """Navigate to Storage click Disks then click name several times to sort in alphabetical order."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    wait_on_element(driver, 0.5, 30, 'xpath', '//mat-list-item[@ix-auto="option__Disks"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Disks"]').click()
    wait_on_element(driver, 0.5, 30, 'xpath', '//div[contains(.,"Disks")]')
    wait_on_element(driver, 0.5, 30, 'xpath', '//span[contains(.,"Name")]')
    # sort disk
    ada0 = ''
    while ada0 != 'ada0':
        driver.find_element_by_xpath('//span[contains(.,"Name")]').click()
        ada0 = driver.find_element_by_xpath('(//datatable-body-cell[2]/div/div)[1]').text


@then('The list of disks should appear in alphabetical order starting with ada0-ada1 (the boot devices) and da0-da15 the disks we will wipe in next step to create pools')
def the_list_of_disks_should_appear_in_alphabetical_order_starting_with_ada0_ada1_the_boot_devices_and_da0_da15_the_disks_we_will_wipe_in_next_step_to_create_pools(driver):
    """The list of disks should appear in alphabetical order starting with ada0-ada1 (the boot devices) and da0-da15 the disks we will wipe in next step to create pools."""
    # Verify disk are sorted
    disk_list = {1: 'ada0', 2: 'ada0'}
    add_num = 3
    for number in range(16):
        disk_list[add_num] = f'da{number}'
        add_num += 1
    for num in list(disk_list.keys()):
        disk = driver.find_element_by_xpath(f'(//datatable-body-cell[2]/div/div)[{num}]').text
        assert disk == disk_list[num]


@then('Starting with da0, click >, click wipe, check confirm, and click continue. Repeat steps for da1-da15 using the default quick wipe setting')
def starting_with_da0_click_arrow_click_wipe_check_confirm_and_click_continue_repeat_steps_for_da1_da15_using_the_default_quick_wipe_setting(driver):
    """Starting with da0, click >, click wipe, check confirm, and click continue. Repeat steps for da1-da15 using the default quick wipe setting."""
    for num in range(16):
        wait_on_element(driver, 0.5, 30, 'xpath', f'//a[@ix-auto="expander__da{num}"]')
        driver.find_element_by_xpath(f'//a[@ix-auto="expander__da{num}"]').click()
        driver.find_element_by_xpath(f'//button[@ix-auto="button__WIPE_da{num}_da{num}"]').click()
        wait_on_element(driver, 0.5, 30, 'xpath', f'//h1[contains(.,"Wipe Disk da{num}")]')
        driver.find_element_by_xpath('//button[@ix-auto="button__WIPE"]').click()
        wait_on_element(driver, 0.5, 30, 'xpath', f'//h1[contains(.,"Wipe Disk da{num}")]')
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
        driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()
        wait_on_element(driver, 1, 30, 'xpath', '//span[contains(.,"Disk Wiped successfully")]')
        driver.find_element_by_xpath('//button[contains(.,"CLOSE")]').click()


@then('Navigate to Storage click Pools, click Add, select Create new pool')
def navigate_to_storage_click_pools_click_add_select_create_new_pool(driver):
    """Navigate to Storage click Pools, click Add, select Create new pool."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    wait_on_element(driver, 0.5, 30, 'xpath', '//mat-list-item[@ix-auto="option__Pools"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Pools"]').click()
    wait_on_element(driver, 0.5, 30, 'xpath', '//div[contains(.,"Pools")]')
    driver.find_element_by_xpath('//button[@ix-auto="button___ADD"]').click()
    wait_on_element(driver, 0.5, 30, 'xpath', '//label[contains(.,"Create a pool:")]')
    driver.find_element_by_xpath('//mat-radio-button[@ix-auto="radio__is_new_Create new pool"]').click()


@then('Click create pool, enter tank for pool name, check the box next to da0, press under data vdev, click create, check confirm, click CREATE POOL')
def click_create_pool_enter_tank_for_pool_name_check_the_box_next_to_da0_press_under_data_vdev_click_create_check_confirm_click_create_pool(driver):
    """Click create pool, enter tank for pool name, check the box next to da0, press under data vdev, click create, check confirm, click CREATE POOL."""
    driver.find_element_by_xpath('//button[@ix-auto="button__CREATE POOL"]').click()
    wait_on_element(driver, 0.5, 30, 'xpath', '//div[contains(.,"Pool Manager")]')
    driver.find_element_by_xpath('//input[@placeholder="Name"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Name"]').send_keys('tank')
    driver.find_element_by_xpath('//mat-checkbox[@id="pool-manager__disks-table-checkall"]').click()
    wait_on_element(driver, 0.5, 30, 'xpath', '//button[@id="vdev__add-button"]')
    driver.find_element_by_xpath('//button[@id="vdev__add-button"]').click()
    wait_on_element(driver, 0.5, 30, 'xpath', '//button[@name="create-button"]')
    driver.find_element_by_xpath('//button[@name="create-button"]').click()
    wait_on_element(driver, 0.5, 30, 'xpath', '//h1[contains(.,"Warning")]')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    driver.find_element_by_xpath('//button[@ix-auto="button__CREATE POOL"]').click()


@then('Create Pool should appear while pool is being created. You should be returned to list of pools and tank should appear in the list.')
def create_pool_should_appear_while_pool_is_being_created_you_should_be_returned_to_list_of_pools_and_tank_should_appear_in_the_list(driver):
    """Create Pool should appear while pool is being created. You should be returned to list of pools and tank should appear in the list."""
    wait_on_element(driver, 0.2, 30, 'xpath', '//h1[contains(.,"Create Pool")]')
    driver.find_element_by_xpath('//h1[contains(.,"Create Pool")]')
    wait_on_element_disappear(driver, 1, 30, 'xpath', '//h1[contains(.,"Create Pool")]')
    wait_on_element(driver, 1, 30, 'xpath', '//mat-panel-title[contains(.,"tank")]')
    driver.find_element_by_xpath('//mat-panel-title[contains(.,"tank")]')
    driver.find_element_by_xpath('//td[@ix-auto="value__tank_name"]')


@then('Navigate to System then Failover, uncheck disable failover, click save.')
def navigate_to_system_then_failover_click_disable_failover_click_save(driver):
    """Navigate to System then Failover, uncheck disable failover, click save."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System"]').click()
    wait_on_element(driver, 0.5, 30, 'xpath', '//mat-list-item[@ix-auto="option__Failover"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Failover"]').click()
    wait_on_element(driver, 0.5, 30, 'xpath', '//h4[contains(.,"Failover Configuration")]')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Disable Failover"]').click()
    wait_on_element(driver, 0.5, 30, 'xpath', '//button[@ix-auto="button__SAVE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


@then('Navigate to dashboard, and verify that both controllers show.')
def navigate_to_dashboard_and_verify_that_both_controllers_show(driver):
    """Navigate to dashboard, and verify that both controllers show."""
    wait_on_element(driver, 0.5, 30, 'xpath', '//h4[contains(.,"Failover Configuration")]')
    element = driver.find_element_by_xpath('//span[contains(.,"root")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    wait_on_element(driver, 0.5, 30, 'xpath', '//span[contains(.,"System Information")]')
    driver.find_element_by_xpath('//span[contains(.,"System Information")]')
    # need to wait for all controller to be online.
    wait_on_element(driver, 1, 60, 'xpath', f'//span[contains(.,"{serial_one}")]')
    driver.find_element_by_xpath(f'//span[contains(.,"{serial_one}")]')
    wait_on_element(driver, 1, 90, 'xpath', f'//span[contains(.,"{serial_two}")]')
    driver.find_element_by_xpath(f'//span[contains(.,"{serial_two}")]')


@then('Both controllers should show model, and version on the dashboard.')
def both_controllers_should_show_model_and_version_on_the_dashboard(driver):
    """Both controllers should show model, and version on the dashboard."""
    version1 = driver.find_element_by_xpath('(//strong[contains(.,"Version:")])[1]/../div/span').text
    version2 = driver.find_element_by_xpath('(//strong[contains(.,"Version:")])[2]/../div/span').text
    assert version1 == version2
    license1 = driver.find_element_by_xpath('(//strong[contains(.,"Platform:")])[1]/..').text
    license2 = driver.find_element_by_xpath('(//strong[contains(.,"Platform:")])[2]/..').text
    assert license1 == license2
