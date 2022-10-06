# coding=utf-8
"""SCALE UI feature tests."""
import time
from selenium.webdriver.common.keys import Keys
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




def test_create_smb_share_on_system(driver, nas_ip, root_password, systemsmbpath, systemsmbname, systemsmbdescription, mysmbshare, user, password):
    """test_create_smb_share_on_system"""
#    if not is_element_present(driver, '//h1[contains(.,"Storage")]'):
#        assert wait_on_element(driver, 10, '//span[contains(text(),"Storage")]', 'clickable')
#        driver.find_element_by_xpath('//span[contains(text(),"Storage")]').click()
#    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage Dashboard")]')

   # click on sharing and click add
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Shares"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Shares"]').click()


    # The Windows Shares(SMB) page should open, Click Add
    assert wait_on_element(driver, 5, '//h1[contains(text(),"Sharing")]')
    assert wait_on_element(driver, 5, '//mat-card[contains(.,"SMB")]//button[@ix-auto="button__-add"]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"SMB")]//button[@ix-auto="button__-add"]').click()   


    # Set Path to the ACL dataset "{path}", Input "{smbname}" as name, Click to enable, Input "{description}" as description, and Click Summit
    assert wait_on_element(driver, 5, '//h3[contains(text(),"Add SMB")]')
    global smb_path
    smb_path = systemsmbpath
    """Set Path to the ACL dataset "/mnt/system/my_acl_dataset"."""

    assert wait_on_element(driver, 5, '//ix-explorer//ix-label//label//span[contains(text(),"Path")]//ancestor::ix-explorer/div/input', 'inputable')
    driver.find_element_by_xpath('//ix-explorer//ix-label//label//span[contains(text(),"Path")]//ancestor::ix-explorer/div/input').clear()
    driver.find_element_by_xpath('//ix-explorer//ix-label//label//span[contains(text(),"Path")]//ancestor::ix-explorer/div/input').send_keys(systemsmbpath)
    driver.find_element_by_xpath('//ix-explorer//ix-label//label//span[contains(text(),"Path")]//ancestor::ix-explorer/div/input').send_keys(Keys.TAB)
    assert wait_on_element(driver, 5, '//ix-input//ix-label//label//span[contains(text(),"Name")]//ancestor::ix-input/div/input', 'inputable')
    driver.find_element_by_xpath('//ix-input//ix-label//label//span[contains(text(),"Name")]//ancestor::ix-input/div/input').clear()
    driver.find_element_by_xpath('//ix-input//ix-label//label//span[contains(text(),"Name")]//ancestor::ix-input/div/input').send_keys(systemsmbname)

    assert wait_on_element(driver, 5, '//mat-card[1]/mat-card-content[1]/form[1]/ix-fieldset[1]/fieldset[1]/ix-checkbox[1]/mat-checkbox[1]/label[1]/span[contains(text(),"Enabled")]//ancestor::ix-checkbox//mat-checkbox', 'clickable')
    checkbox_checked = attribute_value_exist(driver, '//mat-card[1]/mat-card-content[1]/form[1]/ix-fieldset[1]/fieldset[1]/ix-checkbox[1]/mat-checkbox[1]/label[1]/span[contains(text(),"Enabled")]//ancestor::ix-checkbox//mat-checkbox', 'class', 'mat-checkbox-checked')
    if not checkbox_checked:
        driver.find_element_by_xpath('//mat-card[1]/mat-card-content[1]/form[1]/ix-fieldset[1]/fieldset[1]/ix-checkbox[1]/mat-checkbox[1]/label[1]/span[contains(text(),"Enabled")]//ancestor::ix-checkbox//mat-checkbox').click()
    assert attribute_value_exist(driver, '//mat-card[1]/mat-card-content[1]/form[1]/ix-fieldset[1]/fieldset[1]/ix-checkbox[1]/mat-checkbox[1]/label[1]/span[contains(text(),"Enabled")]//ancestor::ix-checkbox//mat-checkbox', 'class', 'mat-checkbox-checked')
    time.sleep(1)
    assert wait_on_element(driver, 5, '//ix-input//ix-label//label//span[contains(text(),"Description")]//ancestor::ix-input/div/input', 'inputable')
    driver.find_element_by_xpath('//ix-input//ix-label//label//span[contains(text(),"Description")]//ancestor::ix-input/div/input').clear()
    driver.find_element_by_xpath('//ix-input//ix-label//label//span[contains(text(),"Description")]//ancestor::ix-input/div/input').send_keys(systemsmbdescription)
    assert wait_on_element(driver, 5, '//span[contains(text(),"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save")]').click()

    if is_element_present(driver, '//h3[contains(text(),"Restart SMB Service")]'):
        assert wait_on_element(driver, 10, '//span[contains(text(),"Restart Service")]', 'clickable')
        driver.find_element_by_xpath('//span[contains(text(),"Restart Service")]').click()

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
    global smbresults
    cmd = 'ls -la /mnt/system/my_acl_dataset/'
    smbresults = ssh_cmd(cmd, 'root', root_password, nas_ip)
    assert smbresults['result'], smbresults['output']
    assert 'testfile' in smbresults['output'], smbresults['output']
