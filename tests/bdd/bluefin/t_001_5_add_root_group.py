# coding=utf-8
"""SCALE UI feature tests."""

import time
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_on_element_disappear,
    wait_for_attribute_value,
)
from selenium.webdriver.common.keys import (Keys)

def test_add_root_group(driver):
    """add root group"""

    # the Users page should open, click the down carat sign right of the users
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    #assert wait_on_element(driver, 10, '//tr[contains(.,"ericbsd")]//mat-icon', 'clickable')
    #driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]//mat-icon').click()


    # the User Field should expand down, click the Edit button
    assert wait_on_element(driver, 10, '//mat-card//mat-card-content//table//tbody//ix-user-details-row//td//ix-table-expandable-row//div//button//span//span[contains(text(),"Edit")]', 'clickable')
    driver.find_element_by_xpath('//mat-card//mat-card-content//table//tbody//ix-user-details-row//td//ix-table-expandable-row//div//button//span//span[contains(text(),"Edit")]').click()


    # the User Edit Page should open, add the root group and click save
    assert wait_on_element(driver, 11, '//h3[contains(.,"Edit User")]')
    assert wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//ix-select[@formcontrolname="groups"]//mat-select', 'clickable')
    element = driver.find_element_by_xpath('//ix-select[@formcontrolname="groups"]//mat-select')
    # Scroll to root
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    driver.find_element_by_xpath('//ix-select[@formcontrolname="groups"]//mat-select').click()
    assert wait_on_element(driver, 7, '//mat-option[span[contains(., "root")]]', 'clickable')
    element = driver.find_element_by_xpath('//span[contains(.,"root")]')
    # Scroll to root
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    assert wait_on_element(driver, 7, '//mat-option[span[contains(., "root")]]', 'clickable')
    driver.find_element_by_xpath('//mat-option[span[contains(., "root")]]').click()
    driver.find_element_by_xpath('//mat-option[span[contains(., "root")]]').send_keys(Keys.TAB)
    assert wait_on_element(driver, 10, '//button[span[contains(.,"Save")]]', 'clickable')
    element = driver.find_element_by_xpath('//button[span[contains(.,"Save")]]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    driver.find_element_by_xpath('//button[span[contains(.,"Save")]]').click()


    # change should be saved, reopen the edit page, root group value should be visible
    assert wait_on_element_disappear(driver, 15, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    if is_element_present(driver, '//div[contains(@class,"title-container") and contains(@class,"ng-star-inserted")]'):
        assert wait_on_element_disappear(driver, 10, '//div[contains(@class,"title-container") and contains(@class,"ng-star-inserted")]')
    if is_element_present(driver, '//div[contains(@class,"ix-slide-in-background") and contains(@class,"open")]'):
        assert wait_on_element_disappear(driver, 10, '//div[contains(@class,"ix-slide-in-background") and contains(@class,"open")]')

    assert wait_on_element(driver, 10, '//tr[contains(.,"ericbsd")]//mat-icon', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]//mat-icon').click()
    assert wait_on_element(driver, 10, '(//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row)[1]//button[contains(.,"Edit")]', 'clickable')
    driver.find_element_by_xpath('(//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row)[1]//button[contains(.,"Edit")]').click()
    assert wait_on_element(driver, 10, '//h3[contains(.,"Edit User")]')
    assert wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//ix-select[@formcontrolname="groups"]//mat-select', 'clickable')
    element = driver.find_element_by_xpath('//ix-select[@formcontrolname="groups"]//mat-select')
    # Scroll to root
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    driver.find_element_by_xpath('//ix-select[@formcontrolname="groups"]//mat-select').click()
    assert wait_on_element(driver, 7, '//mat-option[span[contains(., "root")]]', 'clickable')
    element = driver.find_element_by_xpath('//span[contains(.,"root")]')
    # Scroll to root
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    wait_for_value = wait_for_attribute_value(driver, 5, '//mat-option[span[contains(., "root")]]', 'class', 'mat-selected')
    assert wait_for_value
    # return to dashboard
    driver.find_element_by_xpath('//mat-option[span[contains(., "root")]]').send_keys(Keys.TAB)
    time.sleep(0.5)
    assert wait_on_element(driver, 10, '//*[@id="ix-close-icon"]', 'clickable')
    driver.find_element_by_xpath('//*[@id="ix-close-icon"]').click()