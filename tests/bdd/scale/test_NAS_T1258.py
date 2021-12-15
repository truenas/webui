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

@scenario('features/NAS-T1258.feature', 'Verify a Certificate Signing Request can be created')
def test_verify_a_certificate_signing_request_can_be_created():
    """Verify a Certificate Signing Request can be created."""


@given('the browser is open, navigate to the SCALE URL, and login')
def the_browser_is_open_navigate_to_the_scale_url_and_login():
    """the browser is open, navigate to the SCALE URL, and login."""
    raise NotImplementedError


@when('on the Dashboard, click on credentials and certificates')
def on_the_dashboard_click_on_credentials_and_certificates():
    """on the Dashboard, click on credentials and certificates."""
    raise NotImplementedError


@then('click on CSR add')
def click_on_csr_add():
    """click on CSR add."""
    raise NotImplementedError


@then('set name and type and click next')
def set_name_and_type_and_click_next():
    """set name and type and click next."""
    raise NotImplementedError


@then('set key info and click next')
def set_key_info_and_click_next():
    """set key info and click next."""
    raise NotImplementedError


@then('set company info and click next')
def set_company_info_and_click_next():
    """set company info and click next."""
    raise NotImplementedError


@then('set extra constraints and click next')
def set_extra_constraints_and_click_next():
    """set extra constraints and click next."""
    raise NotImplementedError


@then('click save on the confirm options page')
def click_save_on_the_confirm_options_page():
    """click save on the confirm options page."""
    raise NotImplementedError


@then('verify that the CSR was added')
def verify_that_the_csr_was_added():
    """verify that the CSR was added."""
    raise NotImplementedError

