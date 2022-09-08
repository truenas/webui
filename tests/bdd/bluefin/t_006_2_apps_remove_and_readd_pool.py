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

    assert wait_on_element(driver, 10, '//div[contains(text(),"Available Applications")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Available Applications")]').click()
    assert wait_on_element(driver, 7, '//h3[contains(.,"minio")]')


    # the Apps page load, click settings, unset pool
    assert wait_on_element(driver, 20, '//button//span[contains(text(),"Settings")]', 'clickable')
    driver.find_element_by_xpath('//button//span[contains(text(),"Settings")]').click()
    assert wait_on_element(driver, 5, '//button[contains(text(),"Unset Pool")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(text(),"Unset Pool")]').click()
    assert wait_on_element(driver, 20, '//h1[contains(.,"Unset Pool")]')
    time.sleep(0.5)


    # confirm unset pool and wait
    assert wait_on_element(driver, 10, '//button//span[contains(text(),"Unset")]', 'clickable')
    driver.find_element_by_xpath('//button//span[contains(text(),"Unset")]').click()
    assert wait_on_element_disappear(driver, 60, '//h1[contains(.,"Configuring...")]')


    # click setting, reset pool
    assert wait_on_element(driver, 10, '//button//span[contains(text(),"Settings")]', 'clickable')
    driver.find_element_by_xpath('//button//span[contains(text(),"Settings")]').click()
    assert wait_on_element(driver, 10, '//button[contains(text(),"Choose Pool")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(text(),"Choose Pool")]').click()
    assert wait_on_element(driver, 7, '//h1[contains(.,"Choose a pool for Apps")]')
    assert wait_on_element(driver, 10, '//mat-dialog-container//ng-component//form//ix-select//div//div//mat-select', 'clickable')
    driver.find_element_by_xpath('//mat-dialog-container//ng-component//form//ix-select//div//div//mat-select').click()
    assert wait_on_element(driver, 7, '//span[contains(text(),"tank")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"tank")]').click()
    assert wait_on_element(driver, 7, '//span[contains(text(),"Choose")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Choose")]').click()
    assert wait_on_element_disappear(driver, 60, '//h1[contains(.,"Configuring...")]')

    assert wait_on_element(driver, 7, '//div[contains(.,"Available Applications")]')