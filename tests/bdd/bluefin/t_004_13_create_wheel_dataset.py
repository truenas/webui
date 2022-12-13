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




def test_create_wheel_dataset(driver, dataset_name):
    """test_create_wheel_dataset"""
    # uncomment next line when running test solo since it will be starting at a different page
    #assert wait_on_element(driver, 10, '//h1[contains(text(),"Dashboard")]')
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
    #assert wait_on_element(driver, 10, '//mat-card-title[contains(text(),"Unix Permissions Editor")]')
    assert wait_on_element(driver, 10, '//h1[text()="Edit ACL"]')

    assert wait_on_element(driver, 5, '//button//span[contains(text(),"Add Item")]', 'clickable')
    driver.find_element_by_xpath('//button//span[contains(text(),"Add Item")]').click()   


    assert wait_on_element(driver, 5, '//div[contains(.,"Owner Group:") and @class="control"]//input', 'inputable')
    driver.find_element_by_xpath('//div[contains(.,"Owner Group:") and @class="control"]//input').click()
    driver.find_element_by_xpath('//div[contains(.,"Owner Group:") and @class="control"]//input').clear()
    driver.find_element_by_xpath('//div[contains(.,"Owner Group:") and @class="control"]//input').send_keys("wheel")
    driver.find_element_by_xpath('//div[contains(.,"Owner Group:") and @class="control"]//input').send_keys(Keys.TAB)
    time.sleep(1) #button is detected clickable before before it can actually be cleanly clicked resulting in failure 
    #assert wait_on_element(driver, 5, '//span[contains(text(),"Save Access Control List")]', 'clickable')
    #driver.find_element_by_xpath('//span[contains(text(),"Save Access Control List")]').click()
    #assert wait_on_element_disappear(driver, 15, '//mat-spinner[@role="progressbar"]')
    #assert wait_on_element(driver, 10, '//div[contains(text(),"wheel_dataset")]')
    #assert wait_on_element(driver, 10, '//tr[contains(.,"wheel_dataset")]//mat-icon[text()="more_vert"]', 'clickable')
    #driver.find_element_by_xpath('//tr[contains(.,"wheel_dataset")]//mat-icon[text()="more_vert"]').click()
    #assert wait_on_element(driver, 7, '//button[normalize-space(text())="View Permissions"]', 'clickable')
    #driver.find_element_by_xpath('//button[normalize-space(text())="View Permissions"]').click()
    #assert wait_on_element(driver, 7, '//div[contains(text(),"Dataset Permissions")]', 'clickable')
    #assert wait_on_element(driver, 7, '//mat-icon[normalize-space(text())="edit"]', 'clickable')
    #driver.find_element_by_xpath('//mat-icon[normalize-space(text())="edit"]').click()

    assert wait_on_element(driver, 7, '//span[contains(text(),"Who")]//ancestor::ix-select//div//mat-select')
    driver.find_element_by_xpath('//span[contains(text(),"Who")]//ancestor::ix-select//div//mat-select').click()
    driver.find_element_by_xpath('//mat-option[2]/span[contains(text(),"Group")]').click()

    assert wait_on_element(driver, 7, '//ix-fieldset[1]/fieldset[1]/ix-combobox[1]/div[1]/div[1]/input', 'inputable')
    driver.find_element_by_xpath('//ix-fieldset[1]/fieldset[1]/ix-combobox[1]/div[1]/div[1]/input').clear()
    driver.find_element_by_xpath('//ix-fieldset[1]/fieldset[1]/ix-combobox[1]/div[1]/div[1]/input').send_keys("wheel")

    assert wait_on_element(driver, 7, '//span[contains(text(),"Full Control")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Full Control")]').click()
    assert wait_on_element(driver, 7, '//mat-option[4]//span[contains(text(),"Full Control")]', 'clickable')
    time.sleep(0.5)
    driver.find_element_by_xpath('//mat-option[4]//span[contains(text(),"Full Control")]').click()


    # click the Save button, which should be returned to the storage page, on the Edit ACL page, verify that the group name is "{group_name}"
    assert wait_on_element(driver, 7, '//span[contains(text(),"Save Access Control List")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save Access Control List")]').click()
    assert wait_on_element_disappear(driver, 30, '//h6[contains(.,"Please wait")]')
    assert wait_on_element_disappear(driver, 15, '//mat-spinner[@role="progressbar"]')

    assert wait_on_element_disappear(driver, 15, '//mat-spinner[@role="progressbar"]')
    assert wait_on_element(driver, 10, '//div[contains(text(),"wheel_dataset")]')
    assert wait_on_element(driver, 5, '//tr[contains(.,"wheel_dataset")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"wheel_dataset")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 5, '//button[normalize-space(text())="View Permissions"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="View Permissions"]').click()
    assert wait_on_element(driver, 10, f'//div[text()="Group - wheel"]')