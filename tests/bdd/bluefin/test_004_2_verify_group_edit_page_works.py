# coding=utf-8
"""SCALE UI feature tests."""
import time
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_for_attribute_value,
    wait_on_element_disappear,
    ssh_cmd
)




def test_verify_group_edit_page_works(driver):
    """test_verify_group_edit_page_works"""
    if not is_element_present(driver, '//h1[contains(text(),"Groups")]'):
        assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
        assert wait_on_element(driver, 10, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Groups"]', 'clickable')
        driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Groups"]').click()
    assert wait_on_element(driver, 7, '//h1[contains(text(),"Groups")]')

    """on the Groups page expand QE group and click edit."""
    assert wait_on_element(driver, 10, '//h1[contains(text(),"Groups")]')
    assert wait_on_element(driver, 10, '//tr[@ix-auto="expander__qetest"]/td', 'clickable')
    driver.find_element_by_xpath('//tr[@ix-auto="expander__qetest"]/td').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__EDIT_qetest_qetest"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__EDIT_qetest_qetest"]').click()


    # verify the edit page opens
    assert wait_on_element(driver, 10, '//h3[contains(text(),"Edit Group")]')
    assert wait_on_element(driver, 7, '//mat-icon[@id="ix-close-icon"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="ix-close-icon"]').click()