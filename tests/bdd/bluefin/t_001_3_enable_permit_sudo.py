# coding=utf-8
"""SCALE UI feature tests."""

import time
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_on_element_disappear,
)


def test_enable_permit_sudo():
    """enable permit sudo"""

    # the Users page should open, click the down carat sign right of the users
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 10, '//tr[contains(.,"ericbsd")]//mat-icon', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]//mat-icon').click()
    assert wait_on_element(driver, 10, '(//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row)[1]//button[contains(.,"Edit")]', 'clickable')
    driver.find_element_by_xpath('(//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row)[1]//button[contains(.,"Edit")]').click()


    # click Enable Permit Sudo checkbox and click save
    assert wait_on_element(driver, 10, '//h3[contains(.,"Edit User")]')
    assert wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')
    element = driver.find_element_by_xpath('//button[span[contains(.,"Save")]]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(5)
    value_exist = attribute_value_exist(driver, '//ix-checkbox[@formcontrolname = "sudo"]//mat-checkbox', 'class', 'mat-checkbox-checked')
    if not value_exist:
        driver.find_element_by_xpath('//ix-checkbox[@formcontrolname = "sudo"]//mat-checkbox').click()
    wait_on_element(driver, 10, '//button[span[contains(.,"Save")]]', 'clickable')
    driver.find_element_by_xpath('//button[span[contains(.,"Save")]]').click()


    # the changes should be saved
    """click on the Credentials on the side menu, click on Local Users."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
    assert wait_on_element(driver, 10, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Users"]', 'clickable')
    driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Users"]').click()


    # open the user dropdown
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]', 'clickable')
    assert wait_on_element(driver, 10, '//tr[contains(.,"ericbsd")]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]//mat-icon').click()
    assert wait_on_element(driver, 10, '(//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row)[1]//button[contains(.,"Edit")]', 'clickable')
    driver.find_element_by_xpath('(//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row)[1]//button[contains(.,"Edit")]').click()


    # updated value should be visible
    assert wait_on_element(driver, 10, '//h3[contains(.,"Edit User")]')
    assert wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')
    element = driver.find_element_by_xpath('//button[span[contains(.,"Save")]]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    assert attribute_value_exist(driver, '//ix-checkbox[@formcontrolname = "sudo"]//mat-checkbox', 'class', 'mat-checkbox-checked')
    assert wait_on_element(driver, 10, '//*[@id="ix-close-icon"]', 'clickable')
    driver.find_element_by_xpath('//*[@id="ix-close-icon"]').click()
    time.sleep(0.5)


    # open a shell and run su user to become that user
    global sudo_results
    cmd = 'ls /tmp'
    sudo_results = ssh_sudo(cmd, nas_ip, 'ericbsd', 'testing')


    # the user should be able to use Sudo
    assert "collectd-boot" in sudo_results, str(sudo_results)