# coding=utf-8
"""SCALE UI feature tests."""

import time
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_on_element_disappear,
)


def test_change_permissions_on_user_home_dir(driver):
    """change_permissions_on_user_home_dir"""
    if not is_element_present(driver, '//div[contains(.,"Users")]'):
        assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
        assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
        assert wait_on_element(driver, 10, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Users"]', 'clickable')
        driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Users"]').click()
        # the Users page should open, click the down carat sign right of the users
        assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
        #assert wait_on_element(driver, 10, '//tr[contains(.,"ericbsd")]//mat-icon', 'clickable')
        #driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]//mat-icon').click()


    # the User Field should expand down, click the Edit button
    assert wait_on_element(driver, 10, '//mat-card//mat-card-content//table//tbody//ix-user-details-row//td//ix-table-expandable-row//div//button//span//span[contains(text(),"Edit")]', 'clickable')
    driver.find_element_by_xpath('//mat-card//mat-card-content//table//tbody//ix-user-details-row//td//ix-table-expandable-row//div//button//span//span[contains(text(),"Edit")]').click()


    # the User Edit Page should open, change some permissions for the Home Directory and click save
    assert wait_on_element(driver, 10, '//h3[contains(.,"Edit User")]')
    assert wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')
    time.sleep(1)
    element = driver.find_element_by_xpath('//button//span[contains(.,"Save")]')
    # Scroll to bottom
    driver.execute_script("arguments[0].scrollIntoView();", element)
    assert wait_on_element(driver, 2, '//ix-fieldset[1]/fieldset[1]/ix-permissions[1]/div[1]/table[1]/tr[2]/td[3]/mat-checkbox[1]/label[1]/span[1]', 'clickable')
    driver.find_element_by_xpath('//ix-fieldset[1]/fieldset[1]/ix-permissions[1]/div[1]/table[1]/tr[3]/td[3]/mat-checkbox[1]/label[1]/span[1]').click()
    driver.find_element_by_xpath('//ix-fieldset[1]/fieldset[1]/ix-permissions[1]/div[1]/table[1]/tr[3]/td[4]/mat-checkbox[1]/label[1]/span[1]').click()
    driver.find_element_by_xpath('//ix-fieldset[1]/fieldset[1]/ix-permissions[1]/div[1]/table[1]/tr[4]/td[3]/mat-checkbox[1]/label[1]/span[1]').click()
    driver.find_element_by_xpath('//ix-fieldset[1]/fieldset[1]/ix-permissions[1]/div[1]/table[1]/tr[4]/td[4]/mat-checkbox[1]/label[1]/span[1]').click()
    time.sleep(1)
    wait_on_element(driver, 10, '//button//span[contains(.,"Save")]', 'clickable')
    driver.find_element_by_xpath('//button//span[contains(.,"Save")]').click()


    # reopen the user edit page and verify all permissions are save properly
    assert wait_on_element_disappear(driver, 60, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    if is_element_present(driver, '//div[contains(@class,"title-container") and contains(@class,"ng-star-inserted")]'):
        assert wait_on_element_disappear(driver, 10, '//div[contains(@class,"title-container") and contains(@class,"ng-star-inserted")]')
    if is_element_present(driver, '//div[contains(@class,"ix-slide-in-background") and contains(@class,"open")]'):
        assert wait_on_element_disappear(driver, 10, '//div[contains(@class,"ix-slide-in-background") and contains(@class,"open")]')
    if is_element_present(driver, '//div[contains(@class,"input-container")]'):
        assert wait_on_element_disappear(driver, 10, '//div[contains(@class,"input-container")]')        

    assert wait_on_element(driver, 10, '//tr[contains(.,"ericbsd")]//mat-icon', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]//mat-icon').click()
    assert wait_on_element(driver, 10, '//mat-card//mat-card-content//table//tbody//ix-user-details-row//td//ix-table-expandable-row//div//button//span//span[contains(text(),"Edit")]', 'clickable')
    driver.find_element_by_xpath('//mat-card//mat-card-content//table//tbody//ix-user-details-row//td//ix-table-expandable-row//div//button//span//span[contains(text(),"Edit")]').click()
    assert wait_on_element(driver, 10, '//h3[contains(.,"Edit User")]')
    assert wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')
    time.sleep(1)
    element = driver.find_element_by_xpath('//button//span[contains(.,"Save")]')
    # Scroll to bottom
    driver.execute_script("arguments[0].scrollIntoView();", element)
    assert wait_on_element(driver, 2, '//ix-fieldset[1]/fieldset[1]/ix-permissions[1]/div[1]/table[1]/tr[2]/td[3]/mat-checkbox[1]/label[1]/span[1]')
    assert wait_on_element(driver, 2, '//ix-fieldset[1]/fieldset[1]/ix-permissions[1]/div[1]/table[1]/tr[2]/td[2]/mat-checkbox[1]/label[1]/span[1]//input[@aria-checked="true"]')
    assert wait_on_element(driver, 2, '//ix-fieldset[1]/fieldset[1]/ix-permissions[1]/div[1]/table[1]/tr[2]/td[3]/mat-checkbox[1]/label[1]/span[1]//input[@aria-checked="true"]')
    assert wait_on_element(driver, 2, '//ix-fieldset[1]/fieldset[1]/ix-permissions[1]/div[1]/table[1]/tr[2]/td[4]/mat-checkbox[1]/label[1]/span[1]//input[@aria-checked="true"]')
    assert wait_on_element(driver, 2, '//ix-fieldset[1]/fieldset[1]/ix-permissions[1]/div[1]/table[1]/tr[3]/td[2]/mat-checkbox[1]/label[1]/span[1]//input[@aria-checked="true"]')
    assert wait_on_element(driver, 2, '//ix-fieldset[1]/fieldset[1]/ix-permissions[1]/div[1]/table[1]/tr[3]/td[3]/mat-checkbox[1]/label[1]/span[1]//input[@aria-checked="true"]')
    assert wait_on_element(driver, 2, '//ix-fieldset[1]/fieldset[1]/ix-permissions[1]/div[1]/table[1]/tr[3]/td[4]/mat-checkbox[1]/label[1]/span[1]//input[@aria-checked="true"]') is False
    assert wait_on_element(driver, 2, '//ix-fieldset[1]/fieldset[1]/ix-permissions[1]/div[1]/table[1]/tr[4]/td[2]/mat-checkbox[1]/label[1]/span[1]//input[@aria-checked="true"]')
    assert wait_on_element(driver, 2, '//ix-fieldset[1]/fieldset[1]/ix-permissions[1]/div[1]/table[1]/tr[4]/td[3]/mat-checkbox[1]/label[1]/span[1]//input[@aria-checked="true"]')
    assert wait_on_element(driver, 2, '//ix-fieldset[1]/fieldset[1]/ix-permissions[1]/div[1]/table[1]/tr[4]/td[4]/mat-checkbox[1]/label[1]/span[1]//input[@aria-checked="true"]') is False


    # revert your changes, click save, and return to dashboard
    assert wait_on_element(driver, 2, '//ix-fieldset[1]//fieldset[1]//ix-permissions[1]/div[1]/table[1]/tr[4]/td[4]//mat-checkbox[1]/label[1]/span[1]', 'clickable')
    driver.find_element_by_xpath('//ix-fieldset[1]/fieldset[1]/ix-permissions[1]/div[1]/table[1]/tr[3]/td[3]/mat-checkbox[1]/label[1]/span[1]').click()
    driver.find_element_by_xpath('//ix-fieldset[1]/fieldset[1]/ix-permissions[1]/div[1]/table[1]/tr[3]/td[4]/mat-checkbox[1]/label[1]/span[1]').click()
    driver.find_element_by_xpath('//ix-fieldset[1]/fieldset[1]/ix-permissions[1]/div[1]/table[1]/tr[4]/td[3]/mat-checkbox[1]/label[1]/span[1]').click()
    driver.find_element_by_xpath('//ix-fieldset[1]/fieldset[1]/ix-permissions[1]/div[1]/table[1]/tr[4]/td[4]/mat-checkbox[1]/label[1]/span[1]').click()
    time.sleep(0.5)
    wait_on_element(driver, 10, '//button//span[contains(.,"Save")]', 'clickable')
    driver.find_element_by_xpath('//button//span[contains(.,"Save")]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
