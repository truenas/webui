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




def test_add_acl_item_on_tank(driver, input, user):
    """test_add_acl_item_on_tank"""
    if not is_element_present(driver, '//h1[contains(.,"Storage")]'):
        assert wait_on_element(driver, 10, '//span[contains(text(),"Storage")]', 'clickable')
        driver.find_element_by_xpath('//span[contains(text(),"Storage")]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage Dashboard")]')


   # click Storage on the side menu and click on the "tank_acl_dataset" 3 dots button, select Edit Permissions
    assert wait_on_element(driver, 5, '//ix-dashboard-pool//div//div//h2[contains(.,"tank")]//ancestor::ix-dashboard-pool//div//div//ix-pool-usage-card//mat-card//mat-card-header//a[contains(.,"Manage Datasets")]', 'clickable')
    driver.find_element_by_xpath('//ix-dashboard-pool//div//div//h2[contains(.,"tank")]//ancestor::ix-dashboard-pool//div//div//ix-pool-usage-card//mat-card//mat-card-header//a[contains(.,"Manage Datasets")]').click()
    
    if not is_element_present(driver, '//ix-tree-node[contains(@class,"selected")]//ix-dataset-node//div//div//span[contains(.,"tank_acl_dataset")]'):
        assert wait_on_element(driver, 7, '//ix-tree-node//ix-dataset-node//div//div//span[contains(.,"tank_acl_dataset")]', 'clickable')
        driver.find_element_by_xpath('//ix-tree-node//ix-dataset-node//div//div//span[contains(.,"tank_acl_dataset")]').click()
    assert wait_on_element( driver, 7, '//ix-tree-node[contains(@class,"selected")]//ix-dataset-node//div//div//span[contains(.,"tank_acl_dataset")]') 

    assert wait_on_element(driver, 5, '//mat-card-header//div//h3[contains(text(),"Permissions")]//ancestor::mat-card-header//a//span[contains(.,"Edit")]', 'clickable')
    driver.find_element_by_xpath('//mat-card-header//div//h3[contains(text(),"Permissions")]//ancestor::mat-card-header//a//span[contains(.,"Edit")]').click()

    # the Edit ACL page should open
    assert wait_on_element(driver, 10, '//mat-card-title[contains(text(),"ACL Editor")]')

    # click on Add ACL Item, click on select User, User input should appear, enter "{input}" and select "{user}"
    assert wait_on_element(driver, 5, '//span[contains(text(),"Add Item")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Add Item")]').click()
    
    assert wait_on_element(driver, 7, '//ix-fieldset[1]/fieldset[1]/ix-combobox[1]/div[1]/div[1]/input', 'inputable')
    driver.find_element_by_xpath('//ix-fieldset[1]/fieldset[1]/ix-combobox[1]/div[1]/div[1]/input').clear()
    driver.find_element_by_xpath('//ix-fieldset[1]/fieldset[1]/ix-combobox[1]/div[1]/div[1]/input').send_keys(user)
    time.sleep(0.5)
    #element = driver.find_element_by_xpath('//mat-option//span[contains(text(),"ericbsd")]')
    # Scroll to ericbsd
    #driver.execute_script("arguments[0].scrollIntoView();", element)
    #time.sleep(0.5)
    assert wait_on_element(driver, 7, '//mat-option//span[contains(text(),"ericbsd")]', 'clickable')
    driver.find_element_by_xpath('//mat-option//span[contains(text(),"ericbsd")]').click()
    time.sleep(0.5)

    assert wait_on_element(driver, 7, '//span[contains(text(),"Modify")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Modify")]').click()
    assert wait_on_element(driver, 7, '//mat-option[4]//span[contains(text(),"Full Control")]', 'clickable')
    time.sleep(0.5)
    driver.find_element_by_xpath('//mat-option[4]//span[contains(text(),"Full Control")]').click()


    # click the Save button, return to the Pools page, click on the "tank_acl_dataset" 3 dots button, select Edit Permissions
    assert wait_on_element(driver, 10, '//span[contains(text(),"Save Access Control List")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save Access Control List")]').click()
    assert wait_on_element_disappear(driver, 15, '//h1[contains(text(),"Updating Dataset ACL")]')
    assert wait_on_element(driver, 10, f'//span[contains(text(),"tank_acl_dataset")]')
    time.sleep(1)


    if not is_element_present(driver, '//ix-tree-node[contains(@class,"selected")]//ix-dataset-node//div//div//span[contains(.,"tank_acl_dataset")]'):
        assert wait_on_element(driver, 7, '//ix-tree-node//ix-dataset-node//div//div//span[contains(.,"tank_acl_dataset")]', 'clickable')
        driver.find_element_by_xpath('//ix-tree-node//ix-dataset-node//div//div//span[contains(.,"tank_acl_dataset")]').click()
    assert wait_on_element( driver, 7, '//ix-tree-node[contains(@class,"selected")]//ix-dataset-node//div//div//span[contains(.,"tank_acl_dataset")]') 

    #verify the new ACL item for user ericbsd exists
    assert wait_on_element(driver, 7, '//div[contains(text(),"User - ericbsd")]')
    time.sleep(1)