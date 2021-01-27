# coding=utf-8
"""Core UI feature tests."""

from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T1013.feature', 'Create an smb share with the LDAP dataset and verify the connection')
def test_create_an_smb_share_with_the_ldap_dataset_and_verify_the_connection(driver):
    """Create an smb share with the LDAP dataset and verify the connection."""


@given('the browser is open on the TrueNAS URL and logged in')
def the_browser_is_open_on_the_truenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open on the TrueNAS URL and logged in."""


@when('you should be on the dashboard')
def you_should_be_on_the_dashboard(driver):
    """you should be on the dashboard."""


@then('click on Sharing on the side menu and click Windows Shares')
def click_on_sharing_on_the_side_menu_and_click_windows_shares(driver):
    """click on Sharing on the side menu and click Windows Shares."""


@then('when the Windows Shares page appears, click Add')
def when_the_windows_shares_page_appears_click_add(driver):
    """when the Windows Shares page appears, click Add."""


@then(parsers.parse('set Path to the LDAP dataset at {path}'))
def set_path_to_the_ldap_dataset_at_mntdozermy_ldap_dataset(driver):
    """set Path to the LDAP dataset at /mnt/dozer/my_ldap_dataset."""


@then(parsers.parse('input {smbname} as name, click to enable'))
def input_ldapsmbshare_as_name_click_to_enable(driver):
    """input ldapsmbshare as name, click to enable."""


@then(parsers.parse('input "{description}" as the description, click Summit'))
def input_my_ldap_smb_test_share_as_the_description_click_summit(driver):
    """input "My LDAP smb test share" as the description, click Summit."""


@then(parsers.parse('the {smbname} should be added to the Windows Shares list'))
def the_ldapsmbshare_should_be_added_to_the_windows_shares_list(driver):
    """the ldapsmbshare should be added to the Windows Shares list."""


@then('click on service on the side menu')
def click_on_service_on_the_side_menu(driver):
    """click on service on the side menu."""


@then('the Service page should open')
def the_service_page_should_open(driver):
    """the Service page should open."""


@then('if the SMB service is not started, start the service')
def if_the_smb_service_is_not_started_start_the_service(driver):
    """if the SMB service is not started, start the service."""


@then(parsers.parse('send a file to the share with ip/{smbname} and {ldap_user}%{ldap_password}'))
def send_a_file_to_the_share_with_ip_ldapsmbshare_and_ldap_user_ldap_password(driver):
    """send a file to the share with ip/ldapsmbshare and ldap_user%ldap_password."""


@then('verify that the file is on the NAS dataset')
def verify_that_the_file_is_on_the_nas_dataset(driver):
    """verify that the file is on the NAS dataset."""


@then('click on Directory Services then LDAP')
def click_on_directory_services_then_ldap(driver):
    """click on Directory Services then LDAP."""


@then('click the Enable checkbox and click SAVE')
def click_the_enable_checkbox_and_click_save(driver):
    """click the Enable checkbox and click SAVE."""
