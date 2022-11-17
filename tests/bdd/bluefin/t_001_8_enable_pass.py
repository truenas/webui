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

def test_enable_pass(driver, nas_ip):
    """enable pass"""

    # the Users page should open, click the down carat sign right of the users
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    #assert wait_on_element(driver, 10, '//tr[contains(.,"ericbsd")]//mat-icon', 'clickable')
    #driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]//mat-icon').click()
    assert wait_on_element(driver, 10, '//mat-card//mat-card-content//table//tbody//ix-user-details-row//td//ix-table-expandable-row//div//button//span//span[contains(text(),"Edit")]', 'clickable')
    driver.find_element_by_xpath('//mat-card//mat-card-content//table//tbody//ix-user-details-row//td//ix-table-expandable-row//div//button//span//span[contains(text(),"Edit")]').click()


    # the User Edit Page should open, change "Disable Password" to No and click save
    assert wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//h3[contains(.,"Edit User")]')
    assert wait_on_element(driver, 3, '//ix-slide-toggle[@formcontrolname="password_disabled"]//mat-slide-toggle/label', 'clickable')
    driver.find_element_by_xpath('//ix-slide-toggle[@formcontrolname="password_disabled"]//mat-slide-toggle/label').click()
    value_exist = attribute_value_exist(driver, '//ix-slide-toggle[@formcontrolname="password_disabled"]//mat-slide-toggle', 'class', 'mat-checked')
    if value_exist:
        driver.find_element_by_xpath('//ix-slide-toggle[@formcontrolname="password_disabled"]//mat-slide-toggle/label').click()
    element = driver.find_element_by_xpath('//button[span[contains(.,"Save")]]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    assert wait_on_element(driver, 10, '//button[span[contains(.,"Save")]]', 'clickable')
    driver.find_element_by_xpath('//button[span[contains(.,"Save")]]').click()
    time.sleep(1)

    # change should be saved, open the user page and verify the user Disable Password is false
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 5, '//h1[contains(.,"Users")]')
    if is_element_present(driver, '//div[contains(@class,"title-container") and contains(@class,"ng-star-inserted")]'):
        assert wait_on_element_disappear(driver, 10, '//div[contains(@class,"title-container") and contains(@class,"ng-star-inserted")]')
    if is_element_present(driver, '//div[contains(@class,"ix-slide-in-background") and contains(@class,"open")]'):
        assert wait_on_element_disappear(driver, 10, '//div[contains(@class,"ix-slide-in-background") and contains(@class,"open")]')
    assert wait_on_element(driver, 10, '//tr[contains(.,"ericbsd")]//mat-icon', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]//mat-icon').click()
    element_text = driver.find_element_by_xpath('(//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row)[1]//dt[contains(.,"Password Disabled:")]/../dd').text
    assert element_text == 'false'


    # try login with ssh, the user should be able to login
    time.sleep(1)
    # check SSH
    global ssh_result
    ssh_result = ssh_cmd('ls /', 'ericbsd', 'testing', nas_ip)
    assert ssh_result['result'], ssh_result['output']
    assert 'home' in ssh_result['output'], ssh_result['output']