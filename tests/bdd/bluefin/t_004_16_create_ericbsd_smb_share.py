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



def test_create_ericbsd_smb_share(driver, nas_ip, root_password, eric_smb_path, ericsmbdescription, ericsharename, ericsmbname, user, password, user2, password2):
    """test_create_ericbsd_smb_share"""
#    if not is_element_present(driver, '//h1[contains(.,"Storage")]'):
#        assert wait_on_element(driver, 10, '//span[contains(text(),"Storage (Deprecated))]', 'clickable')
#        driver.find_element_by_xpath('//span[contains(text(),"Storage (Deprecated))]').click()
#    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage")]')

    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Shares"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Shares"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(text(),"Sharing")]')
    assert wait_on_element(driver, 10, '//mat-card[contains(.,"SMB")]//button[@ix-auto="button__-add"]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"SMB")]//button[@ix-auto="button__-add"]').click() 


    # The Windows Shares(SMB) page should open, Click Add
    assert wait_on_element(driver, 10, '//h3[contains(.,"Add SMB")]')
    assert wait_on_element(driver, 10, '//ix-explorer//ix-label//label//span[contains(text(),"Path")]//ancestor::ix-explorer/div/input', 'inputable')
    driver.find_element_by_xpath('//ix-explorer//ix-label//label//span[contains(text(),"Path")]//ancestor::ix-explorer/div/input').clear()
    driver.find_element_by_xpath('//ix-explorer//ix-label//label//span[contains(text(),"Path")]//ancestor::ix-explorer/div/input').send_keys(eric_smb_path)
    driver.find_element_by_xpath('//ix-explorer//ix-label//label//span[contains(text(),"Path")]//ancestor::ix-explorer/div/input').send_keys(Keys.TAB)
    assert wait_on_element(driver, 10, '//ix-input//ix-label//label//span[contains(text(),"Name")]//ancestor::ix-input/div/input', 'inputable')
    driver.find_element_by_xpath('//ix-input//ix-label//label//span[contains(text(),"Name")]//ancestor::ix-input/div/input').clear()
    driver.find_element_by_xpath('//ix-input//ix-label//label//span[contains(text(),"Name")]//ancestor::ix-input/div/input').send_keys(ericsmbname)

    assert wait_on_element(driver, 10, '//mat-card[1]/mat-card-content[1]/form[1]/ix-fieldset[1]/fieldset[1]/ix-checkbox[1]/mat-checkbox[1]/label[1]/span[contains(text(),"Enabled")]//ancestor::ix-checkbox//mat-checkbox', 'clickable')
    checkbox_checked = attribute_value_exist(driver, '//mat-card[1]/mat-card-content[1]/form[1]/ix-fieldset[1]/fieldset[1]/ix-checkbox[1]/mat-checkbox[1]/label[1]/span[contains(text(),"Enabled")]//ancestor::ix-checkbox//mat-checkbox', 'class', 'mat-checkbox-checked')
    if not checkbox_checked:
        driver.find_element_by_xpath('//mat-card[1]/mat-card-content[1]/form[1]/ix-fieldset[1]/fieldset[1]/ix-checkbox[1]/mat-checkbox[1]/label[1]/span[contains(text(),"Enabled")]//ancestor::ix-checkbox//mat-checkbox').click()
    assert attribute_value_exist(driver, '//mat-card[1]/mat-card-content[1]/form[1]/ix-fieldset[1]/fieldset[1]/ix-checkbox[1]/mat-checkbox[1]/label[1]/span[contains(text(),"Enabled")]//ancestor::ix-checkbox//mat-checkbox', 'class', 'mat-checkbox-checked')
    time.sleep(1)
    assert wait_on_element(driver, 10, '//ix-input//ix-label//label//span[contains(text(),"Description")]//ancestor::ix-input/div/input', 'inputable')
    driver.find_element_by_xpath('//ix-input//ix-label//label//span[contains(text(),"Description")]//ancestor::ix-input/div/input').clear()
    driver.find_element_by_xpath('//ix-input//ix-label//label//span[contains(text(),"Description")]//ancestor::ix-input/div/input').send_keys(ericsmbdescription)
    assert wait_on_element(driver, 10, '//span[contains(text(),"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save")]').click()

    if is_element_present(driver, '//h3[contains(text(),"Restart SMB Service")]'):
        assert wait_on_element(driver, 10, '//span[contains(text(),"Restart Service")]', 'clickable')
        driver.find_element_by_xpath('//span[contains(text(),"Restart Service")]').click()

    assert wait_on_element_disappear(driver, 30, '//h6[contains(.,"Please wait")]')

    if not is_element_present(driver, '//h1[contains(.,"Sharing")]'):
        assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Shares"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Shares"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Sharing")]')
    assert wait_on_element(driver, 10, '//a[contains(text(),"View Details")]', 'clickable')
    driver.find_element_by_xpath('//a[contains(text(),"View Details")]').click()
    assert wait_on_element(driver, 10, '//tr//td//div[contains(.,"eric_share")]//ancestor::tr//td//ix-entity-table-actions//div//button//mat-icon[contains(.,"more_vert")]', 'clickable')
    driver.find_element_by_xpath('//tr//td//div[contains(.,"eric_share")]//ancestor::tr//td//ix-entity-table-actions//div//button//mat-icon[contains(.,"more_vert")]').click()
    assert wait_on_element(driver, 10, '//span[contains(text(),"Edit Filesystem ACL")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Edit Filesystem ACL")]').click()

    assert wait_on_element(driver, 5, '//h1[text()="Edit ACL"]')
    assert wait_on_element(driver, 5, '//div[contains(.,"Group - builtin_users") and contains(@class,"ace")]//mat-icon[text()="cancel"]', 'clickable')
    driver.find_element_by_xpath('//div[contains(.,"Group - builtin_users") and contains(@class,"ace")]//mat-icon[text()="cancel"]').click()
    time.sleep(0.5)
    assert wait_on_element(driver, 5, '//span[contains(text(),"Save Access Control List")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save Access Control List")]').click()

    # the ldapsmbshare should be added to the Shares list
    assert wait_on_element(driver, 10, f'//div[contains(.,"{ericsmbname}")]')


    # This sleep is to make sure that the NAS VM is ready for the step
    time.sleep(2)


    # Send a file to the share with nas_IP/"{smbname}" and "{user}" and "{password}"
    run_cmd('touch testfile.txt')
    results = run_cmd(f'smbclient //{nas_ip}/{ericsmbname} -U {user}%{password} -c "put testfile.txt testfile.txt"')
    time.sleep(1)
    run_cmd('rm testfile.txt')
    assert results['result'], results['output']


    # Verify that the is on nas_ip with root and password
    global ericsmbresults1
    cmd = 'ls -la /mnt/tank/ericbsd_dataset'
    ericsmbresults1 = ssh_cmd(cmd, 'root', root_password, nas_ip)
    assert ericsmbresults1['result'], ericsmbresults1['output']
    assert 'testfile' in ericsmbresults1['output'], ericsmbresults1['output']


    # send a file to the share should fail with NAS IP/"{smbname}" and {user2}%{password2}
    run_cmd('touch testfile2.txt')
    results2 = run_cmd(f'smbclient //{nas_ip}/{ericsmbname} -U {user2}%{password2} -c "put testfile2.txt testfile2.txt"')
    time.sleep(1)
    run_cmd('rm testfile2.txt')
    assert not results2['result'], results2['output']


    # verify that the file is not on the NAS
    global ericsmbresults2
    cmd = 'ls -la /mnt/tank/ericbsd_dataset/'
    ericsmbresults2 = ssh_cmd(cmd, 'root', root_password, nas_ip)
    assert ericsmbresults2['result'], ericsmbresults2['output']
    assert 'testfile2' not in ericsmbresults2['output'], ericsmbresults2['output']

  