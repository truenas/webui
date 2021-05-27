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
    raise NotImplementedError


@when('you see the dashboard click Network on the side menu')
def you_see_the_dashboard_click_network_on_the_side_menu(driver):
    """you see the dashboard click Network on the side menu."""
    raise NotImplementedError


@when('the Network page will open, click Global Configuration Settings')
def the_network_page_will_open_click_global_configuration_settings(driver):
    """the Network page will open, click Global Configuration Settings."""
    raise NotImplementedError


@then('the global config page will open and input Nameservers and gateway and hostname and click SAVE')
def the_global_config_page_will_open_and_input_nameservers_and_gateway_and_hostname_and_click_save(driver):
    """the global config page will open and input Nameservers and gateway and hostname and click SAVE."""
    raise NotImplementedError
    

@then('"Please wait" should appear, changes should be saved without errors, the network page will reload')
def please_wait_should_appear_changes_should_be_saved_without_errors_the_network_page_will_reload(driver):
    """"Please wait" should appear, changes should be saved without errors, the network page will reload."""
    raise NotImplementedError


@then('click the interface field, uncheck dhcp and click add and enter IP and click Apply.')
def click_the_interface_field_uncheck_dhcp_and_click_add_and_enter_ip_and_click_apply(driver):
    """click the interface field, uncheck dhcp and click add and enter IP and click Apply.."""
    raise NotImplementedError


@then('"Please wait" should appear while settings are being applied, when the Interfaces page appears verify Nameservers do not list (DHCP)')
def please_wait_should_appear_while_settings_are_being_applied_when_the_interfaces_page_appears_verify_nameservers_do_not_list_dhcp(driver):
    """"Please wait" should appear while settings are being applied, when the Interfaces page appears verify Nameservers do not list (DHCP)."""
    raise NotImplementedError


@then('click Test Changes, check Confirm, click Test Changes again')
def click_test_changes_check_confirm_click_test_changes_again(driver):
    """click Test Changes, check Confirm, click Test Changes again."""
    raise NotImplementedError


@then('when "Please wait" goes away, and there are unapplied network changes, click "Save Changes"')
def when_please_wait_goes_away_and_there_are_unapplied_network_changes_click_save_changes(driver):
    """when "Please wait" goes away, and there are unapplied network changes, click "Save Changes"."""
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
    raise NotImplementedError




