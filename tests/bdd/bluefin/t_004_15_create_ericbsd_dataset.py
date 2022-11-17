# coding=utf-8
"""SCALE UI feature tests."""
import time
from selenium.webdriver.common.keys import Keys
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_for_attribute_value,
    wait_on_element_disappear,
)




def test_create_ericbsd_dataset(driver, dataset_name, user):
    """test_create_ericbsd_dataset"""
    if not is_element_present(driver, '//h1[contains(.,"Datasets")]'):
        #assert wait_on_element_disappear(driver, 15, '//div[contains(@class,"cdk-overlay-backdrop-showing")]')
        driver.find_element_by_xpath('//a//span[contains(text(),"Datasets")]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Datasets")]')


    # the storage page should open, find and click on manage datasets for tank
    if not is_element_present(driver, '//ix-tree-node[(contains(@class,"selected")) and (contains(.,"tank"))]'):
        assert wait_on_element(driver, 10, '//ix-dataset-node//div//div//span[contains(.,"tank")]', 'clickable')
        driver.find_element_by_xpath('//ix-dataset-node//div//div//span[contains(.,"tank")]').click()
    assert wait_on_element( driver, 10, '//ix-tree-node[(contains(@class,"selected")) and (contains(.,"tank"))]') 
    assert wait_on_element(driver, 10, '//span[contains(text(),"Add Dataset")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Add Dataset")]').click()


    # on the Add Dataset page, input the dataset name "{dataset_name}"
    assert wait_on_element(driver, 10, '//h3[text()="Add Dataset"]')
    assert wait_on_element(driver, 10, '//div[@ix-auto="textarea__Name"]//div//textarea')
    driver.find_element_by_xpath('//div[@ix-auto="textarea__Name"]//div//textarea').click()
    driver.find_element_by_xpath('//div[@ix-auto="textarea__Name"]//div//textarea').send_keys(dataset_name)
    assert wait_on_element(driver, 10, '//mat-select[@ix-auto="select__Share Type"]')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Share Type"]').click()
    assert wait_on_element(driver, 10, '//mat-option[@ix-auto="option__Share Type_SMB"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Share Type_SMB"]').click()


    # click Summit the "{dataset_name}" data should be created
    assert wait_on_element(driver, 10, '//span[contains(.,"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Save")]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, f'//div//span[contains(text(),"{dataset_name}")]')


    # click on the "{dataset_name}" 3 dots button, select Edit Permissions
    if not is_element_present(driver, f'//ix-tree-node[contains(@class,"selected")]//ix-dataset-node//div//div//span[contains(.,"{dataset_name}")]'):
        assert wait_on_element(driver,  15, f'//ix-tree-node//ix-dataset-node//div//div//span[contains(.,"{dataset_name}")]', 'clickable')
        driver.find_element_by_xpath(f'//ix-tree-node//ix-dataset-node//div//div//span[contains(.,"{dataset_name}")]').click()
    assert wait_on_element( driver,  15, f'//ix-tree-node[contains(@class,"selected")]//ix-dataset-node//div//div//span[contains(.,"{dataset_name}")]') 
    
    # Scroll to permissions
    element = driver.find_element_by_xpath('//h3[contains(text(),"Permissions")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)

    # click on edit
    assert wait_on_element(driver, 10, '//mat-card-header//div//h3[contains(text(),"Permissions")]//ancestor::mat-card-header//a//span[contains(.,"Edit")]', 'clickable')
    driver.find_element_by_xpath('//mat-card-header//div//h3[contains(text(),"Permissions")]//ancestor::mat-card-header//a//span[contains(.,"Edit")]').click()


    # the Edit Permissions page should open, select eturgeon for User, click on the Apply User checkbox, then select eturgeon for Group name, click on the Apply Group checkbox, and click the Save button
    #assert wait_on_element(driver, 10, '//mat-card-title[contains(text(),"Unix Permissions Editor")]')
    assert wait_on_element(driver, 10, '//h1[text()="Edit ACL"]')
    
    assert wait_on_element(driver, 10, '//button//span[contains(text(),"Add Item")]', 'clickable')
    driver.find_element_by_xpath('//button//span[contains(text(),"Add Item")]').click() 

    if is_element_present(driver, '//h1[contains(.,"Select a preset ACL")]'):
        assert wait_on_element(driver,  15, '//span[contains(.,"Cancel")]')
        driver.find_element_by_xpath('//span[contains(.,"Cancel")]').click()

    assert wait_on_element(driver, 10, '//mat-card-header//div//div//label[contains(text(),"Owner:")]//ancestor::mat-card-header//div//div[1]/ix-combobox//div//div//input', 'inputable')
    driver.find_element_by_xpath('//mat-card-header//div//div//label[contains(text(),"Owner:")]//ancestor::mat-card-header//div//div[1]/ix-combobox//div//div//input').clear()
    driver.find_element_by_xpath('//mat-card-header//div//div//label[contains(text(),"Owner:")]//ancestor::mat-card-header//div//div[1]/ix-combobox//div//div//input').send_keys(user)
    driver.find_element_by_xpath('//mat-card-header//div//div//label[contains(text(),"Owner:")]//ancestor::mat-card-header//div//div[1]/ix-combobox//div//div//input').send_keys(Keys.TAB)

    assert wait_on_element(driver, 10, '//mat-card-header//div//div//label[contains(text(),"Owner:")]//ancestor::mat-card-header//div//div[2]/ix-combobox//div//div//input', 'inputable')
    driver.find_element_by_xpath('//mat-card-header//div//div//label[contains(text(),"Owner:")]//ancestor::mat-card-header//div//div[2]/ix-combobox//div//div//input').clear()
    driver.find_element_by_xpath('//mat-card-header//div//div//label[contains(text(),"Owner:")]//ancestor::mat-card-header//div//div[2]/ix-combobox//div//div//input').send_keys(user)
    driver.find_element_by_xpath('//mat-card-header//div//div//label[contains(text(),"Owner:")]//ancestor::mat-card-header//div//div[2]/ix-combobox//div//div//input').send_keys(Keys.TAB)

    # Check the checkboxes
    assert wait_on_element(driver, 10, '//mat-card-header/div//div//ix-checkbox//mat-checkbox//label[1]/span[contains(text(),"Apply Owner")]//ancestor::ix-checkbox//mat-checkbox', 'clickable')
    driver.find_element_by_xpath('//mat-card-header/div//div//ix-checkbox//mat-checkbox//label[1]/span[contains(text(),"Apply Owner")]//ancestor::ix-checkbox//mat-checkbox').click()
    assert wait_on_element(driver, 10, '//mat-card-header/div//div//ix-checkbox//mat-checkbox//label[1]/span[contains(text(),"Apply Group")]//ancestor::ix-checkbox//mat-checkbox', 'clickable')
    driver.find_element_by_xpath('//mat-card-header/div//div//ix-checkbox//mat-checkbox//label[1]/span[contains(text(),"Apply Group")]//ancestor::ix-checkbox//mat-checkbox').click()

    assert wait_on_element(driver,  15, '//span[contains(text(),"Who")]//ancestor::ix-select//div//mat-select')
    driver.find_element_by_xpath('//span[contains(text(),"Who")]//ancestor::ix-select//div//mat-select').click()
    driver.find_element_by_xpath('//mat-option[2]/span[contains(text(),"Group")]').click()

    assert wait_on_element(driver,  15, '//ix-fieldset[1]/fieldset[1]/ix-combobox[1]/div[1]/div[1]/input', 'inputable')
    driver.find_element_by_xpath('//ix-fieldset[1]/fieldset[1]/ix-combobox[1]/div[1]/div[1]/input').clear()
    driver.find_element_by_xpath('//ix-fieldset[1]/fieldset[1]/ix-combobox[1]/div[1]/div[1]/input').send_keys(user)
    driver.find_element_by_xpath('//ix-fieldset[1]/fieldset[1]/ix-combobox[1]/div[1]/div[1]/input').send_keys(Keys.TAB)

    assert wait_on_element(driver,  15, '//span[contains(text(),"Modify")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Modify")]').click()
    assert wait_on_element(driver,  15, '//mat-option[4]//span[contains(text(),"Full Control")]', 'clickable')
    time.sleep(0.5)
    driver.find_element_by_xpath('//mat-option[4]//span[contains(text(),"Full Control")]').click()

    # click the Save button, which should be returned to the storage page, on the Edit ACL page, verify that the group name is "{group_name}"
    assert wait_on_element(driver,  15, '//span[contains(text(),"Save Access Control List")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save Access Control List")]').click()
    assert wait_on_element_disappear(driver, 30, '//h6[contains(.,"Please wait")]')
    assert wait_on_element_disappear(driver, 15, '//mat-spinner[@role="progressbar"]')

    # you should be returned to the pool list page, click on the ericbsd_dataset three dots button, view and edit Permissions, and the Edit Permissions page should open
    assert wait_on_element(driver, 10, f'//div[contains(text(),"{dataset_name}")]')
    if not is_element_present(driver, f'//ix-tree-node[contains(@class,"selected")]//ix-dataset-node//div//div//span[contains(.,"{dataset_name}")]'):
        assert wait_on_element(driver, 15, f'//ix-tree-node//ix-dataset-node//div//div//span[contains(.,"{dataset_name}")]', 'clickable')
        driver.find_element_by_xpath(f'//ix-tree-node//ix-dataset-node//div//div//span[contains(.,"{dataset_name}")]').click()
    assert wait_on_element( driver, 15, f'//ix-tree-node[contains(@class,"selected")]//ix-dataset-node//div//div//span[contains(.,"{dataset_name}")]') 

    #verify the new ACL item for user ericbsd exists
    assert wait_on_element(driver, 15, '//div[contains(text(),"owner@ - ericbsd")]')
    assert wait_on_element(driver, 15, '//div[contains(text(),"group@ - ericbsd")]')
    assert wait_on_element(driver, 15, '//div[contains(text(),"Group - ericbsd")]')
    time.sleep(1)