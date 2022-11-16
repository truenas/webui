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




def test_recursive_and_transverse_acls(driver, dataset_name_1, dataset_name_2, dataset_name_3, path):
    """test_recursive_and_transverse_acls"""
    if not is_element_present(driver, '//h1[contains(.,"Datasets")]'):
        #assert wait_on_element_disappear(driver, 15, '//div[contains(@class,"cdk-overlay-backdrop-showing")]')
        driver.find_element_by_xpath('//a//span[contains(text(),"Datasets")]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Datasets")]')


    # click on the tank, then Add Zvol, and the Add Zvol page should open
    if not is_element_present(driver, '//div[((contains(@class,"selected")) and (contains(.,"tank")) and not(contains(.,"encrypted_tank")))]'):
        assert wait_on_element(driver, 10, '//span[(contains(.,"tank")) and not(contains(.,"encrypted_tank"))]', 'clickable')
        driver.find_element_by_xpath('//span[(contains(.,"tank")) and not(contains(.,"encrypted_tank"))]').click()
    assert wait_on_element( driver, 10, '//div[((contains(@class,"selected")) and (contains(.,"tank")) and not(contains(.,"encrypted_tank")))]') 
    assert wait_on_element(driver, 10, '//span[contains(text(),"Add Dataset")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Add Dataset")]').click()



    # Create 1st dataset {dataset_name_1}
    assert wait_on_element(driver, 10, '//h3[text()="Add Dataset"]')
    assert wait_on_element(driver, 10, '//div[@ix-auto="textarea__Name"]//div//textarea')
    driver.find_element_by_xpath('//div[@ix-auto="textarea__Name"]//div//textarea').click()
    driver.find_element_by_xpath('//div[@ix-auto="textarea__Name"]//div//textarea').send_keys(dataset_name_1)
    assert wait_on_element(driver, 10, '//mat-select[@ix-auto="select__Share Type"]')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Share Type"]').click()
    assert wait_on_element(driver, 10, '//mat-option[@ix-auto="option__Share Type_SMB"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Share Type_SMB"]').click()
    # click Summit the "{dataset_name}" data should be created
    assert wait_on_element(driver, 10, '//span[contains(.,"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Save")]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, f'//div//span[contains(text(),"{dataset_name_1}")]')

    if not is_element_present(driver, f'//ix-tree-node[contains(@class,"selected")]//ix-dataset-node//div//div//span[contains(.,"{dataset_name_1}")]'):
        assert wait_on_element(driver, 10, f'//span[(contains(.,"{dataset_name_1}"))]', 'clickable')
        driver.find_element_by_xpath(f'//span[(contains(.,"{dataset_name_1}"))]').click()
    assert wait_on_element( driver, 10, f'//ix-tree-node[contains(@class,"selected")]//ix-dataset-node//div//div//span[contains(.,"{dataset_name_1}")]') 

    # Create 2nd dataset {dataset_name_2} under {dataset_name_1}

    assert wait_on_element(driver, 10, '//span[contains(text(),"Add Dataset")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Add Dataset")]').click()
    assert wait_on_element(driver, 10, '//h3[text()="Add Dataset"]')
    assert wait_on_element(driver, 10, '//div[@ix-auto="textarea__Name"]//div//textarea')
    driver.find_element_by_xpath('//div[@ix-auto="textarea__Name"]//div//textarea').click()
    driver.find_element_by_xpath('//div[@ix-auto="textarea__Name"]//div//textarea').send_keys(dataset_name_2)
    assert wait_on_element(driver, 10, '//mat-select[@ix-auto="select__Share Type"]')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Share Type"]').click()
    assert wait_on_element(driver, 10, '//mat-option[@ix-auto="option__Share Type_SMB"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Share Type_SMB"]').click()
    # click Summit the "{dataset_name_2}" data should be created
    assert wait_on_element(driver, 10, '//span[contains(.,"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Save")]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//span[contains(text(),"Return to pool list")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Return to pool list")]').click()
    assert wait_on_element(driver, 10, f'//div//span[contains(text(),"{dataset_name_2}")]')

    # refresh page to prevent dom failures
    assert wait_on_element(driver, 10, '//span[contains(text(),"Storage")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Storage")]').click()
    assert wait_on_element(driver, 10, '//a//span[contains(text(),"Datasets")]', 'clickable')
    driver.find_element_by_xpath('//a//span[contains(text(),"Datasets")]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Datasets")]')
    # click on the tank
    if not is_element_present(driver, '//div[((contains(@class,"selected")) and (contains(.,"tank")) and not(contains(.,"encrypted_tank")))]'):
        assert wait_on_element(driver, 10, '//span[(contains(.,"tank")) and not(contains(.,"encrypted_tank"))]', 'clickable')
        driver.find_element_by_xpath('//span[(contains(.,"tank")) and not(contains(.,"encrypted_tank"))]').click()
    assert wait_on_element( driver, 10, '//div[((contains(@class,"selected")) and (contains(.,"tank")) and not(contains(.,"encrypted_tank")))]') 
    if not is_element_present(driver, f'//ix-nested-tree-node//div[contains(@class,"selected")]//ix-dataset-node//div//div//span[contains(.,,"{dataset_name_1}")]'):
        assert wait_on_element(driver, 20, f'//span[(contains(.,"{dataset_name_1}"))]', 'clickable')
        driver.find_element_by_xpath(f'//span[(contains(.,"{dataset_name_1}"))]').click()
    assert wait_on_element( driver, 20, f'//ix-nested-tree-node//div[contains(@class,"selected")]//ix-dataset-node//div//div//span[contains(.,"{dataset_name_1}")]')
    
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
    
    assert wait_on_element(driver, 10, '//span[contains(text(),"Add Item")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Add Item")]').click()
    assert wait_on_element(driver, 10, '//mat-select//div//div//span[contains(.,"User")]', 'clickable')
    driver.find_element_by_xpath('//mat-select//div//div//span[contains(.,"User")]').click()
    assert wait_on_element(driver, 10, '//mat-option//span[contains(.,"User")]')
    driver.find_element_by_xpath('//mat-option//span[contains(.,"User")]').click()
    assert wait_on_element(driver, 10, '//ix-combobox//div//ix-label//label//span[contains(.,"User")]//ancestor::ix-combobox//div//div//input[@placeholder="Search"]')
    driver.find_element_by_xpath('//ix-combobox//div//ix-label//label//span[contains(.,"User")]//ancestor::ix-combobox//div//div//input[@placeholder="Search"]').send_keys("ericbs")
    
    assert wait_on_element(driver, 10, '//mat-option//span[contains(.,"ericbsd")]', 'clickable')
    driver.find_element_by_xpath('//mat-option//span[contains(.,"ericbsd")]').click()
    
    assert wait_on_element(driver, 10, '//ix-checkbox[@formcontrolname="recursive"]', 'clickable')
    driver.find_element_by_xpath('//ix-checkbox[@formcontrolname="recursive"]').click()
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 10, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()    
    assert wait_on_element(driver, 10, '//ix-checkbox[@formcontrolname="traverse"]', 'clickable')
    driver.find_element_by_xpath('//ix-checkbox[@formcontrolname="traverse"]').click()
    assert wait_on_element(driver, 10, '//span[contains(text(),"Save Access Control List")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save Access Control List")]').click()
    
    assert wait_on_element_disappear(driver, 30, '//h6[contains(.,"Updating Dataset ACL")]')
    assert wait_on_element_disappear(driver, 30, '//mat-spinner[@role="progressbar"]')

    # refresh page to prevent dom failures
    if is_element_present(driver, '//div[contains(@class,"cdk-overlay-backdrop-showing")]'):
        assert wait_on_element_disappear(driver, 10, '//div[contains(@class,"cdk-overlay-backdrop-showing")]')
    assert wait_on_element(driver, 10, '//span[contains(text(),"Storage")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Storage")]').click()
    assert wait_on_element(driver, 10, '//a//span[contains(text(),"Datasets")]', 'clickable')
    driver.find_element_by_xpath('//a//span[contains(text(),"Datasets")]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Datasets")]')
    # click on the tank
    if not is_element_present(driver, '//div[((contains(@class,"selected")) and (contains(.,"tank")) and not(contains(.,"encrypted_tank")))]'):
        assert wait_on_element(driver, 10, '//span[(contains(.,"tank")) and not(contains(.,"encrypted_tank"))]', 'clickable')
        driver.find_element_by_xpath('//span[(contains(.,"tank")) and not(contains(.,"encrypted_tank"))]').click()
    assert wait_on_element( driver, 10, '//div[((contains(@class,"selected")) and (contains(.,"tank")) and not(contains(.,"encrypted_tank")))]') 

    # Verify that the ACL was set to rt-acl-test-2
    if not is_element_present(driver, f'//ix-tree-node[contains(@class,"selected")]//ix-dataset-node//div//div//span[contains(.,"{dataset_name_2}")]'):
        assert wait_on_element(driver, 20, f'//span[(contains(.,"{dataset_name_2}"))]', 'clickable')
        driver.find_element_by_xpath(f'//span[(contains(.,"{dataset_name_2}"))]').click()
    assert wait_on_element( driver, 10, f'//ix-tree-node[contains(@class,"selected")]//ix-dataset-node//div//div//span[contains(.,"{dataset_name_2}")]')    
    assert wait_on_element(driver, 15, '//div[contains(text(),"User - ericbsd")]')
      
    if not is_element_present(driver, f'//ix-nested-tree-node//div[contains(@class,"selected")]//ix-dataset-node//div//div//span[contains(.,,"{dataset_name_1}")]'):
        assert wait_on_element(driver, 20, f'//span[(contains(.,"{dataset_name_1}"))]', 'clickable')
        driver.find_element_by_xpath(f'//span[(contains(.,"{dataset_name_1}"))]').click()
    assert wait_on_element( driver, 20, f'//ix-nested-tree-node//div[contains(@class,"selected")]//ix-dataset-node//div//div//span[contains(.,"{dataset_name_1}")]')
    
    # Verify that the ACL was set to rt-acl-test-1
    assert wait_on_element(driver, 15, '//div[contains(text(),"User - ericbsd")]')
    time.sleep(1)


    # Create 3rd dataset {dataset_name_3} under {dataset_name_1}
    assert wait_on_element(driver, 10, '//span[contains(text(),"Add Dataset")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Add Dataset")]').click()
    assert wait_on_element(driver, 10, '//h3[text()="Add Dataset"]')
    assert wait_on_element(driver, 10, '//div[@ix-auto="textarea__Name"]//div//textarea')
    driver.find_element_by_xpath('//div[@ix-auto="textarea__Name"]//div//textarea').click()
    driver.find_element_by_xpath('//div[@ix-auto="textarea__Name"]//div//textarea').send_keys(dataset_name_3)
    assert wait_on_element(driver, 10, '//mat-select[@ix-auto="select__Share Type"]')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Share Type"]').click()
    assert wait_on_element(driver, 10, '//mat-option[@ix-auto="option__Share Type_SMB"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Share Type_SMB"]').click()
    # click Summit the "{dataset_name_2}" data should be created
    assert wait_on_element(driver, 10, '//span[contains(.,"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Save")]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//span[contains(text(),"Return to pool list")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Return to pool list")]').click()
    assert wait_on_element(driver, 10, f'//div//span[contains(text(),"{dataset_name_3}")]')


    # Create SMB share with path {path}
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Shares"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Shares"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(text(),"Sharing")]')
    assert wait_on_element(driver, 10, '//mat-card[contains(.,"SMB")]//button[@ix-auto="button__-add"]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"SMB")]//button[@ix-auto="button__-add"]').click() 


    # The Windows Shares(SMB) page should open, Click Add
    assert wait_on_element(driver, 10, '//h3[contains(.,"Add SMB")]')
    assert wait_on_element(driver, 10, '//ix-explorer//ix-label//label//span[contains(text(),"Path")]//ancestor::ix-explorer/div/input', 'inputable')
    driver.find_element_by_xpath('//ix-explorer//ix-label//label//span[contains(text(),"Path")]//ancestor::ix-explorer/div/input').clear()
    driver.find_element_by_xpath('//ix-explorer//ix-label//label//span[contains(text(),"Path")]//ancestor::ix-explorer/div/input').send_keys(path)
    driver.find_element_by_xpath('//ix-explorer//ix-label//label//span[contains(text(),"Path")]//ancestor::ix-explorer/div/input').send_keys(Keys.TAB)
    assert wait_on_element(driver, 10, '//ix-input//ix-label//label//span[contains(text(),"Name")]//ancestor::ix-input/div/input', 'inputable')
    driver.find_element_by_xpath('//ix-input//ix-label//label//span[contains(text(),"Name")]//ancestor::ix-input/div/input').clear()
    driver.find_element_by_xpath('//ix-input//ix-label//label//span[contains(text(),"Name")]//ancestor::ix-input/div/input').send_keys("rt-test")

    assert wait_on_element(driver, 10, '//mat-card[1]/mat-card-content[1]/form[1]/ix-fieldset[1]/fieldset[1]/ix-checkbox[1]/mat-checkbox[1]/label[1]/span[contains(text(),"Enabled")]//ancestor::ix-checkbox//mat-checkbox', 'clickable')
    checkbox_checked = attribute_value_exist(driver, '//mat-card[1]/mat-card-content[1]/form[1]/ix-fieldset[1]/fieldset[1]/ix-checkbox[1]/mat-checkbox[1]/label[1]/span[contains(text(),"Enabled")]//ancestor::ix-checkbox//mat-checkbox', 'class', 'mat-checkbox-checked')
    if not checkbox_checked:
        driver.find_element_by_xpath('//mat-card[1]/mat-card-content[1]/form[1]/ix-fieldset[1]/fieldset[1]/ix-checkbox[1]/mat-checkbox[1]/label[1]/span[contains(text(),"Enabled")]//ancestor::ix-checkbox//mat-checkbox').click()
    assert attribute_value_exist(driver, '//mat-card[1]/mat-card-content[1]/form[1]/ix-fieldset[1]/fieldset[1]/ix-checkbox[1]/mat-checkbox[1]/label[1]/span[contains(text(),"Enabled")]//ancestor::ix-checkbox//mat-checkbox', 'class', 'mat-checkbox-checked')
    time.sleep(1)
    assert wait_on_element(driver, 10, '//ix-input//ix-label//label//span[contains(text(),"Description")]//ancestor::ix-input/div/input', 'inputable')
    driver.find_element_by_xpath('//ix-input//ix-label//label//span[contains(text(),"Description")]//ancestor::ix-input/div/input').clear()
    driver.find_element_by_xpath('//ix-input//ix-label//label//span[contains(text(),"Description")]//ancestor::ix-input/div/input').send_keys("rt-test")
    assert wait_on_element(driver, 10, '//span[contains(text(),"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save")]').click()

    if is_element_present(driver, '//h3[contains(text(),"Restart SMB Service")]'):
        assert wait_on_element(driver, 10, '//span[contains(text(),"Restart Service")]', 'clickable')
        driver.find_element_by_xpath('//span[contains(text(),"Restart Service")]').click()

    assert wait_on_element_disappear(driver, 30, '//h6[contains(.,"Please wait")]')
    if not is_element_present(driver, '//h1[contains(.,"Sharing")]'):
        assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Shares"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Shares"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Sharing")]')
    assert wait_on_element(driver, 10, f'//div[contains(.,"rt-test")]')


    # Apply ACL to rt-acl-test-1 with recusrive checked
    if not is_element_present(driver, '//h1[contains(.,"Datasets")]'):
        #assert wait_on_element_disappear(driver, 15, '//div[contains(@class,"cdk-overlay-backdrop-showing")]')
        driver.find_element_by_xpath('//a//span[contains(text(),"Datasets")]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Datasets")]')
    assert wait_on_element(driver, 10, f'//span[contains(text(),"rt-acl-test-1")]')
    # now select {dataset_name_1}
    if not is_element_present(driver, f'//ix-nested-tree-node//div[contains(@class,"selected")]//ix-dataset-node//div//div//span[contains(.,"{dataset_name_1}")]'):
        assert wait_on_element(driver, 10, f'//span[(contains(.,"{dataset_name_1}"))]', 'clickable')
        driver.find_element_by_xpath(f'//span[(contains(.,"{dataset_name_1}"))]').click()
    assert wait_on_element( driver, 10, f'//ix-nested-tree-node//div[contains(@class,"selected")]//ix-dataset-node//div//div//span[contains(.,"{dataset_name_1}")]')
    
    # Scroll to permissions
    element = driver.find_element_by_xpath('//h3[contains(text(),"Permissions")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)

    # click on edit
    assert wait_on_element(driver, 10, '//mat-card-header//div//h3[contains(text(),"Permissions")]//ancestor::mat-card-header//a//span[contains(.,"Edit")]', 'clickable')
    driver.find_element_by_xpath('//mat-card-header//div//h3[contains(text(),"Permissions")]//ancestor::mat-card-header//a//span[contains(.,"Edit")]').click()

    assert wait_on_element(driver, 10, '//h1[text()="Edit ACL"]')
    
    assert wait_on_element(driver, 10, '//span[contains(text(),"Add Item")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Add Item")]').click()
    assert wait_on_element(driver, 10, '//mat-select//div//div//span[contains(.,"User")]', 'clickable')
    driver.find_element_by_xpath('//mat-select//div//div//span[contains(.,"User")]').click()
    assert wait_on_element(driver, 10, '//mat-option//span[contains(.,"User")]')
    driver.find_element_by_xpath('//mat-option//span[contains(.,"User")]').click()
    assert wait_on_element(driver, 10, '//ix-combobox//div//ix-label//label//span[contains(.,"User")]//ancestor::ix-combobox//div//div//input[@placeholder="Search"]')
    driver.find_element_by_xpath('//ix-combobox//div//ix-label//label//span[contains(.,"User")]//ancestor::ix-combobox//div//div//input[@placeholder="Search"]').send_keys("gam")
    
    assert wait_on_element(driver, 10, '//mat-option//span[contains(.,"games")]', 'clickable')
    driver.find_element_by_xpath('//mat-option//span[contains(.,"games")]').click()
    
    assert wait_on_element(driver, 10, '//ix-checkbox[@formcontrolname="recursive"]', 'clickable')
    driver.find_element_by_xpath('//ix-checkbox[@formcontrolname="recursive"]').click()
    assert wait_on_element(driver, 15, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 10, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()    
    assert wait_on_element(driver, 10, '//span[contains(text(),"Save Access Control List")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save Access Control List")]').click()
    
    assert wait_on_element_disappear(driver, 30, '//h6[contains(.,"Updating Dataset ACL")]')
    assert wait_on_element_disappear(driver, 15, '//mat-spinner[@role="progressbar"]')

    # refresh page to prevent dom failures
    if is_element_present(driver, '//div[contains(@class,"cdk-overlay-backdrop-showing")]'):
        assert wait_on_element_disappear(driver, 10, '//div[contains(@class,"cdk-overlay-backdrop-showing")]')
    assert wait_on_element(driver, 10, '//span[contains(text(),"Storage")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Storage")]').click()
    assert wait_on_element(driver, 10, '//a//span[contains(text(),"Datasets")]', 'clickable')
    driver.find_element_by_xpath('//a//span[contains(text(),"Datasets")]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Datasets")]')
    # click on the tank
    if not is_element_present(driver, '//div[((contains(@class,"selected")) and (contains(.,"tank")) and not(contains(.,"encrypted_tank")))]'):
        assert wait_on_element(driver, 10, '//span[(contains(.,"tank")) and not(contains(.,"encrypted_tank"))]', 'clickable')
        driver.find_element_by_xpath('//span[(contains(.,"tank")) and not(contains(.,"encrypted_tank"))]').click()
    assert wait_on_element( driver, 10, '//div[((contains(@class,"selected")) and (contains(.,"tank")) and not(contains(.,"encrypted_tank")))]') 

    # Verify that the ACL was set to rt-acl-test-1
    if not is_element_present(driver, f'//ix-nested-tree-node//div[contains(@class,"selected")]//ix-dataset-node//div//div//span[contains(.,"{dataset_name_1}")]'):
        assert wait_on_element(driver, 20, f'//span[(contains(.,"{dataset_name_1}"))]', 'clickable')
        driver.find_element_by_xpath(f'//span[(contains(.,"{dataset_name_1}"))]').click()
    assert wait_on_element( driver, 10, f'//ix-nested-tree-node//div[contains(@class,"selected")]//ix-dataset-node//div//div//span[contains(.,"{dataset_name_1}")]')
    assert wait_on_element(driver, 15, '//div[contains(text(),"User - games")]')
    time.sleep(1)

    # Verify that the ACL was not set to rt-acl-test-3
    if not is_element_present(driver, f'//ix-tree-node[contains(@class,"selected")]//ix-dataset-node//div//div//span[contains(.,"{dataset_name_3}")]'):
        assert wait_on_element(driver, 10, f'//span[(contains(.,"{dataset_name_3}"))]', 'clickable')
        driver.find_element_by_xpath(f'//span[(contains(.,"{dataset_name_3}"))]').click()
    assert wait_on_element( driver, 10, f'//ix-tree-node[contains(@class,"selected")]//ix-dataset-node//div//div//span[contains(.,"{dataset_name_3}")]')    
    assert wait_on_element(driver, 15, '//div[contains(text(),"User - games")]') is False
    time.sleep(1) 
    
    # Verify that the ACL was not set to rt-acl-test-2
    if not is_element_present(driver, f'//ix-tree-node[contains(@class,"selected")]//ix-dataset-node//div//div//span[contains(.,"{dataset_name_2}")]'):
        assert wait_on_element(driver, 10, f'//span[(contains(.,"{dataset_name_2}"))]', 'clickable')
        driver.find_element_by_xpath(f'//span[(contains(.,"{dataset_name_2}"))]').click()
    assert wait_on_element( driver, 10, f'//ix-tree-node[contains(@class,"selected")]//ix-dataset-node//div//div//span[contains(.,"{dataset_name_2}")]')    
    assert wait_on_element(driver, 15, '//div[contains(text(),"User - games")]') is False
    time.sleep(1)  


    
    # Verify the SMB Share Filesystem has the ACL that was applied to rt-acl-test-1
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Shares"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Shares"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(text(),"Sharing")]')
    assert wait_on_element(driver, 10, f'//div[contains(.,"rt-test")]')
    assert wait_on_element(driver, 10, '//tr//td//div[contains(.,"rt-test")]//ancestor::tr//div//button//span//mat-icon[contains(.,"security")]', 'clickable')
    driver.find_element_by_xpath('//tr//td//div[contains(.,"rt-test")]//ancestor::tr//div//button//span//mat-icon[contains(.,"security")]').click()
    assert wait_on_element(driver, 10, '//h1[text()="Edit ACL"]')
    assert wait_on_element(driver, 10, '//div[contains(text(),"User - games")]')

