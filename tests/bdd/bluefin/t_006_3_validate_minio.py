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


def test_validate_minio(driver):
    """test_validate_minio"""
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
    assert wait_on_element(driver, 20, '//mat-card[contains(.,"minio")]//span[contains(.,"Install")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"minio")]//span[contains(.,"Install")]').click()
    if is_element_present(driver, '//*[contains(.,"Please wait")]'):
        assert wait_on_element_disappear(driver, 10, '//*[contains(.,"Please wait")]')


    # set application name
    assert wait_on_element(driver, 7, '//h3[contains(.,"minio")]')
    assert wait_on_element(driver, 7, '//ix-input[contains(.,"Application Name")]//input ')
    driver.find_element_by_xpath('//ix-input[contains(.,"Application Name")]//input ').clear()
    driver.find_element_by_xpath('//ix-input[contains(.,"Application Name")]//input ').send_keys('minio-test')


    # minio Configuration
    driver.find_element_by_xpath('//ix-input[contains(.,"Root User")]//input ').clear()
    driver.find_element_by_xpath('//ix-input[contains(.,"Root User")]//input ').send_keys('minio-user')
    driver.find_element_by_xpath('//ix-input[contains(.,"Root Password")]//input ').clear()
    driver.find_element_by_xpath('//ix-input[contains(.,"Root Password")]//input ').send_keys('minio-pass')

    # confirm options
    assert wait_on_element(driver, 7, '//button//span[contains(.,"Save")]', 'clickable')
    driver.find_element_by_xpath('//button//span[contains(.,"Save")]').click()

    assert wait_on_element(driver, 5, '//h1[contains(.,"Installing")]')
    assert wait_on_element_disappear(driver, 300, '//h1[contains(.,"Installing")]')


    # confirm installation is successful
    assert wait_on_element(driver, 10, '//div[contains(text(),"Installed Applications")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Installed Applications")]').click()
    time.sleep(2)  # we have to wait for the page to settle down and the card to fully load
    if is_element_present(driver, '//mat-card[contains(.,"minio-test")]//span[@class="status active"]') is False:
        assert wait_on_element(driver, 20, '//strong[contains(.,"minio-test")]')
        assert wait_on_element(driver, 20, '//strong[contains(.,"minio-test")]', 'clickable')
        driver.find_element_by_xpath('//strong[contains(.,"minio-test")]').click()
        if wait_on_element(driver, 5, '//*[contains(.,"Please wait")]'):
            assert wait_on_element_disappear(driver, 10, '//*[contains(.,"Please wait")]')
        assert wait_on_element(driver, 10, '//div[@class="logo-container" and contains(.,"minio-test")]')
        assert wait_on_element(driver, 10, '//mat-panel-title[contains(.,"Application Events")]', 'clickable')
        driver.find_element_by_xpath('//mat-panel-title[contains(.,"Application Events")]').click()
        while is_element_present(driver, '//div[(normalize-space(text())="Started container minio")]') is False:
            time.sleep(2)
            assert wait_on_element(driver, 10, '//span[contains(.,"Refresh Events")]', 'clickable')
            driver.find_element_by_xpath('//span[contains(.,"Refresh Events")]').click()
            # make sure Please wait pop up is gone before continuing.
            if wait_on_element(driver, 3, '//*[contains(.,"Please wait")]'):
                assert wait_on_element_disappear(driver, 10, '//*[contains(.,"Please wait")]')
        else:
            assert wait_on_element(driver, 10, '//span[contains(.,"Close")]', 'clickable')
            driver.find_element_by_xpath('//span[contains(.,"Close")]').click()
            time.sleep(1)  # wait for popup to close
            # we have to change tab for UI to refresh
            assert wait_on_element(driver, 10, '//div[contains(text(),"Available Applications")]', 'clickable')
            driver.find_element_by_xpath('//div[contains(text(),"Available Applications")]').click()
            assert wait_on_element(driver, 10, '//div[contains(text(),"Installed Applications")]', 'clickable')
            driver.find_element_by_xpath('//div[contains(text(),"Installed Applications")]').click()
            assert wait_on_element(driver, 300, '//mat-card[contains(.,"minio-test")]//span[@class="status active"]')
    else:
        assert wait_on_element(driver, 300, '//mat-card[contains(.,"minio-test")]//span[@class="status active"]')