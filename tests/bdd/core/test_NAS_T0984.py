# coding=utf-8
"""Core UI feature tests."""

from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)


@scenario('features/NAS-T984.feature', 'Setting interface from dhcp to a static ip')
def test_setting_interface_from_dhcp_to_a_static_ip(driver):
    """Setting interface from dhcp to a static ip."""


@given('the browser is open, the FreeNAS URL and logged in')
def the_browser_is_open_the_freenas_url_and_logged_in(driver):
    """the browser is open, the FreeNAS URL and logged in."""


@when('you see the dashboard')
def you_see_the_dashboard(driver):
    """you see the dashboard."""


@then('click Network on the side menu and click interface')
def click_network_on_the_side_menu_and_click_interface(driver):
    """click Network on the side menu and click interface."""


@then('when the Interfaces page appears, click on vnet0')
def when_the_interfaces_page_appears_click_on_vnet0(driver):
    """when the Interfaces page appears, click on vnet0."""


@then('click on Edit, the Interface Settings page should open')
def click_on_edit_the_interface_settings_page_should_open(driver):
    """click on Edit, the Interface Settings page should open."""


@then('uncheck DHCP, input the NAS IP, then click APPLY')
def uncheck_dhcp_input_the_nas_ip_then_click_apply(driver):
    """uncheck DHCP, input the NAS IP, then click APPLY."""


@then('"Please wait" should appear while settings are being applied.')
def please_wait_should_appear_while_settings_are_being_applied(driver):
    """"Please wait" should appear while settings are being applied.."""


@then('click Test Changes, check Confirm, click Test Changes again')
def click_test_changes_check_confirm_click_test_changes_again(driver):
    """click Test Changes, check Confirm, click Test Changes again."""


@then('"Please wait" should appear will Test Changes is happening')
def please_wait_should_appear_will_test_changes_is_happening(driver):
    """"Please wait" should appear will Test Changes is happening."""


@then('There are unapplied network interface changes should appear click "Save Changes"')
def there_are_unapplied_network_interface_changes_should_appear_click_save_changes():
    """There are unapplied network interface changes should appear click "Save Changes"."""


@then('on the Save Changes widget, click Save')
def on_the_save_changes_widget_click_save(driver):
    """on the Save Changes widget, click Save."""


@then('on the Saved Changes widget, click CLOSE')
def on_the_save_changes_widget_click_close(driver):
    """on the Saved Changes widget, click CLOSE."""


@then('on the Interfaces page vnet0 DHCP should be "no"')
def on_the_interfaces_page_vnet0_dhcp_should_be_no(driver):
    """on the Interfaces page vnet0 DHCP should be "no"."""
