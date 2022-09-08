# coding=utf-8
"""SCALE UI feature tests."""
import time
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_for_attribute_value,
    wait_on_element_disappear,
)




def test_create_pool_for_system_dataset(driver):
    """test_wipe_one_disk"""
        """click on the Credentials on the side menu, click on Local Users."""
    if not is_element_present(driver, '//h1[contains(.,"Storage")]'):
        assert wait_on_element(driver, 10, '//span[contains(text(),"Storage (Deprecated))]', 'clickable')
        driver.find_element_by_xpath('//span[contains(text(),"Storage (Deprecated))]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage")]')
    assert wait_on_element(driver, 10, '//a[@ix-auto="button___POOL_CREATE"]', 'clickable')
    driver.find_element_by_xpath('//a[@ix-auto="button___POOL_CREATE"]').click()


    # the Pool Manager appears, enter the system for pool name
    assert wait_on_element(driver, 7, '//div[contains(.,"Pool Manager")]')
    assert wait_on_element(driver, 10, '//input[@id="pool-manager__name-input-field"]', 'inputable')
    driver.find_element_by_xpath('//input[@id="pool-manager__name-input-field"]').send_keys('system')


    # click sdc checkbox, press the right arrow under Data VDevs
    assert wait_on_element(driver, 7, '//datatable-body[contains(.,"sd")]//mat-checkbox[1]', 'clickable')
    driver.find_element_by_xpath('//datatable-body[contains(.,"sd")]//mat-checkbox[1]').click()
    assert wait_on_element(driver, 5, '//button[@id="vdev__add-button"]', 'clickable')
    driver.find_element_by_xpath('//button[@id="vdev__add-button"]').click()
    assert wait_on_element(driver, 7, '//mat-checkbox[@id="pool-manager__force-submit-checkbox"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@id="pool-manager__force-submit-checkbox"]').click()


    # click create, On the Warning widget, click confirm checkbox, click CREATE POOL
    assert wait_on_element(driver, 10, '//h1[contains(.,"Warning")]')
    assert wait_on_element(driver, 7, '//mat-checkbox[@name="confirm_checkbox"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@name="confirm_checkbox"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()
    assert wait_on_element(driver, 5, '//button[@id="pool-manager__create-button"]', 'clickable')
    driver.find_element_by_xpath('//button[@id="pool-manager__create-button"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Warning")]')
    assert wait_on_element(driver, 7, '//mat-checkbox[@name="confirm_checkbox"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@name="confirm_checkbox"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__CREATE POOL"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CREATE POOL"]').click()


    # Create pool should appear while pool is being created
    assert wait_on_element(driver, 10, '//h1[contains(.,"Create Pool")]')
    assert wait_on_element_disappear(driver, 120, '//h1[contains(.,"Create Pool")]')
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage")]')


    # the pools system should appear in the list
    assert wait_on_element(driver, 7, '//div[contains(.,"system")]')


    # navigate to System Setting and click Advanced to open the Advanced page should open
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__System Settings"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System Settings"]').click()
    assert wait_on_element(driver, 7, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Advanced"]', 'clickable')
    driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Advanced"]').click()


    # click on System Dataset Configure button and close the popup
    assert wait_on_element(driver, 7, '//h1[contains(.,"Advanced")]')
    element = driver.find_element_by_xpath('//h3[contains(.,"System Dataset Pool")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    assert wait_on_element(driver, 7, '//mat-card[contains(.,"System Dataset Pool")]//button[contains(.,"Configure")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"System Dataset Pool")]//button[contains(.,"Configure")]').click()
    assert wait_on_element(driver, 5, '//h1[contains(.,"Warning")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CLOSE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()


    # click on System Dataset Pool select system, click Save
    assert wait_on_element(driver, 5, '//h3[contains(text(),"System Dataset Pool") and @class="ix-formtitle"]')
    assert wait_on_element(driver, 5, '//label[contains(text(),"Select Pool")]')
    time.sleep(0.5)
    assert wait_on_element(driver, 5, '//mat-select', 'clickable')
    driver.find_element_by_xpath('//mat-select').click()
    assert wait_on_element(driver, 5, '//mat-option[@role="option"]//span[contains(.,"system")]')
    driver.find_element_by_xpath('//mat-option[@role="option"]//span[contains(.,"system")]').click()
    assert wait_on_element(driver, 30, '//ix-slide-in[@id="ix-slide-in-form"]//button//span[contains(.,"Save")]', 'clickable')
    driver.find_element_by_xpath('//ix-slide-in[@id="ix-slide-in-form"]//button//span[contains(.,"Save")]').click()


    # Please wait should appear while settings are being applied
    assert wait_on_element_disappear(driver, 30, '//ix-slide-in[@id="ix-slide-in-form"]//button//span[contains(.,"Save")]')
