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


def test_change_pass(driver, nas_ip):
    """enable pass"""

    # the Users page should open, click the down carat sign right of the users
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    #assert wait_on_element(driver, 10, '//tr[contains(.,"ericbsd")]//mat-icon', 'clickable')
    #driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]//mat-icon').click()
    assert wait_on_element(driver, 10, '//mat-card//mat-card-content//table//tbody//ix-user-details-row//td//ix-table-expandable-row//div//button//span//span[contains(text(),"Edit")]', 'clickable')
    driver.find_element_by_xpath('//mat-card//mat-card-content//table//tbody//ix-user-details-row//td//ix-table-expandable-row//div//button//span//span[contains(text(),"Edit")]').click()


    # the User Edit Page should open, change the password in both fields and click save
    assert wait_on_element(driver, 10, '//h3[contains(.,"Edit User")]')
    assert wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//ix-input[@formcontrolname="password"]//input', 'inputable')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="password"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="password"]//input').send_keys('testing1234')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="password_conf"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="password_conf"]//input').send_keys('testing1234')
    element = driver.find_element_by_xpath('//button[span[contains(.,"Save")]]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    assert wait_on_element(driver, 10, '//button[span[contains(.,"Save")]]', 'clickable')
    driver.find_element_by_xpath('//button[span[contains(.,"Save")]]').click()
    time.sleep(1)


    # the changes should be saved without an error try to ssh with the old password for that user
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 2, '//div[contains(.,"Users")]')


    # the user should not be able to log in ssh with the old password, then try to ssh with the new password for that user
    time.sleep(2) #race condition if we dont give the OS enough time to preform the function first. 
    # check SSH
    global ssh_result1
    ssh_result1 = ssh_cmd('ls /', 'ericbsd', 'testing', nas_ip)
    assert not ssh_result1['result'], ssh_result1['output']
    assert 'home' not in ssh_result1['output'], ssh_result1['output']
    time.sleep(1)
    # check SSH
    global ssh_result2
    ssh_result2 = ssh_cmd('ls /', 'ericbsd', 'testing1234', nas_ip)
    assert ssh_result2['result'], ssh_result2['output']
    assert 'home' in ssh_result2['output'], ssh_result2['output']

