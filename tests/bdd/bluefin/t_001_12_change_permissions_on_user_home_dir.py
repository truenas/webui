# coding=utf-8
"""SCALE UI feature tests."""

import time
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    setup_ssh_agent,
    wait_on_element_disappear,
)


def test_change_permissions_on_user_home_dir(driver):
    """change_permissions_on_user_home_dir"""

    # the Users page should open, click the down carat sign right of the users
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 10, '//tr[contains(.,"ericbsd")]//mat-icon', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]//mat-icon').click()


    # the User Field should expand down, click the Edit button
    assert wait_on_element(driver, 10, '(//tr[contains(.,"ericbsd")]/following-sibling::tr)[1]//button[contains(.,"Edit")]', 'clickable')
    driver.find_element_by_xpath('(//tr[contains(.,"ericbsd")]/following-sibling::tr)[1]//button[contains(.,"Edit")]').click()


    # the User Edit Page should open, change some permissions for the Home Directory and click save
    assert wait_on_element(driver, 10, '//h3[contains(.,"Edit User")]')
    assert wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')
    time.sleep(1)
    assert wait_on_element(driver, 2, '//mat-checkbox[@ix-auto="checkbox__home_mode_groupWrite"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__home_mode_groupWrite"]').click()
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__home_mode_groupExec"]').click()
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__home_mode_otherWrite"]').click()
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__home_mode_otherExec"]').click()
    time.sleep(0.5)
    wait_on_element(driver, 10, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


    # reopen the user edit page and verify all permissions are save properly
    assert wait_on_element_disappear(driver, 60, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 10, '//tr[contains(.,"ericbsd")]//mat-icon', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]//mat-icon').click()
    assert wait_on_element(driver, 10, '(//tr[contains(.,"ericbsd")]/following-sibling::tr)[1]//button[contains(.,"Edit")]', 'clickable')
    driver.find_element_by_xpath('(//tr[contains(.,"ericbsd")]/following-sibling::tr)[1]//button[contains(.,"Edit")]').click()
    assert wait_on_element(driver, 10, '//h3[contains(.,"Edit User")]')
    assert wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')
    time.sleep(1)
    assert wait_on_element(driver, 2, '//mat-checkbox[@ix-auto="checkbox__home_mode_groupWrite"]')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__home_mode_ownerWrite"]', 'class', 'mat-checkbox-checked')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__home_mode_ownerRead"]', 'class', 'mat-checkbox-checked')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__home_mode_ownerExec"]', 'class', 'mat-checkbox-checked')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__home_mode_groupRead"]', 'class', 'mat-checkbox-checked')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__home_mode_groupWrite"]', 'class', 'mat-checkbox-checked')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__home_mode_groupExec"]', 'class', 'mat-checkbox-checked') is False
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__home_mode_otherRead"]', 'class', 'mat-checkbox-checked')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__home_mode_otherWrite"]', 'class', 'mat-checkbox-checked')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__home_mode_otherExec"]', 'class', 'mat-checkbox-checked') is False


    # revert your changes, click save, and return to dashboard
    assert wait_on_element(driver, 2, '//mat-checkbox[@ix-auto="checkbox__home_mode_groupWrite"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__home_mode_groupWrite"]').click()
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__home_mode_groupExec"]').click()
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__home_mode_otherWrite"]').click()
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__home_mode_otherExec"]').click()
    time.sleep(0.5)
    wait_on_element(driver, 10, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
