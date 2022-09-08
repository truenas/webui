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




def test_delete_dataset(driver):
    """test_delete_dataset"""
    if not is_element_present(driver, '//h1[contains(.,"Storage")]'):
        assert wait_on_element(driver, 10, '//span[contains(text(),"Storage (Deprecated))]', 'clickable')
        driver.find_element_by_xpath('//span[contains(text(),"Storage (Deprecated))]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage")]')

    """the storage page opens click the pool config button."""
    assert wait_on_element(driver, 10, '//mat-icon[@id="encrypted_tank_settings_button"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="encrypted_tank_settings_button"]').click()


    # in the dropdown click Export Disconnect
    assert wait_on_element(driver, 10, '//span[contains(text(),"Export/Disconnect")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Export/Disconnect")]').click()


    # click the checkboxes, enter name, and click export
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__Destroy data on this pool?"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Destroy data on this pool?"]').click()   
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__"]').click()
    #driver.find_element_by_xpath('//input[@ix-auto="input__"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__"]').send_keys("encrypted_tank")
    assert wait_on_element(driver, 10, '//mat-checkbox[@ix-auto="checkbox__Confirm Export/Disconnect"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Confirm Export/Disconnect"]').click()   
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__EXPORT/DISCONNECT"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__EXPORT/DISCONNECT"]').click()

    # storage page should load and the pool should be gone
    assert wait_on_element(driver, 20, '//button[@ix-auto="button__CLOSE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    assert wait_on_element(driver, 10, '//div[contains(.,"encrypted_tank")]') is False

