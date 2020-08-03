# coding=utf-8
"""High Availability (tn09) feature tests."""

from function import wait_on_element
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T919.feature', 'Verify vlan with lagg0 parent interface using secondary failover group functions')
def test_verify_vlan_with_lagg0_parent_interface_using_secondary_failover_group_functions(driver):
    """Verify vlan with lagg0 parent interface using secondary failover group functions."""


@given('The browser is open navigate to "http://tn09a.lab.ixsystems.com/"')
def the_browser_is_open_navigate_to_httptn09alabixsystemscom(driver):
    """The browser is open navigate to "http://tn09a.lab.ixsystems.com/"."""


@when('Login appear enter "root" and "abcd1234"')
def login_appear_enter_root_and_abcd1234(driver):
    """Login appear enter "root" and "abcd1234"."""


@then('You should see the dashboard')
def you_should_see_the_dashboard(driver):
    """You should see the dashboard."""


@then('Navigate to System then to Failover')
def navigate_to_system_then_to_failover(driver):
    """Navigate to System then to Failover."""


@then('The Failover Page should open')
def the_failover_page_should_open(driver):
    """The Failover Page should open."""


@then('Select disable failover and click save Check confirm on the warning dialog and press OK')
def select_disable_failover_and_click_save_check_confirm_on_the_warning_dialog_and_press_ok(driver):
    """Select disable failover and click save Check confirm on the warning dialog and press OK."""


@then('A dialog should appear while applying settings')
def a_dialog_should_appear_while_applying_settings(driver):
    """A dialog should appear while applying settings."""


@then('Navigate to Network then to Interfaces')
def navigate_to_network_then_to_interfaces(driver):
    """Navigate to Network then to Interfaces."""


@then('The interface page should open.')
def the_interface_page_should_open(driver):
    """The interface page should open."""


@then('Click Add')
def click_add(driver):
    """Click Add."""


@then('The Interface Settings page should open')
def the_interface_settings_page_should_open(driver):
    """The Interface Settings page should open."""


@then('For type select link aggregation. For name enter lagg0')
def for_type_select_link_aggregation_for_name_enter_lagg0(driver):
    """For type select link aggregation. For name enter lagg0."""


@then('For description enter "lagg for functional testing" without quotes')
def for_description_enter_lagg_for_functional_testing_without_quotes(driver):
    """For description enter "lagg for functional testing" without quotes."""


@then('For lagg protocol select LACP For lagg interfaces select cxl0, and cxl1')
def for_lagg_protocol_select_lacp_for_lagg_interfaces_select_cxl0_and_cxl1(driver):
    """For lagg protocol select LACP For lagg interfaces select cxl0, and cxl1."""


@then('Press Apply')
def press_apply(driver):
    """Press Apply."""


@then('The following message "There are unapplied network changes. Apply them now? Unapplied changes will be lost." should appear.')
def the_following_message_there_are_unapplied_network_changes_apply_them_now_unapplied_changes_will_be_lost_should_appear(driver):
    """The following message "There are unapplied network changes. Apply them now? Unapplied changes will be lost." should appear."""


@then('You should be able to confirm and close.')
def you_should_be_able_to_confirm_and_close(driver):
    """You should be able to confirm and close."""


@then('The following message "Network changes have been applied. Keep changes permanently? Changes will be automatically discarded if they are not permanently applied." should appear')
def the_following_message_network_changes_have_been_applied_keep_changes_permanently_changes_will_be_automatically_discarded_if_they_are_not_permanently_applied_should_appear(driver):
    """The following message "Network changes have been applied. Keep changes permanently? Changes will be automatically discarded if they are not permanently applied." should appear."""


@then('You should be able to select keep network change permanently.')
def you_should_be_able_to_select_keep_network_change_permanently(driver):
    """You should be able to select keep network change permanently."""


@then('Finally you should see a message indicating that network changes have been applied')
def finally_you_should_see_a_message_indicating_that_network_changes_have_been_applied(driver):
    """Finally you should see a message indicating that network changes have been applied."""


@then('Finally you should see a message indicating that network changes have been applied, and you should be able to close.')
def finally_you_should_see_a_message_indicating_that_network_changes_have_been_applied_and_you_should_be_able_to_close(driver):
    """Finally you should see a message indicating that network changes have been applied, and you should be able to close."""


@then('If any other information is required such as failover group, vhid this test fails.')
def if_any_other_information_is_required_such_as_failover_group_vhid_this_test_fails(driver):
    """If any other information is required such as failover group, vhid this test fails."""


@then('For type select link vlan, For name enter vlan1043')
def for_type_select_link_vlan_for_name_enter_vlan1043(driver):
    """For type select link vlan, For name enter vlan1043."""


@then('For description enter "vlan for functional testing" without quotes')
def for_description_enter_vlan_for_functional_testing_without_quotes(driver):
    """For description enter "vlan for functional testing" without quotes."""


@then('Select critical, For failover group select 2')
def select_critical_for_failover_group_select_2(driver):
    """Select critical, For failover group select 2."""


@then('For Failover VHID enter 30')
def for_failover_vhid_enter_30(driver):
    """For Failover VHID enter 30."""


@then('For parent interface select lagg0 created by previous step')
def for_parent_interface_select_lagg0_created_by_previous_step(driver):
    """For parent interface select lagg0 created by previous step."""


@then('For IP Address (This Conroller) enter 10.215.30.2 select /28 for netmask')
def for_ip_address_this_conroller_enter_10215302_select_28_for_netmask(driver):
    """For IP Address (This Conroller) enter 10.215.30.2 select /28 for netmask."""


@then('For IP Address (TrueNAS Controller 2) enter 10.215.30.3 select /28 netmask')
def for_ip_address_truenas_controller_2_enter_10215303_select_28_netmask(driver):
    """For IP Address (TrueNAS Controller 2) enter 10.215.30.3 select /28 netmask."""


@then('For Virtual IP address enter 10.215.30.4 and Press Apply')
def for_virtual_ip_address_enter_10215304_and_press_apply(driver):
    """For Virtual IP address enter 10.215.30.4 and Press Apply."""


@then('You should be able to close')
def you_should_be_able_to_close(driver):
    """You should be able to close."""


@then('Logout and log back in')
def logout_and_log_back_in(driver):
    """Logout and log back in."""


@then('You should be able to log in.')
def you_should_be_able_to_log_in(driver):
    """You should be able to log in."""


@then('Verify both controllers on dashboard')
def verify_both_controllers_on_dashboard(driver):
    """Verify both controllers on dashboard."""


@then('HA status icon should appear and it should reflect that HA is enabled when clicked')
def ha_status_icon_should_appear_and_it_should_reflect_that_ha_is_enabled_when_clicked(driver):
    """HA status icon should appear and it should reflect that HA is enabled when clicked."""
