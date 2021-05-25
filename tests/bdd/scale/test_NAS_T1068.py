# coding=utf-8
"""SCALE UI feature tests."""

import time
from function (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_for_attribute_value,
)    
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)


@scenario('features/NAS-T1068.feature', 'Change Shell for user')
def test_change_shell_for_user():
    """Change Shell for user."""


@given('the browser is open, the FreeNAS URL and logged in')
def the_browser_is_open_the_freenas_url_and_logged_in():
    """the browser is open, the FreeNAS URL and logged in."""
    raise NotImplementedError


@when('you should be on the dashboard, click on the Accounts on the side menu, click on Users')
def you_should_be_on_the_dashboard_click_on_the_accounts_on_the_side_menu_click_on_users():
    """you should be on the dashboard, click on the Accounts on the side menu, click on Users."""
    raise NotImplementedError


@when('the Users page should open, click the Greater-Than-Sign right of the users')
def the_users_page_should_open_click_the_down_carat_sign_right_of_the_users():
    """the Users page should open, click the Greater-Than-Sign right of the users."""
    raise NotImplementedError


@when('the User Field should expand down, then click the Edit button')
def the_user_field_should_expand_down_then_click_the_edit_button():
    """the User Field should expand down, then click the Edit button."""
    raise NotImplementedError


@then('the User Edit Page should open')
def the_user_edit_page_should_open():
    """the User Edit Page should open."""
    raise NotImplementedError


@then('change the user shell and click save')
def change_the_user_shell_and_click_save():
    """change the user shell and click save."""
    raise NotImplementedError


@then('open the user dropdown, and verify the shell value has changed')
def open_the_user_dropdown_and_verify_the_shell_value_has_changed():
    """open the user dropdown, and verify the shell value has changed."""
    raise NotImplementedError




