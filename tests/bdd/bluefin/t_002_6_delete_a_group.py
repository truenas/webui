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




def test_delete_a_group(driver):
    """test_delete_a_group"""
    if not is_element_present(driver, '//h1[contains(text(),"Groups")]'):
        assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
        assert wait_on_element(driver, 10, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Groups"]', 'clickable')
        driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Groups"]').click()
    assert wait_on_element(driver, 7, '//h1[contains(text(),"Groups")]')

    # on the Groups page click to expand the gidtestdupe entry."""
    assert wait_on_element(driver, 10, '//tr[contains(.,"gidtestdupe")]//mat-icon', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"gidtestdupe")]//mat-icon').click()

    # click delete, click the confirm checkbox, and click delete
    assert wait_on_element(driver, 7, '//mat-icon[contains(text(),"delete")]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[contains(text(),"delete")]').click()

    #assert wait_on_element(driver, 10, '//ix-form-checkbox//div[1]//mat-checkbox//label//span', 'clickable')
    #driver.find_element_by_xpath('//ix-form-checkbox//div[1]//mat-checkbox//label//span').click()

    assert wait_on_element(driver, 10, '//mat-dialog-container//button//span[contains(text(),"Delete")]', 'clickable')
    driver.find_element_by_xpath('//mat-dialog-container//button//span[contains(text(),"Delete")]').click()

    #assert wait_on_element(driver, 20, '//button//span[contains(.,"Confirm")]', 'clickable')
    #driver.find_element_by_xpath('//button//span[contains(.,"Confirm")]').click()

    # verify the group was deleted
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//h1[contains(.,"Groups")]')
    assert wait_on_element(driver, 10, '//div[contains(.,"gidtestdupe")]') is False