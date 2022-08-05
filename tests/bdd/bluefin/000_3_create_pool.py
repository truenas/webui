# coding=utf-8
"""SCALE UI feature tests."""
import time
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_for_attribute_value,
    wait_on_element_disappear,
    ssh_cmd,
)


"""Create a new user call ericbsd."""

def test_create_pool(driver):
    """test new user"""
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()


    # the pools page appears click create pool
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage")]')
    assert wait_on_element(driver, 10, '//a[@ix-auto="button___POOL_CREATE"]', 'clickable')
    driver.find_element_by_xpath('//a[@ix-auto="button___POOL_CREATE"]').click()


    # the Pool Manager appears, enter the tank for pool name
    assert wait_on_element(driver, 7, '//div[contains(.,"Pool Manager")]')
    assert wait_on_element(driver, 10, '//input[@id="pool-manager__name-input-field"]', 'inputable')
    driver.find_element_by_xpath('//input[@id="pool-manager__name-input-field"]').send_keys('tank')


    # click sdb checkbox, press the right arrow under Data VDevs
    assert wait_on_element(driver, 5, '//datatable-body[contains(.,"sd")]//mat-checkbox[1]', 'clickable')
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
    assert wait_on_element(driver, 5, '//button[@id="pool-manager__create-button"]', 'clickable')
    driver.find_element_by_xpath('//button[@id="pool-manager__create-button"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Warning")]')
    assert wait_on_element(driver, 7, '//mat-checkbox[@name="confirm_checkbox"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@name="confirm_checkbox"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__CREATE POOL"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CREATE POOL"]').click()


    # Create pool should appear while pool is being created
    assert wait_on_element(driver, 10, '//h1[contains(.,"Create Pool")]')
    assert wait_on_element_disappear(driver, 120, '//h1[contains(.,"Create Pool")]')
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage")]')


    # you should be returned to the list of pools and tank should appear in the list
    assert wait_on_element(driver, 7, '//div[contains(.,"tank")]')