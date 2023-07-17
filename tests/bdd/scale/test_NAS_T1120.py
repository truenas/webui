# coding=utf-8
"""SCALE UI: feature tests."""

import pytest
import reusableSeleniumCode as rsc
import time
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    attribute_value_exist,
    wait_for_attribute_value,
    run_cmd,
    post
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)
from pytest_dependency import depends


@pytest.mark.dependency(name='AD_SMB')
@scenario('features/NAS-T1120.feature', 'Verify an smb share with  AD dataset from a system pool works')
def test_verify_an_smb_share_with__ad_dataset_from_a_system_pool_works(driver):
    """Verify an smb share with  AD dataset from a system pool works."""


@given('the browser is open, the TrueNAS URL and logged in')
def the_browser_is_open_the_truenas_url_and_logged_in(driver, root_password, nas_ip, request):
    """the browser is open, the TrueNAS URL and logged in."""
    depends(request, ['AD_Setup'], scope='session')
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, xpaths.login.user_Input)
    if not is_element_present(driver, xpaths.side_Menu.dashboard):
        assert wait_on_element(driver, 10, xpaths.login.user_Input)
        driver.find_element_by_xpath(xpaths.login.user_Input).clear()
        driver.find_element_by_xpath(xpaths.login.user_Input).send_keys('root')
        driver.find_element_by_xpath(xpaths.login.password_Input).clear()
        driver.find_element_by_xpath(xpaths.login.password_Input).send_keys(root_password)
        assert wait_on_element(driver, 5, xpaths.login.signin_Button)
        driver.find_element_by_xpath(xpaths.login.signin_Button).click()
    else:
        assert wait_on_element(driver, 5, xpaths.side_Menu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.side_Menu.dashboard).click()


@when('on the dashboard, click on Shares on the left sidebar')
def on_the_dashboard_click_on_shares_on_the_left_sidebar(driver):
    """on the dashboard, click on Shares on the left sidebar."""
    assert wait_on_element(driver, 7, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.system_Info_Card_Title)
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


@then(parsers.parse('input "{share_name}" as name, then click to enable'))
def input_myadsmbshare_as_name_then_click_to_enable(driver, share_name):
    """input "myadsmbshare" as name, then click to enable."""
    assert wait_on_element(driver, 5, xpaths.smb.name_Input, 'inputable')
    driver.find_element_by_xpath(xpaths.smb.name_Input).click()
    driver.find_element_by_xpath(xpaths.smb.name_Input).clear()
    driver.find_element_by_xpath(xpaths.smb.name_Input).send_keys(share_name)
    assert wait_on_element(driver, 5, xpaths.checkbox.enabled, 'clickable')
    if not attribute_value_exist(driver, xpaths.checkbox.enabled, 'class', 'mat-mdc-checkbox-checked'):
        driver.find_element_by_xpath(xpaths.checkbox.enable).click()


@then(parsers.parse('input "{description}" as the description, click Save'))
def input_my_active_Directory_smb_share_as_the_description_click_save(driver, description):
    """input "My Active Directory SMB share" as the description, click Save."""
    driver.find_element_by_xpath(xpaths.smb.description_Input).send_keys(description)
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('if Restart SMB Service box appears, click Restart Service')
def if_restart_smb_service_box_appears_click_restart_service(driver):
    """if Restart SMB Service box appears, click Restart Service."""
    assert wait_on_element(driver, 7, xpaths.popup.smb_Start_Title)
    assert wait_on_element(driver, 5, xpaths.popup.enable_Service_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.popup.enable_Service_Button).click()
    assert wait_on_element_disappear(driver, 30, xpaths.progress.progressbar)


@then(parsers.parse('"{share_name}" should appear on the Sharing page under SMB'))
def myadsmbshare_should_appear_on_the_sharing_page_under_smb(driver, share_name):
    """"myadsmbshare" should appear on the Sharing page under SMB."""
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
def on_the_Service_page_verify_smb_service_is_started(driver):
    """on the Service page, verify SMB service is started."""
    assert wait_on_element(driver, 7, xpaths.services.title)
    assert wait_on_element(driver, 5, xpaths.services.smb_Service_Toggle, 'clickable')
    assert wait_for_attribute_value(driver, 20, xpaths.services.smb_Service_Toggle, 'class', 'mdc-switch--checked')


@then(parsers.parse('send a file to "{share_name}" with "{ad_user}"%"{ad_password}"'))
def send_a_file_to_the_share(driver, nas_ip, share_name, ad_user, ad_password):
    """send a file to {share}" with "{ad_user}"%"{ad_password}"."""
    global aduser, adpassword
    aduser = ad_user
    adpassword = ad_password

    run_cmd('touch testfile.txt')
    results = run_cmd(f'smbclient //{nas_ip}/{share_name} -W AD02 -U {ad_user}%{ad_password} -c "put testfile.txt testfile.txt"')
    run_cmd('rm testfile.txt')
    assert results['result'], results['output']
    time.sleep(1)


@then('verify that the file is on the share dataset')
def verify_that_the_file_is_on_the_share_dataset(nas_ip, root_password):
    """verify that the file is on the share dataset."""
    file = f'{dataset}/testfile.txt'
    results = post(nas_ip, '/filesystem/stat/', ('root', root_password), file)
    assert results.status_code == 200, results.text


@then('click on Credentials then Directory Services and disable AD')
def click_on_credentials_then_directory_services_and_disable_ad(driver):
    """click on Credentials then Directory Services and disable AD."""
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
