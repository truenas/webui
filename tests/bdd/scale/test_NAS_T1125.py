# coding=utf-8
"""SCALE UI: Setting up LDAP and verify that it is setup on the NAS feature tests."""

from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)


@scenario('features/NAS-T1125.feature', 'SCALE UI: Setting up LDAP and verify that it is setup on the NAS')
def test_scale_ui_setting_up_ldap_and_verify_that_it_is_setup_on_the_nas():
    """SCALE UI: Setting up LDAP and verify that it is setup on the NAS."""


@given('the browser is open, the FreeNAS URL and logged in')
def the_browser_is_open_the_freenas_url_and_logged_in():
    """the browser is open, the FreeNAS URL and logged in."""
    raise NotImplementedError


@when('you should be on the dashboard, click on Credentials and then Directory Services.')
def you_should_be_on_the_dashboard_click_on_credentials_and_then_directory_services():
    """you should be on the dashboard, click on Credentials and then Directory Services.."""
    raise NotImplementedError


@then('the Directory Services page should open, then click LDAP settings button')
def the_directory_services_page_should_open_then_click_ldap_settings_button():
    """the Directory Services page should open, then click LDAP settings button."""
    raise NotImplementedError


@then('input ldap.jumpcloud.com for Hostname, "o=5f7743d18c0f3264d482b8f8,dc=jumpcloud,dc=com" Base DN, input "uid=qatesting,ou=Users,o=5f7743d18c0f3264d482b8f8,dc=jumpcloud,dc=com" for Bind DN, and input tr74BHhVm6he for Bind Password')
def input_ldapjumpcloudcom_for_hostname_o5f7743d18c0f3264d482b8f8dcjumpclouddccom_base_dn_input_uidqatestingouuserso5f7743d18c0f3264d482b8f8dcjumpclouddccom_for_bind_dn_and_input_tr74bhhvm6he_for_bind_password():
    """input ldap.jumpcloud.com for Hostname, "o=5f7743d18c0f3264d482b8f8,dc=jumpcloud,dc=com" Base DN, input "uid=qatesting,ou=Users,o=5f7743d18c0f3264d482b8f8,dc=jumpcloud,dc=com" for Bind DN, and input tr74BHhVm6he for Bind Password."""
    raise NotImplementedError


@then('click Advanced Options, then click Enable checkbox, then check Samba Schema, select ON for Encryption Mode, then click save')
def click_advanced_options_then_click_enable_checkbox_then_check_samba_schema_select_on_for_encryption_mode_then_click_save():
    """click Advanced Options, then click Enable checkbox, then check Samba Schema, select ON for Encryption Mode, then click save."""
    raise NotImplementedError


@then('wait for Please wait should appear while settings are applied, then after settings are applied, you should see Settings saved')
def wait_for_please_wait_should_appear_while_settings_are_applied_then_after_settings_are_applied_you_should_see_settings_saved():
    """wait for Please wait should appear while settings are applied, then after settings are applied, you should see Settings saved."""
    raise NotImplementedError


@then('run getent passwd eturgeon trough ssh, the ssh result should pass and return eturgeon info')
def run_getent_passwd_eturgeon_trough_ssh_the_ssh_result_should_pass_and_return_eturgeon_info():
    """run getent passwd eturgeon trough ssh, the ssh result should pass and return eturgeon info."""
    raise NotImplementedError