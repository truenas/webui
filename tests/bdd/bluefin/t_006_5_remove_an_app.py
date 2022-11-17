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




def test_remove_an_app(driver):
    """test_remove_an_app"""
    if not is_element_present(driver, '//h1[contains(.,"Applications")]'):
        assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Apps"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Apps"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Applications")]')

    # the Apps page load, open installed applications
    if is_element_present(driver, '//mat-ink-bar[@style="visibility: visible; left: 0px; width: 183px;"]') is False:
        assert wait_on_element(driver, 10, '//div[contains(text(),"Installed Applications")]', 'clickable')
        driver.find_element_by_xpath('//div[contains(text(),"Installed Applications")]').click()
        assert wait_on_element(driver, 7, '//h3[contains(.,"No Applications Installed")]')


    # click the three dots icon and select delete
    assert wait_on_element(driver, 20, '//mat-card[contains(.,"minio-test")]//mat-icon[contains(.,"more_vert")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"minio-test")]//mat-icon[contains(.,"more_vert")]').click()
    assert wait_on_element(driver, 20, '//span[contains(.,"Delete")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Delete")]').click()


    # confirm that you want to delete
    assert wait_on_element(driver, 2, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    wait_on_element(driver, 10, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()


    # Verify the application has been deleted
    assert wait_on_element(driver, 5, '//h1[contains(.,"Deleting...")]')
    assert wait_on_element_disappear(driver, 60, '//h1[contains(.,"Deleting...")]')
    time.sleep(1)  # we have to wait for the page to update
    assert wait_on_element_disappear(driver, 10, '//mat-card[contains(.,"minio-test")]')