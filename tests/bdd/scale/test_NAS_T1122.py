# coding=utf-8
"""SCALE UI: feature tests."""

from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)


@scenario('features/NAS-T1122.feature', 'Add an ACL Item and verify is preserve on the system ACL dataset')
def test_add_an_acl_item_and_verify_is_preserve_on_the_system_acl_dataset():
    """Add an ACL Item and verify is preserve on the system ACL dataset."""


@given('the browser is open, the FreeNAS URL and logged in')
def the_browser_is_open_the_freenas_url_and_logged_in():
    """the browser is open, the FreeNAS URL and logged in."""
    raise NotImplementedError


@when('you should be on the dashboard')
def you_should_be_on_the_dashboard():
    """you should be on the dashboard."""
    raise NotImplementedError


@then('click Storage on the side menu and click on the "my_acl_dataset" 3 dots button, select Edit Permissions')
def click_storage_on_the_side_menu_and_click_on_the_my_acl_dataset_3_dots_button_select_edit_permissions():
    """click Storage on the side menu and click on the "my_acl_dataset" 3 dots button, select Edit Permissions."""
    raise NotImplementedError


@then('click on Add ACL Item, click on select User, User input should appear, enter "eric" and select "ericbsd"')
def click_on_add_acl_item_click_on_select_user_user_input_should_appear_enter_eric_and_select_ericbsd():
    """click on Add ACL Item, click on select User, User input should appear, enter "eric" and select "ericbsd"."""
    raise NotImplementedError


@then('click the Save button, return to the Pools page, click on the "my_acl_dataset" 3 dots button, select Edit Permissions')
def click_the_save_button_return_to_the_pools_page_click_on_the_my_acl_dataset_3_dots_button_select_edit_permissions():
    """click the Save button, return to the Pools page, click on the "my_acl_dataset" 3 dots button, select Edit Permissions."""
    raise NotImplementedError


@then('the Edit ACL page should open')
def the_edit_acl_page_should_open():
    """the Edit ACL page should open."""
    raise NotImplementedError


@then('the Edit ACL page should open, verify the new ACL item for user "ericbsd" exists')
def the_edit_acl_page_should_open_verify_the_new_acl_item_for_user_ericbsd_exists():
    """the Edit ACL page should open, verify the new ACL item for user "ericbsd" exists."""
    raise NotImplementedError

