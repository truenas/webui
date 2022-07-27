# coding=utf-8
"""SCALE UI feature tests."""
import time
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_for_attribute_value,
    wait_on_element_disappear
)




def test_validate_machinaris(driver):
    """test_validate_machinaris"""
    if not is_element_present(driver, '//h1[contains(.,"Applications")]'):
        assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Apps"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Apps"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Applications")]')

    # the Apps page load, open available applications
    assert wait_on_element(driver, 10, '//div[contains(text(),"Available Applications")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Available Applications")]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Available Applications")]')


    # click install
    time.sleep(2)  # we have to wait for the page to settle down and the card to fully load
    assert wait_on_element(driver, 20, '//mat-card[contains(.,"machinaris")]//span[contains(.,"Install")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"machinaris")]//span[contains(.,"Install")]').click()
    assert wait_on_element(driver, 5, '//*[contains(.,"Please wait")]')
    assert wait_on_element_disappear(driver, 30, '//*[contains(.,"Please wait")]')


    # set application name
    assert wait_on_element(driver, 7, '//h3[contains(.,"machinaris")]')
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Application Name"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Application Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Application Name"]').send_keys('machinaris-test')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Application Name"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Application Name"]').click()


    # set networking
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Networking"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Networking"]').click()


    # set machinaris configuration
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Machinaris Configuration"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Machinaris Configuration"]').click()


    # set storage
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Storage"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Storage"]').click()


    # set Machinaris Environment Variables
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Machinaris Environment Variables"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Machinaris Environment Variables"]').click()


    # set Resource Limits
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Resource Limits"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Resource Limits"]').click()


    # set Configure Coins
    assert wait_on_element(driver, 10, '//mat-checkbox[@ix-auto="checkbox__Enable Flax"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Enable Flax"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__NEXT_Configure Coins"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__NEXT_Configure Coins"]').click()


    # confirm options
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()

    assert wait_on_element(driver, 5, '//*[contains(.,"Installing")]')
    assert wait_on_element_disappear(driver, 45, '//*[contains(.,"Installing")]')


    # confirm installation is successful
    assert wait_on_element(driver, 10, '//div[contains(text(),"Installed Applications")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Installed Applications")]').click()
    time.sleep(2)  # we have to wait for the page to settle down and the card to fully load
    if is_element_present(driver, '//mat-card[contains(.,"machinaris-test")]//span[@class="status active"]') is False:
        assert wait_on_element(driver, 20, '//strong[contains(.,"machinaris-test")]')
        assert wait_on_element(driver, 20, '//strong[contains(.,"machinaris-test")]', 'clickable')
        driver.find_element_by_xpath('//strong[contains(.,"machinaris-test")]').click()
        if wait_on_element(driver, 5, '//*[contains(.,"Please wait")]'):
            assert wait_on_element_disappear(driver, 10, '//*[contains(.,"Please wait")]')
        assert wait_on_element(driver, 10, '//div[@class="logo-container" and contains(.,"machinaris-test")]')
        assert wait_on_element(driver, 10, '//mat-panel-title[contains(.,"Application Events")]', 'clickable')
        driver.find_element_by_xpath('//mat-panel-title[contains(.,"Application Events")]').click()
        while is_element_present(driver, '//div[(normalize-space(text())="Created container machinaris")]') is False:
            time.sleep(2)
            assert wait_on_element(driver, 10, '//span[contains(.,"Refresh Events")]', 'clickable')
            driver.find_element_by_xpath('//span[contains(.,"Refresh Events")]').click()
            # make sure Please wait pop up is gone before continuing.
            if wait_on_element(driver, 3, '//*[contains(.,"Please wait")]'):
                assert wait_on_element_disappear(driver, 10, '//*[contains(.,"Please wait")]')
        else:
            assert wait_on_element(driver, 10, '//span[contains(.,"Close")]', 'clickable')
            driver.find_element_by_xpath('//span[contains(.,"Close")]').click()
            time.sleep(45)  # Because of slow start up times, this takes another 10-20 second to switch from "Deploying to Active"  So we can either flip the page constantly or just wait and give it time.
            assert wait_on_element(driver, 10, '//div[contains(text(),"Available Applications")]', 'clickable')
            driver.find_element_by_xpath('//div[contains(text(),"Available Applications")]').click()
            assert wait_on_element(driver, 10, '//div[contains(text(),"Installed Applications")]', 'clickable')
            driver.find_element_by_xpath('//div[contains(text(),"Installed Applications")]').click()
            assert wait_on_element(driver, 300, '//mat-card[contains(.,"machinaris-test")]//span[@class="status active"]')
    else:
        assert wait_on_element(driver, 300, '//mat-card[contains(.,"machinaris-test")]//span[@class="status active"]')