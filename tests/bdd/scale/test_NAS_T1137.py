# coding=utf-8
"""SCALE UI: feature tests."""

import time
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    run_cmd,
    ssh_cmd,
    wait_on_element_disappear
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers,
)


@scenario('features/NAS-T1137.feature', 'Create smb share for ericbsd verify only ericbsd can access it')
def test_create_smb_share_for_ericbsd_verify_only_ericbsd_can_access_it():
    """Create smb share for ericbsd verify only ericbsd can access it."""


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
    assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Shares"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Shares"]').click()
    assert wait_on_element(driver, 5, '//div[contains(.,"Shares")]')


@then('The Windows Shares(SMB) page should open, Click Add')
def the_windows_sharessmb_page_should_open_click_add(driver):
    """The Windows Shares(SMB) page should open, Click Add."""
    assert wait_on_element(driver, 7, '//mat-card[contains(.,"Windows (SMB) Shares")]//button[contains(.,"Add")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"Windows (SMB) Shares")]//button[contains(.,"Add")]').click()
    assert wait_on_element(driver, 5, '//h3[contains(text(),"Add SMB")]')
    assert wait_on_element(driver, 5, '//h4[contains(.,"Basic")]')  


@then(parsers.parse('Set Path to the LDAP dataset "{path}", Input "{smbname}" as name, Click to enable, Input "{description}" as description, and Click Summit'))
def set_path_to_the_ldap_dataset_mnttankericbsd_dataset_input_eric_share_as_name_click_to_enable_input_test_eric_smb_share_as_description_and_click_summit(driver, path, smbname, description):
    """Set Path to the LDAP dataset "{path}", Input "{smbname}" as name, Click to enable, Input "{description}" as description, and Click Summit."""
    time.sleep(1)
    global smb_path
    smb_path = path
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__path"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__path"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__path"]').send_keys(path)
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Name"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys(smbname)
    checkbox_checked = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Enabled"]', 'class', 'mat-checkbox-checked')
    if not checkbox_checked:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Enabled"]').click()
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Enabled"]', 'class', 'mat-checkbox-checked')
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Description"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').send_keys(description)
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 15, '//h6[contains(.,"Please wait")]')


@then(parsers.parse('{sharename} should be added, start service if its not running'))
def sharename_should_be_added_start_service_if_its_not_running(driver, sharename):
    """{sharename} should be added, start service if its not running."""
    assert wait_on_element(driver, 5, '//div[contains(.,"SMB")]')
    assert wait_on_element(driver, 5, f'//div[contains(.,"{sharename}")]')
    if not is_element_present(driver, '//mat-card[contains(.,"Windows (SMB) Shares")]//span[contains(.,"RUNNING")]'):
        assert wait_on_element(driver, 10, '//mat-card[contains(.,"Windows (SMB) Shares")]//mat-icon[text()="more_vert"]', 'clickable')      
        driver.find_element_by_xpath('//mat-card[contains(.,"Windows (SMB) Shares")]//mat-icon[text()="more_vert"]').click()
        assert wait_on_element(driver, 10, '//button[normalize-space(text())="Turn On Service"]', 'clickable')
        driver.find_element_by_xpath('//button[normalize-space(text())="Turn On Service"]').click()
        assert wait_on_element(driver, 20, '//mat-card[contains(.,"Windows (SMB) Shares")]//span[contains(.,"RUNNING")]')
    # This sleep is to make sure that the NAS VM is ready for the step
    time.sleep(2)


@then(parsers.parse('Send a file to the share with nas_IP/"{smbname}" and "{user}" and "{password}"'))
def send_a_file_to_the_share_with_nas_iperic_share_and_ericbsd_and_testing1234(driver, nas_ip, smbname, user, password):
    """Send a file to the share with nas_IP/"{smbname}" and "{user}" and "testing1234"."""
    run_cmd('touch testfile.txt')
    results = run_cmd(f'smbclient //{nas_ip}/{smbname} -U {user}%{password} -c "put testfile.txt testfile.txt"')
    time.sleep(1)
    run_cmd('rm testfile.txt')
    assert results['result'], results['output']


@then('Verify that the is on nas_ip with root and password')
def verify_that_the_is_on_nas_ip_with_root_and_password(driver, root_password, nas_ip):
    """Verify that the is on nas_ip with root and password."""
    global results
    cmd = 'ls -la /mnt/tank/ericbsd_dataset'
    results = ssh_cmd(cmd, 'root', root_password, nas_ip)
    assert results['result'], results['output']
    assert 'testfile' in results['output'], results['output']


@then(parsers.parse('send a file to the share should fail with NAS IP/"{smbname}" and {user2}%{password2}'))
def send_a_file_to_the_share_should_fail_with_nas_iperic_share_and_footesting(driver, smbname, user2, password2, nas_ip):
    """send a file to the share should fail with NAS IP/"{smbname}" and {user2}{password2}."""
    run_cmd('touch testfile2.txt')
    results = run_cmd(f'smbclient //{nas_ip}/{smbname} -U {user2}%{password2} -c "put testfile2.txt testfile2.txt"')
    time.sleep(1)
    run_cmd('rm testfile2.txt')
    assert not results['result'], results['output']


@then(parsers.parse('verify that the file is not on the NAS'))
def verify_that_the_file_is_not_on_the_nas(driver, nas_ip, root_password):
    """verify that the file is not on the NAS."""
    global results
    cmd = 'ls -la /mnt/tank/ericbsd_dataset/'
    results = ssh_cmd(cmd, 'root', root_password, nas_ip)
    assert results['result'], results['output']
    assert 'testfile2' not in results['output'], results['output']
