# coding=utf-8
"""High Availability (tn-bhyve02) feature tests."""

from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T934.feature', 'Add an ACL Item and verify is preserve')
def test_add_an_acl_item_and_verify_is_preserve():
    """Add an ACL Item and verify is preserve."""


@given(parsers.parse('The browser is open navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url):
    """The browser is open navigate to "{nas_url}"."""


@when(parsers.parse('If login page appear enter "{user}" and "{password}"'))
def if_login_page_appear_enter_root_and_testing(driver, user, password):
    """If login page appear enter "{user}" and "{password}"."""


@then('You should see the dashboard and "System Information"')
def you_should_see_the_dashboard_and_system_information(driver):
    """You should see the dashboard and "System Information"."""


@then('Navigate to Storage click Pools')
def navigate_to_storage_click_pools(driver):
    """Navigate to Storage click Pools."""


@then('The Pools page should open')
def the_pools_page_should_open(driver):
    """The Pools page should open."""


@then('On the dozer pool click on "my_acl_dataset" 3 dots button, select Edit Permissions')
def on_the_dozer_pool_click_on_my_acl_dataset_3_dots_button_select_edit_permissions(driver):
    """On the dozer pool click on "my_acl_dataset" 3 dots button, select Edit Permissions."""


@then('The Edit ACL page should open')
def the_edit_acl_page_should_open(driver):
    """The Edit ACL page should open."""


@then('Click on Add ACL Item')
def click_on_add_acl_item(driver):
    """Click on Add ACL Item."""


@then('The new ACL item should be added')
def the_new_acl_item_should_be_added(driver):
    """The new ACL item should be added."""


@then('Click on who select User')
def click_on_who_select_user(driver):
    """Click on who select User."""


@then('The User input should appear')
def the_user_input_should_appear(driver):
    """The User input should appear."""


@then(parsers.parse('In User Input enter "{input}" and select "{user}"'))
def in_user_input_enter_eric_and_select_ericbsd(driver, input, user):
    """In User Input enter "{input}" and select "{user}"."""


@then('Click the Save button, should be return to pool page')
def click_the_save_button_should_be_return_to_pool_page(driver):
    """Click the Save button, should be return to pool page."""


@then('Click on "my_acl_dataset" 3 dots button, select Edit Permissions')
def click_on_my_acl_dataset_3_dots_button_select_edit_permissions(driver):
    """Click on "my_acl_dataset" 3 dots button, select Edit Permissions."""


@then(parsers.parse('Verify the new ACL item for user "{user}" still exist'))
def verify_the_new_acl_item_for_user_name_still_exist(driver, user):
    """Verify the new ACL item for user "{user}" still exist."""


@then('Navigate to Dashboard')
def navigate_to_dashboard(driver):
    """Navigate to Dashboard."""
