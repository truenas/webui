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




def test_remove_another_app(driver):
    """test_remove_another_app"""
    if not is_element_present(driver, '//h1[contains(.,"Applications")]'):
        assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Apps"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Apps"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Applications")]')


    # make sure the installed tab is open
    if is_element_present(driver, '//mat-ink-bar[@style="visibility: visible; left: 0px; width: 183px;"]') is False:
        assert wait_on_element(driver, 10, '//div[contains(text(),"Installed Applications")]', 'clickable')
        driver.find_element_by_xpath('//div[contains(text(),"Installed Applications")]').click()


    # click three dots icon for Chia and select delete
    assert wait_on_element(driver, 60, '//mat-card[contains(.,"chia-test")]//mat-icon[contains(.,"more_vert")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"chia-test")]//mat-icon[contains(.,"more_vert")]').click()
    assert wait_on_element(driver, 10, '//span[contains(.,"Delete")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Delete")]').click()


    # confirm the delete confirmation
    assert wait_on_element(driver, 5, '//h1[contains(.,"Delete")]')
    assert wait_on_element(driver, 2, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 10, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()
    assert wait_on_element(driver, 5, '//*[contains(.,"Deleting...")]')
    assert wait_on_element_disappear(driver, 60, '//*[contains(.,"Deleting...")]')


    # confirm deletion is successful
    assert is_element_present(driver, '//mat-card[contains(.,"chia-test")]') is False