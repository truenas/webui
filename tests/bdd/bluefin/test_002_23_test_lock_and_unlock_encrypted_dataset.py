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




def test_lock_and_unlock_encrypted_dataset(driver):
    """test_lock_and_unlock_encrypted_dataset"""
    if not is_element_present(driver, '//h1[contains(.,"Storage")]'):
        assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage")]')


    """lock the pool when the pool page reloads."""
    assert wait_on_element(driver, 5, '//tr[contains(.,"encrypted_tank")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"tank")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 4, '//button[normalize-space(text())="Lock"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="Lock"]').click() 
    assert wait_on_element(driver, 10, '//h1[contains(.,"Lock Dataset encrypted_tank")]')

    assert wait_on_element(driver, 10, '//mat-checkbox[@ix-auto="checkbox__FORCE UNMOUNT"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__FORCE UNMOUNT"]').click()       
    assert wait_on_element(driver, 10, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()   
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__LOCK"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__LOCK"]').click()

    assert wait_on_element(driver, 10, '//mat-icon[@fonticon="mdi-lock"]')    


    # enter 1234abcd and verify that an error shows
    assert wait_on_element(driver, 5, '//tr[contains(.,"encrypted_tank")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"tank")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 4, '//button[normalize-space(text())="Unlock"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="Unlock"]').click() 
    assert wait_on_element(driver, 10, '//h1[contains(.,"Unlock Datasets")]')
    
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Dataset Passphrase"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Dataset Passphrase"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Dataset Passphrase"]').send_keys("1234abcd")
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element(driver, 10, '//p[contains(.,"The following datasets cannot be unlocked.")]')
    assert wait_on_element(driver, 5, '//mat-dialog-container//button[@ix-auto="button__CLOSE"]', 'clickable')
    driver.find_element_by_xpath('//mat-dialog-container//button[@ix-auto="button__CLOSE"]').click()


    # enter abcd1234 and confirm
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Dataset Passphrase"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Dataset Passphrase"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Dataset Passphrase"]').send_keys("abcd1234")
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()



    # unlock the pool
    assert wait_on_element(driver, 10, '//p[contains(.,"These datasets will be unlocked with the provided credentials.")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()

    assert wait_on_element(driver, 10, '//p[contains(.,"These datasets were successfully unlocked.")]')
    assert wait_on_element(driver, 10, '//button[@ix-auto="button__CLOSE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    assert wait_on_element(driver, 10, '//mat-icon[@fonticon="mdi-lock-open-variant"]')
