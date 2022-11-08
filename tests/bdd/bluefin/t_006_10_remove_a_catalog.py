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




def test_remove_a_catalog(driver):
    """test_remove_a_catalog"""
    if not is_element_present(driver, '//h1[contains(.,"Applications")]'):
        assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Apps"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Apps"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Applications")]')


    # when the Apps page loads, open manage catalogs
    assert wait_on_element(driver, 10, '//div[contains(text(),"Manage Catalogs")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Manage Catalogs")]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Manage Catalogs")]')


    # click three dots icon for Truecharts and select delete
    time.sleep(5)  # we have to wait for the page to settle down and the card to fully load
    assert wait_on_element(driver, 10, '//tr[contains(.,"TRUECHARTS")]//mat-icon[contains(.," more_vert ")]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"TRUECHARTS")]//mat-icon[contains(.," more_vert ")]').click()
    assert wait_on_element(driver, 10, '//button[@ix-auto="action__TRUECHARTS_Delete"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__TRUECHARTS_Delete"]').click()


    # confirm the confirmation
    assert wait_on_element(driver, 2, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 10, '//button[@ix-auto="button__DELETE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__DELETE"]').click()
    time.sleep(0.5)
    assert wait_on_element_disappear(driver, 25, '//h6[contains(.,"Please wait")]')


    # confirm deletion is successful
    assert wait_on_element_disappear(driver, 10, '//div[text()="TRUECHARTS"]')
    assert is_element_present(driver, '//div[text()="TRUECHARTS"]') is False