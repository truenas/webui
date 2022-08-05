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
from selenium.webdriver.common.keys import (Keys)

def test_disable_pass():
    """disable pass"""

    # the Users page should open, click the down carat sign right of the users
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 10, '//tr[contains(.,"ericbsd")]//mat-icon', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]//mat-icon').click()
    assert wait_on_element(driver, 10, '(//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row)[1]//button[contains(.,"Edit")]', 'clickable')
    driver.find_element_by_xpath('(//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row)[1]//button[contains(.,"Edit")]').click()


    # the User Edit Page should open, change "Disable Password" to Yes and click save
    assert wait_on_element(driver, 10, '//h3[contains(.,"Edit User")]')
    assert wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')
    #driver.find_element_by_xpath('//ix-slide-toggle[@formcontrolname="password_disabled"]//mat-slide-toggle/label').click()
    assert wait_on_element(driver, 3, '//ix-slide-toggle[@formcontrolname="password_disabled"]//mat-slide-toggle/label', 'clickable')
    driver.find_element_by_xpath('//ix-slide-toggle[@formcontrolname="password_disabled"]//mat-slide-toggle/label').click()
    value_exist = attribute_value_exist(driver, '//ix-slide-toggle[@formcontrolname="password_disabled"]//mat-slide-toggle', 'class', 'mat-checked')
    if not value_exist:
        driver.find_element_by_xpath('//ix-slide-toggle[@formcontrolname="password_disabled"]//mat-slide-toggle/label').click()
    wait_on_element(driver, 10, '//button[span[contains(.,"Save")]]', 'clickable')
    driver.find_element_by_xpath('//button[span[contains(.,"Save")]]').click()


    # change should be saved, open the user page and verify the user Disable Password is true
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 5, '//div[contains(.,"Users")]')


    # try login with ssh, the user should not be able to login
    time.sleep(1)
    # check SSH
    global ssh_result
    ssh_result = ssh_cmd('ls', 'ericbsd', 'testing', nas_ip)
    assert not ssh_result['result'], ssh_result['output']
    assert 'syslog' not in ssh_result['output'], ssh_result['output']