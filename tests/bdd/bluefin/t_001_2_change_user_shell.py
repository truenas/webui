# coding=utf-8
"""SCALE UI feature tests."""

import time
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_on_element_disappear,
)


def test_change_user_shell():
    """change Shell for user"""

    # the Users page should open, click the down carat sign right of the users')
    assert wait_on_element(driver, 10, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 10, '//tr[contains(.,"ericbsd")]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]//mat-icon').click()


    # the User Field should expand down, then click the Edit button')
    #time.sleep(1)
    assert wait_on_element(driver, 10, '(//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row)[1]//button[contains(.,"Edit")]', 'clickable')
    driver.find_element_by_xpath('(//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row)[1]//button[contains(.,"Edit")]').click()


    # the User Edit Page should open, change the user shell and click save')
    assert wait_on_element(driver, 10, '//h3[contains(.,"Edit User")]')
    assert wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')
    element = driver.find_element_by_xpath('//button[span[contains(.,"Save")]]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    assert wait_on_element(driver, 5, '//ix-combobox[@formcontrolname="shell"]', 'clickable')
    driver.find_element_by_xpath('//ix-combobox[@formcontrolname="shell"]').click()
    assert wait_on_element(driver, 10, '//span[contains(.,"zsh")]', 'clickable')
    driver.find_element_by_xpath('//mat-option[span[contains(.,"zsh")]]').click()
    wait_on_element(driver, 10, '//button[span[contains(.,"Save")]]', 'clickable')
    driver.find_element_by_xpath('//button[span[contains(.,"Save")]]').click()


    # open the user dropdown, and verify the shell value has changed')
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 10, '//tr[contains(.,"ericbsd")]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]//mat-icon').click()
    assert wait_on_element(driver, 10, '//div[contains(.,"zsh")]')