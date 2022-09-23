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




def test_create_ldap_dataset(driver, dataset_name, user):
    """test_create_ldap_dataset"""
    # uncomment next line when running test solo since it will be starting at a different page
    #assert wait_on_element(driver, 10, '//h1[contains(text(),"Dashboard")]')
    assert wait_on_element(driver, 10, '//h1[contains(text(),"Directory Services")]')


    assert wait_on_element(driver, 10, '//span[contains(text(),"Storage (Deprecated)")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Storage (Deprecated)")]').click()


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
    assert wait_on_element(driver, 5, '//span[contains(text(),"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save")]').click()
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

  
    assert wait_on_element(driver, 5, f'//ix-fieldset//fieldset//ix-combobox//div//ix-label//label//span[contains(.,"User")]//ancestor::ix-combobox//div//input', 'clickable')
    driver.find_element_by_xpath(f'//ix-fieldset//fieldset//ix-combobox//div//ix-label//label//span[contains(.,"User")]//ancestor::ix-combobox//div//input').click()
    element = driver.find_element_by_xpath('//mat-option//span[contains(text(),"eturgeon")]')
    # Scroll to user
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    assert wait_on_element(driver, 5, '//mat-option//span[contains(text(),"eturgeon")]', 'clickable')    
    driver.find_element_by_xpath('//mat-option//span[contains(text(),"eturgeon")]').click()

    assert wait_on_element(driver, 5, f'//ix-fieldset//fieldset//ix-combobox//div//ix-label//label//span[contains(.,"Group")]//ancestor::ix-combobox//div//input', 'clickable')
    driver.find_element_by_xpath(f'//ix-fieldset//fieldset//ix-combobox//div//ix-label//label//span[contains(.,"Group")]//ancestor::ix-combobox//div//input').click()
    element = driver.find_element_by_xpath('//mat-option//span[contains(text(),"eturgeon")]')
    # Scroll to user
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    assert wait_on_element(driver, 5, '//mat-option//span[contains(text(),"eturgeon")]', 'clickable')    
    driver.find_element_by_xpath('//mat-option//span[contains(text(),"eturgeon")]').click()

    assert wait_on_element(driver, 5, '//ix-fieldset//fieldset//ix-checkbox/mat-checkbox[1]/label[1]//following-sibling::span[contains(.,"Apply User")]', 'clickable')
    checkbox_checked = attribute_value_exist(driver, '//ix-fieldset//fieldset//ix-checkbox/mat-checkbox[1]/label[1]//following-sibling::span[contains(.,"Apply User")]', 'class', 'mat-checkbox-checked')
    if not checkbox_checked:
        driver.find_element_by_xpath('//ix-fieldset//fieldset//ix-checkbox/mat-checkbox[1]/label[1]//following-sibling::span[contains(.,"Apply User")]').click()
 
    assert wait_on_element(driver, 5, '//ix-fieldset//fieldset//ix-checkbox/mat-checkbox[1]/label[1]//following-sibling::span[contains(.,"Apply Group")]', 'clickable')
    checkbox_checked = attribute_value_exist(driver, '//ix-fieldset//fieldset//ix-checkbox/mat-checkbox[1]/label[1]//following-sibling::span[contains(.,"Apply Group")]', 'class', 'mat-checkbox-checked')
    if not checkbox_checked:
        driver.find_element_by_xpath('//ix-fieldset//fieldset//ix-checkbox/mat-checkbox[1]/label[1]//following-sibling::span[contains(.,"Apply Group")]').click()

    assert wait_on_element(driver, 5, '//span[contains(text(),"Save")]', 'clickable')    
    driver.find_element_by_xpath('//span[contains(text(),"Save")]').click()


    # on the storage page, click on the "{dataset_name}" three dots button, select Edit Permissions and verify that user and group name is "{user}"
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage")]')
    assert wait_on_element(driver, 5, f'//tr[contains(.,"{dataset_name}")]//mat-icon[text()="more_vert"]')
    driver.find_element_by_xpath(f'//tr[contains(.,"{dataset_name}")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 5, '//button[normalize-space(text())="View Permissions"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="View Permissions"]').click()
    assert wait_on_element(driver, 5, '//div[contains(text(),"eturgeon")]')