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




def test_recursive_and_transverse_acls(driver):
    """test_recursive_and_transverse_acls"""
    if not is_element_present(driver, '//h1[contains(.,"Storage")]'):
        assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage")]')

    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage")]')


    # Create 1st dataset {dataset_name}
    assert wait_on_element(driver, 5, '//tr[contains(.,"tank")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"tank")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 4, '//button[normalize-space(text())="Add Dataset"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="Add Dataset"]').click()  
    assert wait_on_element(driver, 5, '//h3[text()="Add Dataset"]')
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys(dataset_name)
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Share Type"]')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Share Type"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Share Type_SMB"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Share Type_SMB"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


    # Create 2nd dataset {dataset_name} under rt-acl-test-1
    assert wait_on_element(driver, 5, '//tr[contains(.,"rt-acl-test-1")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"rt-acl-test-1")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 4, '//button[normalize-space(text())="Add Dataset"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="Add Dataset"]').click()  
    assert wait_on_element(driver, 5, '//h3[text()="Add Dataset"]')
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys(dataset_name)
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Share Type"]')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Share Type"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Share Type_SMB"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Share Type_SMB"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element(driver, 5, '//span[contains(text(),"RETURN TO POOL LIST")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"RETURN TO POOL LIST")]').click()


    # Apply ACL with both recusrive and transverse set to rt-acl-test-1
    assert wait_on_element(driver, 10, f'//div[contains(text(),"rt-acl-test-1")]')
    time.sleep(1)
    assert wait_on_element(driver, 5, f'//tr[contains(.,"rt-acl-test-1")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath(f'//tr[contains(.,"rt-acl-test-1")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 5, '//button[normalize-space(text())="View Permissions"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="View Permissions"]').click()
    assert wait_on_element(driver, 5, '//mat-icon[text()="edit"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[text()="edit"]').click()
    assert wait_on_element(driver, 5, '//span[contains(text(),"Add Item")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Add Item")]').click()
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Who"]/div/div/span[contains(.,"User")]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Who"]/div/div/span[contains(.,"User")]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Who_User"]')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Who_User"]').click()
    assert wait_on_element(driver, 5, '(//div[@ix-auto="combobox__User"]//mat-form-field//input[@data-placeholder="User"])')
    driver.find_element_by_xpath('(//div[@ix-auto="combobox__User"]//mat-form-field//input[@data-placeholder="User"])').send_keys("ericbsd")
    time.sleep(1)
    driver.find_element_by_xpath('(//div[@ix-auto="combobox__User"]//mat-form-field//input[@data-placeholder="User"])').click()
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Apply permissions recursively"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Apply permissions recursively"]').click()
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Apply permissions to child datasets"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Apply permissions to child datasets"]').click()
    assert wait_on_element(driver, 5, '//span[contains(text(),"Save Access Control List")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save Access Control List")]').click()


    # Verify that the ACL was set to rt-acl-test-1
    assert wait_on_element(driver, 5, f'//tr[contains(.,"rt-acl-test-1")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath(f'//tr[contains(.,"rt-acl-test-1")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 5, '//button[normalize-space(text())="View Permissions"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="View Permissions"]').click()
    assert wait_on_element(driver, 5, '//div[contains(text(),"User - ericbsd")]')


    # Verify that the ACL was set to rt-acl-test-2
    assert wait_on_element(driver, 5, f'//div[contains(text(),"rt-acl-test-1")]//button', 'clickable')
    driver.find_element_by_xpath(f'//div[contains(text(),"rt-acl-test-1")]//button').click()
    assert wait_on_element(driver, 5, f'//tr[contains(.,"rt-acl-test-2")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath(f'//tr[contains(.,"rt-acl-test-2")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 5, '//button[normalize-space(text())="View Permissions"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="View Permissions"]').click()
    assert wait_on_element(driver, 5, '//div[contains(text(),"User - ericbsd")]')


    # Create 3rd dataset {dataset_name}
    assert wait_on_element(driver, 5, '//tr[contains(.,"rt-acl-test-1")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"rt-acl-test-1")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 4, '//button[normalize-space(text())="Add Dataset"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="Add Dataset"]').click()  
    assert wait_on_element(driver, 5, '//h3[text()="Add Dataset"]')
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys(dataset_name)
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Share Type"]')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Share Type"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Share Type_SMB"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Share Type_SMB"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element(driver, 5, '//span[contains(text(),"RETURN TO POOL LIST")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"RETURN TO POOL LIST")]').click()


    # Create SMB share with path {path}
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Shares"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Shares"]').click()
    assert wait_on_element(driver, 5, '//div[contains(.,"Shares")]')
    assert wait_on_element(driver, 7, '//mat-card[contains(.,"Windows (SMB) Shares")]//button[contains(.,"Add")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"Windows (SMB) Shares")]//button[contains(.,"Add")]').click()
    assert wait_on_element(driver, 5, '//h3[contains(text(),"Add SMB")]')
    global smb_path
    smb_path = path
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__path"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__path"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__path"]').send_keys(path)
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys("rt-test")
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__Enabled"]', 'clickable')
    checkbox_checked = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Enabled"]', 'class', 'mat-checkbox-checked')
    if not checkbox_checked:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Enabled"]').click()
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Enabled"]', 'class', 'mat-checkbox-checked')
    time.sleep(1)
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Description"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Description"]').send_keys("rt-test")
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 15, '//h6[contains(.,"Please wait")]')


    # Apply ACL to rt-acl-test-1 with recusrive checked
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage")]')
    assert wait_on_element(driver, 10, f'//div[contains(text(),"rt-acl-test-1")]')
    time.sleep(1)
    assert wait_on_element(driver, 5, f'//tr[contains(.,"rt-acl-test-1")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath(f'//tr[contains(.,"rt-acl-test-1")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 5, '//button[normalize-space(text())="View Permissions"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="View Permissions"]').click()
    assert wait_on_element(driver, 5, '//mat-icon[text()="edit"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[text()="edit"]').click()
    assert wait_on_element(driver, 5, '//span[contains(text(),"Add Item")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Add Item")]').click()
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Who"]/div/div/span[contains(.,"User")]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Who"]/div/div/span[contains(.,"User")]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Who_User"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Who_User"]').click()
    assert wait_on_element(driver, 5, '(//div[@ix-auto="combobox__User"]//mat-form-field//input[@data-placeholder="User"])')
    driver.find_element_by_xpath('(//div[@ix-auto="combobox__User"]//mat-form-field//input[@data-placeholder="User"])').send_keys("games")
    time.sleep(1)
    driver.find_element_by_xpath('(//div[@ix-auto="combobox__User"]//mat-form-field//input[@data-placeholder="User"])').click()
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Apply permissions recursively"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Apply permissions recursively"]').click()
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()
    assert wait_on_element(driver, 5, '//span[contains(text(),"Save Access Control List")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save Access Control List")]').click()



    # Verify that the ACL was not set to rt-acl-test-3
    assert wait_on_element(driver, 5, f'//div[contains(text(),"rt-acl-test-1")]//button', 'clickable')
    driver.find_element_by_xpath(f'//div[contains(text(),"rt-acl-test-1")]//button').click()
    time.sleep(3)
    assert wait_on_element(driver, 5, f'//tr[contains(.,"rt-acl-test-3")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath(f'//tr[contains(.,"rt-acl-test-3")]//mat-icon[text()="more_vert"]').click()
    time.sleep(1)
    assert wait_on_element(driver, 5, '//button[normalize-space(text())="View Permissions"]')
    driver.find_element_by_xpath('//button[normalize-space(text())="View Permissions"]').click()
    assert wait_on_element(driver, 5, '//div[contains(text(),"User - games")]') is False


    # Verify the SMB Share Filesystem has the ACL that was applied to rt-acl-test-1
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Shares"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Shares"]').click()
    assert wait_on_element(driver, 5, '//div[contains(.,"Shares")]')
    assert wait_on_element(driver, 5, '//mat-panel-title//h5//a[contains(.,"(SMB)")]', 'clickable')
    driver.find_element_by_xpath('//mat-panel-title//h5//a[contains(.,"(SMB)")]').click()
    assert wait_on_element(driver, 5, f'//tr[contains(.,"rt-test")]//mat-icon[@ix-auto="options__rt-test"]', 'clickable')
    driver.find_element_by_xpath(f'//tr[contains(.,"rt-test")]//mat-icon[@ix-auto="options__rt-test"]').click()
    assert wait_on_element(driver, 5, f'//button[@ix-auto="action__rt-test_Edit Filesystem ACL"]', 'clickable')
    driver.find_element_by_xpath(f'//button[@ix-auto="action__rt-test_Edit Filesystem ACL"]').click()
    assert wait_on_element(driver, 5, '//h1[contains(text(),"Edit POSIX.1e ACL")]')
    assert wait_on_element(driver, 5, '//div[contains(text(),"/mnt/tank/rt-acl-test-1/share")]')
    assert wait_on_element(driver, 5, '//div[contains(text(),"User - games")]')

