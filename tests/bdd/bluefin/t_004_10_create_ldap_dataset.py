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
    if not is_element_present(driver, '//h1[contains(.,"Datasets")]'):
        #assert wait_on_element_disappear(driver, 15, '//div[contains(@class,"cdk-overlay-backdrop-showing")]')
        driver.find_element_by_xpath('//a//span[contains(text(),"Datasets")]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Datasets")]')


    # the storage page should open, find and click on manage datasets for tank
    if not is_element_present(driver, '//div[((contains(@class,"selected")) and (contains(.,"tank")) and not(contains(.,"encrypted_tank")))]'):
        assert wait_on_element(driver, 10, '//span[(contains(.,"tank")) and not(contains(.,"encrypted_tank"))]', 'clickable')
        driver.find_element_by_xpath('//span[(contains(.,"tank")) and not(contains(.,"encrypted_tank"))]').click()
    assert wait_on_element( driver, 10, '//div[((contains(@class,"selected")) and (contains(.,"tank")) and not(contains(.,"encrypted_tank")))]') 
    assert wait_on_element(driver, 10, '//span[contains(text(),"Add Dataset")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Add Dataset")]').click()
   

    # on the Add Dataset page, input the dataset name "{dataset_name}"
    assert wait_on_element(driver, 10, '//h3[text()="Add Dataset"]')
    assert wait_on_element(driver, 10, '//div[@ix-auto="textarea__Name"]//div//textarea')
    driver.find_element_by_xpath('//div[@ix-auto="textarea__Name"]//div//textarea').click()
    driver.find_element_by_xpath('//div[@ix-auto="textarea__Name"]//div//textarea').send_keys(dataset_name)
    #assert wait_on_element(driver, 10, '//mat-select[@ix-auto="select__Share Type"]')
    #driver.find_element_by_xpath('//mat-select[@ix-auto="select__Share Type"]').click()
    #assert wait_on_element(driver, 10, '//mat-option[@ix-auto="option__Share Type_SMB"]', 'clickable')
    #driver.find_element_by_xpath('//mat-option[@ix-auto="option__Share Type_SMB"]').click()


    # click Summit the "{dataset_name}" data should be created
    assert wait_on_element(driver, 10, '//span[contains(.,"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Save")]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')


    # click on the "{dataset_name}" 3 dots button, select Edit Permissions
    if not is_element_present(driver, f'//ix-tree-node[contains(@class,"selected")]//ix-dataset-node//div//div//span[contains(.,"{dataset_name}")]'):
        assert wait_on_element(driver, 7, f'//ix-tree-node//ix-dataset-node//div//div//span[contains(.,"{dataset_name}")]', 'clickable')
        driver.find_element_by_xpath(f'//ix-tree-node//ix-dataset-node//div//div//span[contains(.,"{dataset_name}")]').click()
    assert wait_on_element( driver, 7, f'//ix-tree-node[contains(@class,"selected")]//ix-dataset-node//div//div//span[contains(.,"{dataset_name}")]') 
    
    # Scroll to permissions
    element = driver.find_element_by_xpath('//h3[contains(text(),"Permissions")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)

    # click on edit
    assert wait_on_element(driver, 10, '//mat-card-header//div//h3[contains(text(),"Permissions")]//ancestor::mat-card-header//a//span[contains(.,"Edit")]', 'clickable')
    driver.find_element_by_xpath('//mat-card-header//div//h3[contains(text(),"Permissions")]//ancestor::mat-card-header//a//span[contains(.,"Edit")]').click()


    # the Edit Permissions page should open, select eturgeon for User, click on the Apply User checkbox, then select eturgeon for Group name, click on the Apply Group checkbox, and click the Save button
    assert wait_on_element(driver, 10, '//mat-card-title[contains(text(),"Unix Permissions Editor")]')

  
    assert wait_on_element(driver, 10, f'//ix-fieldset//fieldset//ix-combobox//div//ix-label//label//span[contains(.,"User")]//ancestor::ix-combobox//div//input', 'clickable')
    driver.find_element_by_xpath(f'//ix-fieldset//fieldset//ix-combobox//div//ix-label//label//span[contains(.,"User")]//ancestor::ix-combobox//div//input').click()
    element = driver.find_element_by_xpath('//mat-option//span[contains(text(),"eturgeon")]')
    # Scroll to user
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    assert wait_on_element(driver, 10, '//mat-option//span[contains(text(),"eturgeon")]', 'clickable')    
    driver.find_element_by_xpath('//mat-option//span[contains(text(),"eturgeon")]').click()

    assert wait_on_element(driver, 10, f'//ix-fieldset//fieldset//ix-combobox//div//ix-label//label//span[contains(.,"Group")]//ancestor::ix-combobox//div//input', 'clickable')
    driver.find_element_by_xpath(f'//ix-fieldset//fieldset//ix-combobox//div//ix-label//label//span[contains(.,"Group")]//ancestor::ix-combobox//div//input').click()
    element = driver.find_element_by_xpath('//mat-option//span[contains(text(),"eturgeon")]')
    # Scroll to user
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    assert wait_on_element(driver, 10, '//mat-option//span[contains(text(),"eturgeon")]', 'clickable')    
    driver.find_element_by_xpath('//mat-option//span[contains(text(),"eturgeon")]').click()

    assert wait_on_element(driver, 10, '//ix-fieldset//fieldset//ix-checkbox/mat-checkbox[1]/label[1]//following-sibling::span[contains(.,"Apply User")]', 'clickable')
    checkbox_checked = attribute_value_exist(driver, '//ix-fieldset//fieldset//ix-checkbox/mat-checkbox[1]/label[1]//following-sibling::span[contains(.,"Apply User")]', 'class', 'mat-checkbox-checked')
    if not checkbox_checked:
        driver.find_element_by_xpath('//ix-fieldset//fieldset//ix-checkbox/mat-checkbox[1]/label[1]//following-sibling::span[contains(.,"Apply User")]').click()
 
    assert wait_on_element(driver, 10, '//ix-fieldset//fieldset//ix-checkbox/mat-checkbox[1]/label[1]//following-sibling::span[contains(.,"Apply Group")]', 'clickable')
    checkbox_checked = attribute_value_exist(driver, '//ix-fieldset//fieldset//ix-checkbox/mat-checkbox[1]/label[1]//following-sibling::span[contains(.,"Apply Group")]', 'class', 'mat-checkbox-checked')
    if not checkbox_checked:
        driver.find_element_by_xpath('//ix-fieldset//fieldset//ix-checkbox/mat-checkbox[1]/label[1]//following-sibling::span[contains(.,"Apply Group")]').click()

    assert wait_on_element(driver, 10, '//span[contains(text(),"Save")]', 'clickable')    
    driver.find_element_by_xpath('//span[contains(text(),"Save")]').click()

   # the storage page should open, find and click on manage datasets for tank
    if not is_element_present(driver, '//div[((contains(@class,"selected")) and (contains(.,"tank")) and not(contains(.,"encrypted_tank")))]'):
        assert wait_on_element(driver, 10, '//span[(contains(.,"tank")) and not(contains(.,"encrypted_tank"))]', 'clickable')
        driver.find_element_by_xpath('//span[(contains(.,"tank")) and not(contains(.,"encrypted_tank"))]').click()
    assert wait_on_element( driver, 10, '//div[((contains(@class,"selected")) and (contains(.,"tank")) and not(contains(.,"encrypted_tank")))]') 

    if not is_element_present(driver, f'//ix-tree-node[((contains(@class,"selected")) and (contains(.,"{dataset_name}")))]'):
        assert wait_on_element(driver, 7, f'//ix-tree-node//ix-dataset-node//div//div//span[contains(.,"{dataset_name}")]', 'clickable')
        driver.find_element_by_xpath(f'//ix-tree-node//ix-dataset-node//div//div//span[contains(.,"{dataset_name}")]').click()
    assert wait_on_element( driver, 7, f'//ix-tree-node[((contains(@class,"selected")) and (contains(.,"{dataset_name}")))]') 
    
    #verify the new ACL item for user ericbsd exists
    assert wait_on_element(driver, 7, '//div//div[contains(text(),"Owner:")]//following-sibling::div[contains(text(),"eturgeon")]')
    time.sleep(1)