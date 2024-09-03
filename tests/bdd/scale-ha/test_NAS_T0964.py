# coding=utf-8
"""SCALE High Availability (tn-bhyve06) feature tests."""

import pytest
import reusableSeleniumCode as rsc
import time
import xpaths
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)
from function import (
    wait_on_element,
    attribute_value_exist,
    wait_on_element_disappear,
    wait_for_attribute_value,
    run_cmd,
    post
)
from pytest_dependency import depends


@pytest.mark.dependency(name='AD_SMB_SHARE', scope='session')
@scenario('features/NAS-T964.feature', 'Create an Active Directory SMB share and verify it still function after failover')
def test_create_an_active_directory_smb_share_and_verify_it_still_function_after_failover(driver):
    """Create an Active Directory SMB share and verify it still function after failover."""


@given(parsers.parse('the browser is open and to {nas_hostname}'))
def the_browser_is_open_and_to_nas_hostname(driver, nas_vip, request):
    """the browser is open and to <nas_hostname>."""
    depends(request, ['Active_Directory'], scope='session')
    if nas_vip not in driver.current_url:
        driver.get(f"http://{nas_vip}/ui/signin")
        assert wait_on_element(driver, 10, xpaths.login.user_Input)


@when(parsers.parse('the login page appears, enter "{user}" and "{password}"'))
def the_login_page_appears_enter_root_and_password(driver, user, password):
    """the login page appears, enter "root" and "password"."""
    global root_password
    root_password = password
    rsc.Login_If_Not_On_Dashboard(driver, user, password)


@then('on the dashboard, click on Shares on the left sidebar')
def on_the_dashboard_click_on_shares_on_the_left_sidebar(driver):
    """on the dashboard, click on Shares on the left sidebar."""
    rsc.Verify_The_Dashboard(driver)
    assert wait_on_element(driver, 5, xpaths.side_Menu.shares, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.shares).click()


@then('on the Sharing page, click the Add button on Windows (SMB) Shares')
def on_the_sharing_page_click_the_add_button_on_windows_smb_shares(driver):
    """on the Sharing page, click the Add button on Windows (SMB) Shares."""
    assert wait_on_element(driver, 7, xpaths.sharing.title)
    assert wait_on_element(driver, 5, xpaths.sharing.smb_Panel_Title)
    assert wait_on_element(driver, 5, xpaths.sharing.smb_Add_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.sharing.smb_Add_Button).click()


@then(parsers.parse('on the Add SMB slide box, set the Path to "{dataset_path}"'))
def on_the_add_smb_slide_box_set_the_path_to_mntdozermy_ad_dataset(driver, dataset_path):
    """on the Add SMB slide box, set the Path to "/mnt/dozer/my_ad_dataset"."""
    global dataset
    dataset = dataset_path
    assert wait_on_element(driver, 7, xpaths.smb.addTitle)
    assert wait_on_element(driver, 5, xpaths.smb.description_Input)
    assert wait_on_element(driver, 5, xpaths.smb.path_Input, 'inputable')
    driver.find_element_by_xpath(xpaths.smb.path_Input).send_keys(dataset_path)


@then(parsers.parse('input the {share_name}, then click to enable'))
def input_the_share_name_then_click_to_enable(driver, share_name):
    """input the <share_name>, then click to enable."""
    assert wait_on_element(driver, 5, xpaths.smb.name_Input, 'inputable')
    driver.find_element_by_xpath(xpaths.smb.name_Input).click()
    driver.find_element_by_xpath(xpaths.smb.name_Input).clear()
    driver.find_element_by_xpath(xpaths.smb.name_Input).send_keys(share_name)
    rsc.set_checkbox(driver, xpaths.checkbox.enabled)


@then(parsers.parse('input "{description}" as the description, click Save'))
def input_my_active_directory_smb_share_as_the_description_click_save(driver, description):
    """input "My Active Directory SMB share" as the description, click Save."""
    driver.find_element_by_xpath(xpaths.smb.description_Input).send_keys(description)
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('if Restart SMB Service box appears, click Restart Service')
def if_restart_smb_service_box_appears_click_restart_service(driver):
    """if Restart SMB Service box appears, click Restart Service."""
    rsc.Start_Or_Restart_SMB_Service(driver)

    assert wait_on_element_disappear(driver, 30, xpaths.progress.progressbar)


@then(parsers.parse('the {share_name} should appear on the Sharing page under SMB'))
def the_share_name_should_appear_on_the_sharing_page_under_smb(driver, share_name):
    """the <share_name> should appear on the Sharing page under SMB."""
    assert wait_on_element(driver, 5, xpaths.sharing.title)
    assert wait_on_element(driver, 5, xpaths.sharing.smb_Share_Name(share_name))


@then('verify the SMB service status is RUNNING under Windows (SMB) Shares')
def verify_the_smb_service_status_is_running_under_windows_smb_shares(driver):
    """verify the SMB service status is RUNNING under Windows (SMB) Shares."""
    assert wait_on_element(driver, 5, xpaths.sharing.smb_Service_Status)


@then('click on System Settings on the left sidebar, and click Services')
def click_on_system_settings_on_the_left_sidebar_and_click_services(driver):
    """click on System Settings on the left sidebar, and click Services."""
    rsc.Go_To_Service(driver)


@then('on the Service page, verify SMB service is started')
def on_the_service_page_verify_smb_service_is_started(driver):
    """on the Service page, verify SMB service is started."""
    assert wait_on_element(driver, 7, xpaths.services.title)
    assert wait_on_element(driver, 5, xpaths.services.smb_running_toggle, 'clickable')
    assert wait_for_attribute_value(driver, 60, xpaths.services.smb_running_toggle, 'class', 'mat-mdc-slide-toggle-checked')


@then(parsers.parse('send a file on {share_name}on {nas_hostname} with {ad_user}%{ad_password}'))
def send_a_file_on_share_name_on_nas_hostname_with_ad_userad_password(driver, nas_vip, share_name, ad_user, ad_password):
    """send a file on <share_name> on <nas_hostname> with <ad_user>%<ad_password>."""
    run_cmd('touch testfile.txt')
    results = run_cmd(f'smbclient //{nas_vip}/{share_name} -W AD03 -U {ad_user}%{ad_password} -c "put testfile.txt testfile.txt"')
    run_cmd('rm testfile.txt')
    assert results['result'], f'{results["output"]}\n{results["stderr"]}'
    time.sleep(1)


@then(parsers.parse('verify that the file is on {nas_hostname}'))
def verify_that_the_file_is_on_host(driver, nas_vip):
    """verify that the file is on <nas_hostname>."""
    file = f'{dataset}/testfile.txt'
    results = post(nas_vip, '/filesystem/stat/', ('root', root_password), file)
    assert results.status_code == 200, results.text
    time.sleep(5)


@then('go to the Dashboard and click Initiate Failover on the System Information standby controller')
def go_to_the_dashboard_and_click_initiate_failover_on_the_system_information_standby_controller(driver):
    """go to the Dashboard and click Initiate Failover on the System Information standby controller."""
    rsc.Click_On_Element(driver, xpaths.side_Menu.old_dashboard)
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    time.sleep(10)
    rsc.Trigger_Failover(driver)


@then('on the Initiate Failover box check the Confirm checkbox, then click Failover')
def on_the_initiate_failover_box_check_the_confirm_checkbox_then_click_failover(driver):
    """on the Initiate Failover box check the Confirm checkbox, then click Failover."""
    rsc.Confirm_Failover(driver)


@then('wait for the login to appear and HA to be enable')
def wait_for_the_login_to_appear_and_ha_to_be_enable(driver):
    """wait for the login to appear and HA to be enable."""
    rsc.HA_Login_Status_Enable(driver)


@then(parsers.parse('at the login page, enter "{user}" and "{password}"'))
def at_the_login_page_enter_user_and_password(driver, user, password):
    """At the login page, enter "user" and "password"."""
    rsc.Login(driver, user, password)


@then('once on the dashboard go to the Services page and verify SMB service is RUNNING')
def once_on_the_dashboard_go_to_the_services_page_and_verify_smb_service_is_running(driver):
    """once on the dashboard go to the Services page and verify SMB service is RUNNING."""
    assert wait_on_element(driver, 60, xpaths.dashboard.title)
    assert wait_on_element(driver, 120, xpaths.dashboard.system_Info_Card_Title)
    assert wait_on_element(driver, 180, xpaths.toolbar.ha_Enabled)
    if wait_on_element(driver, 3, '//button[@ix-auto="button__I AGREE"]', 'clickable'):
        driver.find_element_by_xpath('//button[@ix-auto="button__I AGREE"]').click()
    # Wait for the directories service manager button
    assert wait_on_element(driver, 180, '//button[@id="dirservices-manager"]')

    rsc.Go_To_Service(driver)

    assert wait_on_element(driver, 7, xpaths.services.title)
    assert wait_on_element(driver, 5, xpaths.services.smb_running_toggle, 'clickable')
    assert wait_for_attribute_value(driver, 20, xpaths.services.smb_running_toggle, 'class', 'mat-mdc-slide-toggle-checked')


@then(parsers.parse('verify you can get the file from {share_name} and modify it on {nas_hostname} with {ad_user}%{ad_password}'))
def verify_you_can_get_the_file_from_share_name_and_modify_it_on_nas_hostname_with_ad_userad_password(driver, nas_vip, share_name, ad_user, ad_password):
    """verify you can get the file from <share_name> and modify it on <nas_hostname> with <ad_user>%<ad_password>."""
    global aduser, adpassword
    aduser = ad_user
    adpassword = ad_password
    results1 = run_cmd(f'smbclient //{nas_vip}/{share_name} -W AD03 -U {ad_user}%{ad_password} -c "get testfile.txt testfile.txt"')
    assert results1['result'], f'{results1["output"]}\n{results1["stderr"]}'

    results2 = run_cmd('echo "test text in testfile" >> testfile.txt')
    assert results2['result'], f'{results2["output"]}\n{results2["stderr"]}'

    results3 = run_cmd(f'smbclient //{nas_vip}/{share_name} -W AD03 -U {ad_user}%{ad_password} -c "put testfile.txt testfile.txt"')
    assert results3['result'], f'{results3["output"]}\n{results3["stderr"]}'


@then('click on Credentials then Directory Services and Leave AD')
def click_on_credentials_then_directory_services_and_leave_ad(driver):
    """click on Credentials then Directory Services and Leave AD."""
    assert wait_on_element(driver, 7, xpaths.side_Menu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.credentials).click()
    assert wait_on_element(driver, 7, xpaths.side_Menu.directory_Services)
    driver.find_element_by_xpath(xpaths.side_Menu.directory_Services).click()
    assert wait_on_element_disappear(driver, 20, xpaths.popup.please_Wait)
    assert wait_on_element(driver, 7, xpaths.directory_Services.title)

    assert wait_on_element(driver, 5, xpaths.button.settings, 'clickable')
    driver.find_element_by_xpath(xpaths.button.settings).click()

    assert wait_on_element(driver, 5, xpaths.active_Directory.title)
    assert wait_on_element(driver, 7, xpaths.active_Directory.enable_Checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.active_Directory.enable_Checkbox).click()
    assert wait_on_element(driver, 7, xpaths.button.leave_Domain, 'clickable')
    driver.find_element_by_xpath(xpaths.button.leave_Domain).click()

    rsc.Leave_Domain(driver, aduser, adpassword)

    assert wait_on_element_disappear(driver, 120, xpaths.progress.progressbar)
    assert wait_on_element_disappear(driver, 120, xpaths.popup.active_Directory)


@then('click on network and click on Global Configuration')
def click_on_network_and_click_on_global_configuration(driver):
    """click on network and click on Global Configuration."""
    assert wait_on_element(driver, 10, xpaths.side_Menu.network, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.network).click()
    assert wait_on_element(driver, 7, xpaths.network.title)
    assert wait_on_element(driver, 5, xpaths.button.settings)
    driver.find_element_by_xpath(xpaths.button.settings).click()
    assert wait_on_element(driver, 10, xpaths.global_Configuration.title)


@then(parsers.parse('change nameservers to "{nameserver1}" and "{nameserver2}" then save'))
def change_nameservers_to_nameserver1_and_nameserve2_then_save(driver, nameserver1, nameserver2):
    """change nameservers to "{nameserver1}" and "{nameserver2}" then save."""
    assert wait_on_element(driver, 5, xpaths.global_Configuration.nameserver1_Input, 'inputable')
    driver.find_element_by_xpath(xpaths.global_Configuration.nameserver1_Input).clear()
    driver.find_element_by_xpath(xpaths.global_Configuration.nameserver1_Input).send_keys(nameserver1)
    driver.find_element_by_xpath(xpaths.global_Configuration.nameserver2_Input).clear()
    driver.find_element_by_xpath(xpaths.global_Configuration.nameserver2_Input).send_keys(nameserver2)

    assert wait_on_element(driver, 7, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 20, xpaths.progress.progressbar)
