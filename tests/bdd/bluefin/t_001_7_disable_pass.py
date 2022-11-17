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

def test_disable_pass(driver, nas_ip):
    """disable pass"""

    # the Users page should open, click the down carat sign right of the users
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    #assert wait_on_element(driver, 10, '//tr[contains(.,"ericbsd")]//mat-icon', 'clickable')
    #driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]//mat-icon').click()
    assert wait_on_element(driver, 10, '//mat-card//mat-card-content//table//tbody//ix-user-details-row//td//ix-table-expandable-row//div//button//span//span[contains(text(),"Edit")]', 'clickable')
    driver.find_element_by_xpath('//mat-card//mat-card-content//table//tbody//ix-user-details-row//td//ix-table-expandable-row//div//button//span//span[contains(text(),"Edit")]').click()


    # the User Edit Page should open, change "Disable Password" to Yes and click save
    assert wait_on_element(driver, 10, '//h3[contains(.,"Edit User")]')
    assert wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')
    #driver.find_element_by_xpath('//ix-slide-toggle[@formcontrolname="password_disabled"]//mat-slide-toggle/label').click()
    assert wait_on_element(driver, 10, '//ix-slide-toggle[@formcontrolname="password_disabled"]//mat-slide-toggle/label', 'clickable')
    driver.find_element_by_xpath('//ix-slide-toggle[@formcontrolname="password_disabled"]//mat-slide-toggle/label').click()
    value_exist = attribute_value_exist(driver, '//ix-slide-toggle[@formcontrolname="password_disabled"]//mat-slide-toggle', 'class', 'mat-checked')
    if not value_exist:
        driver.find_element_by_xpath('//ix-slide-toggle[@formcontrolname="password_disabled"]//mat-slide-toggle/label').click()
    wait_on_element(driver, 10, '//button[span[contains(.,"Save")]]', 'clickable')
    driver.find_element_by_xpath('//button[span[contains(.,"Save")]]').click()


    # change should be saved, open the user page and verify the user Disable Password is true
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//div[contains(.,"Users")]')
    if is_element_present(driver, '//div[contains(@class,"title-container") and contains(@class,"ng-star-inserted")]'):
        assert wait_on_element_disappear(driver, 10, '//div[contains(@class,"title-container") and contains(@class,"ng-star-inserted")]')
    if is_element_present(driver, '//div[contains(@class,"ix-slide-in-background") and contains(@class,"open")]'):
        assert wait_on_element_disappear(driver, 10, '//div[contains(@class,"ix-slide-in-background") and contains(@class,"open")]')
    assert wait_on_element(driver, 20, '//tr[contains(.,"ericbsd")]/td', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]/td').click()
    assert wait_on_element(driver, 10, '//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row//button[contains(.,"Edit")]')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row//dt[contains(.,"Password Disabled:")]')
    
    #Updated value should be visible.
    assert wait_on_element(driver, 5, '//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row//dt[contains(.,"Password Disabled:")]/../dd')
    element_text = driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row//dt[contains(.,"Password Disabled:")]/../dd').text
    assert element_text == 'true'

    # try login with ssh, the user should not be able to login
    time.sleep(1)
    # check SSH
    global ssh_result
    ssh_result = ssh_cmd('ls', 'ericbsd', 'testing', nas_ip)
    assert not ssh_result['result'], ssh_result['output']
    assert 'syslog' not in ssh_result['output'], ssh_result['output']