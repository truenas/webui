# coding=utf-8
"""High Availability (tn-bhyve01) feature tests."""

import time
from function import (
    wait_on_element,
    wait_on_element_disappear,
    is_element_present
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T946.feature', 'Verify setting up HA works with a single failover group')
def test_verify_setting_up_ha_works_with_a_single_failover_group(driver):
    """Verify setting up HA works with a single failover group."""


@given(parsers.parse('the browser is open navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url):
    """the browser is open navigate to "nas(url"."""
    if nas_url not in driver.current_url:
        driver.get(f"http://{nas_url}/ui/sessions/signin")
        time.sleep(2)


@when(parsers.parse('login appear enter "root" and "{password}"'))
def login_appear_enter_root_and_password(driver, password):
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        """login appear enter "root" and "password"."""
        assert wait_on_element(driver, 0.5, 7, '//input[@data-placeholder="Username"]')
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').send_keys('root')
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').send_keys(password)
        assert wait_on_element(driver, 0.5, 7, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@then(parsers.parse('you should see the dashboard and "{information}"'))
def you_should_see_the_dashboard_and_information(driver, information):
    """you should see the dashboard and "information"."""
    assert wait_on_element(driver, 1, 10, f'//span[contains(.,"{information}")]')


@then('navigate to System Settings and click General')
def navigate_to_system_settings_and_click_general(driver):
    """navigate to System Settings and click General."""
    assert wait_on_element(driver, 0.5, 7, '//mat-list-item[@ix-auto="option__System Settings"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System Settings"]').click()
    assert wait_on_element(driver, 0.5, 7, '//mat-list-item[@ix-auto="option__General"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__General"]').click()


@then('the General page should load')
def the_support_page_license_information_should_load(driver):
    """the Support page License Information should load."""
    assert wait_on_element(driver, 0.5, 7, '//h1[contains(.,"General")]')


@then('under Support click Enter License')
def under_support_click_enter_license(driver):
    """under Support click Enter License."""
    assert wait_on_element(driver, 0.5, 7, '//h3[contains(.,"Support")]')
    assert wait_on_element(driver, 0.5, 7, '//button[@id="update-license-btn"]')
    driver.find_element_by_xpath('//button[@id="update-license-btn"]').click()


@then('the "License" widget should open')
def the_license_widget_should_open(driver):
    """the "License" widget should open."""
    assert wait_on_element(driver, 0.5, 7, '//h3[contains(.,"License")]')


@then(parsers.parse('enter "{License}"'))
def enter_license(driver, License):
    """enter "License"."""
    driver.find_element_by_xpath('//textarea').clear()
    driver.find_element_by_xpath('//textarea').send_keys(License)


@then('click Save')
def click_save(driver):
    """click Save."""
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


@then('The following should appear "Reload the page for the license to take effect"')
def the_following_should_appear_reload_the_page_for_the_license_to_take_effect(driver):
    """The following should appear "Reload the page for the license to take effect"."""
    assert wait_on_element_disappear(driver, 1, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 1, 7, '//h1[contains(.,"Reload the page")]')


@then('Click reload now')
def click_reload_now(driver):
    """Click reload now."""
    assert wait_on_element(driver, 1, 7, '//button[@ix-auto="button__RELOAD NOW"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__RELOAD NOW"]').click()


@then(parsers.parse('"{agreement}" should appear'))
def end_user_license_agreement_truenas_should_appear(driver, agreement):
    """"End User License Agreement - TrueNAS" should appear."""
    assert wait_on_element(driver, 1, 10, f'//h1[contains(.,"{agreement}")]')


@then('Click Agree')
def click_agree(driver):
    """Click Agree."""
    assert wait_on_element(driver, 1, 7, '//button[@ix-auto="button__I AGREE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__I AGREE"]').click()


@then('we should be returned to the General page')
def we_should_be_returned_to_license_information(driver):
    """we should be returned to the General page."""
    assert wait_on_element(driver, 0.5, 7, '//h1[contains(.,"General")]')


@then(parsers.parse('both serials should show under System Serial "{serial1}" and "{serial2}"'))
def both_serials_should_show_under_system_serial_serial1_and_serial2(driver, serial1, serial2):
    """both serials should show under System Serial "serial1" and "serial2"."""
    # driver.find_element_by_xpath(f'//span[contains(.,"{serial1} / {serial2}")]')


@then('navigate to Network and on the Network page click on Global Configuration Settings')
def navigate_to_network_and_on_the_network_page_click_on_global_configuration_settings(driver):
    """navigate to Network and on the Network page click on Global Configuration Settings."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Network"]').click()
    assert wait_on_element(driver, 0.5, 7, '//h1[contains(.,"Network")]')
    assert wait_on_element(driver, 0.5, 7, '//button[contains(.,"Settings")]')
    driver.find_element_by_xpath('//button[contains(.,"Settings")]').click()
    assert wait_on_element(driver, 1, 7, '//h3[contains(.,"Global Configuration")]')


@then(parsers.parse('enter Hostname (Virtual) "{vhost}", IPv4 Default Gateway "{gatway}"'))
def enter_hostname_Virtual_ipv4_default_gateway_(driver, vhost, gatway):
    """enter Hostname (Virtual) "vhost", IPv4 Default Gateway "{gatway}"."""
    driver.find_element_by_xpath('//input[@ix-auto="input__Hostname (Virtual)"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Hostname (Virtual)"]').send_keys(vhost)
    driver.find_element_by_xpath('//input[@ix-auto="input__IPv4 Default Gateway"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__IPv4 Default Gateway"]').send_keys(gatway)


@then('click save when finished')
def click_save_when_finished(driver):
    """click save when finished."""
    assert wait_on_element(driver, 0.5, 7, '//button[@ix-auto="button__SAVE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


@then('"Please wait" should appear while settings are being applied and You should be returned to Network page')
def please_wait_should_appear_while_settings_are_being_applied_you_should_be_returned_to_network_page(driver):
    """"Please wait" should appear while settings are being applied and You should be returned to Network page."""
    assert wait_on_element_disappear(driver, 1, 15, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 0.5, 7, '//h1[contains(.,"Network")]')


@then('navigate to System then click Misc')
def navigate_to_system_click_failover_click_disable_failover_click_save(driver):
    """navigate to System then click Misc"""
    assert wait_on_element(driver, 0.5, 7, '//mat-list-item[@ix-auto="option__System Settings"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System Settings"]').click()
    assert wait_on_element(driver, 0.5, 7, '//mat-list-item[@ix-auto="option__Misc"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Misc"]').click()


@then('the Miscellaneous page should open')
def the_miscellaneous_page_should_open(driver):
    """the Miscellaneous page should open."""
    assert wait_on_element(driver, 0.5, 7, '//h1[contains(.,"Miscellaneous")]')


@then('click Failover, check disable failover, click save and confirm changes')
def click_Failover_check_disable_failover_click_save_and_confirm_changes(driver):
    """click Failover, check disable failover, click save and confirm changes."""
    assert wait_on_element(driver, 0.5, 7, '//li[contains(.,"Failover")]')
    driver.find_element_by_xpath('//li[contains(.,"Failover")]').click()
    assert wait_on_element(driver, 0.5, 7, '//h1[contains(.,"Failover")]')
    element = driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Disable Failover"]')
    global class_attribute
    class_attribute = element.get_attribute('class')
    if 'mat-checkbox-checked' not in class_attribute:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Disable Failover"]').click()
        assert wait_on_element(driver, 0.5, 7, '//button[@ix-auto="button__SAVE"]')
        driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
        assert wait_on_element(driver, 0.5, 7, '//h1[contains(.,"Disable Failover")]')
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
        driver.find_element_by_xpath('//button[@ix-auto="button__OK"]').click()
    else:
        assert wait_on_element(driver, 0.5, 7, '//button[@ix-auto="button__SAVE"]')
        driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


@then('after settings are applied you should see "Settings applied"')
def after_settings_are_applied_you_should_see_settings_applied(driver):
    """after settings are applied you should see "Settings applied"."""
    assert wait_on_element(driver, 0.5, 15, '//h1[contains(.,"Settings saved")]')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()


@then('navigate to Network then under Interfaces click enp0s6f0')
def navigate_to_network_then_under_interfacesclick_enp0s6f0(driver):
    """navigate to Network then under Interfaces click enp0s6f0."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Network"]').click()
    assert wait_on_element(driver, 0.5, 7, '//h1[contains(.,"Network")]')
    assert wait_on_element(driver, 0.5, 7, '//h3[contains(.,"Interfaces")]')
    assert wait_on_element(driver, 0.5, 7, '//td[contains(.,"enp0s6f0")]')
    driver.find_element_by_xpath('//td[contains(.,"enp0s6f0")]').click()


@then('the Edit Interface should appear')
def the_edit_interface_should_appear(driver):
    """the Edit Interface should appear."""
    assert wait_on_element(driver, 1, 7, '//h3[contains(.,"Edit Interface")]')


@then(parsers.parse('uncheck DHCP, check Critical, Select 1 for Failover Group, input IP Address (This Controller) "{ip1}" then select /"{netmask1}", IP Address (TrueNAS Controller 2) "{ip2}", Virtual IP Address "{vip}"'))
def uncheck_dhcp_check_critical_select_1_for_failover_group_input_ip_address_this_controller__then_select_23_ip_address_truenas_controller_2_virtual_ip_address(driver, ip1, netmask1, ip2, vip):
    """uncheck DHCP, check Critical, Select 1 for Failover Group, input IP Address (This Controller) "{ip1}" then select /"{netmask1}", IP Address (TrueNAS Controller 2) "{ip2}", Virtual IP Address, "{vip}"."""
    assert wait_on_element(driver, 1, 7, '//mat-checkbox[@ix-auto="checkbox__DHCP"]')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__DHCP"]').click()
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Critical"]').click()
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Failover Group"]').click()
    assert wait_on_element(driver, 1, 5, '//mat-option[@ix-auto="option__Failover Group_1"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Failover Group_1"]').click()
    assert wait_on_element(driver, 1, 5, '//mat-select[@ix-auto="select__Failover VHID"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__IP Address (This Controller)"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__IP Address (This Controller)"]').send_keys(ip1)
    driver.find_element_by_xpath('//mat-select[@ix-auto="input__IP Address (This Controller)"]').click()
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__{netmask1}"]').click()
    driver.find_element_by_xpath('//input[@ix-auto="input__IP Address (TrueNAS Controller 2)"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__IP Address (TrueNAS Controller 2)"]').send_keys(ip2)
    driver.find_element_by_xpath('//input[@ix-auto="input__Virtual IP Address (Failover Address)"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Virtual IP Address (Failover Address)"]').send_keys(vip)


@then('click Apply and "Please wait" should appear while settings are being applied.')
def click_apply_and_please_wait_should_appear_while_settings_are_being_applied(driver):
    """click Apply and "Please wait" should appear while settings are being applied."""
    assert wait_on_element(driver, 0.5, 7, '//button[@ix-auto="button__APPLY"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__APPLY"]').click()
    assert wait_on_element_disappear(driver, 1, 20, '//h6[contains(.,"Please wait")]')


@then('click Test Changes, check Confirm, click Test Changes again')
def click_test_changes_check_confirm_click_test_changes_again(driver):
    """click Test Changes, check Confirm, click Test Changes again."""
    assert wait_on_element(driver, 1, 7, '//button[contains(.,"Test Changes")]')
    driver.find_element_by_xpath('//button[contains(.,"Test Changes")]').click()
    assert wait_on_element(driver, 1, 7, '//h1[contains(.,"Test Changes")]')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    driver.find_element_by_xpath('//button[@ix-auto="button__TEST CHANGES"]').click()


@then('Please wait should appear wait for Save Changes then click Save Changes')
def please_wait_should_appear_wait_for_save_changes_then_click_save_changes(driver):
    """Please wait should appear wait for Save Changes then click Save Changes."""
    assert wait_on_element_disappear(driver, 1, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 1, 7, '//button[contains(.,"Save Changes")]')
    driver.find_element_by_xpath('//button[contains(.,"Save Changes")]').click()
    assert wait_on_element(driver, 0.5, 7, '//h1[contains(.,"Save Changes")]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element(driver, 0.5, 7, '//button[@ix-auto="button__CLOSE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()


@then('navigate to Storage then click the gear icon and click Disks then click Name to sort in ascending order')
def navigate_to_storage_then_click_the_great_icon_to_disks_then_click_name_to_sort_in_ascending_order(driver):
    """navigate to Storage then click the gear icon and click Disks then click Name to sort in ascending order."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 1, 7, '//h1[contains(.,"Storage")]')
    assert wait_on_element(driver, 0.5, 7, '//button[@ix-auto="button__STORAGE_ACTIONS"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__STORAGE_ACTIONS"]').click()
    assert wait_on_element(driver, 0.5, 7, '//button[@ix-auto="button__STORAGE_DISKS"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__STORAGE_DISKS"]').click()
    assert wait_on_element(driver, 1, 7, '//h1[contains(.,"Disks")]')
    # sort disk was removed, probably need to rewrite the step
    # disk = ''
    # while disk != 'sda':
    #     driver.find_element_by_xpath('//span[contains(.,"Name")]').click()
    #     disk = driver.find_element_by_xpath('(//datatable-body-cell[2]/div/div)[1]').text


@then('the list of disks should appear in ascending order starting with sda')
def the_list_of_disks_should_appear_in_ascending_order_starting_with_sda(driver):
    """the list of disks should appear in ascending order starting with sda."""
    # Verify disk are sorted
    disk_list = {1: 'sda', 3: 'sdb', 5: 'sdc'}
    for num in list(disk_list.keys()):
        disk = driver.find_element_by_xpath(f'//table/tbody/tr[{num}]/td[2]').text
        assert disk == disk_list[num]


@then('starting with sda, click >, click wipe, check confirm, and click continue. Repeat steps for sdb')
def starting_with_sda_click__click_wipe_check_confirm_and_click_continue_repeat_steps_for_sdb(driver):
    """starting with sda, click >, click wipe, check confirm, and click continue. Repeat steps for sdb."""
    disk_list = ['sda', 'sdb']
    for disk in disk_list:
        assert wait_on_element(driver, 0.5, 7, f'//tr[@ix-auto="expander__{disk}"]/td[2]')
        driver.find_element_by_xpath(f'//tr[@ix-auto="expander__{disk}"]/td[2]').click()
        assert wait_on_element(driver, 0.5, 7, f'//button[@ix-auto="button__WIPE_{disk}_{disk}"]')
        driver.find_element_by_xpath(f'//button[@ix-auto="button__WIPE_{disk}_{disk}"]').click()
        assert wait_on_element(driver, 0.5, 7, f'//h1[contains(.,"Wipe Disk {disk}")]')
        driver.find_element_by_xpath('//button[@ix-auto="button__WIPE"]').click()
        assert wait_on_element(driver, 0.5, 7, f'//h1[contains(.,"Wipe Disk {disk}")]')
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
        driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()
        assert wait_on_element(driver, 1, 7, '//span[contains(.,"Disk Wiped successfully")]')
        driver.find_element_by_xpath('//button[contains(.,"CLOSE")]').click()


@then('navigate to Storage click Create')
def navigate_to_storage_click_create(driver):
    """navigate to Storage click Create"""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 1, 7, '//h1[contains(.,"Storage")]')
    assert wait_on_element(driver, 0.5, 7, '//button[@ix-auto="button___POOL_CREATE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button___POOL_CREATE"]').click()


@then(parsers.parse('enter tank for pool name, check the box next to "{disk}", click the arrow pointing to Data Vdevs, click Create, check confirm, click CREATE POOL'))
def enter_tank_for_pool_name_check_the_box_next_to_sda_press_under_data_vdev_click_create_check_confirm_click_create_pool(driver, disk):
    """enter tank for pool name, check the box next to sda, click the arrow pointing to Data Vdevs, click Create, check confirm, click CREATE POOL."""
    assert wait_on_element(driver, 1, 7, '//h1[contains(.,"Create Pool")]')
    assert wait_on_element(driver, 0.5, 7, '//div[contains(.,"Pool Manager")]')
    driver.find_element_by_xpath('//input[@id="pool-manager__name-input-field"]').clear()
    driver.find_element_by_xpath('//input[@id="pool-manager__name-input-field"]').send_keys('tank')
    driver.find_element_by_xpath(f'//mat-checkbox[@id="pool-manager__disks-{disk}"]').click()
    assert wait_on_element(driver, 0.5, 7, '//button[@id="vdev__add-button"]')
    driver.find_element_by_xpath('//button[@id="vdev__add-button"]').click()
    assert wait_on_element(driver, 0.5, 7, '//button[@name="create-button"]')
    driver.find_element_by_xpath('//button[@name="create-button"]').click()
    assert wait_on_element(driver, 0.5, 7, '//h1[contains(.,"Warning")]')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    driver.find_element_by_xpath('//button[@ix-auto="button__CREATE POOL"]').click()


@then('Create Pool should appear while pool is being created. You should be returned to the Storage page')
def create_pool_should_appear_while_pool_is_being_created_you_should_be_returned_to_the_storage_page(driver):
    """Create Pool should appear while pool is being created. You should be returned to the Storage page."""
    assert wait_on_element(driver, 0.2, 7, '//h1[contains(.,"Create Pool")]')
    driver.find_element_by_xpath('//h1[contains(.,"Create Pool")]')
    assert wait_on_element_disappear(driver, 1, 30, '//h1[contains(.,"Create Pool")]')
    assert wait_on_element(driver, 1, 7, '//mat-panel-title[contains(.,"tank")]')
    driver.find_element_by_xpath('//td[contains(.,"tank")]')


@then('click Failover, uncheck disable failover, click save and confirm changes')
def click_failover_uncheck_disable_failover_click_save_and_confirm_changes(driver):
    """click Failover, uncheck disable failover, click save and confirm changes."""
    assert wait_on_element(driver, 0.5, 7, '//li[contains(.,"Failover")]')
    driver.find_element_by_xpath('//li[contains(.,"Failover")]').click()
    assert wait_on_element(driver, 0.5, 7, '//h1[contains(.,"Failover")]')
    element = driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Disable Failover"]')
    global class_attribute
    class_attribute = element.get_attribute('class')
    if 'mat-checkbox-checked' in class_attribute:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Disable Failover"]').click()
        assert wait_on_element(driver, 0.5, 7, '//button[@ix-auto="button__SAVE"]')
        driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    element = driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Disable Failover"]')
    attribute = element.get_attribute('class')
    assert 'mat-checkbox-checked' not in attribute, attribute
    assert wait_on_element(driver, 1, 7, '//h4[contains(.,"Failover Configuration")]')


@then(parsers.parse('enter Hostname "{host1}", Hostname (TrueNAS Controller 2) "{host2}", Hostname (Virtual) "{vhost}", Domain "{domain}", Nameserver1 "{nameserver1}", Nameserver2 "{nameserver2}"'))
def enter_hostname_hostname_truenas_controller_2_hostname_virtual_domain_nameserver1_nameserver2(driver, host1, host2, vhost, domain, nameserver1, nameserver2):
    """enter Hostname "{host1}", Hostname (TrueNAS Controller 2) "{host2}", Hostname (Virtual) "{vhost}", Domain "{domain}", Nameserver1 "{nameserver1}", Nameserver2 "{nameserver2}"."""
    driver.find_element_by_xpath('//input[@ix-auto="input__Hostname"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Hostname"]').send_keys(host1)
    driver.find_element_by_xpath('//input[@ix-auto="input__Hostname (TrueNAS Controller 2)"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Hostname (TrueNAS Controller 2)"]').send_keys(host2)
    driver.find_element_by_xpath('//input[@ix-auto="input__Hostname (Virtual)"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Hostname (Virtual)"]').send_keys(vhost)
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain"]').send_keys(domain)
    driver.find_element_by_xpath('//input[@ix-auto="input__Nameserver 1"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Nameserver 1"]').send_keys(nameserver1)
    driver.find_element_by_xpath('//input[@ix-auto="input__Nameserver 2"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Nameserver 2"]').send_keys(nameserver2)


@then('navigate to dashboard, and verify that both controllers show')
def navigate_to_dashboard_and_verify_that_both_controllers_show(driver):
    """navigate to dashboard, and verify that both controllers show."""
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    assert wait_on_element(driver, 1, 10, '//span[contains(.,"System Information")]')
    # need to wait for all controller to be online.
    assert wait_on_element(driver, 1, 60, '//div[contains(.,"tn-bhyve01-nodea")]')
    assert wait_on_element(driver, 1, 180, '//div[contains(.,"tn-bhyve01-nodeb")]')


@then('both controllers should show version and license on the dashboard')
def both_controllers_should_show_model_and_version_on_the_dashboard(driver):
    """both controllers should show version and license on the dashboard."""
    version1 = driver.find_element_by_xpath('(//strong[contains(.,"Version:")])[1]/../div/span').text
    version2 = driver.find_element_by_xpath('(//strong[contains(.,"Version:")])[2]/../div/span').text
    assert version1 == version2
    license1 = driver.find_element_by_xpath('(//strong[contains(.,"License:")])[1]/..').text
    license2 = driver.find_element_by_xpath('(//strong[contains(.,"License:")])[2]/..').text
    assert license1 == license2
