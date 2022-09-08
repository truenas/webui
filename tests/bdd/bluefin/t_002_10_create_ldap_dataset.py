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




def test_create_ldap_dataset(driver):
    """test_create_ldap_dataset"""


   # click on sharing and click add
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Shares"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Shares"]').click()
    assert wait_on_element(driver, 7, '//mat-card[contains(.,"Windows (SMB) Shares")]//button[contains(.,"Add")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"Windows (SMB) Shares")]//button[contains(.,"Add")]').click()


    assert wait_on_element(driver, 10, '//span[contains(text(),"Storage (Deprecated))]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Storage (Deprecated))]').click()


    # the storage page should open, then click on the tank three dots button, select Add Dataset
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage")]')
    assert wait_on_element(driver, 5, '//tr[contains(.,"tank")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"tank")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 4, '//button[normalize-space(text())="Add Dataset"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="Add Dataset"]').click()   


    # the Dataset window should open, input dataset name "{dataset_name}" and click save
    assert wait_on_element(driver, 5, '//h3[text()="Add Dataset"]')
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys(dataset_name)
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')


    # the my_ldap_dataset should be created, click on the "{dataset_name}" three dots button, select Edit Permissions
    assert wait_on_element(driver, 10, f'//div[contains(text(),"{dataset_name}")]')
    assert wait_on_element(driver, 5, f'//tr[contains(.,"{dataset_name}")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath(f'//tr[contains(.,"{dataset_name}")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 5, '//button[normalize-space(text())="View Permissions"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="View Permissions"]').click()
    assert wait_on_element(driver, 5, '//div[contains(text(),"Dataset Permissions")]')
    assert wait_on_element(driver, 5, '//mat-icon[normalize-space(text())="edit"]')
    driver.find_element_by_xpath('//mat-icon[normalize-space(text())="edit"]').click()


    # the Edit Permissions page should open, select eturgeon for User, click on the Apply User checkbox, then select eturgeon for Group name, click on the Apply Group checkbox, and click the Save button
    assert wait_on_element(driver, 5, '//mat-card-title[contains(text(),"Unix Permissions Editor")]')
    assert wait_on_element(driver, 5, '//input[@data-placeholder="User"]', 'inputable')
    driver.find_element_by_xpath('//input[@data-placeholder="User"]').clear()
    driver.find_element_by_xpath('//input[@data-placeholder="User"]').send_keys('eturgeon')
    assert wait_on_element(driver, 5, '//span[contains(text(),"eturgeon")]', 'clickable')    
    driver.find_element_by_xpath('//span[contains(text(),"eturgeon")]').click()
    assert wait_on_element(driver, 5, '//input[@data-placeholder="Group"]', 'inputable')
    driver.find_element_by_xpath('//input[@data-placeholder="Group"]').clear()
    driver.find_element_by_xpath('//input[@data-placeholder="Group"]').send_keys('eturgeon')
    assert wait_on_element(driver, 5, '//span[contains(text(),"eturgeon")]', 'clickable')    
    driver.find_element_by_xpath('//span[contains(text(),"eturgeon")]').click()
    checkbox_checked = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Apply User"]', 'class', 'mat-checkbox-checked')
    if not checkbox_checked:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Apply User"]').click()
    checkbox_checked = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Apply Group"]', 'class', 'mat-checkbox-checked')
    if not checkbox_checked:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Apply Group"]').click()
    assert wait_on_element(driver, 5, '//span[contains(text(),"Save")]', 'clickable')    
    driver.find_element_by_xpath('//span[contains(text(),"Save")]').click()


    # on the storage page, click on the "{dataset_name}" three dots button, select Edit Permissions and verify that user and group name is "{user}"
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage")]')
    assert wait_on_element(driver, 5, f'//tr[contains(.,"{dataset_name}")]//mat-icon[text()="more_vert"]')
    driver.find_element_by_xpath(f'//tr[contains(.,"{dataset_name}")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 5, '//button[normalize-space(text())="View Permissions"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="View Permissions"]').click()
    assert wait_on_element(driver, 5, '//div[contains(text(),"eturgeon")]')