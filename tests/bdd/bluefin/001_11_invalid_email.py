# coding=utf-8
"""SCALE UI feature tests."""

import time
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_on_element_disappear,
    ssh_cmd,
)


def test_invalid_email():
    """invalid email"""

    # the Users page should open, click the down carat sign right of the users
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 10, '//tr[contains(.,"ericbsd")]//mat-icon', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]//mat-icon').click()


    # the User Field should expand down, click the Edit button
    assert wait_on_element(driver, 10, '(//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row)[1]//button[contains(.,"Edit")]', 'clickable')
    driver.find_element_by_xpath('(//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row)[1]//button[contains(.,"Edit")]').click()


    # the User Edit Page should open, change the user email "eturgeon@ixsystemscom"
    assert wait_on_element(driver, 10, '//h3[contains(.,"Edit User")]')
    assert wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//ix-input[@formcontrolname="email"]//input', 'inputable')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="email"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="email"]//input').send_keys("eturgeon@ixsystemscom")


    # you should not be able to save the changes and an error message should appear
    wait_on_element(driver, 10, '//button[span[contains(.,"Save")]]', 'clickable')
    driver.find_element_by_xpath('//button[span[contains(.,"Save")]]').click()
    assert wait_on_element(driver, 3, '//ix-fieldset[contains(.,"Identification")]')
    assert wait_on_element(driver, 3, '//mat-error[contains(.,"Not a valid E-Mail address")]')
    time.sleep(0.5)
    assert wait_on_element(driver, 10, '//*[@id="ix-close-icon"]', 'clickable')
    driver.find_element_by_xpath('//*[@id="ix-close-icon"]').click()