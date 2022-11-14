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




def test_add_a_catalog(driver):
    """test_add_a_catalog"""
    if not is_element_present(driver, '//h1[contains(.,"Applications")]'):
        assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Apps"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Apps"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Applications")]')

    # the Apps page load, open available applications
    assert wait_on_element(driver, 10, '//div[contains(text(),"Available Applications")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Available Applications")]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Available Applications")]')


    # when the Apps page loads, open manage catalogs
    assert wait_on_element(driver, 10, '//div[contains(text(),"Manage Catalogs")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Manage Catalogs")]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Manage Catalogs")]')


    # click add catalog
    assert wait_on_element(driver, 10, '//div[text()="OFFICIAL"]')
    assert wait_on_element(driver, 10, '//span[contains(.,"Add Catalog")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Add Catalog")]').click()


    # fill out the form)
    assert wait_on_element(driver, 7, '//div[contains(.,"Add Catalog")]')
    assert wait_on_element(driver, 7, '//ix-input[@formcontrolname = "label"]//input')
    driver.find_element_by_xpath('//ix-input[@formcontrolname = "label"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname = "label"]//input').send_keys('truecharts')
    assert wait_on_element(driver, 7, '//ix-input[@formcontrolname = "repository"]//input')
    driver.find_element_by_xpath('//ix-input[@formcontrolname = "repository"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname = "repository"]//input').send_keys('https://github.com/truecharts/catalog')
    assert wait_on_element(driver, 10, '//span[contains(.,"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Save")]').click()


    # close confirmation dialog
    assert wait_on_element(driver, 30, '//span[contains(.,"Success")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"Close")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Close")]').click()


    # confirm installation is successful
    assert wait_on_element(driver, 900, '//div[text()="TRUECHARTS"]')