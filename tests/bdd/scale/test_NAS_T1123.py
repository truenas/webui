# coding=utf-8
"""SCALE UI: feature tests."""

import time
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    run_cmd,
    ssh_cmd
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T1123.feature', 'Create an smb share with the system ACL dataset')
def test_create_an_smb_share_with_the_system_acl_dataset():
    """Create an smb share with the system ACL dataset."""


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


@when('you should be on the dashboard, click on Sharing then Windows Shares(SMB)')
def you_should_be_on_the_dashboard_click_on_sharing_then_windows_sharessmb(driver):
    """you should be on the dashboard, click on Sharing then Windows Shares(SMB)."""
    time.sleep(1)
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    time.sleep(1)
    assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Shares"]').click()


@then('The Windows Shares(SMB) page should open, Click Add')
def the_windows_sharessmb_page_should_open_click_add(driver):
    """The Windows Shares(SMB) page should open, Click Add."""
    time.sleep(1)
    assert wait_on_element(driver, 5, '//mat-card[contains(.,"SMB")]//button[@ix-auto="button__-add"]')
    driver.find_element_by_xpath('//mat-card[contains(.,"SMB")]//button[@ix-auto="button__-add"]').click()   


@then(parsers.parse('Set Path to the ACL dataset "{path}", Input "{smbname}" as name, Click to enable, Input "{description}" as description, and Click Summit'))
def set_path_to_the_acl_dataset_mntsystemkmy_acl_dataset_input_mysmbshare_as_name_click_to_enable_input_my_smb_test_share_as_description_and_click_summit(driver, path, smbname, description):
    """Set Path to the ACL dataset "{path}", Input "{smbname}" as name, Click to enable, Input "{description}" as description, and Click Summit."""
    time.sleep(1)
    global smb_path
    smb_path = path
    """Set Path to the ACL dataset "/mnt/system/my_acl_dataset"."""
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__path"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__path"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__path"]').send_keys(path)
    time.sleep(1)
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Name"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys(smbname)
    checkbox_checked = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Enabled"]', 'class', 'mat-checkbox-checked')
    if not checkbox_checked:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Enabled"]').click()
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Enabled"]', 'class', 'mat-checkbox-checked')
    time.sleep(1)
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Description"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').send_keys(description)
    time.sleep(1)
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


@then(parsers.parse('"{smbname}" should be added, Click on service and the Service page should open'))
def mysmbshare_should_be_added_click_on_service_and_the_service_page_should_open(driver, smbname):
    """"{smbname}" should be added, Click on service and the Service page should open."""
    #assert wait_on_element(driver, 5, '//div[contains(.,"SMB")]')
    assert wait_on_element(driver, 5, f'//div[contains(.,"mysmbshare")]')
    time.sleep(2)
    #assert wait_on_element(driver, 7, '//button[@ix-auto="button__ENABLE SERVICE"]', 'clickable')
    #driver.find_element_by_xpath('//button[@ix-auto="button__ENABLE SERVICE"]').click()
    #time.sleep(2)
    #assert wait_on_element(driver, 7, '//div[contains(text(),"The SMB service has been enabled.")]')
    #driver.find_element_by_xpath('//span[contains(text(),"Close")]').click()



@then('If the SMB serivce is not started start the service, and click on SMB Start Automatically checkbox')
def if_the_smb_serivce_is_not_started_start_the_service_and_click_on_smb_start_automatically_checkbox(driver):
    """If the SMB serivce is not started start the service, and click on SMB Start Automatically checkbox."""
    time.sleep(1)
    #assert wait_on_element(driver, 5, '//services')
    # Scroll to SMB service
    #element = driver.find_element_by_xpath('//div[contains(text(),"WebDAV")]')
    #driver.execute_script("arguments[0].scrollIntoView();", element)
    #time.sleep(1)
    #driver.find_element_by_xpath('//div[contains(text(),"SMB")]')
    #value_exist = attribute_value_exist(driver, '//mat-slide-toggle[@id="slide-toggle__state_SMB"]', 'class', 'mat-checked')
    #if not value_exist:
    #    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="overlay__SMB_Running"]').click()
    #time.sleep(2)


@then(parsers.parse('Send a file to the share with nas_ip/"{mysmbshare}" and "{user}" and "{password}"'))
def send_a_file_to_the_share_with_nas_ipmysmbshare_and_administrator_and_abcd1234(driver, nas_ip, mysmbshare, user, password):
    """Send a file to the share with nas_IP/"{mysmbshare}" and "{user}" and "{password}"."""
    run_cmd('touch testfile.txt')
    time.sleep(2)
    results = run_cmd(f'smbclient //{nas_ip}/{mysmbshare} -W AD01 -U {user}%{password} -c "put testfile.txt testfile.txt"')
    time.sleep(1)
    assert results['result'], results['output']


@then('Verify that the is on nas_ip with root and password')
def verify_that_the_is_on_nas_ip_with_root_and_password(nas_ip, password):
    global results
    cmd = 'ls -al'
    results = ssh_cmd(cmd, 'root', None, nas_ip)
    assert results['result'], results['output']
    assert 'testfile' in results['output'], results['output']
