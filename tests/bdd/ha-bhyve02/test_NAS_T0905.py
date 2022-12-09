# coding=utf-8
"""High Availability (tn-bhyve02) feature tests."""

import xpaths
import time
from function import (
    wait_on_element,
    wait_on_element_disappear,
    is_element_present,
    refresh_if_element_missing,
    get
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T905.feature', 'Verify setting up HA works with a single failover group')
def test_verify_setting_up_ha_works_with_a_single_failover_group(driver):
    """Verify setting up HA works with a single failover group."""


@given(parsers.parse('the browser is open navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url):
    """the browser is open navigate to "nas(url"."""
    if nas_url not in driver.current_url:
        driver.get(f"http://{nas_url}/ui/dashboard/")
        time.sleep(1)


@when(parsers.parse('login appear enter "root" and "{password}"'))
def login_appear_enter_root_and_password(driver, password):
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        """login appear enter "root" and "password"."""
        assert wait_on_element(driver, 7, xpaths.login.user_input)
        driver.find_element_by_xpath(xpaths.login.user_input).clear()
        driver.find_element_by_xpath(xpaths.login.user_input).send_keys('root')
        driver.find_element_by_xpath(xpaths.login.password_input).clear()
        driver.find_element_by_xpath(xpaths.login.password_input).send_keys(password)
        assert wait_on_element(driver, 7, xpaths.login.signin_button)
        driver.find_element_by_xpath(xpaths.login.signin_button).click()
    if not is_element_present(driver, '//li[contains(.,"Dashboard")]'):
        assert wait_on_element(driver, 10, '//span[contains(.,"root")]')
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@then(parsers.parse('you should see the dashboard and "{information}"'))
def you_should_see_the_dashboard_and_serial_number_should_show_serial1(driver, information, nas_url):
    """you should see the dashboard and "information"."""
    assert wait_on_element(driver, 7, '//a[text()="Dashboard"]')
    assert wait_on_element(driver, 7, f'//span[contains(.,"{information}")]')
    assert get(nas_url, 'system/ready/', ('root', 'testing')).json() is True
    assert get(nas_url.replace('nodea', 'nodeb'), 'system/ready/', ('root', 'testing')).json() is True


@then('navigate to System and click Support')
def navigate_to_system_and_click_support(driver):
    """navigate to System and click Support."""
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__System"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Reporting"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Support"]').click()


@then('the Support page License Information should load')
def the_support_page_license_information_should_load(driver):
    """the Support page License Information should load."""
    assert wait_on_element(driver, 7, '//p[contains(.,"License Information")]')


@then('click UPDATE LICENSE')
def click_update_license(driver):
    """click UPDATE LICENSE."""
    assert wait_on_element(driver, 7, '//button[@id="update-license-btn"]', 'clickable')
    driver.find_element_by_xpath('//button[@id="update-license-btn"]').click()


@then('the "Update License" widget should open')
def the_update_license_widget_should_open(driver):
    """the "Update License" widget should open."""
    assert wait_on_element(driver, 7, '//h1[contains(.,"Update License")]')


@then(parsers.parse('enter "{License}"'))
def enter_license(driver, License):
    """enter "license"."""
    driver.find_element_by_xpath('//textarea[@placeholder="License"]').clear()
    driver.find_element_by_xpath('//textarea[@placeholder="License"]').send_keys(License)


@then('click SAVE LICENSE')
def click_save_license(driver):
    """click SAVE LICENSE."""
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE LICENSE"]').click()


@then('the following should appear "Reload the page for the license to take effect"')
def the_following_should_appear_reload_the_page_for_the_license_to_take_effect(driver):
    """the following should appear "Reload the page for the license to take effect"."""
    assert wait_on_element_disappear(driver, 20, xpaths.popupTitle.please_wait)
    assert wait_on_element(driver, 7, '//h1[contains(.,"Reload the page")]')


@then('click reload now')
def click_reload_now(driver):
    """click reload now."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__RELOAD NOW"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__RELOAD NOW"]').click()


@then(parsers.parse('"{agreement}" should appear'))
def end_user_license_agreement_truenas_should_appear(driver, agreement):
    """"End User License Agreement - TrueNAS" should appear."""
    assert wait_on_element(driver, 15, f'//h1[contains(.,"{agreement}")]')


@then('click Agree')
def click_agree(driver):
    """click Agree."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__I AGREE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__I AGREE"]').click()
    if wait_on_element(driver, 2, xpaths.popupTitle.help):
        assert wait_on_element(driver, 10, '//button[@ix-auto="button__CLOSE"]')
        driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()


@then('we should be returned to license information')
def we_should_be_returned_to_license_information(driver):
    """we should be returned to license information."""
    if not is_element_present(driver, '//li[contains(.,"Dashboard")]'):
        assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__System"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System"]').click()
        assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Reporting"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Support"]').click()
    assert wait_on_element(driver, 7, '//p[contains(.,"License Information")]')


@then(parsers.parse('both serials show show under System Serial "{serial1}" and "{serial2}"'))
def both_serials_show_show_under_system_serial_serial1_and_serial2(driver, serial1, serial2):
    """both serials show show under System Serial "serial1" and "serial2"."""
    driver.find_element_by_xpath(f'//span[contains(.,"{serial1} / {serial2}")]')


@then('navigate to Network click Global Configuration')
def navigate_to_network_click_global_configuration(driver):
    """navigate to Network click Global Configuration."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Network"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Global Configuration"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Global Configuration"]').click()
    assert wait_on_element(driver, 7, '//a[contains(.,"Global Configuration")]')


@then(parsers.parse('enter Hostname (Virtual) "{vhost}" and Domain "{domain}"'))
def enter_hostname_virtual_and_domain(driver, vhost, domain):
    """enter Hostname (Virtual) "{vhost}" and Domain "{domain}"."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Hostname"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Hostname (Virtual)"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Hostname (Virtual)"]').send_keys(vhost)
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain"]').send_keys(domain)


@then(parsers.parse('enter Nameserver1 "{nameserver1}", Nameserver2 "{nameserver2}", Nameserver3 "{nameserver3}", IPv4 Default Gateway "{gatway}"'))
def enter_nameserver1_nameserver2_nameservere_ipv4_default_gateway(driver, nameserver1, nameserver2, nameserver3, gatway):
    """enter Nameserver1 "{nameserver1}", Nameserver2 "{nameserver2}", Nameserver3 "{nameserver3}", IPv4 Default Gateway "{gatway}"."""
    driver.find_element_by_xpath('//input[@ix-auto="input__Nameserver 1"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Nameserver 1"]').send_keys(nameserver1)
    driver.find_element_by_xpath('//input[@ix-auto="input__Nameserver 2"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Nameserver 2"]').send_keys(nameserver2)
    driver.find_element_by_xpath('//input[@ix-auto="input__Nameserver 3"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Nameserver 3"]').send_keys(nameserver3)
    driver.find_element_by_xpath('//input[@ix-auto="input__IPv4 Default Gateway"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__IPv4 Default Gateway"]').send_keys(gatway)


@then('click save when finished')
def click_save_when_finished(driver):
    """click save when finished."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


@then('"Please wait" should appear while settings are being applied You should be returned to the same Global Configuration screen and "Settings saved." should appear below the save button at the bottom')
def please_wait_should_appear_while_settings_are_being_applied_you_should_be_returned_to_the_same_global_configuration_screen_and_settings_saved_should_appear_below_the_save_button_at_the_bottom(driver):
    """"Please wait" should appear while settings are being applied You should be returned to the same Global Configuration screen and "Settings saved." should appear below the save button at the bottom."""
    assert wait_on_element_disappear(driver, 20, xpaths.popupTitle.please_wait)
    assert wait_on_element(driver, 7, '//div[contains(.,"Settings saved.")]')


@then('navigate to System then Failover, check disable failover, click save')
def navigate_to_system_click_failover_click_disable_failover_click_save(driver):
    """navigate to System click Failover, click disable failover, click save."""
    # scroll up the mat-list-item
    element = driver.find_element_by_xpath('//span[contains(.,"root")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__System"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Reporting"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Failover"]').click()
    assert wait_on_element(driver, 7, '//h4[contains(.,"Failover Configuration")]')
    time.sleep(0.5)
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Disable Failover"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Disable Failover"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element(driver, 7, '//h1[contains(.,"Disable Failover")]')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 7, '//h1[contains(.,"Disable Failover")]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__OK"]').click()
    assert wait_on_element_disappear(driver, 20, xpaths.popupTitle.please_wait)


@then('after settings are applied you should see "Settings applied"')
def after_settings_are_applied_you_should_see_settings_applied(driver):
    """after settings are applied you should see "Settings applied"."""
    assert wait_on_element(driver, 7, '//h1[contains(.,"Settings saved")]')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()


@then('navigate to Network then Interfaces, click next to vtnet0, click edit')
def navigate_to_network_then_interfaces_click_next_to_vtnet0_click_edit(driver):
    """navigate to Network then Interfaces, click next to vtnet0, click edit."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Network"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Interfaces"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Interfaces"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Interfaces")]')
    driver.find_element_by_xpath('//a[@ix-auto="expander__vtnet0"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__EDIT_vtnet0_vtnet0"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__EDIT_vtnet0_vtnet0"]').click()


@then('interface Settings should appear')
def interface_settings_should_appear(driver):
    """interface Settings should appear."""
    assert wait_on_element(driver, 7, '//h4[contains(.,"Interface Settings")]')


@then(parsers.parse('uncheck DHCP, check Critical, Select 1 for Failover Group, select the Failover VHID "{vhid}", IP Address (This Controller) "{ip1}" then select /"{netmask1}"'))
def uncheck_dhcp_check_critical_select_1_for_failover_group_select_the_failover_vhid_ip_address_this_controller_then_select_netmask(driver, vhid, ip1, netmask1):
    """uncheck DHCP, check Critical, Select 1 for Failover Group, select the Failover VHID "{vhid}", IP Address (This Controller) "{ip1}" then select /"{netmask1}"."""
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__DHCP"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__DHCP"]').click()
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Critical"]').click()
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Failover Group"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Failover Group_1"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Failover Group_1"]').click()
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Failover VHID"]')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Failover VHID"]').click()
    assert wait_on_element(driver, 5, f'//mat-option[@ix-auto="option__Failover VHID_{vhid}"]')
    # Scroll vhid in to view
    element = driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__Failover VHID_{vhid}"]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(1)
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__Failover VHID_{vhid}"]').click()
    driver.find_element_by_xpath('//input[@ix-auto="input__IP Address (This Controller)"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__IP Address (This Controller)"]').send_keys(ip1)
    driver.find_element_by_xpath('//mat-select[@ix-auto="input__IP Address (This Controller)"]').click()
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__{netmask1}"]').click()


@then(parsers.parse('enter IP Address (TrueNAS Controller 2) "{ip2}" then select /"{netmask2}", Virtual IP Address "{vip}"'))
def input_ip_address_truenas_controller_2_then_select_netmask_virtual_ip_address(driver, ip2, netmask2, vip):
    """enter IP Address (TrueNAS Controller 2) "{ip2}" then select /"{netmask2}", Virtual IP Address "{vip}"."""
    driver.find_element_by_xpath('//input[@ix-auto="input__IP Address (TrueNAS Controller 2)"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__IP Address (TrueNAS Controller 2)"]').send_keys(ip2)
    driver.find_element_by_xpath('//mat-select[@ix-auto="input__IP Address (TrueNAS Controller 2)"]').click()
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__{netmask2}"]').click()
    driver.find_element_by_xpath('//input[@ix-auto="input__Virtual IP Address (Failover Address)"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Virtual IP Address (Failover Address)"]').send_keys(vip)


@then('click Apply and "Please wait" should appear while settings are being applied')
def click_apply_and_please_wait_should_appear_while_settings_are_being_applied(driver):
    """click Apply and "Please wait" should appear while settings are being applied."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__APPLY"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__APPLY"]').click()
    assert wait_on_element_disappear(driver, 20, xpaths.popupTitle.please_wait)


@then('click Test Changes, check Confirm, click Test Changes again')
def click_test_changes_check_confirm_click_test_changes_again(driver):
    """click Test Changes, check Confirm, click Test Changes again."""
    assert wait_on_element(driver, 10, '//button[contains(.,"TEST CHANGES")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"TEST CHANGES")]').click()
    assert wait_on_element(driver, 7, '//h1[contains(.,"Test Changes")]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__TEST CHANGES"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__TEST CHANGES"]').click()
    assert wait_on_element_disappear(driver, 20, xpaths.popupTitle.please_wait)


@then(parsers.parse('switch to the virtual hostname "{virtual_hostname}" and login'))
def switch_to_the_virtual_hostname_virtual_hostname_and_login(driver, virtual_hostname, password):
    """switch to the virtual hostname "{virtual_hostname}" and login."""
    driver.get(f"http://{virtual_hostname}")
    time.sleep(1)
    """login appear enter "root" and "password"."""
    assert wait_on_element(driver, 7, xpaths.login.user_input)
    driver.find_element_by_xpath(xpaths.login.user_input).clear()
    driver.find_element_by_xpath(xpaths.login.user_input).send_keys('root')
    driver.find_element_by_xpath(xpaths.login.password_input).clear()
    driver.find_element_by_xpath(xpaths.login.password_input).send_keys(password)
    assert wait_on_element(driver, 7, xpaths.login.signin_button)
    driver.find_element_by_xpath(xpaths.login.signin_button).click()


@then('on the virtual hostname Dashboard Save the network interface changes')
def once_on_the_virtual_hostname_Dashboard_Save_the_network_interface_changes(driver, nas_url):
    """on the virtual hostname Dashboard Save the network interface changes."""
    assert wait_on_element(driver, 7, '//a[text()="Dashboard"]')
    assert wait_on_element(driver, 7, '//h1[text()="Save Changes"]')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__CLOSE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    assert get(nas_url, 'system/ready/', ('root', 'testing')).json() is True
    assert get(nas_url.replace('nodea', 'nodeb'), 'system/ready/', ('root', 'testing')).json() is True


@then('navigate to Storage click Disks then click name several times to sort in alphabetical order')
def navigate_to_storage_click_disks_then_click_name_several_times_to_sort_in_alphabetical_order(driver):
    """navigate to Storage click Disks then click name several times to sort in alphabetical order."""
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Disks"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Disks"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Disks")]')
    assert wait_on_element(driver, 7, '//span[contains(.,"Name")]', 'clickable')
    time.sleep(1)
    # sort disk
    ada0 = ''
    while ada0 != 'ada0':
        driver.find_element_by_xpath('//span[contains(.,"Name")]').click()
        ada0 = driver.find_element_by_xpath('(//datatable-body-cell[2]/div/div)[1]').text


@then('the list of disks should appear in alphabetical order starting with ada0 (the boot devices) and da0 to da1')
def the_list_of_disks_should_appear_in_alphabetical_order_starting_with_ada0_the_boot_devices_and_da0_to_da1(driver):
    """the list of disks should appear in alphabetical order starting with ada0 (the boot devices) and da0 to da1."""
    # Verify disk are sorted
    disk_list = {1: 'ada0', 2: 'da0', 3: 'da1'}
    for num in list(disk_list.keys()):
        disk = driver.find_element_by_xpath(f'(//datatable-body-cell[2]/div/div)[{num}]').text
        assert disk == disk_list[num]


@then('starting with da0, click >, click wipe, check confirm, and click continue. Repeat steps for da1 using the default quick wipe setting')
def starting_with_da0_click__click_wipe_check_confirm_and_click_continue_repeat_steps_for_da1_using_the_default_quick_wipe_setting(driver):
    """starting with da0, click >, click wipe, check confirm, and click continue. Repeat steps for da1 using the default quick wipe setting."""
    for num in range(2):
        if not is_element_present(driver, f'//button[@ix-auto="button__WIPE_da{num}_da{num}"]'):
            assert wait_on_element(driver, 7, f'//a[@ix-auto="expander__da{num}"]', 'clickable')
            driver.find_element_by_xpath(f'//a[@ix-auto="expander__da{num}"]').click()
        driver.find_element_by_xpath(f'//button[@ix-auto="button__WIPE_da{num}_da{num}"]').click()
        assert wait_on_element(driver, 7, f'//h1[contains(.,"Wipe Disk da{num}")]')
        driver.find_element_by_xpath('//button[@ix-auto="button__WIPE"]').click()
        assert wait_on_element(driver, 7, f'//h1[contains(.,"Wipe Disk da{num}")]')
        assert wait_on_element(driver, 10, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
        driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()
        assert wait_on_element(driver, 10, '//span[contains(.,"Disk Wiped successfully")]')
        assert wait_on_element(driver, 20, '//button[contains(.,"CLOSE")]', 'clickable')
        driver.find_element_by_xpath('//button[contains(.,"CLOSE")]').click()
        if wait_on_element(driver, 2, '//button[@ix-auto="button__EDIT_ada0_ada0"]', 'clickable'):
            assert wait_on_element(driver, 7, '//a[@ix-auto="expander__ada0"]', 'clickable')
            driver.find_element_by_xpath('//a[@ix-auto="expander__ada0"]').click()
        if is_element_present(driver, '//button[@ix-auto="button__WIPE_da0_da0"]'):
            assert wait_on_element(driver, 7, '//a[@ix-auto="expander__da0"]', 'clickable')
            driver.find_element_by_xpath('//a[@ix-auto="expander__da0"]').click()


@then('navigate to Storage click Pools, click Add, select Create new pool')
def navigate_to_storage_click_pools_click_add_select_create_new_pool(driver):
    """navigate to Storage click Pools, click Add, select Create new pool."""
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Pools"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Pools"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Pools")]')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button___ADD"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button___ADD"]').click()
    assert wait_on_element(driver, 7, '//label[contains(.,"Create a pool:")]')
    assert wait_on_element(driver, 7, '//mat-radio-button[@ix-auto="radio__is_new_Create new pool"]', 'clickable')
    driver.find_element_by_xpath('//mat-radio-button[@ix-auto="radio__is_new_Create new pool"]').click()


@then('click create pool, enter tank for pool name, check the box next to da0, press under data vdev, click create, check confirm, click CREATE POOL')
def click_create_pool_enter_tank_for_pool_name_check_the_box_next_to_da0_press_under_data_vdev_click_create_check_confirm_click_create_pool(driver, nas_url):
    """click create pool, enter tank for pool name, check the box next to da0, press under data vdev, click create, check confirm, click CREATE POOL."""
    assert get(nas_url, 'system/ready/', ('root', 'testing')).json() is True
    assert get(nas_url.replace('nodea', 'nodeb'), 'system/ready/', ('root', 'testing')).json() is True
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__CREATE POOL"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CREATE POOL"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Pool Manager")]')
    assert wait_on_element(driver, 7, '//input[@placeholder="Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@placeholder="Name"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Name"]').send_keys('tank')
    driver.find_element_by_xpath('//mat-checkbox[@id="pool-manager__disks-da0"]').click()
    assert wait_on_element(driver, 7, '//button[@id="vdev__add-button"]')
    driver.find_element_by_xpath('//button[@id="vdev__add-button"]').click()
    assert wait_on_element(driver, 5, '//mat-checkbox[@id="pool-manager__force-submit-checkbox"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@id="pool-manager__force-submit-checkbox"]').click()
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()
    assert wait_on_element(driver, 7, '//button[@name="create-button"]', 'clickable')
    driver.find_element_by_xpath('//button[@name="create-button"]').click()
    assert wait_on_element(driver, 7, '//h1[contains(.,"Warning")]')
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__CREATE POOL"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CREATE POOL"]').click()
    assert get(nas_url, 'system/ready/', ('root', 'testing')).json() is True
    assert get(nas_url.replace('nodea', 'nodeb'), 'system/ready/', ('root', 'testing')).json() is True


@then('create Pool should appear while pool is being created. You should be returned to list of pools and tank should appear in the list')
def create_pool_should_appear_while_pool_is_being_created_you_should_be_returned_to_list_of_pools_and_tank_should_appear_in_the_list(driver):
    """Create Pool should appear while pool is being created. You should be returned to list of pools and tank should appear in the list."""
    assert wait_on_element(driver, 7, '//h1[contains(.,"Create Pool")]')
    driver.find_element_by_xpath('//h1[contains(.,"Create Pool")]')
    assert wait_on_element_disappear(driver, 120, '//h1[contains(.,"Create Pool")]')
    assert wait_on_element(driver, 7, '//mat-panel-title[contains(.,"tank")]')
    driver.find_element_by_xpath('//td[@ix-auto="value__tank_name"]')


@then('navigate to System then Failover, uncheck disable failover, click save')
def navigate_to_system_then_failover_click_disable_failover_click_save(driver, nas_url):
    """navigate to System then Failover, uncheck disable failover, click save."""
    # scroll up the mat-list-item
    element = driver.find_element_by_xpath('//span[contains(.,"root")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__System"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Reporting"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Failover"]').click()
    assert wait_on_element(driver, 7, '//h4[contains(.,"Failover Configuration")]')
    assert get(nas_url, 'system/ready/', ('root', 'testing')).json() is True
    assert get(nas_url.replace('nodea', 'nodeb'), 'system/ready/', ('root', 'testing')).json() is True
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Disable Failover"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Disable Failover"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 20, xpaths.popupTitle.please_wait)


@then('navigate to dashboard, wait for HA to be online')
def navigate_to_dashboard_wait_for_ha_to_be_online(driver):
    """navigate to dashboard, wait for HA to be online."""
    assert wait_on_element(driver, 7, '//h4[contains(.,"Failover Configuration")]')
    # scroll up the mat-list-item
    element = driver.find_element_by_xpath('//span[contains(.,"root")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    assert wait_on_element(driver, 7, xpaths.dashboard.system_information)
    # need to wait for all controller to be online.
    assert wait_on_element(driver, 60, '//div[contains(.,"truenas")]')
    # refresh_if_element_missing need to be replace with wait_on_element when NAS-118299
    assert refresh_if_element_missing(driver, 300, '//div[contains(.,"truenas-b")]')
    assert wait_on_element(driver, 60, xpaths.topToolbar.ha_enable)
    time.sleep(5)


@then('navigate to Network and on the Network page click on Global Configuration Settings')
def navigate_to_network_and_on_the_network_page_click_on_global_configuration_settings(driver):
    """navigate to Network and on the Network page click on Global Configuration Settings."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Network"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Global Configuration"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Global Configuration"]').click()
    assert wait_on_element(driver, 7, '//a[contains(.,"Global Configuration")]')


@then(parsers.parse('enter Hostname "{host1}" and Hostname (TrueNAS Controller 2) "{host2}"'))
def enter_hostname_and_hostname_truenas_controller_2(driver, host1, host2):
    """enter Hostname "{host1}" and Hostname (TrueNAS Controller 2) "{host2}"."""
    assert wait_on_element(driver, 7, '//a[contains(.,"Global Configuration")]')
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Hostname"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Hostname"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Hostname"]').send_keys(host1)
    driver.find_element_by_xpath('//input[@ix-auto="input__Hostname (TrueNAS Controller 2)"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Hostname (TrueNAS Controller 2)"]').send_keys(host2)


@then('"Please wait" should appear while settings are being applied and You should be returned to Network page')
def please_wait_should_appear_while_settings_are_being_applied_and_you_should_be_returned_to_network_page(driver):
    """"Please wait" should appear while settings are being applied and You should be returned to Network page."""
    assert wait_on_element_disappear(driver, 20, xpaths.popupTitle.please_wait)
    assert wait_on_element(driver, 7, '//div[contains(.,"Settings saved.")]')
    time.sleep(2)


@then('navigate to dashboard, verify both controller hostname')
def navigate_to_dashboard_verify_both_controller_hostname(driver):
    """navigate to dashboard, verify both controller hostname."""
    # scroll up the mat-list-item
    element = driver.find_element_by_xpath('//span[contains(.,"root")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    assert wait_on_element(driver, 7, xpaths.dashboard.system_information)
    assert wait_on_element(driver, 20, xpaths.topToolbar.ha_enable)
    assert wait_on_element(driver, 20, '//div[contains(.,"tn-bhyve03-nodea")]')
    assert wait_on_element(driver, 20, '//div[contains(.,"tn-bhyve03-nodeb")]')


@then('both controllers should show version and license on the dashboard')
def both_controllers_should_show_model_and_version_on_the_dashboard(driver):
    """both controllers should show version and license on the dashboard."""
    version1 = driver.find_element_by_xpath('(//strong[contains(.,"Version:")])[1]/../div/span').text
    version2 = driver.find_element_by_xpath('(//strong[contains(.,"Version:")])[2]/../div/span').text
    assert version1 == version2
    license1 = driver.find_element_by_xpath('(//strong[contains(.,"License:")])[1]/..').text
    license2 = driver.find_element_by_xpath('(//strong[contains(.,"License:")])[2]/..').text
    assert license1 == license2
