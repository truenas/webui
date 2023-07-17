# coding=utf-8
"""SCALE UI: feature tests."""

import pytest
import time
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_on_element_disappear,
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


@pytest.mark.dependency(name='LDAP_SMB')
@scenario('features/NAS-T1129.feature', 'Create an smb share with the LDAP dataset and verify the connection')
def test_create_an_smb_share_with_the_ldap_dataset_and_verify_the_connection(driver):
    """Create an smb share with the LDAP dataset and verify the connection."""
    assert wait_on_element(driver, 10, xpaths.side_Menu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.credentials).click()
    assert wait_on_element(driver, 10, xpaths.side_Menu.directory_Services, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.directory_Services).click()
    assert wait_on_element(driver, 7, xpaths.button.settings, 'clickable')
    driver.find_element_by_xpath(xpaths.button.settings).click()
    assert wait_on_element(driver, 7, xpaths.checkbox.enable, 'clickable')
    driver.find_element_by_xpath(xpaths.checkbox.enable).click()
    wait_on_element(driver, 10, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 60, xpaths.popup.please_Wait)
    assert wait_on_element(driver, 10, xpaths.directory_Services.title)
    # Make sure Active Directory and LDAP are both disabled
    assert wait_on_element(driver, 10, xpaths.directory_Services.directory_Disable_Title)
    assert wait_on_element(driver, 7, xpaths.directory_Services.configure_AD_Button, 'clickable')
    assert wait_on_element(driver, 7, xpaths.directory_Services.configure_Ldap_Button, 'clickable')


@given('the browser is open, the TrueNAS URL and logged in')
def the_browser_is_open_the_truenas_url_and_logged_in(driver, nas_ip, root_password, request):
    """the browser is open, the TrueNAS URL and logged in."""
    depends(request, ['LDAP_Dataset'], scope='session')
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


@when('you should be on the dashboard, click on Shares on the side menu')
def you_should_be_on_the_dashboard_click_on_shares_on_the_side_menu(driver):
    """you should be on the dashboard, click on Shares on the side menu."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.system_Info_Card_Title)
    assert wait_on_element(driver, 10, xpaths.side_Menu.shares, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.shares).click()


@then('on the Shares page click on the SMB Add button')
def on_the_shares_page_click_on_the_smb_add_button(driver):
    """on the Shares page click on the SMB Add button."""
    assert wait_on_element(driver, 10, xpaths.sharing.title)
    assert wait_on_element(driver, 7, xpaths.sharing.smb_Add_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.sharing.smb_Add_Button).click()


@then(parsers.parse('on the SMB Add set Path to "{path}"'))
def on_the_smb_add_set_path_to_mnttankmy_ldap_dataset(driver, path):
    """on the SMB Add set Path to "/mnt/tank/my_ldap_dataset"."""
    global dataset_path
    dataset_path = path
    assert wait_on_element(driver, 5, xpaths.smb.addTitle)
    assert wait_on_element(driver, 5, xpaths.smb.path_Input, 'inputable')
    driver.find_element_by_xpath(xpaths.smb.path_Input).clear()
    driver.find_element_by_xpath(xpaths.smb.path_Input).send_keys(path)


@then(parsers.parse('input "{name}" as name and click enable'))
def input_ldapsmbshare_as_name_and_click_enable(driver, name):
    """input "ldapsmbshare" as name and click enable."""
    assert wait_on_element(driver, 5, xpaths.smb.name_Input, 'inputable')
    driver.find_element_by_xpath(xpaths.smb.name_Input).click()
    driver.find_element_by_xpath(xpaths.smb.name_Input).clear()
    driver.find_element_by_xpath(xpaths.smb.name_Input).send_keys(name)


@then(parsers.parse('input "{description}" as the description and click Save'))
def input_my_ldap_smb_test_share_as_the_description_and_click_save(driver, description):
    """input "My LDAP smb test share" as the description and click Save."""
    assert wait_on_element(driver, 5, xpaths.smb.description_Input)
    driver.find_element_by_xpath(xpaths.smb.description_Input).clear()
    driver.find_element_by_xpath(xpaths.smb.description_Input).send_keys(description)
    checkbox_checked = attribute_value_exist(driver, xpaths.checkbox.enabled, 'class', 'mat-mdc-checkbox-checked')
    if not checkbox_checked:
        driver.find_element_by_xpath(xpaths.checkbox.enabled).click()
    time.sleep(0.5)
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('if Restart SMB Service box appears, click Restart Service')
def if_restart_smb_service_box_appears_click_restart_service(driver):
    """if Restart SMB Service box appears, click Restart Service."""
    if wait_on_element(driver, 3, xpaths.popup.smb_Restart_Title):
        assert wait_on_element(driver, 3, xpaths.popup.smb_Restart_Button, 'clickable')
        driver.find_element_by_xpath(xpaths.popup.smb_Restart_Button).click()
    elif wait_on_element(driver, 3, xpaths.popup.smb_Start_Title):
        assert wait_on_element(driver, 3, xpaths.popup.enable_Service_Button, 'clickable')
        driver.find_element_by_xpath(xpaths.popup.enable_Service_Button).click()
    assert wait_on_element_disappear(driver, 30, xpaths.progress.progressbar)


@then(parsers.parse('the {share_name} should be added to the Shares list'))
def the_ldapsmbshare_should_be_added_to_the_shares_list(driver, share_name):
    """the ldapsmbshare should be added to the Shares list."""
    assert wait_on_element(driver, 5, xpaths.sharing.smb_Share_Name(share_name))
    assert wait_on_element(driver, 5, xpaths.sharing.smb_Service_Status)
    time.sleep(1)


@then(parsers.parse('send a file to the share with ip/"{smb_share}" and "{ldap_user}" and "{ldap_password}"'))
def send_a_file_to_the_share(smb_share, ldap_user, ldap_password, nas_ip):
    """send a file to the share with ip/{smb_share} and "{ldap_user}" and "{ldap_password}""."""
    run_cmd('touch testfile.txt')
    results = run_cmd(f'smbclient //{nas_ip}/{smb_share} -U "{ldap_user}"%"{ldap_password}" -c "put testfile.txt testfile.txt"')
    assert results['result'], results['output']
    run_cmd('rm testfile.txt')


@then('verify that the file is on the NAS dataset')
def verify_that_the_file_is_on_the_nas_dataset(driver, nas_ip, root_password):
    """verify that the file is on the NAS dataset."""
    file = f'{dataset_path}/testfile.txt'
    results = post(nas_ip, '/filesystem/stat/', ('root', root_password), file)
    assert results.status_code == 200, results.text
