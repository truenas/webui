# coding=utf-8
"""SCALE UI feature tests."""
import time
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_for_attribute_value,
    wait_on_element_disappear
)




def test_delete_a_ca(driver):
    """test_delete_a_ca"""
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
    assert wait_on_element(driver, 7, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Certificates"]', 'clickable')
    driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Certificates"]').click()


    # click on the trash icon for ca1
    assert wait_on_element(driver, 7, '//h3[contains(text(),"Certificate Authorities")]')
    assert wait_on_element(driver, 5, '//tr[contains(.,"ca1")]//mat-icon[contains(text(),"delete")]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ca1")]//mat-icon[contains(text(),"delete")]').click()


    # click the confirm checkbox and click delete
    assert wait_on_element(driver, 5, '//h1[contains(.,"Delete")]')
    assert wait_on_element(driver, 10, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 10, '//button[@ix-auto="button__DELETE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__DELETE"]').click()


    # verify that the CA was deleted
    assert wait_on_element_disappear(driver, 20, '//li[contains(.,"Name: ca1")]')
