# coding=utf-8
"""SCALE UI: feature tests."""

from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)


@scenario('features/NAS-T1131.feature', 'Create a new dataset with the wheel group with 775 permission')
def test_create_a_new_dataset_with_the_wheel_group_with_775_permission():
    """Create a new dataset with the wheel group with 775 permission."""


@given('the browser is open, the FreeNAS URL and logged in')
def the_browser_is_open_the_freenas_url_and_logged_in():
    """the browser is open, the FreeNAS URL and logged in."""
    raise NotImplementedError


@when('you should be on the dashboard, click on credentials and local accounts')
def you_should_be_on_the_dashboard_click_on_credentials_and_local_accounts():
    """you should be on the dashboard, click on credentials and local accounts."""
    raise NotImplementedError


@then('click on Storage in the side menu and click the tank three dots and add dataset')
def click_on_storage_in_the_side_menu_and_click_the_tank_three_dots_and_add_dataset():
    """click on Storage in the side menu and click the tank three dots and add dataset."""
    raise NotImplementedError


@then('the Edit Permissions page should open, select root for User, click on the Apply User checkbox, select wheel for Group name, click on the Apply Group checkbox, click on Group Write Access, and click the Save button')
def the_edit_permissions_page_should_open_select_root_for_user_click_on_the_apply_user_checkbox_select_wheel_for_group_name_click_on_the_apply_group_checkbox_click_on_group_write_access_and_click_the_save_button():
    """the Edit Permissions page should open, select root for User, click on the Apply User checkbox, select wheel for Group name, click on the Apply Group checkbox, click on Group Write Access, and click the Save button."""
    raise NotImplementedError


@then('the add datasetpage should open, input "wheel_dataset" for the naem and click save')
def the_add_datasetpage_should_open_input_wheel_dataset_for_the_naem_and_click_save():
    """the add datasetpage should open, input "wheel_dataset" for the naem and click save."""
    raise NotImplementedError


@then('the wheel_dataset should be created, click the dataset three dots and select View Permissions, then click the pencil to Edit')
def the_wheel_dataset_should_be_created_click_the_dataset_three_dots_and_select_view_permissions_then_click_the_pencil_to_edit():
    """the wheel_dataset should be created, click the dataset three dots and select View Permissions, then click the pencil to Edit."""
    raise NotImplementedError


@then('verify that the user is root and the group is wheel')
def verify_that_the_user_is_root_and_the_group_is_wheel():
    """verify that the user is root and the group is wheel."""
    raise NotImplementedError


@then('you should be returned to the pool list page, click on the wheel_dataset three dots button, view and edit Permissions, and the Edit Permissions page should open')
def you_should_be_returned_to_the_pool_list_page_click_on_the_wheel_dataset_three_dots_button_view_and_edit_permissions_and_the_edit_permissions_page_should_open():
    """you should be returned to the pool list page, click on the wheel_dataset three dots button, view and edit Permissions, and the Edit Permissions page should open."""
    raise NotImplementedError

