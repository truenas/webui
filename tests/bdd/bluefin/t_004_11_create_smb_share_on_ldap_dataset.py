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
    run_cmd,
    ssh_cmd
)




def test_create_smb_share_on_ldap_dataset(driver, nas_ip, root_password, smb_ldap_path, ldapsmbsharename, ldapsmbsharedescription, ldapsmbshare, ldap_user, ldap_password):
    """test_create_smb_share_on_ldap_dataset"""

    # uncomment next line when running test solo since it will be starting at a different page
    #assert wait_on_element(driver, 10, '//h1[contains(text(),"Dashboard")]')
    # click on sharing and click add
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Shares"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Shares"]').click()
    assert wait_on_element(driver, 5, '//h1[contains(text(),"Sharing")]')
    assert wait_on_element(driver, 5, '//mat-card[contains(.,"SMB")]//button[@ix-auto="button__-add"]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"SMB")]//button[@ix-auto="button__-add"]').click() 


    # set Path to the LDAP dataset at "{path}"
    assert wait_on_element(driver, 5, '//h3[contains(.,"Add SMB")]')
    assert wait_on_element(driver, 5, '//ix-explorer//ix-label//label//span[contains(text(),"Path")]//ancestor::ix-explorer/div/input', 'inputable')
    driver.find_element_by_xpath('//ix-explorer//ix-label//label//span[contains(text(),"Path")]//ancestor::ix-explorer/div/input').clear()
    driver.find_element_by_xpath('//ix-explorer//ix-label//label//span[contains(text(),"Path")]//ancestor::ix-explorer/div/input').send_keys(smb_ldap_path)
    driver.find_element_by_xpath('//ix-explorer//ix-label//label//span[contains(text(),"Path")]//ancestor::ix-explorer/div/input').send_keys(Keys.TAB)
    assert wait_on_element(driver, 5, '//ix-input//ix-label//label//span[contains(text(),"Name")]//ancestor::ix-input/div/input', 'inputable')
    driver.find_element_by_xpath('//ix-input//ix-label//label//span[contains(text(),"Name")]//ancestor::ix-input/div/input').clear()
    driver.find_element_by_xpath('//ix-input//ix-label//label//span[contains(text(),"Name")]//ancestor::ix-input/div/input').send_keys(ldapsmbsharename)

    assert wait_on_element(driver, 5, '//mat-card[1]/mat-card-content[1]/form[1]/ix-fieldset[1]/fieldset[1]/ix-checkbox[1]/mat-checkbox[1]/label[1]/span[contains(text(),"Enabled")]//ancestor::ix-checkbox//mat-checkbox', 'clickable')
    checkbox_checked = attribute_value_exist(driver, '//mat-card[1]/mat-card-content[1]/form[1]/ix-fieldset[1]/fieldset[1]/ix-checkbox[1]/mat-checkbox[1]/label[1]/span[contains(text(),"Enabled")]//ancestor::ix-checkbox//mat-checkbox', 'class', 'mat-checkbox-checked')
    if not checkbox_checked:
        driver.find_element_by_xpath('//mat-card[1]/mat-card-content[1]/form[1]/ix-fieldset[1]/fieldset[1]/ix-checkbox[1]/mat-checkbox[1]/label[1]/span[contains(text(),"Enabled")]//ancestor::ix-checkbox//mat-checkbox').click()
    assert attribute_value_exist(driver, '//mat-card[1]/mat-card-content[1]/form[1]/ix-fieldset[1]/fieldset[1]/ix-checkbox[1]/mat-checkbox[1]/label[1]/span[contains(text(),"Enabled")]//ancestor::ix-checkbox//mat-checkbox', 'class', 'mat-checkbox-checked')
    time.sleep(1)
    assert wait_on_element(driver, 5, '//ix-input//ix-label//label//span[contains(text(),"Description")]//ancestor::ix-input/div/input', 'inputable')
    driver.find_element_by_xpath('//ix-input//ix-label//label//span[contains(text(),"Description")]//ancestor::ix-input/div/input').clear()
    driver.find_element_by_xpath('//ix-input//ix-label//label//span[contains(text(),"Description")]//ancestor::ix-input/div/input').send_keys(ldapsmbsharedescription)
    assert wait_on_element(driver, 5, '//span[contains(text(),"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save")]').click()

    if is_element_present(driver, '//h3[contains(text(),"Restart SMB Service")]'):
        assert wait_on_element(driver, 10, '//span[contains(text(),"Restart Service")]', 'clickable')
        driver.find_element_by_xpath('//span[contains(text(),"Restart Service")]').click()

    assert wait_on_element_disappear(driver, 15, '//h6[contains(.,"Please wait")]')

    if not is_element_present(driver, '//h1[contains(.,"Sharing")]'):
        assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Shares"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Shares"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Sharing")]')


    # the ldapsmbshare should be added to the Shares list
    assert wait_on_element(driver, 5, '//div[contains(.,"ldapsmbshare")]')

    # send a file to the share with ip/"{ldapsmbshare}" and "{ldap_user}" and "{ldap_password}"
#    run_cmd('touch testfile.txt')
#    ldap_smb_results = run_cmd(f'smbclient //{nas_ip}/{smb_ldap_path} -U {ldap_user}%{ldap_password} -c "put testfile.txt testfile.txt"')
#    assert ldap_smb_results['result'], ldap_smb_results['output']
#    run_cmd('rm testfile.txt')


    # verify that the file is on the NAS dataset
#    global smb_ldap_results
#    smb_ldap_cmd = 'ls -la /mnt/tank/my_ldap_dataset/'
#    smb_ldap_results = ssh_cmd(smb_ldap_cmd, 'root', root_password, nas_ip)
#    assert smb_ldap_results['result'], smb_ldap_results['output']
#    assert 'testfile' in smb_ldap_results['output'], smb_ldap_results['output']


    # click on Credentials/DirectoryServices, then LDAP Settings, then disable and click SAVE
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
    assert wait_on_element(driver, 10, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Directory Services"]', 'clickable')
    driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Directory Services"]').click()
    assert wait_on_element(driver, 5, '//mat-card//span[contains(text(),"Settings")]', 'clickable')
    driver.find_element_by_xpath('//mat-card//span[contains(text(),"Settings")]').click()
    # Verify the box is starting to load
    assert wait_on_element(driver, 5, '//h3[text()="LDAP"]')
    assert wait_on_element(driver, 5, '//ix-fieldset//fieldset//ix-checkbox/mat-checkbox[1]/label[1]//following-sibling::span[contains(.,"Enable")]', 'clickable')
    driver.find_element_by_xpath('//ix-fieldset//fieldset//ix-checkbox/mat-checkbox[1]/label[1]//following-sibling::span[contains(.,"Enable")]').click()
    checkbox_checked = attribute_value_exist(driver, '//ix-fieldset//fieldset//ix-checkbox/mat-checkbox[1]/label[1]//following-sibling::span[contains(.,"Enable")]', 'class', 'mat-checkbox-checked')

    # The checkbox should be checked
    if checkbox_checked:
        driver.find_element_by_xpath('//ix-fieldset//fieldset//ix-checkbox/mat-checkbox[1]/label[1]//following-sibling::span[contains(.,"Enable")]').click()
    assert wait_on_element(driver, 5, '//span[contains(text(),"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save")]').click()

    assert wait_on_element_disappear(driver, 60, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//h1[text()="Directory Services"]')
    # Make sure Active Directory and LDAP are both disabled
    assert wait_on_element(driver, 10, '//h3[text()="Active Directory and LDAP are disabled."]')
    #assert wait_on_element(driver, 7, '//span[contains(text(),"Configure Active Directory")]', 'clickable')
    #assert wait_on_element(driver, 7, '//span[contains(text(),"Configure LDAP")]', 'clickable')





