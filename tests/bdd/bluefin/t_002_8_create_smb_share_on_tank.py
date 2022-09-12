# coding=utf-8
"""SCALE UI feature tests."""
import time
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_for_attribute_value,
    wait_on_element_disappear,
    ssh_cmd,
    run_cmd,
    post
)


def test_create_smb_share_on_tank(driver, nas_ip, root_password, tanksmbpath, tanksmbname, tanksmbdescription, mysmbshare, user, password):
    """test_create_smb_share_on_tank"""


   # click on sharing and click add
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage")]')
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Shares"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Shares"]').click()


    # The Windows Shares(SMB) page should open, Click Add
    assert wait_on_element(driver, 5, '//h1[contains(text(),"Sharing")]')
    assert wait_on_element(driver, 5, '//mat-card[contains(.,"SMB")]//button[@ix-auto="button__-add"]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"SMB")]//button[@ix-auto="button__-add"]').click()   


    # Set Path to the ACL dataset "{tanksmbpath}", Input "{tanksmbname}" as name, Click to enable, Input "{tanksmbdescription}" as description, and Click Summit
    assert wait_on_element(driver, 5, '//h3[contains(text(),"Add SMB")]')
    global smb_path
    smb_path = tanksmbpath
    """Set Path to the ACL dataset "/mnt/system/my_acl_dataset"."""
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__path"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__path"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__path"]').send_keys(tanksmbpath)
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys(tanksmbname)
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__Enabled"]', 'clickable')
    checkbox_checked = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Enabled"]', 'class', 'mat-checkbox-checked')
    if not checkbox_checked:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Enabled"]').click()
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Enabled"]', 'class', 'mat-checkbox-checked')
    time.sleep(1)
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Description"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').send_keys(tanksmbdescription)
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 15, '//h6[contains(.,"Please wait")]')


    # "{smbname}" should be added, Click on service and the Service page should open
    assert wait_on_element(driver, 5, '//div[contains(.,"mysmbshare")]')
    time.sleep(2)


    # Send a file to the share with nas_ip/"{mysmbshare}" and "{user}" and "{password}"
    run_cmd('touch testfile.txt')
    results = run_cmd(f'smbclient //{nas_ip}/{mysmbshare} -W AD02 -U {user}%{password} -c "put testfile.txt testfile.txt"')
    run_cmd('rm testfile.txt')
    assert results['result'], results['output']


    # Verify that the is on nas_ip with root and password
    global smbresults2
    cmd = 'ls -la /mnt/system/my_acl_dataset/'
    smbresults2 = ssh_cmd(cmd, 'root', root_password, nas_ip)
    assert smbresults2['result'], smbresults2['output']
    assert 'testfile' in smbresults2['output'], smbresults2['output']
