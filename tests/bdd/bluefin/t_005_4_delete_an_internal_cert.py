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




def test_delete_an_internal_cert(driver):
    """test_delete_an_interal_cert"""
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
    assert wait_on_element(driver, 7, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Certificates"]', 'clickable')
    driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Certificates"]').click()


    # click on the trash icon for cert1
    assert wait_on_element(driver, 7, '//h3[contains(text(),"Certificates")]')
    assert wait_on_element(driver, 5, '//tr[contains(.,"cert1")]//mat-icon[contains(text(),"delete")]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"cert1")]//mat-icon[contains(text(),"delete")]').click()
    

    # click the confirm checkbox and click delet
    assert wait_on_element(driver, 5, '//h1[contains(.,"Delete")]')
    assert wait_on_element(driver, 10, '//ix-force-delete-certificate//form//ix-checkbox//mat-checkbox//label', 'clickable')
    driver.find_element_by_xpath('//ix-force-delete-certificate//form//ix-checkbox//mat-checkbox//label').click()
    assert wait_on_element(driver, 10, '//button//span[contains(text(),"Delete")]', 'clickable')
    driver.find_element_by_xpath('//button//span[contains(text(),"Delete")]').click()
    assert wait_on_element(driver, 5, '//*[contains(.,"Deleting")]')
    assert wait_on_element_disappear(driver, 10, '//*[contains(.,"Deleteing")]')


    # verify that the Cert was deleted
    assert wait_on_element_disappear(driver, 20, '//li[contains(.,"Name: cert1")]')
