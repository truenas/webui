# coding=utf-8
"""SCALE UI feature tests."""

import time
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_on_element_disappear,
)


def test_add_email():
    """add email"""

    # the Users page should open, click the down carat sign right of the users
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 10, '//tr[contains(.,"ericbsd")]//mat-icon', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]//mat-icon').click()


    # the User Field should expand down, click the Edit button
    assert wait_on_element(driver, 10, '(//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row)[1]//button[contains(.,"Edit")]', 'clickable')
    driver.find_element_by_xpath('(//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row)[1]//button[contains(.,"Edit")]').click()


    # the User Edit Page should open, change the user email "eturgeon@ixsystems.com" and click save
    assert wait_on_element(driver, 10, '//h3[contains(.,"Edit User")]')
    assert wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//ix-input[@formcontrolname="email"]//input', 'inputable')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="email"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="email"]//input').send_keys("eturgeon@ixsystems.com")
    assert wait_on_element(driver, 10, '//button[span[contains(.,"Save")]]', 'clickable')
    element = driver.find_element_by_xpath('//button[span[contains(.,"Save")]]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    driver.find_element_by_xpath('//button[span[contains(.,"Save")]]').click()


    # change should be saved, open the user dropdown, the email value should be visible
    assert wait_on_element_disappear(driver, 15, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 10, '//tr[contains(.,"ericbsd")]//mat-icon', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]//mat-icon').click()
    driver.find_element_by_xpath('//div[contains(.,"Email:")]')