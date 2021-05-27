# coding=utf-8
"""SCALE UI feature tests."""

import time
from function import(
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_for_attribute_value,
    wait_on_element_disappear,
)

from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)


@scenario('features/NAS-T1066.feature', 'Set interface')
def test_set_interface():
    """Set interface."""


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


@when('you see the dashboard click Network on the side menu')
def you_see_the_dashboard_click_network_on_the_side_menu(driver):
    """you see the dashboard click Network on the side menu."""
    assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Network"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Network"]').click()



@when('the Network page will open, click Global Configuration Settings')
def the_network_page_will_open_click_global_configuration_settings(driver):
    """the Network page will open, click Global Configuration Settings."""
    assert wait_on_element(driver, 10, '//h1[contains(.,"Network")]')
    assert wait_on_element(driver, 10, '//button[@ix-auto="button__globalSettings"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__globalSettings"]').click()


@then('the global config page will open and input Nameservers and gateway and hostname and click SAVE')
def the_global_config_page_will_open_and_input_nameservers_and_gateway_and_hostname_and_click_save(driver):
    """the global config page will open and input Nameservers and gateway and hostname and click SAVE."""
    assert wait_on_element(driver, 10, '//h3[contains(.,"Global Configuration")]')
        assert wait_on_element(driver, 7, '//input[@ix-auto="input__Nameserver 1"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Nameserver 1"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Nameserver 1"]').send_keys('10.231.0.2')
    driver.find_element_by_xpath('//input[@ix-auto="input__Nameserver 2"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Nameserver 2"]').send_keys('10.231.0.3')
    driver.find_element_by_xpath('//input[@ix-auto="input__Nameserver 3"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Nameserver 3"]').send_keys('10.242.0.2')
    driver.find_element_by_xpath('//input[@ix-auto="input__IPv4 Default Gateway"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__IPv4 Default Gateway"]').send_keys('10.238.238.1')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    

@then('"Please wait" should appear, changes should be saved without errors, the network page will reload')
def please_wait_should_appear_changes_should_be_saved_without_errors_the_network_page_will_reload(driver):
    """"Please wait" should appear, changes should be saved without errors, the network page will reload."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//h1[contains(.,"Network")]')


@then('click the interface field, uncheck dhcp and click add and enter IP and click Apply.')
def click_the_interface_field_uncheck_dhcp_and_click_add_and_enter_ip_and_click_apply(driver):
    """click the interface field, uncheck dhcp and click add and enter IP and click Apply.."""
    driver.find_element_by_xpath('//mat-icon[@id="enp0s8"]').click()
    assert wait_on_element(driver, 1, 7, '//mat-checkbox[@ix-auto="checkbox__DHCP"]')
    if attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__DHCP"]', 'class', 'mat-checkbox-checked'):
    	driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__DHCP"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__add-box_aliases"]', 'clickable')
    assert wait_on_element(driver, 1, 7, '//div[contains(.,"array__IP Address")]')
    driver.find_element_by_xpath('//input[@ix-auto="input__IP Address"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__IP Address"]').send_keys(nas_ip)
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__APPLY"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__APPLY"]').click()



@then('"Please wait" should appear while settings are being applied, when the Interfaces page appears verify Nameservers do not list (DHCP)')
def please_wait_should_appear_while_settings_are_being_applied_when_the_interfaces_page_appears_verify_nameservers_do_not_list_dhcp(driver):
    """"Please wait" should appear while settings are being applied, when the Interfaces page appears verify Nameservers do not list (DHCP)."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//h1[contains(.,"Network")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"DHCP")]') is False


@then('click Test Changes, check Confirm, click Test Changes again')
def click_test_changes_check_confirm_click_test_changes_again(driver, nas_ip):
    """click Test Changes, check Confirm, click Test Changes again."""
    if is_element_present(driver, '//button[contains(.,"TEST CHANGES")]'):
        assert wait_on_element(driver, 7, '//button[@ix-auto="button__testChange"]', 'clickable')
        driver.find_element_by_xpath('//button[@ix-auto="button__testChange"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Test Changes")]')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    driver.find_element_by_xpath('//button[@ix-auto="button__TEST CHANGES"]').click()




@then('when "Please wait" goes away, and there are unapplied network changes, click "Save Changes"')
def when_please_wait_goes_away_and_there_are_unapplied_network_changes_click_save_changes(driver):
    """when "Please wait" goes away, and there are unapplied network changes, click "Save Changes"."""
        assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//h1[contains(.,"Network")]')




    raise NotImplementedError


@then('on the Save Changes widget, click Save')
def on_the_save_changes_widget_click_save(driver):
    """on the Save Changes widget, click Save."""
    raise NotImplementedError


@then('on the Saved Changes widget, click CLOSE')
def on_the_saved_changes_widget_click_close(driver):
    """on the Saved Changes widget, click CLOSE."""
    raise NotImplementedError


@then('on the Interfaces page, Nameservers do not list (DHCP)')
def on_the_interfaces_page_nameservers_do_not_list_dhcp(driver):
    """on the Interfaces page, Nameservers do not list (DHCP)."""
    assert wait_on_element(driver, 10, '//h1[contains(.,"Network")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"DHCP")]') is False




