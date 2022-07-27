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




def test_create_zvol_for_iscsi(driver):
    """test_create_zvol_for_iscsi"""
    if not is_element_present(driver, '//h1[contains(.,"Storage")]'):
        assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage")]')


    # click on the tank three dots button, select Add Zvol, and the Add Zvol page should open
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage")]')
    assert wait_on_element(driver, 5, '//tr[contains(.,"tank")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"tank")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 4, '//button[normalize-space(text())="Add Zvol"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="Add Zvol"]').click() 
    time.sleep(1)
    assert wait_on_element(driver, 5, '//h3[text()="Add Zvol"]')


    # input {name} for Zvol Name and "{zvol_1G_size}" for Zvol Size, click the SUBMIT button,
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Zvol name"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Zvol name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Zvol name"]').send_keys(name)
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Size for this zvol"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Size for this zvol"]').send_keys(zvol_1G_size)
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


    # Please wait should appear, And the nopeer1 zvol should be created
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//div[contains(.,"nopeer1")]')
    ## return to dashboard
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    time.sleep(1)

