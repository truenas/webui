# coding=utf-8
"""SCALE UI feature tests."""

import reusableSeleniumCode as rsc
import xpaths
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
import pytest
pytestmark = [pytest.mark.debug_test]


@pytest.mark.dependency(name='Set_Interface')
@scenario('features/NAS-T1066.feature', 'Set DNS and static IP')
def test_set_interface():
    """Set interface."""


@given('the browser is open, the TrueNAS URL and logged in')
def the_browser_is_open_the_truenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open, the TrueNAS URL and logged in."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, xpaths.login.user_Input)
    if not is_element_present(driver, xpaths.side_Menu.dashboard):
        assert wait_on_element(driver, 10, xpaths.login.user_Input)
        driver.find_element_by_xpath(xpaths.login.user_Input).clear()
        driver.find_element_by_xpath(xpaths.login.user_Input).send_keys('root')
        driver.find_element_by_xpath(xpaths.login.password_Input).clear()
        driver.find_element_by_xpath(xpaths.login.password_Input).send_keys(root_password)
        assert wait_on_element(driver, 5, xpaths.login.signin_Button)
        driver.find_element_by_xpath(xpaths.login.signin_Button).click()
    else:
        assert wait_on_element(driver, 10, xpaths.side_Menu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.side_Menu.dashboard).click()


@when('you see the dashboard click Network on the side menu')
def you_see_the_dashboard_click_network_on_the_side_menu(driver):
    """you see the dashboard click Network on the side menu."""
    rsc.Verify_The_Dashboard(driver)
    assert wait_on_element(driver, 10, xpaths.side_Menu.network, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.network).click()


@when('the Network page will open, click Global Configuration Settings')
def the_network_page_will_open_click_global_configuration_settings(driver):
    """the Network page will open, click Global Configuration Settings."""
    assert wait_on_element(driver, 10, xpaths.network.title)
    assert wait_on_element(driver, 7, xpaths.network.global_Configuration_Title)
    assert wait_on_element(driver, 10, xpaths.button.settings, 'clickable')
    driver.find_element_by_xpath(xpaths.button.settings).click()


@then(parsers.parse('the global config page will open and input Nameservers "{nameserver1}", "{nameserver2}" and "{nameserver3}"'))
def the_global_config_page_will_open_and_input_nameservers(driver, nameserver1, nameserver2, nameserver3):
    """the global config page will open and input Nameservers "{nameserver1}", "{nameserver2}" and "{nameserver3}"."""
    assert wait_on_element(driver, 10, xpaths.global_Configuration.title)
    assert wait_on_element(driver, 7, xpaths.global_Configuration.nameserver1_Input, 'inputable')
    driver.find_element_by_xpath(xpaths.global_Configuration.nameserver1_Input).clear()
    driver.find_element_by_xpath(xpaths.global_Configuration.nameserver1_Input).send_keys(nameserver1)
    driver.find_element_by_xpath(xpaths.global_Configuration.nameserver2_Input).clear()
    driver.find_element_by_xpath(xpaths.global_Configuration.nameserver2_Input).send_keys(nameserver2)
    driver.find_element_by_xpath(xpaths.global_Configuration.nameserver3_Input).clear()
    driver.find_element_by_xpath(xpaths.global_Configuration.nameserver3_Input).send_keys(nameserver3)


@then(parsers.parse('input gateway "{gateway}" and an hostname and click SAVE'))
def input_gateway_and_a_hostname_and_click_save(driver, nas_hostname, gateway):
    """input gateway "{gateway}" and an hostname and click SAVE."""
    driver.find_element_by_xpath(xpaths.global_Configuration.ipv4_Default_Gateway_Input).clear()
    driver.find_element_by_xpath(xpaths.global_Configuration.ipv4_Default_Gateway_Input).send_keys(gateway)
    driver.find_element_by_xpath(xpaths.global_Configuration.hostname_Input).clear()
    driver.find_element_by_xpath(xpaths.global_Configuration.hostname_Input).send_keys(nas_hostname)
    assert wait_on_element(driver, 7, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('"Please wait" should appear, changes should be saved without errors, the network page will reload')
def please_wait_should_appear_changes_should_be_saved_without_errors_the_network_page_will_reload(driver):
    """"Please wait" should appear, changes should be saved without errors, the network page will reload."""
    assert wait_on_element_disappear(driver, 20, xpaths.progress.progressbar)
    assert wait_on_element(driver, 10, xpaths.network.title)


@then('click the interface field, uncheck dhcp and click add and enter IP and click Apply.')
def click_the_interface_field_uncheck_dhcp_and_click_add_and_enter_ip_and_click_apply(driver, nas_ip):
    """click the interface field, uncheck dhcp and click add and enter IP and click Apply.."""
    assert wait_on_element(driver, 7, xpaths.network.interface_Card_Title)
    assert wait_on_element(driver, 7, xpaths.network.interface_Row('enp1s0'))
    assert wait_on_element(driver, 7, xpaths.network.interface_Edit_Button('enp-1-s-0'), 'clickable')
    driver.find_element_by_xpath(xpaths.network.interface_Edit_Button('enp-1-s-0')).click()
    assert wait_on_element(driver, 7, xpaths.interface.title)
    assert wait_on_element(driver, 7, xpaths.interface.dhcp_Checkbox, 'clickable')
    if attribute_value_exist(driver, xpaths.interface.dhcp_Checkbox, 'class', 'mat-mdc-checkbox-checked'):
        driver.find_element_by_xpath(xpaths.interface.dhcp_Checkbox).click()
    assert wait_on_element(driver, 7, xpaths.interface.add_Allias_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.interface.add_Allias_Button).click()
    assert wait_on_element(driver, 7, xpaths.interface.ip_Address_Input, 'clickable')
    driver.find_element_by_xpath(xpaths.interface.ip_Address_Input).clear()
    driver.find_element_by_xpath(xpaths.interface.ip_Address_Input).send_keys(nas_ip)
    driver.find_element_by_xpath(xpaths.interface.netmask_Select).click()
    assert wait_on_element(driver, 10, xpaths.interface.netmask_Option(24), 'clickable')
    driver.find_element_by_xpath(xpaths.interface.netmask_Option(24)).click()
    assert wait_on_element(driver, 7, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('"Please wait" should appear while settings are being applied')
def please_wait_should_appear_while_settings_are_being_applied(driver):
    """"Please wait" should appear while settings are being applied."""
    assert wait_on_element_disappear(driver, 20, xpaths.progress.progressbar)
    driver.refresh()
    assert wait_on_element(driver, 10, xpaths.network.title)
    assert wait_on_element(driver, 7, xpaths.network.interface_Row('enp1s0'))


@then('click Test Changes, check Confirm, click Test Changes again')
def click_test_changes_check_confirm_click_test_changes_again(driver, nas_ip):
    """click Test Changes, check Confirm, click Test Changes again."""
    assert wait_on_element(driver, 7, xpaths.network.test_Changes_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.network.test_Changes_Button).click()
    assert wait_on_element(driver, 10, xpaths.network.test_Changes_Dialog_Title)
    assert wait_on_element(driver, 7, xpaths.checkbox.new_Confirm, 'clickable')
    driver.find_element_by_xpath(xpaths.checkbox.new_Confirm).click()
    assert wait_on_element(driver, 7, xpaths.button.Continue, 'clickable')
    driver.find_element_by_xpath(xpaths.button.Continue).click()


@then('when Save Changes appear click the "Save Changes" button')
def when_save_changes_appear_click_the_save_changes_button(driver):
    """when Save Changes appear click the "Save Changes" button."""
    assert wait_on_element_disappear(driver, 65, xpaths.popup.please_Wait)
    assert wait_on_element(driver, 10, xpaths.network.title)
    assert wait_on_element(driver, 7, xpaths.button.save_changes, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save_changes).click()
    assert wait_on_element(driver, 10, xpaths.popup.save_changes)
    assert wait_on_element(driver, 7, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('the changes should be successfully saved')
def the_changes_should_be_successfully_saved(driver):
    """the changes should be successfully saved."""
    assert wait_on_element(driver, 10, '//div[contains(.,"Network interface changes have been made permanent.")]')
    assert wait_on_element(driver, 10, xpaths.network.title)
    assert wait_on_element(driver, 7, xpaths.network.interface_Row('enp1s0'))
