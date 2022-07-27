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
    assert wait_on_element(driver, 10, '//tr[@ix-auto="expander__gidtestdupe"]/td', 'clickable')
    driver.find_element_by_xpath('//tr[@ix-auto="expander__gidtestdupe"]/td').click()
    

    # click delete, click the confirm checkbox, and click delete
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__DELETE_gidtestdupe_gidtestdupe"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__DELETE_gidtestdupe_gidtestdupe"]').click()

    assert wait_on_element(driver, 10, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()

    assert wait_on_element(driver, 7, '//span[contains(text(),"DELETE")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"DELETE")]').click()


    # verify the group was deleted
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//h1[contains(.,"Groups")]')
    assert wait_on_element(driver, 10, '//div[contains(.,"gidtestdupe")]') is False