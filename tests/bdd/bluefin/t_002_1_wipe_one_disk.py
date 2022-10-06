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


"""test_wipe_one_disk"""

def test_wipe_one_disk(driver):
    """test_wipe_one_disk"""
    """click on the Storage on the side menu."""
    if not is_element_present(driver, '//h1[contains(.,"Storage")]'):
        assert wait_on_element(driver, 10, '//span[contains(text(),"Storage")]', 'clickable')
        driver.find_element_by_xpath('//span[contains(text(),"Storage")]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage Dashboard")]')

    
    # 'the pools page appears click disk and select disks
    assert wait_on_element(driver, 10, '//a//span[contains(.,"Disks")]', 'clickable')
    driver.find_element_by_xpath('//a//span[contains(.,"Disks")]').click()


    # the disk manager appears, expand sdc and click wipe
    assert wait_on_element(driver, 10, '//h1[contains(.,"Disks")]')
    time.sleep(1)
    disk_list = []
    disk_elements = driver.find_elements_by_xpath('//div[contains(text(),"sd")]')
    for disk_element in disk_elements:
        disk = disk_element.text
        if is_element_present(driver, f'//tr[@id="{disk}"]//td//div[contains(text(),"N/A")]'):
            disk_list.append(disk)
    for disk in disk_list:
        assert wait_on_element(driver, 7, f'//tr[@id="{disk}"]/td[2]', 'clickable')
        driver.find_element_by_xpath(f'//tr[@id="{disk}"]/td[2]').click()
        assert wait_on_element(driver, 7, f'//button[@ix-auto="button__WIPE_{disk}_{disk}"]', 'clickable')
        driver.find_element_by_xpath(f'//button[@ix-auto="button__WIPE_{disk}_{disk}"]').click()
        assert wait_on_element(driver, 7, f'//h1[contains(.,"Wipe Disk {disk}")]')
        assert wait_on_element(driver, 7, '//span[contains(text(),"Wipe")]', 'clickable')

        driver.find_element_by_xpath('//span[contains(text(),"Wipe")]').click()
        assert wait_on_element(driver, 7, f'//h1[contains(.,"Wipe Disk {disk}")]')
        assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
        assert wait_on_element(driver, 7, '//span[contains(text(),"Continue")]', 'clickable')
        driver.find_element_by_xpath('//span[contains(text(),"Continue")]').click()
        assert wait_on_element(driver, 15, '//span[contains(.,"Disk Wiped successfully")]')
        assert wait_on_element(driver, 5, '//button[contains(.,"Close")]', 'clickable')
        driver.find_element_by_xpath('//button[contains(.,"Close")]').click()


    # click wipe and conform, wait for popup, then click close
    time.sleep(1)
    assert wait_on_element(driver, 7, '//div[contains(.,"Disks")]')
