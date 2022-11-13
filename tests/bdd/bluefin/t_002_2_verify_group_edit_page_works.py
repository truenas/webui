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
    assert wait_on_element(driver, 10, '//h1[contains(text(),"Groups")]')
    assert wait_on_element(driver, 10, '//td[contains(text(),"qetest")]', 'clickable')
    driver.find_element_by_xpath('//td[contains(text(),"qetest")]').click()
    assert wait_on_element(driver, 7, '//span[contains(text(),"Edit")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Edit")]').click()


    # verify the edit page opens
    assert wait_on_element(driver, 10, '//h3[contains(text(),"Edit Group")]')
    assert wait_on_element(driver, 7, '//mat-icon[@id="ix-close-icon"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="ix-close-icon"]').click()