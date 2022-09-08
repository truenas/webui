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




def test_apps_page_validation(driver):
    """test_apps_page_validation"""
    if not is_element_present(driver, '//h1[contains(.,"Applications")]'):
        assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Apps"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Apps"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Applications")]')

    assert wait_on_element(driver, 10, '//div[contains(text(),"Available Applications")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Available Applications")]').click()
    assert wait_on_element(driver, 7, '//h3[contains(.,"minio")]')

    # the Apps page load, select pool
    assert wait_on_element(driver, 7, '//h1[contains(.,"Choose a pool for Apps")]')
    time.sleep(0.5)
    assert wait_on_element(driver, 5, '//mat-dialog-container//ng-component//form//ix-select//div//div//mat-select', 'clickable')
    driver.find_element_by_xpath('//mat-dialog-container//ng-component//form//ix-select//div//div//mat-select').click()
    assert wait_on_element(driver, 7, '//span[contains(text(),"tank")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"tank")]').click()
    assert wait_on_element(driver, 7, '//span[contains(text(),"Choose")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Choose")]').click()
    assert wait_on_element_disappear(driver, 60, '//h1[contains(.,"Configuring...")]')


    # the Available Applications Tab loads
    # used for local testing, so you dont have to unset and reset the pool every time 
    assert wait_on_element(driver, 10, '//div[contains(text(),"Available Applications")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Available Applications")]').click()
    assert wait_on_element(driver, 7, '//h3[contains(.,"minio")]')


    # verify the setting slide out works
    assert wait_on_element(driver, 10, '//button//span[contains(text(),"Settings")]', 'clickable')
    driver.find_element_by_xpath('//button//span[contains(text(),"Settings")]').click()
    assert wait_on_element(driver, 10, '//button[contains(text(),"Advanced Settings")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(text(),"Advanced Settings")]').click()
    assert wait_on_element(driver, 7, '//h3[contains(.,"Kubernetes Settings")]')
    assert wait_on_element(driver, 10, '//div[@class="ix-slidein-title-bar"]//mat-icon[contains(.,"cancel")]', 'clickable')
    driver.find_element_by_xpath('//div[@class="ix-slidein-title-bar"]//mat-icon[contains(.,"cancel")]').click()


    # open the Installed Applications page
    assert wait_on_element(driver, 10, '//div[contains(text(),"Installed Applications")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Installed Applications")]').click()
    assert wait_on_element(driver, 7, '//h3[contains(.,"No Applications Installed")]')
    # test the buttons
    assert wait_on_element(driver, 10, '//span[contains(.,"Launch Docker Image")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Launch Docker Image")]').click()
    if wait_on_element(driver, 3, '//*[contains(.,"Please wait")]'):
        assert wait_on_element_disappear(driver, 120, '//*[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//mat-icon[@id="ix-close-icon"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="ix-close-icon"]').click()
    assert wait_on_element(driver, 10, '//button//span[contains(text(),"Settings")]', 'clickable')
    driver.find_element_by_xpath('//button//span[contains(text(),"Settings")]').click()
    assert wait_on_element(driver, 10, '//button[contains(text(),"Advanced Settings")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(text(),"Advanced Settings")]').click()
    assert wait_on_element(driver, 7, '//h3[contains(.,"Kubernetes Settings")]')
    assert wait_on_element(driver, 10, '//mat-icon[@id="ix-close-icon"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="ix-close-icon"]').click()


    # open the Manage Docker Images Page
    assert wait_on_element(driver, 10, '//div[contains(text(),"Manage Docker Images")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Manage Docker Images")]').click()
    # seems like sometimes zfs-driver is present.
    assert wait_on_element(driver, 5, '//h3[contains(.,"No Docker Images")]') or wait_on_element(driver, 5, '//div[contains(.,"rancher")]')
    # test the buttons
    assert wait_on_element(driver, 10, '//span[contains(.,"Launch Docker Image")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Launch Docker Image")]').click()
    if wait_on_element(driver, 3, '//*[contains(.,"Please wait")]'):
        assert wait_on_element_disappear(driver, 120, '//*[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//mat-icon[@id="ix-close-icon"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="ix-close-icon"]').click()
    assert wait_on_element(driver, 10, '//button//span[contains(text(),"Settings")]', 'clickable')
    driver.find_element_by_xpath('//button//span[contains(text(),"Settings")]').click()
    assert wait_on_element(driver, 10, '//button[contains(text(),"Advanced Settings")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(text(),"Advanced Settings")]').click()
    assert wait_on_element(driver, 7, '//h3[contains(.,"Kubernetes Settings")]')
    assert wait_on_element(driver, 10, '//mat-icon[@id="ix-close-icon"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="ix-close-icon"]').click()


    # open the Manage Catalogs Page
    assert wait_on_element(driver, 10, '//div[contains(text(),"Manage Catalogs")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Manage Catalogs")]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"https://github.com/truenas/charts.git")]')
    # test the buttons
    assert wait_on_element(driver, 10, '//span[contains(.,"Launch Docker Image")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Launch Docker Image")]').click()
    if wait_on_element(driver, 3, '//*[contains(.,"Please wait")]'):
        assert wait_on_element_disappear(driver, 120, '//*[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//mat-icon[@id="ix-close-icon"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="ix-close-icon"]').click()
    assert wait_on_element(driver, 10, '//button//span[contains(text(),"Settings")]', 'clickable')
    driver.find_element_by_xpath('//button//span[contains(text(),"Settings")]').click()
    assert wait_on_element(driver, 10, '//button[contains(text(),"Advanced Settings")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(text(),"Advanced Settings")]').click()
    assert wait_on_element(driver, 7, '//h3[contains(.,"Kubernetes Settings")]')
    assert wait_on_element(driver, 10, '//mat-icon[@id="ix-close-icon"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="ix-close-icon"]').click()
