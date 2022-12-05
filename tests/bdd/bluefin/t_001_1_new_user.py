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

def test_new_user(driver):
    """test new user"""
    """click on the Credentials on the side menu, click on Local Users."""
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
    assert wait_on_element(driver, 10, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Users"]', 'clickable')
    driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Users"]').click()

    
    # the Users page should open, click on the "Add" Button')
    if is_element_present(driver, '//h1[contains(.,"Display Note")]'):
        assert wait_on_element(driver, 5, '//button[@ix-auto="button__CLOSE"]', 'clickable')
        driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()  
    assert wait_on_element(driver, 10, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"Add")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Add")]').click()


    # the Users Add Page should open, input the fields Full Name, Username, Password and click Save')
    assert wait_on_element(driver, 7, '//h3[contains(.,"Add User")]')
    assert wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')
    """input in the following fields Full Name, Username, and password."""
    assert wait_on_element(driver, 7, '//ix-input[@formcontrolname="full_name"]//input')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="full_name"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="full_name"]//input').send_keys('Eric Turgeon')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="username"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="username"]//input').send_keys('ericbsd')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="password"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="password"]//input').send_keys('testing')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="password_conf"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="password_conf"]//input').send_keys('testing')
    assert wait_on_element(driver, 7, '//button[span[contains(.,"Save")]]', 'clickable')
    driver.find_element_by_xpath('//button[span[contains(.,"Save")]]').click()


    # the new User should be created and added to the user list')
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 20, '//div[contains(.,"ericbsd")]')

