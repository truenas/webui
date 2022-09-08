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




def test_verify_fullaudit_for_smb(driver):
    """test_verify_fullaudit_for_smb"""
    if not is_element_present(driver, '//h1[contains(.,"Storage")]'):
        assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage")]')

   """"click on the System Settings side menu, then click services."""
    assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__System Settings"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System Settings"]').click()
    assert wait_on_element(driver, 10, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Services"]', 'clickable')
    driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Services"]').click()


    # on the service page, press on configure SMB
    assert wait_on_element(driver, 7, '//h1[text()="Services"]')
    assert wait_on_element(driver, 5, '//td[contains(text(),"Dynamic DNS")]')
    # Scroll to SSH service
    element = driver.find_element_by_xpath('//td[contains(text(),"Dynamic DNS")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    assert wait_on_element(driver, 5, '//tr[contains(.,"SMB")]//button', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"SMB")]//button').click()


    # the SMB page loads click advanced
    if wait_on_element(driver, 3, '//*[contains(.,"Please wait")]'):
        assert wait_on_element_disappear(driver, 10, '//*[contains(.,"Please wait")]')
    assert wait_on_element(driver, 5, '//h1[contains(text(),"SMB")]')
    assert wait_on_element(driver, 10, '//button[@ix-auto="button__ADVANCED OPTIONS"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__ADVANCED OPTIONS"]').click()


    # Enter parameters and click save
    element = driver.find_element_by_xpath('//button[@ix-auto="button__CANCEL"]')
    # Scroll to SSH service
    driver.execute_script("arguments[0].scrollIntoView();", element)
    assert wait_on_element(driver, 5, '//div[@ix-auto="textarea__Auxiliary Parameters"]//textarea', 'inputable')
    auxvariable_str = "vfs objects = full_audit\nfull_audit:success = rename write pwrite unlinkat linkat mkdirat\nfull_audit:failure = connect\nfull_audit:prefix = %I|%m|%S"
    driver.find_element_by_xpath('//div[@ix-auto="textarea__Auxiliary Parameters"]//textarea').click()
    driver.find_element_by_xpath('//div[@ix-auto="textarea__Auxiliary Parameters"]//textarea').send_keys(auxvariable_str)
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 10, '//*[contains(.,"Please wait")]')


    # The Service page should load and there should be no traceback
    assert wait_on_element(driver, 10, '//h1[contains(text(),"Services")]')
