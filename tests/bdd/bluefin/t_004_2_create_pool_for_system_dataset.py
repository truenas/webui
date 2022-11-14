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
    """click on the Storage on the side menu."""
    if not is_element_present(driver, '//h1[contains(.,"Storage")]'):
        assert wait_on_element(driver, 10, '//span[contains(text(),"Storage")]', 'clickable')
        driver.find_element_by_xpath('//span[contains(text(),"Storage")]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage Dashboard")]')

    assert wait_on_element(driver, 10, '//span[contains(.,"Create Pool")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Create Pool")]').click()


    # the Pool Manager appears, enter the tank for pool name
    assert wait_on_element(driver, 7, '//div[contains(.,"Pool Manager")]')
    assert wait_on_element(driver, 10, '//input[@id="pool-manager__name-input-field"]', 'inputable')
    driver.find_element_by_xpath('//input[@id="pool-manager__name-input-field"]').send_keys('system')


    # click sdb checkbox, press the right arrow under Data VDevs
    assert wait_on_element(driver, 5, '//datatable-body[contains(.,"sd")]//mat-checkbox[1]', 'clickable')
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
    assert wait_on_element(driver, 5, '//span[contains(.,"Create")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Create")]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Warning")]')
    assert wait_on_element(driver, 7, '//mat-checkbox[@name="confirm_checkbox"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@name="confirm_checkbox"]').click()
    assert wait_on_element(driver, 7, '//span[contains(.,"Create Pool")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Create Pool")]').click()


    # Create pool should appear while pool is being created
    assert wait_on_element(driver, 10, '//h1[contains(.,"Create Pool")]')
    assert wait_on_element_disappear(driver, 120, '//h1[contains(.,"Create Pool")]')
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage")]')


    # you should be returned to the list of pools and tank should appear in the list
    assert wait_on_element(driver, 7, '//h2[contains(.,"system")]')

    # navigate to System Setting and click Advanced to open the Advanced page should open
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__System Settings"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System Settings"]').click()
    assert wait_on_element(driver, 7, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Advanced"]', 'clickable')
    driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Advanced"]').click()


    # click on System Dataset Configure button and close the popup
    assert wait_on_element(driver, 7, '//h1[contains(.,"Advanced")]')
    time.sleep(1) #the page needs to settle before it can scroll to element
    element = driver.find_element_by_xpath('//h3[contains(.,"System Dataset Pool")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    assert wait_on_element(driver, 7, '//mat-card[contains(.,"System Dataset Pool")]//button[contains(.,"Configure")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"System Dataset Pool")]//button[contains(.,"Configure")]').click()
    assert wait_on_element(driver, 5, '//h1[contains(.,"Warning")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CLOSE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()


    # click on System Dataset Pool select system, click Save
    assert wait_on_element(driver, 5, '//h3[contains(text(),"System Dataset Pool") and @class="ix-formtitle"]')
    assert wait_on_element(driver, 5, '//span[contains(text(),"Select Pool")]')
    time.sleep(0.5)
    assert wait_on_element(driver, 5, '//ix-slide-in[@id="ix-slide-in-form"]//span[contains(text(),"tank")]', 'clickable')
    driver.find_element_by_xpath('//ix-slide-in[@id="ix-slide-in-form"]//span[contains(text(),"tank")]').click()
    assert wait_on_element(driver, 5, '//mat-option[@role="option"]//span[contains(.,"system")]')
    driver.find_element_by_xpath('//mat-option[@role="option"]//span[contains(.,"system")]').click()
    assert wait_on_element(driver, 30, '//ix-slide-in[@id="ix-slide-in-form"]//button//span[contains(.,"Save")]', 'clickable')
    driver.find_element_by_xpath('//ix-slide-in[@id="ix-slide-in-form"]//button//span[contains(.,"Save")]').click()


    # Please wait should appear while settings are being applied
    assert wait_on_element_disappear(driver, 30, '//ix-slide-in[@id="ix-slide-in-form"]//button//span[contains(.,"Save")]')
