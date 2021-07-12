# coding=utf-8
"""SCALE UI: feature tests."""

from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)


@scenario('features/NAS-T1126.feature', 'Create a new dataset with the LDAP user and group permissions')
def test_create_a_new_dataset_with_the_ldap_user_and_group_permissions():
    """Create a new dataset with the LDAP user and group permissions."""


@given('the browser is open, the FreeNAS URL and logged in')
def the_browser_is_open_the_freenas_url_and_logged_in():
    """the browser is open, the FreeNAS URL and logged in."""
    raise NotImplementedError


@when('you should be on the dashboard, click on Storage.')
def you_should_be_on_the_dashboard_click_on_storage():
    """you should be on the dashboard, click on Storage.."""
    raise NotImplementedError


@then('on the storage page, click on the my_ldap_dataset three dots button, select Edit Permissions and verify that user and group name is eturgeon')
def on_the_storage_page_click_on_the_my_ldap_dataset_three_dots_button_select_edit_permissions_and_verify_that_user_and_group_name_is_eturgeon():
    """on the storage page, click on the my_ldap_dataset three dots button, select Edit Permissions and verify that user and group name is eturgeon."""
    raise NotImplementedError


@then('the Dataset window should open, input dataset name my_ldap_dataset and click save')
def the_dataset_window_should_open_input_dataset_name_my_ldap_dataset_and_click_save():
    """the Dataset window should open, input dataset name my_ldap_dataset and click save."""
    raise NotImplementedError


@then('the my_ldap_dataset should be created, click on the my_ldap_dataset three dots button, select Edit Permissions')
def the_my_ldap_dataset_should_be_created_click_on_the_my_ldap_dataset_three_dots_button_select_edit_permissions():
    """the my_ldap_dataset should be created, click on the my_ldap_dataset three dots button, select Edit Permissions."""
    raise NotImplementedError


@then('the Edit Permissions page should open, select eturgeon for User, click on the Apply User checkbox, then select eturgeon for Group name, click on the Apply Group checkbox, and click the Save button')
def the_edit_permissions_page_should_open_select_eturgeon_for_user_click_on_the_apply_user_checkbox_then_select_eturgeon_for_group_name_click_on_the_apply_group_checkbox_and_click_the_save_button():
    """the Edit Permissions page should open, select eturgeon for User, click on the Apply User checkbox, then select eturgeon for Group name, click on the Apply Group checkbox, and click the Save button."""
    raise NotImplementedError


@then('the storage page should open, then click on the tank three dots button, select Add Dataset')
def the_storage_page_should_open_then_click_on_the_tank_three_dots_button_select_add_dataset():
    """the storage page should open, then click on the tank three dots button, select Add Dataset."""
    raise NotImplementedError

