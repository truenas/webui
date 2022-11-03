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




def test_create_encrypted_pool(driver):
    """test_create_encrypted_pool"""
    if not is_element_present(driver, '//h1[contains(.,"Storage")]'):
        assert wait_on_element(driver, 10, '//span[contains(text(),"Storage")]', 'clickable')
        driver.find_element_by_xpath('//span[contains(text(),"Storage")]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage Dashboard")]')


    assert wait_on_element(driver, 10, '//span[contains(.,"Create Pool")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Create Pool")]').click()


    # the Pool Manager appears, enter the tank for pool name
    assert wait_on_element(driver, 7, '//div[contains(.,"Pool Manager")]')


    # click encryption and confirm popup
    assert wait_on_element(driver, 10, '//mat-checkbox[@id="pool-manager__encryption-checkbox"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@id="pool-manager__encryption-checkbox"]').click()
    assert wait_on_element(driver, 10, '//mat-checkbox[@id="confirm-dialog__confirm-checkbox"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@id="confirm-dialog__confirm-checkbox"]').click()    
    assert wait_on_element(driver, 10, '//button[@ix-auto="button__I UNDERSTAND"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__I UNDERSTAND"]').click() 

    # name the pool
    assert wait_on_element(driver, 10, '//input[@id="pool-manager__name-input-field"]', 'inputable')
    driver.find_element_by_xpath('//input[@id="pool-manager__name-input-field"]').send_keys('encrypted_tank')


    # click a drive checkbox and press the right arrow
    assert wait_on_element(driver, 10, '//datatable-body[contains(.,"sd")]//mat-checkbox[1]', 'clickable')
    driver.find_element_by_xpath('//datatable-body[contains(.,"sd")]//mat-checkbox[1]').click()
    assert wait_on_element(driver, 5, '//button[@id="vdev__add-button"]', 'clickable')
    driver.find_element_by_xpath('//button[@id="vdev__add-button"]').click()
    assert wait_on_element(driver, 7, '//mat-checkbox[@id="pool-manager__force-submit-checkbox"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@id="pool-manager__force-submit-checkbox"]').click()



    # click create, On the Warning widget, click confirm checkbox, click CREATE POOL
    assert wait_on_element(driver, 10, '//h1[contains(.,"Warning")]')
    assert wait_on_element(driver, 7, '//mat-checkbox[@name="confirm_checkbox"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@name="confirm_checkbox"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()
    assert wait_on_element(driver, 5, '//span[contains(.,"Create")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Create")]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Warning")]')
    assert wait_on_element(driver, 7, '//mat-checkbox[@name="confirm_checkbox"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@name="confirm_checkbox"]').click()
    assert wait_on_element(driver, 7, '//span[contains(.,"Create Pool")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Create Pool")]').click()
    assert wait_on_element_disappear(driver, 120, '//h1[contains(.,"Create Pool")]')
    assert wait_on_element(driver, 20, '//h1[contains(.,"WARNING!")]')
    assert wait_on_element(driver, 30, '//button[contains(text(),"Done")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(text(),"Done")]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage Dashboard")]')


    # the pool should be listed on the storage page
    assert wait_on_element(driver, 7, '//div[contains(.,"encrypted_tank")]')
