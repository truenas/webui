# coding=utf-8
"""High Availability (tn09) feature tests."""

from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)


@scenario('features/NAS-T922.feature', 'Verify vlan1043 with lagg0 parrent interface MTU can be change to 9000')
def test_verify_vlan1043_with_lagg0_parrent_interface_mtu_can_be_change_to_9000():
    """Verify vlan1043 with lagg0 parrent interface MTU can be change to 9000."""


@given('the browser is open navigate to "http://tn09a.lab.ixsystems.com"')
def the_browser_is_open_navigate_to_httptn09alabixsystemscom():
    """the browser is open navigate to "http://tn09a.lab.ixsystems.com"."""


@when('login appear enter "root" and "abcd1234"')
def login_appear_enter_root_and_abcd1234():
    """login appear enter "root" and "abcd1234"."""


@then('you should see the dashboard')
def you_should_see_the_dashboard():
    """you should see the dashboard."""


@then('navigate to System then to Failover')
def navigate_to_system_then_to_failover():
    """navigate to System then to Failover."""


@then('the Failover Page should open')
def the_failover_page_should_open():
    """the Failover Page should open."""


@then('select disable failover and click save Check confirm on the warning dialog and press OK')
def select_disable_failover_and_click_save_check_confirm_on_the_warning_dialog_and_press_ok():
    """select disable failover and click save Check confirm on the warning dialog and press OK."""


@then('a dialog should appear while applying settings')
def a_dialog_should_appear_while_applying_settings():
    """a dialog should appear while applying settings."""


@then('navigate to Network then to Interfaces')
def navigate_to_network_then_to_interfaces():
    """navigate to Network then to Interfaces."""


@then('the interface page should open.')
def the_interface_page_should_open():
    """the interface page should open.."""


@then('click on lagg0 expender, then click edit')
def click_on_lagg0_expender_then_click_edit():
    """click on lagg0 expender, then click edit."""


@then('lagg0 Interface Settings should appear')
def lagg0_interface_settings_should_appear():
    """lagg0 Interface Settings should appear."""


@then('set mtu to 9000 and Click Apply')
def set_mtu_to_9000_and_click_apply():
    """set mtu to 9000 and Click Apply."""


@then('"Please wait" should appear while settings are being applied')
def please_wait_should_appear_while_settings_are_being_applied():
    """"Please wait" should appear while settings are being applied."""


@then('click Test Changes, check Confirm, Click Test Changes again')
def click_test_changes_check_confirm_click_test_changes_again():
    """click Test Changes, check Confirm, Click Test Changes again."""


@then('click Save Changes, Click Save')
def click_save_changes_click_save():
    """click Save Changes, Click Save."""


@then('a message indicating that network changes have been applied should appeared, and you should be able to close')
def a_message_indicating_that_network_changes_have_been_applied_should_appeared_and_you_should_be_able_to_close():
    """a message indicating that network changes have been applied should appeared, and you should be able to close."""


@then('click on vlan1043 expender, then click edit')
def click_on_vlan1043_expender_then_click_edit():
    """click on vlan1043 expender, then click edit."""


@then('vlan1043 Interface Settings should appear')
def vlan1043_interface_settings_should_appear():
    """vlan1043 Interface Settings should appear."""


@then('logout and log back in')
def logout_and_log_back_in():
    """logout and log back in."""


@then('you should be able to log in.')
def you_should_be_able_to_log_in():
    """you should be able to log in.."""


@then('verify both "A1-46474" and "A1-46475" controllers are on dashboard')
def verify_both_a146474_and_a146475_controllers_are_on_dashboard():
    """verify both "A1-46474" and "A1-46475" controllers are on dashboard."""


@then('HA status icon should appear and it should reflect that HA is enabled when clicked')
def ha_status_icon_should_appear_and_it_should_reflect_that_ha_is_enabled_when_clicked():
    """HA status icon should appear and it should reflect that HA is enabled when clicked."""
