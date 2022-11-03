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




def test_change_encryption_key(driver):
    """test_change_encryption_key"""
    if not is_element_present(driver, '//h1[contains(.,"Storage")]'):
        assert wait_on_element(driver, 10, '//span[contains(text(),"Storage")]', 'clickable')
        driver.find_element_by_xpath('//span[contains(text(),"Storage")]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage Dashboard")]')


   # click Storage on the side menu and click on the "tank_acl_dataset" 3 dots button, select Edit Permissions
    assert wait_on_element(driver, 5, '//ix-dashboard-pool//div//div//h2[contains(.,"encrypted_tank")]//ancestor::ix-dashboard-pool//div//div//ix-pool-usage-card//mat-card//mat-card-header//a[contains(.,"Manage Datasets")]', 'clickable')
    driver.find_element_by_xpath('//ix-dashboard-pool//div//div//h2[contains(.,"encrypted_tank")]//ancestor::ix-dashboard-pool//div//div//ix-pool-usage-card//mat-card//mat-card-header//a[contains(.,"Manage Datasets")]').click()
    
    if not is_element_present(driver, '//ix-tree-node[contains(@class,"selected")]//ix-dataset-node//div//div//span[contains(.,"encrypted_tank")]'):
        assert wait_on_element(driver, 10, '//ix-tree-node//ix-dataset-node//div//div//span[contains(.,"encrypted_tank")]', 'clickable')
        driver.find_element_by_xpath('//ix-tree-node//ix-dataset-node//div//div//span[contains(.,"encrypted_tank")]').click()
    assert wait_on_element( driver, 10, '//ix-tree-node[contains(@class,"selected")]//ix-dataset-node//div//div//span[contains(.,"encrypted_tank")]') 

    assert wait_on_element(driver, 5, '//mat-card-header//div//h3[contains(text(),"ZFS Encryption")]//ancestor::mat-card-header//a//span[contains(.,"Edit")]', 'clickable')
    driver.find_element_by_xpath('//mat-card-header//div//h3[contains(text(),"ZFS Encryption")]//ancestor::mat-card-header//a//span[contains(.,"Edit")]').click()


    # Popup appears
 
    assert wait_on_element(driver, 10, '//h1[contains(.,"Edit Encryption Options")]')

    # set key type to passphrase
    assert wait_on_element(driver, 10, '//ix-select[@formcontrolname="encryption_type"]')
    driver.find_element_by_xpath('//ix-select[@formcontrolname="encryption_type"]//div//div//mat-select').click()
    assert wait_on_element(driver, 10, '//span[contains(text(),"Passphrase")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Passphrase")]').click()


    # enter acbd1234 and 1234abcd and verify that an error shows
    assert wait_on_element(driver, 10, '//ix-input[@formcontrolname="passphrase"]//div//input', 'inputable')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="passphrase"]//div//input').click()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="passphrase"]//div//input').send_keys("abcd1234")
    assert wait_on_element(driver, 10, '//ix-input[@formcontrolname="confirm_passphrase"]//div//input', 'inputable')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="confirm_passphrase"]//div//input').click()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="confirm_passphrase"]//div//input').send_keys("1234abcd")
    assert wait_on_element(driver, 10, '//mat-error[contains(.,"Passphrase and confirmation should match.")]')


    # enter abcd1234 for both fields and confirm and save
    assert wait_on_element(driver, 10, '//ix-input[@formcontrolname="confirm_passphrase"]//div//input', 'inputable')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="confirm_passphrase"]//div//input').click()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="confirm_passphrase"]//div//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="confirm_passphrase"]//div//input').send_keys("abcd1234")
    assert wait_on_element(driver, 10, '//mat-error[contains(.,"Passphrase and confirmation should match.")]') is False
    
    assert wait_on_element(driver, 10, '//mat-checkbox//ancestor::ix-checkbox//span[contains(.,"Confirm")]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox//ancestor::ix-checkbox//span[contains(.,"Confirm")]').click()

    assert wait_on_element(driver, 10, '//span[contains(text(),"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save")]').click()
    assert wait_on_element(driver, 20, '//div[contains(.,"Encryption Options Saved")]')


    # lock the pool when the pool page reloads
    assert wait_on_element(driver, 10, '//button//span[contains(.,"Lock")]', 'clickable')
    driver.find_element_by_xpath('//button//span[contains(.,"Lock")]').click() 
    assert wait_on_element(driver, 10, '//h1[contains(.,"Lock Dataset")]')

    assert wait_on_element(driver, 10, '//mat-checkbox//label//span[contains(.,"Force unmount")]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox//label//span[contains(.,"Force unmount")]').click()       
    assert wait_on_element(driver, 10, '//ix-checkbox//following-sibling::div//button//span[contains(.,"Lock")]', 'clickable')
    driver.find_element_by_xpath('//ix-checkbox//following-sibling::div//button//span[contains(.,"Lock")]').click()

    assert wait_on_element(driver, 20, '//mat-icon[@fonticon="mdi-lock"]')


    # unlock the pool
    assert wait_on_element(driver, 410, '//mat-card-header//div//h3[contains(text(),"ZFS Encryption")]//ancestor::mat-card-header//a//span[contains(.,"Unlock")]', 'clickable')
    driver.find_element_by_xpath('//mat-card-header//div//h3[contains(text(),"ZFS Encryption")]//ancestor::mat-card-header//a//span[contains(.,"Unlock")]').click() 
    assert wait_on_element(driver, 10, '//h4[contains(.,"Unlock Datasets")]')
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Dataset Passphrase"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Dataset Passphrase"]').click()
    driver.find_element_by_xpath('//input[@ix-auto="input__Dataset Passphrase"]').send_keys("abcd1234")
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__Force"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Force"]').click()
    assert wait_on_element(driver, 10, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element(driver, 10, '//p[contains(.,"These datasets will be unlocked with the provided credentials.")]')
    assert wait_on_element(driver, 10, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()
    assert wait_on_element(driver, 10, '//p[contains(.,"These datasets were successfully unlocked.")]')
    assert wait_on_element(driver, 10, '//button[@ix-auto="button__CLOSE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()

    assert wait_on_element(driver, 20, '//mat-icon[@fonticon="mdi-lock-open-variant"]')
