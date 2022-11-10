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




def test_import_pool_with_apps(driver):
    """test_import_pool_with_apps"""
    if not is_element_present(driver, '//h1[contains(.,"Applications")]'):
        assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Apps"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Apps"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Applications")]')

    # the Apps page load, open available applications
    if is_element_present(driver, '//mat-ink-bar[@style="visibility: visible; left: 0px; width: 183px;"]') is False:
        assert wait_on_element(driver, 10, '//div[contains(text(),"Installed Applications")]', 'clickable')
        driver.find_element_by_xpath('//div[contains(text(),"Installed Applications")]').click()

    # click the stop button and confirm
    assert wait_on_element(driver, 20, '//mat-card[contains(.,"minio-test")]//span[contains(.,"Stop")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"minio-test")]//span[contains(.,"Stop")]').click()

    # Verify the application has stopped
    assert wait_on_element(driver, 5, '//h1[contains(.,"Stopping")]')
    assert wait_on_element_disappear(driver, 60, '//h1[contains(.,"Stopping")]')
    assert wait_on_element(driver, 15, '//mat-card[contains(.,"minio-test")]//span[contains(.,"STOPPED ")]')

    # click settings, unset pool
    assert wait_on_element(driver, 20, '//button//span[contains(text(),"Settings")]', 'clickable')
    driver.find_element_by_xpath('//button//span[contains(text(),"Settings")]').click()
    assert wait_on_element(driver, 5, '//button[contains(text(),"Unset Pool")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(text(),"Unset Pool")]').click()
    assert wait_on_element(driver, 20, '//h1[contains(.,"Unset Pool")]')
    time.sleep(0.5)


    # confirm unset pool and wait
    assert wait_on_element(driver, 10, '//button//span[contains(text(),"Unset")]', 'clickable')
    driver.find_element_by_xpath('//button//span[contains(text(),"Unset")]').click()
    assert wait_on_element_disappear(driver, 60, '//h1[contains(.,"Configuring...")]')


    # click setting, reset pool

    assert wait_on_element(driver, 10, '//button//span[contains(text(),"Settings")]', 'clickable')
    driver.find_element_by_xpath('//button//span[contains(text(),"Settings")]').click()
    assert wait_on_element(driver, 10, '//button[contains(text(),"Choose Pool")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(text(),"Choose Pool")]').click()
    assert wait_on_element(driver, 7, '//h1[contains(.,"Choose a pool for Apps")]')
    time.sleep(1) #we need to let the UI settle for some reason because another element obscures the mat-select
    assert wait_on_element(driver, 10, '//mat-dialog-container//ng-component//form//ix-select//div//div//mat-select', 'clickable')
    driver.find_element_by_xpath('//mat-dialog-container//ng-component//form//ix-select//div//div//mat-select').click()
    assert wait_on_element(driver, 7, '//span[contains(text(),"tank")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"tank")]').click()
    assert wait_on_element(driver, 7, '//span[contains(text(),"Choose")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Choose")]').click()
    assert wait_on_element_disappear(driver, 60, '//h1[contains(.,"Configuring...")]')

    assert wait_on_element(driver, 7, '//div[contains(.,"Available Applications")]')

    # open available applications
    if is_element_present(driver, '//mat-ink-bar[@style="visibility: visible; left: 0px; width: 183px;"]') is False:
        assert wait_on_element(driver, 10, '//div[contains(text(),"Installed Applications")]', 'clickable')
        driver.find_element_by_xpath('//div[contains(text(),"Installed Applications")]').click()
        assert wait_on_element(driver, 7, '//h3[contains(.,"No Applications Installed")]')

    # click the stop button and confirm
    assert wait_on_element(driver, 20, '//mat-card[contains(.,"minio-test")]//span[contains(.,"Start")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"minio-test")]//span[contains(.,"Start")]').click()

    # Verify the application has stopped
    assert wait_on_element(driver, 5, '//h1[contains(.,"Starting")]')
    assert wait_on_element_disappear(driver, 90, '//h1[contains(.,"Starting")]')
    assert wait_on_element(driver, 15, '//mat-card[contains(.,"minio-test")]//span[contains(.,"ACTIVE")]')
