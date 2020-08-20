# coding=utf-8
"""High Availability (tn09) feature tests."""

from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T926.feature', 'Setting up Active Directory with the new system dataset')
def test_setting_up_active_directory_with_the_new_system_dataset():
    """Setting up Active Directory with the new system dataset."""


@given(parsers.parse('the browser is open navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url():
    """the browser is open navigate to "{nas_url}"."""


@when(parsers.parse('if login page appear enter "{user}" and "{password}"'))
def if_login_page_appear_enter_root_and_password():
    """if login page appear enter "{user}" and "{password}"."""


@then('you should see the dashboard and "System Information"')
def you_should_see_the_dashboard_and_system_information():
    """you should see the dashboard and "System Information"."""


@then('navigate to Network then Global Configuration')
def navigate_to_network_then_global_configuration():
    """navigate to Network then Global Configuration."""


@then('the Network Global Configuration page should open')
def the_network_global_configuration_page_should_open():
    """the Network Global Configuration page should open."""


@then(parsers.parse('change the first nameserver to "{ad_nameserver}" and Dommain to "{ad_domain}"'))
def change_the_first_nameserver_to_ad_nameserver_and_dommain_to_ad_domain():
    """change the first nameserver to "{ad_nameserver}" and Dommain to "{ad_domain}"."""


@then('click SAVE "Please wait" should appear while settings are being applied')
def click_save_please_wait_should_appear_while_settings_are_being_applied():
    """click SAVE "Please wait" should appear while settings are being applied."""


@then('navigate to Directory Services then Active Directory')
def navigate_to_directory_services_then_active_directory():
    """navigate to Directory Services then Active Directory."""


@then('the Domain Credentials page should open')
def the_domain_credentials_page_should_open():
    """the Domain Credentials page should open."""


@then(parsers.parse('input Domain name "{ad_domain}", Account name "{ad_user}", Password "ad_password"'))
def input_domain_name_ad_domain_account_name_ad_user_password_ad_pasword():
    """input Domain name "{ad_domain}", Account name "{ad_user}", Password "ad_password"."""


@then(parsers.parse('click advanced, and input "{ca_ou}" to Computer Account OU'))
def click_advanced_and_input_truenas_servers_to_computer_account_ou():
    """click advanced, and input "{ca_ou}" to Computer Account OU."""


@then('check the Enable box and click SAVE')
def check_the_enable_box_and_click_save():
    """check the Enable box and click SAVE."""


@then('active Directory should successfully save and start without an error')
def active_directory_should_successfully_save_and_start_without_an_error():
    """active Directory should successfully save and start without an error."""


@then('navigate to Shell')
def navigate_to_shell():
    """navigate to Shell."""


@then('Shell should should open')
def shell_should_should_open():
    """Shell should should open."""


@then(parsers.parse('input "{cmd}"'))
def input_wbinfo_u():
    """input "wbinfo -u"."""


@then(parsers.parse('verify that "{ad_object}" is in  wbinfo -u output'))
def verify_that_ad_object_is_in__wbinfo_u_output():
    """verify that "{ad_object}" is in  wbinfo -u output."""


@then(parsers.parse('input "{cmd}"'))
def input_wbinfo_g():
    """input "wwbinfo -g"."""


@then(parsers.parse('verify that "{ad_object}" is in wbinfo -g output'))
def verify_that_ad01domain_admin_is_in_wbinfo_g_output():
    """verify that "{ad_object}" is in wbinfo -g output."""


@then(parsers.parse('input "{cmd}"'))
def input_wbinfo_t():
    """input "wbinfo -t"."""


@then('verify that the trust secret succeeded')
def verify_that_the_trust_secret_succeeded():
    """verify that the trust secret succeeded."""


@then('navigate to Storage click Pools')
def navigate_to_storage_click_pools():
    """navigate to Storage click Pools."""


@then('the Pools page should open')
def the_pools_page_should_open():
    """the Pools page should open."""


@then('click on the dozer 3 dots button, select Add Dataset')
def click_on_the_dozer_3_dots_button_select_add_dataset():
    """click on the dozer 3 dots button, select Add Dataset."""


@then('the Add Dataset Name and Options page should open')
def the_add_dataset_name_and_options_page_should_open():
    """the Add Dataset Name and Options page should open."""


@then(parsers.parse('input dataset name "{dataset_name}" and click save'))
def input_dataset_name_my_acl_dataset_and_click_save():
    """input dataset name "{dataset_name}" and click save."""


@then('"my_acl_dataset" should be created')
def my_acl_dataset_should_be_created():
    """"my_acl_dataset" should be created."""


@then('click on "my_acl_dataset" 3 dots button, select Edit Permissions')
def click_on_my_acl_dataset_3_dots_button_select_edit_permissions():
    """click on "my_acl_dataset" 3 dots button, select Edit Permissions."""


@then('the Edit Permissions page should open')
def the_edit_permissions_page_should_open():
    """the Edit Permissions page should open."""


@then('click on Use ACL Manager')
def click_on_use_acl_manager():
    """click on Use ACL Manager."""


@then('the Edit ACL page should open')
def the_edit_acl_page_should_open():
    """the Edit ACL page should open."""


@then(parsers.parse('setting permissions set User to root and then select "{group_name}" for Groups, check the Apply Group and select OPEN for Default ACL Option'))
def setting_permissions_set_user_to_root_and_then_select_ad01administrator_for_groups_check_the_apply_group_and_select_open_for_default_acl_option():
    """setting permissions set User to root and then select "{group_name}" for Groups, check the Apply Group and select OPEN for Default ACL Option."""


@then('click the Save button')
def click_the_save_button():
    """click the Save button."""
