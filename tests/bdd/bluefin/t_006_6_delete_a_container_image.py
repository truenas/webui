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

    # open available applications
    assert wait_on_element(driver, 10, '//div[contains(text(),"Available Applications")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Available Applications")]').click()
    assert wait_on_element_disappear(driver, 60, '//mat-spinner[@role="progressbar"]')
    time.sleep(1)


    # when the Apps page loads, open Manager Docker Images
    assert wait_on_element(driver, 10, '//div[contains(text(),"Manage Docker Images")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Manage Docker Images")]').click()
    time.sleep(1)


    # click the three dots icon for minio
    assert wait_on_element(driver, 10, '//div[contains(text(),"Tags")]')
    assert wait_on_element(driver, 10, '//div[contains(text(),"Items per page:")]')
    assert wait_on_element(driver, 10, '//td[contains(text(),"minio/minio")]')

    assert wait_on_element(driver, 20, '//td[contains(text(),"minio/minio")]/following-sibling::td//button//span//mat-icon[contains(.,"more_vert")]', 'clickable')
    driver.find_element_by_xpath('//td[contains(text(),"minio/minio")]/following-sibling::td//button//span//mat-icon[contains(.,"more_vert")]').click()


    # click delete
    assert wait_on_element(driver, 20, '//a[contains(.,"Delete")]', 'clickable')
    driver.find_element_by_xpath('//a[contains(.,"Delete")]').click()


    # confirm 
    assert wait_on_element(driver, 2, '//span[contains(.,"Confirm")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Confirm")]').click()
    wait_on_element(driver, 10, '//span[contains(.,"Force delete")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Force delete")]').click()
    wait_on_element(driver, 10, '//span[contains(text(),"Delete")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Delete")]').click()

   
    # confirm image is deleted
    assert wait_on_element_disappear(driver, 15, '//tr[contains(.,"minio")]')
