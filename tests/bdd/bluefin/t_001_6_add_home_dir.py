# coding=utf-8
"""SCALE UI feature tests."""

import time
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_on_element_disappear,
)
from selenium.webdriver.common.keys import (Keys)

def test_add_home_dir(driver):
    """add home dir"""

    # the Users page should open, click the down carat sign right of the users
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    #assert wait_on_element(driver, 10, '//tr[contains(.,"ericbsd")]//mat-icon', 'clickable')
    #driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]//mat-icon').click()
    assert wait_on_element(driver, 10, '//mat-card//mat-card-content//table//tbody//ix-user-details-row//td//ix-table-expandable-row//div//button//span//span[contains(text(),"Edit")]', 'clickable')
    driver.find_element_by_xpath('//mat-card//mat-card-content//table//tbody//ix-user-details-row//td//ix-table-expandable-row//div//button//span//span[contains(text(),"Edit")]').click()


    # the User Edit Page should open, change the path of the users Home Directory
    assert wait_on_element(driver, 10, '//h3[contains(.,"Edit User")]')
    assert wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//ix-explorer[@formcontrolname="home"]//input', 'inputable')
    driver.find_element_by_xpath('//ix-explorer[@formcontrolname="home"]//input').clear()
    driver.find_element_by_xpath('//ix-explorer[@formcontrolname="home"]//input').send_keys('/mnt/tank/ericbsd')


    # click save and changes should be saved, the drop-down details pane should show the home directory has changed
    assert wait_on_element(driver, 2, '//button[span[contains(.,"Save")]]')
    driver.find_element_by_xpath('//button[span[contains(.,"Save")]]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    time.sleep(1) #weird interiment race condition needs sleep
    if is_element_present(driver, '//div[contains(@class,"title-container") and contains(@class,"ng-star-inserted")]'):
        assert wait_on_element_disappear(driver, 10, '//div[contains(@class,"title-container") and contains(@class,"ng-star-inserted")]')
    if is_element_present(driver, '//div[contains(@class,"ix-slide-in-background") and contains(@class,"open")]'):
        assert wait_on_element_disappear(driver, 10, '//div[contains(@class,"ix-slide-in-background") and contains(@class,"open")]')
    if is_element_present(driver, '//div[contains(@class,"input-container")]'):
        assert wait_on_element_disappear(driver, 10, '//div[contains(@class,"input-container")]')        

    assert wait_on_element(driver, 20, '//tr[contains(.,"ericbsd")]//mat-icon', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]//mat-icon').click()
    assert wait_on_element(driver, 10, '//div[contains(.,"/mnt/tank/ericbsd")]')