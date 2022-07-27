# coding=utf-8
"""SCALE UI feature tests."""
import time
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_for_attribute_value,
    wait_on_element_disappear,
    ssh_cmd
)




def test_create_a_group(driver):
    """test_create_a_group"""
    if not is_element_present(driver, '//span[contains(text(),"System Information")]'):
        assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    assert wait_on_element(driver, 7, '//h1[text()="Dashboard"]')

    # on the dashboard click on Credentials and Local Groups
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
    assert wait_on_element(driver, 10, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Groups"]', 'clickable')
    driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Groups"]').click()


    # on the Groups page, close the note and click Add
    assert wait_on_element(driver, 7, '//h1[contains(.,"Display Note")]')
    assert wait_on_element(driver, 5, '//span[contains(text(),"CLOSE")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"CLOSE")]').click()  
    assert wait_on_element(driver, 10, '//h1[contains(text(),"Groups")]')
    assert wait_on_element(driver, 10, '//button[@ix-auto="button__Groups_ADD"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__Groups_ADD"]').click()


    # input the group name and click save
    assert wait_on_element(driver, 7, '//h3[contains(.,"Add Group")]')
    assert wait_on_element(driver, 7, '//ix-input[@formcontrolname="name"]//input', 'inputable')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="name"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="name"]//input').send_keys('qetest')
    assert wait_on_element(driver, 7, '//span[contains(text(),"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save")]').click()


    # verify the group was added
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//h1[contains(.,"Groups")]')
    assert wait_on_element(driver, 10, '//div[contains(.,"qetest")]')
