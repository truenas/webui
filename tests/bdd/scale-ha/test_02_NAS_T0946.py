# coding=utf-8
"""High Availability (tn-bhyve06) feature tests."""

import pytest
import reusableSeleniumCode as rsc
import time
import xpaths
from function import (
    wait_on_element,
    wait_on_element_disappear,
    is_element_present,
    create_Pool
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@pytest.mark.dependency(name='Setup_HA')
@scenario('features/NAS-T946.feature', 'Verify setting up HA works with a single failover group')
def test_verify_setting_up_ha_works_with_a_single_failover_group(driver):
    """Verify setting up HA works with a single failover group."""


@given(parsers.parse('the browser is open navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_ip):
    """the browser is open navigate to "nas(url"."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}/ui/signin")


@when(parsers.parse('login appear enter "root" and "{password}"'))
def login_appear_enter_root_and_password(driver, password):
    """login appear enter "root" and "password"."""
    global ADMIN_PASSWORD
    ADMIN_PASSWORD = password
    rsc.Login_If_Not_On_Dashboard(driver, 'root', password)


@then(parsers.parse('you should see the dashboard and "{information}"'))
def you_should_see_the_dashboard_and_information(driver, information):
    """you should see the dashboard and "information"."""
    rsc.Verify_The_Dashboard(driver)


@then('navigate to System Settings and click General')
def navigate_to_system_settings_and_click_general(driver):
    """navigate to System Settings and click General."""
    assert wait_on_element(driver, 7, xpaths.side_Menu.system_Setting, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.system_Setting).click()
    assert wait_on_element(driver, 7, xpaths.side_Menu.general, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.general).click()


@then('the General page should load')
def the_support_page_license_information_should_load(driver):
    """the Support page License Information should load."""
    assert wait_on_element(driver, 7, xpaths.general.title)


@then('under Support click Enter License the "License" box should open')
def under_support_click_enter_license_the_license_box_should_open(driver):
    """under Support click Enter License the "License" box should open."""
    assert wait_on_element(driver, 7, xpaths.general.support_title, 'clickable')
    rsc.Click_On_Element(driver, xpaths.general.add_licence_button)
    assert wait_on_element(driver, 7, xpaths.general.license_dialog_title)


@then(parsers.parse('input the {license}, and click Save'))
def input_the_license_and_click_save(driver, license):
    """input the <license>, and click Save."""
    assert wait_on_element(driver, 7, '//textarea', 'inputable')
    driver.find_element_by_xpath('//textarea').clear()
    driver.find_element_by_xpath('//textarea').send_keys(license)
    assert wait_on_element(driver, 7, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 20, xpaths.popup.please_Wait)


@then('the "Reload the page for the license to take effect" should appear')
def the_reload_the_page_for_the_license_to_take_effect_should_appear(driver):
    """the "Reload the page for the license to take effect" should appear."""
    assert wait_on_element(driver, 7, '//h1[contains(.,"Reload the page")]')


@then(parsers.parse('click reload now and "{agreement}" should appear'))
def click_reload_now_and_end_user_license_agreement__truenas_should_appear(driver, agreement):
    """click reload now and "End User License Agreement - TrueNAS" should appear."""
    assert wait_on_element(driver, 7, xpaths.button.reload_Now, 'clickable')
    driver.find_element_by_xpath(xpaths.button.reload_Now).click()
    assert wait_on_element(driver, 10, f'//h1[contains(.,"{agreement}")]')


@then('click Agree we should be returned to the General page')
def click_agree_we_should_be_returned_to_the_general_page(driver):
    """click Agree we should be returned to the General page."""
    rsc.License_Agrement(driver)

    if is_element_present(driver, xpaths.dashboard.title):
        assert wait_on_element(driver, 7, xpaths.side_Menu.system_Setting, 'clickable')
        driver.find_element_by_xpath(xpaths.side_Menu.system_Setting).click()
        assert wait_on_element(driver, 7, xpaths.side_Menu.general, 'clickable')
        driver.find_element_by_xpath(xpaths.side_Menu.general).click()

    assert wait_on_element(driver, 7, '//h1[contains(.,"General")]')


@then(parsers.parse('both serials should show under System Serial "{serial1}" and "{serial2}"'))
def both_serials_should_show_under_system_serial_serial1_and_serial2(driver, serial1, serial2):
    """both serials should show under System Serial "serial1" and "serial2"."""
    # driver.find_element_by_xpath(f'//span[contains(.,"{serial1} / {serial2}")]')
    pass


@then('navigate to Network and on the Network page click on Global Configuration Settings')
def navigate_to_network_and_on_the_network_page_click_on_global_configuration_settings(driver):
    """navigate to Network and on the Network page click on Global Configuration Settings."""
    driver.find_element_by_xpath(xpaths.side_Menu.network).click()
    assert wait_on_element(driver, 7, '//h1[contains(.,"Network")]')
    assert wait_on_element(driver, 7, '//h3[text()="Global Configuration"]')
    assert wait_on_element(driver, 7, '//div[text()="Nameservers"]')
    assert wait_on_element(driver, 7, xpaths.button.settings, 'clickable')
    driver.find_element_by_xpath(xpaths.button.settings).click()
    assert wait_on_element(driver, 7, xpaths.global_Configuration.title)
    time.sleep(1)


@then(parsers.parse('enter Hostname (Virtual) "{vhost}", IPv4 Default Gateway "{gatway}"'))
def enter_hostname_Virtual_ipv4_default_gateway_(driver, vhost, gatway):
    """enter Hostname (Virtual) "vhost", IPv4 Default Gateway "{gatway}"."""
    assert wait_on_element(driver, 7, '//ix-input[contains(.,"Hostname (Virtual)")]//input', 'inputable')
    driver.find_element_by_xpath('//ix-input[contains(.,"Hostname (Virtual)")]//input').clear()
    driver.find_element_by_xpath('//ix-input[contains(.,"Hostname (Virtual)")]//input').send_keys(vhost)
    assert wait_on_element(driver, 7, '//ix-input[contains(.,"IPv4 Default Gateway")]//input', 'clickable')
    driver.find_element_by_xpath('//ix-input[contains(.,"IPv4 Default Gateway")]//input').clear()
    driver.find_element_by_xpath('//ix-input[contains(.,"IPv4 Default Gateway")]//input').send_keys(gatway)


@then(parsers.parse('enter Domain "{domain}", Nameserver1 "{nameserver1}", Nameserver2 "{nameserver2}", Nameserver3 "{nameserver3}"'))
def enter_domain_nameserver1_nameserver2_nameserver3(driver, domain, nameserver1, nameserver2, nameserver3):
    """enter Domain "{domain}", Nameserver1 "{nameserver1}", Nameserver2 "{nameserver2}", Nameserver3 "{nameserver3}"."""
    driver.find_element_by_xpath('//ix-input[contains(.,"Domain")]//input').clear()
    driver.find_element_by_xpath('//ix-input[contains(.,"Domain")]//input').send_keys(domain)
    driver.find_element_by_xpath('//ix-input[contains(.,"Nameserver 1")]//input').clear()
    driver.find_element_by_xpath('//ix-input[contains(.,"Nameserver 1")]//input').send_keys(nameserver1)
    driver.find_element_by_xpath('//ix-input[contains(.,"Nameserver 2")]//input').clear()
    driver.find_element_by_xpath('//ix-input[contains(.,"Nameserver 2")]//input').send_keys(nameserver2)
    driver.find_element_by_xpath('//ix-input[contains(.,"Nameserver 3")]//input').clear()
    driver.find_element_by_xpath('//ix-input[contains(.,"Nameserver 3")]//input').send_keys(nameserver3)


@then('click save when finished')
def click_save_when_finished(driver):
    """click save when finished."""
    element = driver.find_element_by_xpath(xpaths.button.save)
    # Scroll to SSH service
    driver.execute_script("arguments[0].scrollIntoView();", element)

    assert wait_on_element(driver, 7, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('"Please wait" should appear while settings are being applied and You should be returned to Network page')
def please_wait_should_appear_while_settings_are_being_applied_you_should_be_returned_to_network_page(driver):
    """"Please wait" should appear while settings are being applied and You should be returned to Network page."""
    assert wait_on_element_disappear(driver, 60, xpaths.progress.progressbar)
    assert wait_on_element(driver, 7, '//h1[contains(.,"Network")]')


@then('navigate to System then click Failover')
def navigate_to_system_then_click_failover(driver):
    """navigate to System then click Failover"""
    assert wait_on_element(driver, 7, xpaths.side_Menu.system_Setting, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.system_Setting).click()
    assert wait_on_element(driver, 7, xpaths.side_Menu.failover, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.failover).click()


@then('the Failover page should open')
def the_failover_page_should_open(driver):
    """the Failover page should open."""
    assert wait_on_element(driver, 7, '//h1[text()="Failover"]')


@then('click the disable failover checkbox, click save and confirm changes')
def click_the_disable_failover_checkbox_click_save_and_confirm_changes(driver):
    """click the disable failover checkbox, click save and confirm changes."""
    assert wait_on_element(driver, 7, '//mat-checkbox[contains(.,"Disable Failover")]', 'clickable')
    element = driver.find_element_by_xpath('//mat-checkbox[contains(.,"Disable Failover")]')
    global class_attribute
    class_attribute = element.get_attribute('class')
    if 'mat-mdc-checkbox-checked' not in class_attribute:
        driver.find_element_by_xpath('//mat-checkbox[contains(.,"Disable Failover")]').click()

    assert wait_on_element(driver, 7, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('after settings are applied you should see "Settings applied"')
def after_settings_are_applied_you_should_see_settings_applied(driver):
    """after settings are applied you should see "Settings applied"."""
    assert wait_on_element(driver, 15, '//div[text()="Settings saved."]')
    assert wait_on_element(driver, 7, '//h1[text()="Failover"]')


@then('navigate to Network then under Interfaces click enp0s6f0')
def navigate_to_network_then_under_interfacesclick_enp0s6f0(driver):
    """navigate to Network then under Interfaces click enp0s6f0."""
    assert wait_on_element(driver, 7, xpaths.side_Menu.network, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.network).click()
    assert wait_on_element(driver, 7, xpaths.network.title)
    assert wait_on_element(driver, 7, xpaths.network.interface_Card_Title)
    assert wait_on_element(driver, 7, xpaths.network.interface_Row('enp0s6f0'))
    assert wait_on_element(driver, 7, xpaths.network.interface_Edit_Button('enp-0-s-6-f-0'))
    driver.find_element_by_xpath(xpaths.network.interface_Edit_Button('enp-0-s-6-f-0')).click()


@then('the Edit Interface should appear')
def the_edit_interface_should_appear(driver):
    """the Edit Interface should appear."""
    assert wait_on_element(driver, 7, xpaths.interface.title)


@then(parsers.parse('uncheck DHCP, check Critical, Select 1 for Failover Group, input IP Address (This Controller) "{ip1}" then select /"{netmask}", IP Address (TrueNAS Controller 2) "{ip2}", Virtual IP Address "{vip}"'))
def uncheck_dhcp_check_critical_select_1_for_failover_group_input_ip_address_this_controller__then_select_23_ip_address_truenas_controller_2_virtual_ip_address(driver, nas_ip, netmask, nas_ip2, nas_vip):
    """uncheck DHCP, check Critical, Select 1 for Failover Group, input IP Address (This Controller) "{ip1}" then select /"{netmask1}", IP Address (TrueNAS Controller 2) "{ip2}", Virtual IP Address, "{vip}"."""
    assert wait_on_element(driver, 7, xpaths.interface.dhcp_Checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.interface.dhcp_Checkbox).click()
    assert wait_on_element(driver, 7, xpaths.interface.critical_Checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.interface.critical_Checkbox).click()
    driver.find_element_by_xpath(xpaths.interface.failover_Group_Select).click()
    assert wait_on_element(driver, 5, xpaths.interface.failover_Group_Option, 'clickable')
    driver.find_element_by_xpath(xpaths.interface.failover_Group_Option).click()
    assert wait_on_element(driver, 5, xpaths.interface.failover_Group_Selected, 'clickable')
    assert wait_on_element(driver, 5, xpaths.interface.add_Allias_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.interface.add_Allias_Button).click()
    assert wait_on_element(driver, 5, xpaths.interface.ip_Address_Input, 'inputable')
    driver.find_element_by_xpath(xpaths.interface.ip_Address_Input).clear()
    driver.find_element_by_xpath(xpaths.interface.ip_Address_Input).send_keys(nas_ip)
    driver.find_element_by_xpath(xpaths.interface.netmask_Select).click()
    assert wait_on_element(driver, 5, xpaths.interface.netmask_Option(netmask), 'clickable')
    driver.find_element_by_xpath(xpaths.interface.netmask_Option(netmask)).click()
    assert wait_on_element(driver, 5, xpaths.interface.failover_Address_Input, 'inputable')
    driver.find_element_by_xpath(xpaths.interface.failover_Address_Input).clear()
    driver.find_element_by_xpath(xpaths.interface.failover_Address_Input).send_keys(nas_ip2)
    driver.find_element_by_xpath(xpaths.interface.failover_Virtual_Address).clear()
    driver.find_element_by_xpath(xpaths.interface.failover_Virtual_Address).send_keys(nas_vip)


@then('click Apply and "Please wait" should appear while settings are being applied.')
def click_apply_and_please_wait_should_appear_while_settings_are_being_applied(driver):
    """click Apply and "Please wait" should appear while settings are being applied."""
    assert wait_on_element(driver, 7, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 30, xpaths.popup.please_Wait)


@then('click Test Changes, check Confirm, click Test Changes again')
def click_test_changes_check_confirm_click_test_changes_again(driver):
    """click Test Changes, check Confirm, click Test Changes again."""
    assert wait_on_element(driver, 10, xpaths.network.test_Changes_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.network.test_Changes_Button).click()
    assert wait_on_element(driver, 10, xpaths.network.test_Changes_Dialog_Title)
    driver.find_element_by_xpath(xpaths.checkbox.new_Confirm).click()
    driver.find_element_by_xpath(xpaths.button.Continue).click()
    assert wait_on_element(driver, 5, xpaths.popup.please_Wait)
    # sleep 5 second to let the changes take effect
    time.sleep(5)


@then(parsers.parse('switch to the virtual hostname "{virtual_hostname}" and login'))
def switch_to_the_virtual_hostname_virtual_hostname_and_login(driver, nas_vip):
    """switch to the virtual hostname "{virtual_hostname}" and login."""
    driver.get(f"http://{nas_vip}")
    assert wait_on_element(driver, 7, xpaths.login.user_Input)
    driver.find_element_by_xpath(xpaths.login.user_Input).clear()
    driver.find_element_by_xpath(xpaths.login.user_Input).send_keys('root')
    driver.find_element_by_xpath(xpaths.login.password_Input).clear()
    driver.find_element_by_xpath(xpaths.login.password_Input).send_keys('testing')
    assert wait_on_element(driver, 7, xpaths.login.signin_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.login.signin_Button).click()


@then('on the virtual hostname Dashboard Save the network interface changes')
def on_the_virtual_hostname_dashboard_save_the_network_interface_changes(driver):
    """on the virtual hostname Dashboard Save the network interface changes."""
    assert wait_on_element(driver, 7, xpaths.dashboard.title)
    assert wait_on_element(driver, 7, xpaths.popup.save_changes)
    rsc.Click_On_Element(driver, xpaths.button.Continue)
    assert wait_on_element_disappear(driver, 20, xpaths.popup.please_Wait)
    assert wait_on_element(driver, 10, xpaths.network.title)
    rsc.Click_On_Element(driver, xpaths.button.save_changes)
    assert wait_on_element(driver, 10, xpaths.popup.save_changes)
    rsc.Click_On_Element(driver, xpaths.button.save)

@then('navigate to Storage then click the gear icon and click Disks')
def navigate_to_storage_then_click_the_gear_icon_and_click_disks(driver):
    """navigate to Storage then click the gear icon and click Disks."""
    driver.find_element_by_xpath(xpaths.side_Menu.storage).click()
    assert wait_on_element(driver, 7, xpaths.storage.title)
    assert wait_on_element(driver, 7, '//a[*/text()=" Disks "]', 'clickable')
    driver.find_element_by_xpath('//a[*/text()=" Disks "]').click()
    assert wait_on_element(driver, 7, '//h1[text()="Disks"]')


@then('the list of disks should appear in ascending order starting with sda')
def the_list_of_disks_should_appear_in_ascending_order_starting_with_sda(driver):
    """the list of disks should appear in ascending order starting with sda."""
    # make sure the spinner if out of the way
    assert wait_on_element_disappear(driver, 30, xpaths.progress.spinner)


@then('wipe all disk without a pool')
def wipe_all_disk_without_a_pool(driver):
    """wipe all disk without a pool."""
    rsc.Wiped_Unused_Disk(driver)


# TODO: when Bluefin is replaced by Cobia the steps below need to be refactor.
@then('navigate to Storage click Create')
def navigate_to_storage_click_create(driver):
    """navigate to Storage click Create"""
    driver.find_element_by_xpath(xpaths.side_Menu.storage).click()
    assert wait_on_element(driver, 7, xpaths.storage.title)
    # assert wait_on_element(driver, 7, xpaths.storage.create_Pool_Button, 'clickable')
    # driver.find_element_by_xpath(xpaths.storage.create_Pool_Button).click()


@then('enter tank for pool name, click the checkbox beside the first disk')
def enter_tank_for_pool_name_click_the_checkbox_beside_the_first_disk(driver):
    """enter tank for pool name, click the checkbox beside the first disk."""
    # assert wait_on_element(driver, 7, '//h1[contains(.,"Create Pool")]')
    # assert wait_on_element(driver, 7, '//div[contains(.,"Pool Manager")]')
    # assert wait_on_element(driver, 7, '//input[@id="pool-manager__name-input-field"]', 'inputable')
    # driver.find_element_by_xpath('//input[@id="pool-manager__name-input-field"]').clear()
    # driver.find_element_by_xpath('//input[@id="pool-manager__name-input-field"]').send_keys('tank')
    # driver.find_element_by_xpath('//datatable-body[contains(.,"sd")]//mat-checkbox[1]').click()
    # if wait_on_element(driver, 3, '//mat-dialog-container[contains(.,"Warning: sd")]'):
    #     assert wait_on_element(driver, 5, '//button[*/text()=" Close "]', 'clickable')
    #     driver.find_element_by_xpath('//button[*/text()=" Close "]').click()
    pass


@then('click the arrow pointing to Data Vdevs, click Create, check confirm, click CREATE POOL')
def click_the_arrow_pointing_to_data_vdevs_click_create_check_confirm_click_create_pool(nas_vip):
    """click the arrow pointing to Data Vdevs, click Create, check confirm, click CREATE POOL."""
    # assert wait_on_element(driver, 7, '//button[@id="vdev__add-button"]', 'clickable')
    # driver.find_element_by_xpath('//button[@id="vdev__add-button"]').click()
    # assert wait_on_element(driver, 7, '//mat-checkbox[@id="pool-manager__force-submit-checkbox"]', 'clickable')
    # driver.find_element_by_xpath('//mat-checkbox[@id="pool-manager__force-submit-checkbox"]').click()
    # # rsc.Confirm_Single_Disk(driver)
    # assert wait_on_element(driver, 7, '//button[@name="create-button"]', 'clickable')
    # driver.find_element_by_xpath('//button[@name="create-button"]').click()
    # rsc.Confirm_Creating_Pool(driver)
    create_Pool(nas_vip, ('root', ADMIN_PASSWORD), 'tank')


@then('Create Pool should appear while pool is being created. You should be returned to the Storage page')
def create_pool_should_appear_while_pool_is_being_created_you_should_be_returned_to_the_storage_page(driver):
    """Create Pool should appear while pool is being created. You should be returned to the Storage page."""
    # assert wait_on_element(driver, 7, '//h1[contains(.,"Create Pool")]')
    # assert wait_on_element_disappear(driver, 120, '//h1[contains(.,"Create Pool")]')
    driver.refresh()
    assert wait_on_element(driver, 7, xpaths.storage.title)
    assert wait_on_element(driver, 7, '//h2[text()="tank"]')


@then('click disable failover to uncheck it, click save and confirm changes')
def click_disable_failover_to_uncheck_it_click_save_and_confirm_changes(driver):
    """click disable failover to uncheck it, click save and confirm changes."""
    assert wait_on_element(driver, 7, '//h1[text()="Failover"]')
    assert wait_on_element(driver, 7, '//mat-checkbox[contains(.,"Disable Failover")]', 'clickable')
    element = driver.find_element_by_xpath('//mat-checkbox[contains(.,"Disable Failover")]')
    global class_attribute
    class_attribute = element.get_attribute('class')
    if 'mat-mdc-checkbox-checked' in class_attribute:
        driver.find_element_by_xpath('//mat-checkbox[contains(.,"Disable Failover")]').click()

    assert wait_on_element(driver, 7, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element(driver, 15, '//div[text()="Settings saved."]')


@then('navigate to dashboard, wait for HA to be online')
def navigate_to_dashboard_wait_for_ha_to_be_online(driver):
    """navigate to dashboard, wait for HA to be online."""
    rsc.Click_On_Element(driver, xpaths.side_Menu.old_dashboard)
    rsc.Verify_The_Dashboard(driver)
    assert wait_on_element(driver, 240, xpaths.toolbar.ha_Enabled)
    assert wait_on_element(driver, 15, '//span[contains(.,"Hostname:") and contains(.,"truenas")]')
    assert wait_on_element(driver, 15, '//span[contains(.,"Hostname:") and contains(.,"truenas-b")]')
    time.sleep(5)


@then(parsers.parse('enter Hostname "{host1}", Hostname (TrueNAS Controller 2) "{host2}"'))
def enter_hostname_hostname_truenas_controller_2(driver, host1, host2):
    """enter Hostname "{host1}", Hostname (TrueNAS Controller 2) "{host2}"."""
    assert wait_on_element(driver, 7, '//ix-input[contains(.,"Hostname") and not(contains(.,"TrueNAS") or contains(.,"Virtual"))]//input', 'inputable')
    driver.find_element_by_xpath('//ix-input[contains(.,"Hostname") and not(contains(.,"TrueNAS") or contains(.,"Virtual"))]//input').clear()
    driver.find_element_by_xpath('//ix-input[contains(.,"Hostname") and not(contains(.,"TrueNAS") or contains(.,"Virtual"))]//input').send_keys(host1)
    assert wait_on_element(driver, 7, '//ix-input[contains(.,"Hostname (TrueNAS Controller 2)")]//input', 'inputable')
    driver.find_element_by_xpath('//ix-input[contains(.,"Hostname (TrueNAS Controller 2)")]//input').clear()
    driver.find_element_by_xpath('//ix-input[contains(.,"Hostname (TrueNAS Controller 2)")]//input').send_keys(host2)


@then('navigate to dashboard, verify both contorler hostname')
def navigate_to_dashboard_verify_both_contorler_hostname(driver):
    """navigate to dashboard, verify both contorler hostname."""
    rsc.Click_On_Element(driver, xpaths.side_Menu.old_dashboard)
    rsc.Verify_The_Dashboard(driver)
    assert wait_on_element(driver, 15, xpaths.toolbar.ha_Enabled)
    assert wait_on_element(driver, 15, '//span[contains(.,"Hostname:") and contains(.,"tn-bhyve06-nodea")]')
    assert wait_on_element(driver, 15, '//span[contains(.,"Hostname:") and contains(.,"tn-bhyve06-nodeb")]')


@then('both controllers should show version and license on the dashboard')
def both_controllers_should_show_model_and_version_on_the_dashboard(driver):
    """both controllers should show version and license on the dashboard."""
    version1 = driver.find_element_by_xpath('(//strong[contains(.,"Version:")])[1]/../div/div/span').text
    version2 = driver.find_element_by_xpath('(//strong[contains(.,"Version:")])[2]/../div/div/span').text
    assert version1 == version2
    license1 = driver.find_element_by_xpath('(//strong[contains(.,"License:")])[1]/..').text
    license2 = driver.find_element_by_xpath('(//strong[contains(.,"License:")])[2]/..').text
    assert license1 == license2
