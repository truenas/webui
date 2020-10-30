# coding=utf-8
"""High Availability (tn-bhyve02) feature tests."""

from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)


@scenario('features/NAS-T939.feature', 'Create a smb share the ACL dataset')
def test_create_a_smb_share_the_acl_dataset():
    """Create a smb share the ACL dataset."""


@given('The browser is open navigate to "tn-bhyve02.tn.ixsystems.net"')
def the_browser_is_open_navigate_to_tnbhyve02tnixsystemsnet():
    """The browser is open navigate to "tn-bhyve02.tn.ixsystems.net"."""


@when('If login page appear enter "root" and "testing"')
def if_login_page_appear_enter_root_and_testing():
    """If login page appear enter "root" and "testing"."""


@then('You should see the dashboard and "System Information"')
def you_should_see_the_dashboard_and_system_information():
    """You should see the dashboard and "System Information"."""


@then('Click on Sharing then Windows Shares(SMB)')
def click_on_sharing_then_windows_sharessmb():
    """Click on Sharing then Windows Shares(SMB)."""


@then('The Windows Shares(SMB) page should open')
def the_windows_sharessmb_page_should_open():
    """The Windows Shares(SMB) page should open."""


@then('Click Add')
def click_add():
    """Click Add."""


@then('Set Path to the ACL dataset "/mnt/dozer/my_acl_dataset"')
def set_path_to_the_acl_dataset_mntdozermy_acl_dataset():
    """Set Path to the ACL dataset "/mnt/dozer/my_acl_dataset"."""


@then('Input "My smb test share" as description')
def input_my_smb_test_share_as_description():
    """Input "My smb test share" as description."""


@then('Input "mysmbshare" as name, Click to enable')
def input_mysmbshare_as_name_click_to_enable():
    """Input "mysmbshare" as name, Click to enable."""


@then('Click Summit')
def click_summit():
    """Click Summit."""


@then('The "mysmbshare" should be added')
def the_mysmbshare_should_be_added():
    """The "mysmbshare" should be added."""


@then('Click on service')
def click_on_service():
    """Click on service."""


@then('The Service page should open')
def the_service_page_should_open():
    """The Service page should open."""


@then('If the SMB serivce is not started start the service')
def if_the_smb_serivce_is_not_started_start_the_service():
    """If the SMB serivce is not started start the service."""


@then('Click on SMB Start Automatically checkbox')
def click_on_smb_start_automatically_checkbox():
    """Click on SMB Start Automatically checkbox."""
