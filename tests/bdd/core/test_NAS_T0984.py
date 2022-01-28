# coding=utf-8
"""Core UI feature tests."""

import time
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_on_element_disappear,
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T984.feature', 'Setting interface from dhcp to a static ip')
def test_setting_interface_from_dhcp_to_a_static_ip(driver):
    """Setting interface from dhcp to a static ip."""


@given('the browser is open, the FreeNAS URL and logged in')
def the_browser_is_open_the_freenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open, the FreeNAS URL and logged in."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, '//input[@placeholder="Username"]')
        time.sleep(1)
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 10, '//input[@placeholder="Username"]')
        driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys('root')
        driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys(root_password)
        assert wait_on_element(driver, 4, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(0.5)
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('you see the dashboard')
def you_see_the_dashboard(driver):
    """you see the dashboard."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"System Information")]')


@then('click Network on the side menu and click Global Configuration')
def click_network_on_the_side_menu_and_click_global_configuration(driver):
    """click Network on the side menu and click Global Configuration."""
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Network"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Network"]').click()
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Global Configuration"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Global Configuration"]').click()


@then('the Network Global Configuration page should open')
def the_network_global_configuration_page_should_open(driver):
    """the Network Global Configuration page should open."""
    assert wait_on_element(driver, 7, '//a[contains(.,"Global Configuration")]')


@then(parsers.parse('input Nameserver 1 "{ad_nameserver1}" and input Nameserver 2 "{ad_nameserver2}"'))
def input_Nameserver_1_and_input_Nameserver_2(driver, ad_nameserver1, ad_nameserver2):
    """input Nameserver 1 "ad_nameserver1" and input Nameserver 2 "ad_nameserver2"."""
    assert wait_on_element(driver, 7, '//input[@placeholder="Nameserver 1"]')
    driver.find_element_by_xpath('//input[@placeholder="Nameserver 1"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Nameserver 1"]').send_keys(ad_nameserver1)
    driver.find_element_by_xpath('//input[@placeholder="Nameserver 2"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Nameserver 2"]').send_keys(ad_nameserver2)


@then(parsers.parse('input Nameserver 3 "{ad_nameserver3}", input a hostname and click SAVE'))
def input_Nameserver_3_and_click_save(driver, ad_nameserver3, nas_hostname):
    """input Nameserver 3 "ad_nameserver3" and click SAVE."""
    driver.find_element_by_xpath('//input[@placeholder="Nameserver 3"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Nameserver 3"]').send_keys(ad_nameserver3)
    driver.find_element_by_xpath('//input[@ix-auto="input__Hostname"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Hostname"]').send_keys(nas_hostname)
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


@then('"Please wait" should appear and changes should be saved without errors')
def please_wait_should_appear_and_changes_should_be_saved_without_errors(driver):
    """"Please wait" should appear and changes should be saved without errors."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//div[contains(.,"Settings saved.")]')


@then('click Network on the side menu and click interface')
def click_network_on_the_side_menu_and_click_interface(driver):
    """click Network on the side menu and click interface."""
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Network"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Network"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Interfaces"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Interfaces"]').click()


@then('when the Interfaces page appears, click on vnet0')
def when_the_interfaces_page_appears_click_on_vnet0(driver):
    """when the Interfaces page appears, click on vnet0."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Interfaces")]')
    driver.find_element_by_xpath('//a[@ix-auto="expander__vtnet0"]').click()


@then('click on Edit, the Interface Settings page should open')
def click_on_edit_the_interface_settings_page_should_open(driver):
    """click on Edit, the Interface Settings page should open."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__EDIT_vtnet0_vtnet0"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__EDIT_vtnet0_vtnet0"]').click()
    assert wait_on_element(driver, 7, '//h4[contains(.,"Interface Settings")]')


@then('uncheck DHCP, input the NAS IP, then click APPLY')
def uncheck_dhcp_input_the_nas_ip_then_click_apply(driver, nas_ip):
    """uncheck DHCP, input the NAS IP, then click APPLY."""
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__DHCP"]')
    if attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__DHCP"]', 'class', 'mat-checkbox-checked'):
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__DHCP"]').click()
    driver.find_element_by_xpath('//input[@ix-auto="input__IP Address"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__IP Address"]').send_keys(nas_ip)
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__APPLY"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__APPLY"]').click()


@then('"Please wait" should appear while settings are being applied.')
def please_wait_should_appear_while_settings_are_being_applied(driver):
    """"Please wait" should appear while settings are being applied.."""
    wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')


@then('when the Interfaces page appears verify vnet0 DHCP is "no"')
def when_the_Interfaces_page_appears_verify_vnet0_DHCP_is_no(driver):
    """when the Interfaces page appears verify vnet0 DHCP is "no"."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Interfaces")]')
    assert wait_on_element(driver, 7, '//div[@id="vtnet0_Name"]')
    dhcp = driver.find_element_by_xpath('//div[contains(@id,"vtnet0_DHCP")]').text
    assert dhcp == "no"


@then('click Test Changes, check Confirm, click Test Changes again')
def click_test_changes_check_confirm_click_test_changes_again(driver):
    """click Test Changes, check Confirm, click Test Changes again."""
    assert wait_on_element(driver, 7, '//button[contains(.,"TEST CHANGES")]')
    driver.find_element_by_xpath('//button[contains(.,"TEST CHANGES")]').click()
    assert wait_on_element(driver, 7, '//h1[contains(.,"Test Changes")]')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    driver.find_element_by_xpath('//button[@ix-auto="button__TEST CHANGES"]').click()


@then('"Please wait" should appear will Test Changes is happening')
def please_wait_should_appear_will_test_changes_is_happening(driver):
    """"Please wait" should appear will Test Changes is happening."""
    assert wait_on_element_disappear(driver, 80, '//h6[contains(.,"Please wait")]')
    if is_element_present(driver, '//button[contains(.,"TEST CHANGES")]'):
        driver.find_element_by_xpath('//button[contains(.,"TEST CHANGES")]').click()
        assert wait_on_element(driver, 7, '//h1[contains(.,"Test Changes")]')
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
        driver.find_element_by_xpath('//button[@ix-auto="button__TEST CHANGES"]').click()
        assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')


@then('There are unapplied network interface changes should appear click "Save Changes"')
def there_are_unapplied_network_interface_changes_should_appear_click_save_changes(driver):
    """There are unapplied network interface changes should appear click "Save Changes"."""
    assert wait_on_element(driver, 7, '//button[contains(.,"SAVE CHANGES")]')
    driver.find_element_by_xpath('//button[contains(.,"SAVE CHANGES")]').click()


@then('on the Save Changes widget, click Save')
def on_the_save_changes_widget_click_save(driver):
    """on the Save Changes widget, click Save."""
    assert wait_on_element(driver, 7, '//h1[contains(.,"Save Changes")]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


@then('on the Saved Changes widget, click CLOSE')
def on_the_save_changes_widget_click_close(driver):
    """on the Saved Changes widget, click CLOSE."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__CLOSE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()


@then('on the Interfaces page vnet0 DHCP is "no"')
def on_the_interfaces_page_vnet0_dhcp_is_no(driver):
    """on the Interfaces page vnet0 DHCP is "no"."""
    assert wait_on_element(driver, 7, '//div[contains(.,"Interfaces")]')
    assert wait_on_element(driver, 7, '//div[@id="vtnet0_Name"]')
    dhcp = driver.find_element_by_xpath('//div[contains(@id,"vtnet0_DHCP")]').text
    assert dhcp == "no"
