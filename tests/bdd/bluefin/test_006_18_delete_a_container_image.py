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




def test_delete_a_container_image(driver):
    """test_delete_a_container_image"""
    if not is_element_present(driver, '//h1[contains(.,"Applications")]'):
        assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Apps"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Apps"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Applications")]')

    # Stop nextcloud from running
    assert wait_on_element(driver, 10, '//h1[text()="Applications"]')
    assert wait_on_element_disappear(driver, 120, '//mat-spinner[@role="progressbar"]')
    assert wait_on_element(driver, 60, '//strong[text()="nextcloud-test"]')
    assert wait_on_element(driver, 45, '//mat-card[contains(.,"nextcloud")]//span[contains(.,"Stop")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"nextcloud")]//span[contains(.,"Stop")]').click()


    # Verify the application has stopped
    assert wait_on_element(driver, 5, '//h1[contains(.,"Stopping")]')
    assert wait_on_element_disappear(driver, 180, '//h1[contains(.,"Stopping")]')
    assert wait_on_element(driver, 15, '//mat-card[contains(.,"nextcloud-test")]//span[contains(.,"STOPPED ")]')


    # open available applications
    assert wait_on_element(driver, 10, '//div[contains(text(),"Available Applications")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Available Applications")]').click()
    assert wait_on_element_disappear(driver, 60, '//mat-spinner[@role="progressbar"]')
    time.sleep(1)


    # when the Apps page loads, open Manager Docker Images
    assert wait_on_element(driver, 10, '//div[contains(text(),"Manage Docker Images")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Manage Docker Images")]').click()
    time.sleep(1)


    # click the three dots icon for nextcloud
    assert wait_on_element(driver, 10, '//th[text()="Tags"]')
    assert wait_on_element(driver, 10, '//div[contains(text(),"Items per page:")]')
    assert wait_on_element(driver, 10, '//div[contains(text(),"nextcloud")]')
    assert wait_on_element(driver, 20, '//tr[contains(.,"nextcloud")]//mat-icon[contains(.,"more_vert")]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"nextcloud")]//mat-icon[contains(.,"more_vert")]').click()


    # click delete
    assert wait_on_element(driver, 20, '//button//span[contains(.,"Delete")]', 'clickable')
    driver.find_element_by_xpath('//button//span[contains(.,"Delete")]').click()


    # confirm
    assert wait_on_element(driver, 2, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    wait_on_element(driver, 10, '//button[@ix-auto="button__DELETE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__DELETE"]').click()


    # confirm image is deleted
    assert wait_on_element(driver, 10, '//*[contains(.,"Please wait")]')
    assert wait_on_element_disappear(driver, 35, '//*[contains(.,"Please wait")]')
    assert wait_on_element_disappear(driver, 15, '//tr[contains(.,"nextcloud")]')
 