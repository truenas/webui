# coding=utf-8
"""SCALE UI: feature tests."""

from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)


@scenario('features/NAS-T1244.feature', 'Verify locking and unlocking volume using passphrase')
def test_verify_locking_and_unlocking_volume_using_passphrase():
    """Verify locking and unlocking volume using passphrase."""


@given('the browser is open, the FreeNAS URL and logged in')
def the_browser_is_open_the_freenas_url_and_logged_in():
    """the browser is open, the FreeNAS URL and logged in."""
    raise NotImplementedError


@when('you are on the dashboard, click Storage on the side menu')
def you_are_on_the_dashboard_click_storage_on_the_side_menu():
    """you are on the dashboard, click Storage on the side menu."""
    raise NotImplementedError


@then('enter abcd1234 for both fields and confirm and save')
def enter_abcd1234_for_both_fields_and_confirm_and_save():
    """enter abcd1234 for both fields and confirm and save."""
    raise NotImplementedError


@then('enter acbd1234 and 1234abcd and verify that an error shows')
def enter_acbd1234_and_1234abcd_and_verify_that_an_error_shows():
    """enter acbd1234 and 1234abcd and verify that an error shows."""
    raise NotImplementedError


@then('lock the encrypted pool')
def lock_the_encrypted_pool():
    """lock the encrypted pool."""
    raise NotImplementedError


@then('unlock the pool')
def unlock_the_pool():
    """unlock the pool."""
    raise NotImplementedError

