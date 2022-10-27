# coding=utf-8
"""SCALE UI feature tests."""
import time
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_for_attribute_value,
    wait_on_element_disappear,
)




def test_create_ericbsd_smb_share(driver):
    """test_create_ericbsd_smb_share"""
    if not is_element_present(driver, '//h1[contains(.,"Storage")]'):
        assert wait_on_element(driver, 10, '//span[contains(text(),"Storage (Deprecated))]', 'clickable')
        driver.find_element_by_xpath('//span[contains(text(),"Storage (Deprecated))]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage")]')

    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Shares"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Shares"]').click()
    assert wait_on_element(driver, 5, '//div[contains(.,"Shares")]')


    # The Windows Shares(SMB) page should open, Click Add
    assert wait_on_element(driver, 7, '//mat-card[contains(.,"Windows (SMB) Shares")]//button[contains(.,"Add")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"Windows (SMB) Shares")]//button[contains(.,"Add")]').click()
    assert wait_on_element(driver, 5, '//h3[contains(text(),"Add SMB")]')
    assert wait_on_element(driver, 5, '//h4[contains(.,"Basic")]')  


    # Set Path to the LDAP dataset "{path}", Input "{smbname}" as name, Click to enable, Input "{description}" as description, and Click Summit
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


    # {sharename} should be added, start service if its not running
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


    # Send a file to the share with nas_IP/"{smbname}" and "{user}" and "{password}"
    run_cmd('touch testfile.txt')
    results = run_cmd(f'smbclient //{nas_ip}/{smbname} -U {user}%{password} -c "put testfile.txt testfile.txt"')
    time.sleep(1)
    run_cmd('rm testfile.txt')
    assert results['result'], results['output']


    # Verify that the is on nas_ip with root and password
    global results
    cmd = 'ls -la /mnt/tank/ericbsd_dataset'
    results = ssh_cmd(cmd, 'root', root_password, nas_ip)
    assert results['result'], results['output']
    assert 'testfile' in results['output'], results['output']


    # send a file to the share should fail with NAS IP/"{smbname}" and {user2}%{password2}
    run_cmd('touch testfile2.txt')
    results = run_cmd(f'smbclient //{nas_ip}/{smbname} -U {user2}%{password2} -c "put testfile2.txt testfile2.txt"')
    time.sleep(1)
    run_cmd('rm testfile2.txt')
    assert not results['result'], results['output']


    # verify that the file is not on the NAS
    global results
    cmd = 'ls -la /mnt/tank/ericbsd_dataset/'
    results = ssh_cmd(cmd, 'root', root_password, nas_ip)
    assert results['result'], results['output']
    assert 'testfile2' not in results['output'], results['output']