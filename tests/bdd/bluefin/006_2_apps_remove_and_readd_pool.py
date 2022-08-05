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




def test_apps_remove_and_readd_pool(driver):
    """test_apps_remove_and_readd_pool"""
    if not is_element_present(driver, '//h1[contains(.,"Applications")]'):
        assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Apps"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Apps"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Applications")]')

    # the Apps page load, click settings, unset pool
    assert wait_on_element(driver, 20, '//button[@ix-auto-type="button"]//span[contains(text(),"Settings")]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto-type="button"]//span[contains(text(),"Settings")]').click()
    assert wait_on_element(driver, 5, '//span[contains(text(),"Unset Pool")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Unset Pool")]').click()
    assert wait_on_element(driver, 20, '//h1[contains(.,"Unset Pool")]')


    # confirm unset pool and wait
    assert wait_on_element(driver, 10, '//span[contains(text(),"UNSET")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"UNSET")]').click()
    assert wait_on_element_disappear(driver, 60, '//h1[contains(.,"Configuring...")]')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__CLOSE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()


    # click setting, reset pool
    assert wait_on_element(driver, 10, '//button[@ix-auto-type="button"]//span[contains(text(),"Settings")]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto-type="button"]//span[contains(text(),"Settings")]').click()
    assert wait_on_element(driver, 10, '//span[contains(text(),"Choose Pool")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Choose Pool")]').click()
    assert wait_on_element(driver, 7, '//h1[contains(.,"Choose a pool for Apps")]')
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Pools"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Pools"]').click()
    assert wait_on_element(driver, 7, '//mat-option[@ix-auto="option__Pools_tank"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Pools_tank"]').click()
    assert wait_on_element(driver, 7, '//button[@name="Choose_button"]', 'clickable')
    driver.find_element_by_xpath('//button[@name="Choose_button"]').click()
    assert wait_on_element_disappear(driver, 60, '//h1[contains(.,"Configuring...")]')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__CLOSE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Available Applications")]')