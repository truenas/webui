# coding=utf-8
"""High Availability feature tests."""

from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)


@scenario('features/NAS-T909.feature', 'Edit User Shell (tn-bhyve02)')
def test_edit_user_shell_tnbhyve02():
    """Edit User Shell (tn-bhyve02)."""


@given('The browser is open navigate to "tn-bhyve02.tn.ixsystems.net"')
def the_browser_is_open_navigate_to_tnbhyve02tnixsystemsnet():
    """The browser is open navigate to "tn-bhyve02.tn.ixsystems.net"."""


@when('If login page appear enter "root" and "testing"')
def if_login_page_appear_enter_root_and_testing():
    """If login page appear enter "root" and "testing"."""


@then('You should see the dashboard')
def you_should_see_the_dashboard():
    """You should see the dashboard."""


@then('Click on the Accounts item in the left side menu')
def click_on_the_accounts_item_in_the_left_side_menu():
    """Click on the Accounts item in the left side menu."""


@then('The Accounts menu should expand down')
def the_accounts_menu_should_expand_down():
    """The Accounts menu should expand down."""


@then('Click on Users')
def click_on_users():
    """Click on Users."""


@then('The Users page should open')
def the_users_page_should_open():
    """The Users page should open."""


@then('On the right side of the table, click the Greater-Than-Sign for one of the users')
def on_the_right_side_of_the_table_click_the_greaterthansign_for_one_of_the_users():
    """On the right side of the table, click the Greater-Than-Sign for one of the users."""


@then('The User Field should expand down to list further details')
def the_user_field_should_expand_down_to_list_further_details():
    """The User Field should expand down to list further details."""


@then('Click the Edit button that appears')
def click_the_edit_button_that_appears():
    """Click the Edit button that appears."""


@then('The User Edit Page should open')
def the_user_edit_page_should_open():
    """The User Edit Page should open."""


@then('Change the users shell and click save')
def change_the_users_shell_and_click_save():
    """Change the users shell and click save."""


@then('Change should be saved')
def change_should_be_saved():
    """Change should be saved."""


@then('Open the user drop down to verify the shell was changed')
def open_the_user_drop_down_to_verify_the_shell_was_changed():
    """Open the user drop down to verify the shell was changed."""


@then('Updated value should be visible')
def updated_value_should_be_visible():
    """Updated value should be visible."""
