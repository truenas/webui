# coding=utf-8
"""SCALE UI: feature tests."""

import time
from function import(
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_for_attribute_value,
    wait_on_element_disappear,
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)


@scenario('features/NAS-T1243.feature', 'SCALE UI: Verify that changing an encryption key format to PASSPHRASE functions')
def test_scale_ui_verify_that_changing_an_encryption_key_format_to_passphrase_functions():
    """SCALE UI: Verify that changing an encryption key format to PASSPHRASE functions."""


@given('the browser is open, the FreeNAS URL and logged in')
def the_browser_is_open_the_freenas_url_and_logged_in():
    """the browser is open, the FreeNAS URL and logged in."""
    raise NotImplementedError


@when('you are on the dashboard, click Storage on the side menu')
def you_are_on_the_dashboard_click_storage_on_the_side_menu():
    """you are on the dashboard, click Storage on the side menu."""
    raise NotImplementedError


@then('the pools page appears click the three dots for the encrypted pool')
def the_pools_page_appears_click_the_three_dots_for_the_encrypted_pool():
    """the pools page appears click the three dots for the encrypted pool."""
    raise NotImplementedError

@then('click encryption Options')
def click_encryption_options():
    """click encryption Options."""
    raise NotImplementedError


@then('set key type to passphrase')
def set_key_type_to_passphrase():
    """set key type to passphrase."""
    raise NotImplementedError


@then('enter acbd1234 and 1234abcd and verify that an error shows')
def enter_acbd1234_and_1234abcd_and_verify_that_an_error_shows():
    """enter acbd1234 and 1234abcd and verify that an error shows."""
    raise NotImplementedError


@then('enter abcd1234 for both fields and confirm and save')
def enter_abcd1234_for_both_fields_and_confirm_and_save():
    """enter abcd1234 for both fields and confirm and save."""
    raise NotImplementedError


@then('lock the pool when the pool page reloads')
def lock_the_pool_when_the_pool_page_reloads():
    """lock the pool when the pool page reloads."""
    raise NotImplementedError


@then('unlock the pool')
def unlock_the_pool():
    """unlock the pool."""
    raise NotImplementedError

