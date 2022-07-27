# coding=utf-8
"""SCALE UI feature tests."""
import time
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_for_attribute_value,
    wait_on_element_disappear,
    run_cmd
)




def test_create_smb_share_on_ldap_dataset(driver):
    """test_create_smb_share_on_ldap_dataset"""


   # click on sharing and click add
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Shares"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Shares"]').click()
    assert wait_on_element(driver, 7, '//mat-card[contains(.,"Windows (SMB) Shares")]//button[contains(.,"Add")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"Windows (SMB) Shares")]//button[contains(.,"Add")]').click()


    # set Path to the LDAP dataset at "{path}"
    assert wait_on_element(driver, 5, '//h3[contains(.,"Add SMB")]')
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__path"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__path"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__path"]').send_keys(path)


    # input "{name}" as name and click enable
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Name"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys(smbsharename)


    # input "{description}" as the description and click Summit
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Description"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').send_keys(smbsharedescription)
    checkbox_checked = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Enabled"]', 'class', 'mat-checkbox-checked')
    if not checkbox_checked:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Enabled"]').click()
    time.sleep(0.5)
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    time.sleep(0.5)
    assert wait_on_element_disappear(driver, 30, '//h6[contains(.,"Please wait")]')


    # the ldapsmbshare should be added to the Shares list
    assert wait_on_element(driver, 5, '//div[contains(.,"ldapsmbshare")]')


    # send a file to the share with ip/"{ldapsmbshare}" and "{ldap_user}" and "{ldap_password}"
    run_cmd('touch testfile.txt')
    results = run_cmd(f'smbclient //{nas_ip}/{ldapsmbshare} -U {ldap_user}%{ldap_password} -c "put testfile.txt testfile.txt"')
    assert results['result'], results['output']
    run_cmd('rm testfile.txt')


    # verify that the file is on the NAS dataset
    global results
    cmd = 'ls -la /mnt/tank/my_ldap_dataset/'
    results = ssh_cmd(cmd, 'root', root_password, nas_ip)
    assert results['result'], results['output']
    assert 'testfile' in results['output'], results['output']


    # click on Credentials/DirectoryServices, then LDAP Settings, then disable and click SAVE
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
    assert wait_on_element(driver, 10, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Directory Services"]', 'clickable')
    driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Directory Services"]').click()
    assert wait_on_element(driver, 7, '//mat-card[contains(.,"LDAP")]//button[contains(.,"Settings")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"LDAP")]//button[contains(.,"Settings")]').click()
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Enable"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Enable"]').click()
    wait_on_element(driver, 10, '//span[contains(text(),"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save")]').click()
    assert wait_on_element_disappear(driver, 60, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//h1[text()="Directory Services"]')
    # Make sure Active Directory and LDAP are both disabled
    assert wait_on_element(driver, 10, '//h3[text()="Active Directory and LDAP are disabled."]')
    assert wait_on_element(driver, 7, '//span[contains(text(),"Configure Active Directory")]', 'clickable')
    assert wait_on_element(driver, 7, '//span[contains(text(),"Configure LDAP")]', 'clickable')
