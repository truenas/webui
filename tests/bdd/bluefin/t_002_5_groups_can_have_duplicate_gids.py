# coding=utf-8
"""SCALE UI feature tests."""

from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear
)


def test_groups_can_have_duplicate_gids(driver):
    """test_groups_can_have_duplicate_gids"""
    if not is_element_present(driver, '//h1[contains(text(),"Groups")]'):
        assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
        assert wait_on_element(driver, 10, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Groups"]', 'clickable')
        driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Groups"]').click()
    assert wait_on_element(driver, 7, '//h1[contains(text(),"Groups")]')

    # click on Credentials and Local Users
    assert wait_on_element(driver, 10, '//h1[contains(text(),"Groups")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"Add")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Add")]').click()

    # input the group name, GID, enable duplicate gids and click save
    assert wait_on_element(driver, 7, '//h3[contains(.,"Add Group")]')

    assert wait_on_element(driver, 7, '//ix-input[@formcontrolname="name"]//input')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="name"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="name"]//input').send_keys('gidtest')
    assert wait_on_element(driver, 7, '//ix-input[@formcontrolname="gid"]//input')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="gid"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="gid"]//input').send_keys('3333')

    assert wait_on_element(driver, 10, '//ix-checkbox[@formcontrolname="allowDuplicateGid"]//mat-checkbox', 'clickable')
    driver.find_element_by_xpath('//ix-checkbox[@formcontrolname="allowDuplicateGid"]//mat-checkbox').click()

    assert wait_on_element(driver, 7, '//span[contains(text(),"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save")]').click()

    # verify the group was added
    assert wait_on_element_disappear(driver, 20, '//mat-progress-bar')
    assert wait_on_element(driver, 10, '//h1[contains(.,"Groups")]')
    assert wait_on_element(driver, 10, '//div[contains(.,"gidtest")]')

    # on the Groups page click Add again
    assert wait_on_element(driver, 10, '//h1[contains(text(),"Groups")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"Add")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Add")]').click()

    # input the duplicate group name, GID, enable duplicate gids and click save
    assert wait_on_element(driver, 7, '//h3[contains(.,"Add Group")]')

    assert wait_on_element(driver, 7, '//ix-input[@formcontrolname="name"]//input')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="name"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="name"]//input').send_keys('gidtestdupe')
    assert wait_on_element(driver, 7, '//ix-input[@formcontrolname="gid"]//input')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="gid"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="gid"]//input').send_keys('3333')

    assert wait_on_element(driver, 10, '//ix-checkbox[@formcontrolname="allowDuplicateGid"]//mat-checkbox', 'clickable')
    driver.find_element_by_xpath('//ix-checkbox[@formcontrolname="allowDuplicateGid"]//mat-checkbox').click()

    assert wait_on_element(driver, 7, '//span[contains(text(),"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save")]').click()

    # verify the duplicate group was added
    assert wait_on_element_disappear(driver, 20, '//mat-progress-bar')
    assert wait_on_element(driver, 10, '//h1[contains(.,"Groups")]')
    assert wait_on_element(driver, 10, '//div[contains(.,"gidtestdupe")]')
