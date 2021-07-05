# coding=utf-8
"""Core UI feature tests."""

from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T1118.feature', 'Verify Amazon S3 credentials can be added')
def test_verify_amazon_s3_credentials_can_be_added(driver):
    """Verify Amazon S3 credentials can be added."""


@given('the browser is open on the TrueNAS URL and logged in')
def the_browser_is_open_on_the_truenas_url_and_logged_in(driver):
    """the browser is open on the TrueNAS URL and logged in."""


@when('on the dashboard, click system on the left sidebar, then click on Cloud Credentials')
def on_the_dashboard_click_system_on_the_left_sidebar_then_click_on_cloud_credentials(driver):
    """on the dashboard, click system on the left sidebar, then click on Cloud Credentials."""


@then('on the Cloud Credentials page, click Add')
def on_the_cloud_credentials_page_click_add(driver):
    """on the Cloud Credentials page, click Add."""


@then(parsers.parse('input {account_name} as Name, select Amazon S3 has Provider'))
def input_account_name_as_name_select_amazon_s3_has_provider(driver, account_name):
    """input account_name as Name, select Amazon S3 has Provider."""


@then(parsers.parse('input "{key_id}" as for Access Key ID'))
def input_key_id_as_for_access_key_id(driver, key_id):
    """input "{key_id}" as for Access Key ID."""


@then(parsers.parse('input "{access_key}" as Secret Access Key'))
def input_access_key_as_secret_access_key(driver, access_key):
    """input "{access_key}" as Secret Access Key."""


@then('click Verify Credential to verify it is valid')
def click_verify_credential_to_verify_it_is_valid(driver):
    """click Verify Credential to verify it is valid."""


@then(parsers.parse('click Summit, {account_name} should be added to the list'))
def click_summit_account_name_should_be_added_to_the_list(driver, account_name):
    """click Summit, account_name should be added to the list."""


@then(parsers.parse('click on three dots of {account_name} and select Edit'))
def click_on_three_dots_of_account_name_and_select_edit(driver, account_name):
    """click on three dots of account_name and select Edit."""


@then('click Verify Credential to verify the access key is invalid')
def click_verify_credential_to_verify_the_access_key_is_invalid(driver):
    """click Verify Credential to verify the access key is invalid."""


@then('remove the last character from Access Key ID')
def remove_the_last_character_from_access_key_id(driver):
    """remove the last character from Access Key ID."""


@then('correct the Access Key ID then remove the last character from Secret Access Key')
def correct_access_key_id_then_remove_the_last_character_from_secret_access_key(driver):
    """Correct Access Key ID then remove the last character from Secret Access Key."""
