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




def test_import_disk(driver):
    """test_import_disk"""
    if not is_element_present(driver, '//h1[contains(.,"Storage")]'):
        assert wait_on_element(driver, 10, '//span[contains(text(),"Storage")]', 'clickable')
        driver.find_element_by_xpath('//span[contains(text(),"Storage")]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage Dashboard")]')


    # Click on dropdown and import disk
    assert wait_on_element(driver, 10, '//span[contains(.,"Disks")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Disks")]').click()
    assert wait_on_element(driver, 10, '//a[@ix-auto="button__STORAGE_IMPORT_DISK"]', 'clickable')
    driver.find_element_by_xpath('//a[@ix-auto="button__STORAGE_IMPORT_DISK"]').click()


    # verify that the import disk page opens
    assert wait_on_element(driver, 10, '//h1[contains(text(),"Import Disk")]')
