# coding=utf-8
"""Core UI feature tests."""

from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parses
)


@scenario('features/NAS-T1012.feature', 'Create a new dataset with the LDAP user and group permissions')
def test_create_a_new_dataset_with_the_ldap_user_and_group_permissions(driver, nas_ip, root_password):
    """Create a new dataset with the LDAP user and group permissions."""


@given('the browser is open on the TrueNAS URL and logged in')
def the_browser_is_open_on_the_truenas_url_and_logged_in(driver):
    """the browser is open on the TrueNAS URL and logged in."""


@when('you should be on the dashboard')
def you_should_be_on_the_dashboard(driver):
    """you should be on the dashboard."""


@then('click Storage on the side menu and click Pools')
def click_storage_on_the_side_menu_and_click_pools(driver):
    """click Storage on the side menu and click Pools."""


@then('the Pools page should open')
def the_pools_page_should_open(driver):
    """the Pools page should open."""


@then('click on the tank three dots button, select Add Dataset')
def click_on_the_tank_three_dots_button_select_add_dataset(driver):
    """click on the tank three dots button, select Add Dataset."""


@then('the Add Dataset Name and Options page should open')
def the_add_dataset_name_and_options_page_should_open(driver):
    """the Add Dataset Name and Options page should open."""


@then('input dataset name {dataset_name} and click save')
def input_dataset_name_my_ldap_dataset_and_click_save(driver, dataset_name):
    """input dataset name my_ldap_dataset and click save."""


@then('{dataset_name}should be created')
def my_ldap_dataset_should_be_created(driver, dataset_name):
    """my_ldap_dataset should be created."""


@then('click on the {dataset_name} three dots button, select Edit Permissions')
def click_on_the_my_ldap_dataset_three_dots_button_select_edit_permissions(driver, dataset_name):
    """click on the my_ldap_dataset three dots button, select Edit Permissions."""


@then('the Edit Permissions page should open')
def the_edit_permissions_page_should_open(driver):
    """the Edit Permissions page should open."""


@then(parses.parse('select {ldap_user} for User, click on the Apply User checkbox'))
def select_ldap_user_for_user_click_on_the_apply_user_checkbox(driver, ldap_user):
    """select ldap_user for User, click on the Apply User checkbox."""


@then('select {ldap_user} for Group name, click on the Apply Group checkbox')
def select_ldap_user_for_group_name_click_on_the_apply_group_checkbox(driver, ldap_user):
    """select ldap_user for Group name, click on the Apply Group checkbox."""


@then('click the Save button, should be returned to the pool page')
def click_the_save_button_should_be_returned_to_the_pool_page(driver):
    """click the Save button, should be returned to the pool page."""


@then('verify that user and group name is {ldap_user}')
def verify_that_user_and_group_name_is_ldap_user(driver, ldap_user):
    """verify that user and group name is ldap_user."""
