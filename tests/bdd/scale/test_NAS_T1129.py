# coding=utf-8
"""SCALE UI: feature tests."""

import time
from selenium.webdriver import ActionChains
from selenium.webdriver.common.keys import Keys
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    run_cmd,
    post
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)


@scenario('features/NAS-T1129.feature', 'Create an smb share with the LDAP dataset and verify the connection')
def test_create_an_smb_share_with_the_ldap_dataset_and_verify_the_connection():
    """Create an smb share with the LDAP dataset and verify the connection."""


@given('the browser is open, the FreeNAS URL and logged in')
def the_browser_is_open_the_freenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open, the FreeNAS URL and logged in."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, '//input[@data-placeholder="Username"]')
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 10, '//input[@data-placeholder="Username"]')
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').send_keys('root')
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').send_keys(root_password)
        assert wait_on_element(driver, 5, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('you should be on the dashboard, click on sharing and click add.')
def you_should_be_on_the_dashboard_click_on_sharing_and_click_add():
    """you should be on the dashboard, click on sharing and click add.."""
    assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').clickWindows (SMB) Shares()
    time.sleep(2)
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Shares"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Shares"]').click()
    time.sleep(2)
    assert wait_on_element(driver, 7, '//mat-card[contains(.,"Windows (SMB) Shares")]//button[contains(.,"Add")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"Windows (SMB) Shares")]//button[contains(.,"Add")]').click()


@then('set Path to the LDAP dataset at "{path}", input "{name}" as name, click enable, input "{description}" as the description, and click Summit')
def set_path_to_the_ldap_dataset_at_mnttankmy_ldap_dataset_input_ldapsmbshare_as_name_click_enable_input_my_ldap_smb_test_share_as_the_description_and_click_summit(driver, name, path, description):
    """set Path to the LDAP dataset at /mnt/tank/my_ldap_dataset, input ldapsmbshare as name, click enable, input "My LDAP smb test share" as the description, and click Summit."""
    time.sleep(2)
    assert wait_on_element(driver, 5, '//h3[contains(.,"Add SMB")]')
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__path"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__path"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__path"]').send_keys(path)
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Name"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys(name)
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Description"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').send_keys(description)
    if not checkbox_checked:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Enabled"]').click()
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Enabled"]', 'class', 'mat-checkbox-checked')
    time.sleep(1)
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()



@then('the ldapsmbshare should be added to the Shares list, click on systemsettings/services, if the SMB service is not started, start the service.')
def the_ldapsmbshare_should_be_added_to_the_shares_list_click_on_systemsettingsservices_if_the_smb_service_is_not_started_start_the_service():
    """the ldapsmbshare should be added to the Shares list, click on systemsettings/services, if the SMB service is not started, start the service.."""
    raise NotImplementedError


@then('send a file to the share with ip/{ldapsmbshare} and "{ldap_user}" and "{ldap_password}"')
def send_a_file_to_the_share_with_ipldapsmbshare_and_eturgeon_and_need_4_testing(ldapsmbshare, ldap_user, ldap_password):
    """send a file to the share with ip/ldapsmbshare and "eturgeon" and "Need_4_testing"."""
    run_cmd('touch testfile.txt')
    results = run_cmd(f'smbclient //{nas_ip}/{ldapsmbshare} -W AD01 -U {ldap_user}%{ldap_password} -c "put testfile.txt testfile.txt"')
    assert results['result'], results['output']
    run_cmd('rm testfile.txt')


@then('verify that the file is on the NAS dataset')
def verify_that_the_file_is_on_the_nas_dataset(driver, nas_ip, root_password,):
    """verify that the file is on the NAS dataset."""
    results = post(nas_ip, 'filesystem/stat/', ('root', root_password), f'{smb_path}/testfile.txt')
    assert results.status_code == 200, results.text



@then('click on Credentials/DirectoryServices, then LDAP Settings, then disable and click SAVE')
def click_on_credentialsdirectoryservices_then_ldap_settings_then_disable_and_click_save():
    """click on Credentials/DirectoryServices, then LDAP Settings, then disable and click SAVE."""
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
    time.sleep(2)
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Directory Services"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Directory Services"]').click()
    time.sleep(1)
    assert wait_on_element(driver, 7, '//mat-card[contains(.,"LDAP")]//button[contains(.,"Settings")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"LDAP")]//button[contains(.,"Settings")]').click()
    time.sleep(2)
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Enable"]').click()
    time.sleep(1)
    wait_on_element(driver, 10, '//button[@ix-auto="button"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button"]').click()
    ## return to dashboard
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    time.sleep(1)