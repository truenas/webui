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
    if not is_element_present(driver, '//h1[contains(.,"Storage")]'):
        assert wait_on_element(driver, 10, '//span[contains(text(),"Storage (Deprecated)")]', 'clickable')
        driver.find_element_by_xpath('//span[contains(text(),"Storage (Deprecated)")]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage")]')

    assert wait_on_element(driver, 5, '//tr[contains(.,"tank")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"tank")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 4, '//button[normalize-space(text())="Add Dataset"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="Add Dataset"]').click()


    # the add datasetpage should open, input "{dataset_name}" for the naem and click save'
    assert wait_on_element(driver, 5, '//h3[text()="Add Dataset"]')
    assert wait_on_element(driver, 10, '//div[@ix-auto="textarea__Name"]//div//textarea')
    driver.find_element_by_xpath('//div[@ix-auto="textarea__Name"]//div//textarea').click()
    driver.find_element_by_xpath('//div[@ix-auto="textarea__Name"]//div//textarea').send_keys(dataset_name)
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Share Type"]')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Share Type"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Share Type_SMB"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Share Type_SMB"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')

    # the "{dataset_name}" data should be created
    assert wait_on_element(driver, 10, '//h1[text()="Storage"]')
    assert wait_on_element_disappear(driver, 15, '//mat-spinner[@role="progressbar"]')
    assert wait_on_element(driver, 10, f'//div[contains(text(),"{dataset_name}")]')


    # click on the "{dataset_name}" 3 dots button, select Edit Permissions
    assert wait_on_element(driver, 5, f'//tr[contains(.,"{dataset_name}")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath(f'//tr[contains(.,"{dataset_name}")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 5, '//button[normalize-space(text())="View Permissions"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="View Permissions"]').click()
    assert wait_on_element(driver, 5, '//mat-icon[normalize-space(text())="edit"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[normalize-space(text())="edit"]').click()



    # the Edit Permissions page should open, select "{user}" for User, click on the Apply User checkbox, select {group} for Group name, click on the Apply Group checkbox, click on Group Write Access, and click the Save button
    assert wait_on_element(driver, 5, '//h1[text()="Edit ACL"]')
    assert wait_on_element(driver, 5, '//button//span[contains(text(),"Add Item")]', 'clickable')
    driver.find_element_by_xpath('//button//span[contains(text(),"Add Item")]').click() 

    assert wait_on_element(driver, 5, '//mat-card-header//div//div//label[contains(text(),"Owner:")]//ancestor::mat-card-header//div//div[1]/ix-combobox//div//div//input', 'inputable')
    driver.find_element_by_xpath('//mat-card-header//div//div//label[contains(text(),"Owner:")]//ancestor::mat-card-header//div//div[1]/ix-combobox//div//div//input').clear()
    driver.find_element_by_xpath('//mat-card-header//div//div//label[contains(text(),"Owner:")]//ancestor::mat-card-header//div//div[1]/ix-combobox//div//div//input').send_keys(user)
    driver.find_element_by_xpath('//mat-card-header//div//div//label[contains(text(),"Owner:")]//ancestor::mat-card-header//div//div[1]/ix-combobox//div//div//input').send_keys(Keys.TAB)

    assert wait_on_element(driver, 5, '//mat-card-header//div//div//label[contains(text(),"Owner:")]//ancestor::mat-card-header//div//div[2]/ix-combobox//div//div//input', 'inputable')
    driver.find_element_by_xpath('//mat-card-header//div//div//label[contains(text(),"Owner:")]//ancestor::mat-card-header//div//div[2]/ix-combobox//div//div//input').clear()
    driver.find_element_by_xpath('//mat-card-header//div//div//label[contains(text(),"Owner:")]//ancestor::mat-card-header//div//div[2]/ix-combobox//div//div//input').send_keys(user)
    driver.find_element_by_xpath('//mat-card-header//div//div//label[contains(text(),"Owner:")]//ancestor::mat-card-header//div//div[2]/ix-combobox//div//div//input').send_keys(Keys.TAB)

    # Check the checkboxes
    assert wait_on_element(driver, 5, '//mat-card-header/div//div//ix-checkbox//mat-checkbox//label[1]/span[contains(text(),"Apply Owner")]//ancestor::ix-checkbox//mat-checkbox', 'clickable')
    driver.find_element_by_xpath('//mat-card-header/div//div//ix-checkbox//mat-checkbox//label[1]/span[contains(text(),"Apply Owner")]//ancestor::ix-checkbox//mat-checkbox').click()
    assert wait_on_element(driver, 5, '//mat-card-header/div//div//ix-checkbox//mat-checkbox//label[1]/span[contains(text(),"Apply Group")]//ancestor::ix-checkbox//mat-checkbox', 'clickable')
    driver.find_element_by_xpath('//mat-card-header/div//div//ix-checkbox//mat-checkbox//label[1]/span[contains(text(),"Apply Group")]//ancestor::ix-checkbox//mat-checkbox').click()

    assert wait_on_element(driver, 7, '//span[contains(text(),"Who")]//ancestor::ix-select//div//mat-select')
    driver.find_element_by_xpath('//span[contains(text(),"Who")]//ancestor::ix-select//div//mat-select').click()
    driver.find_element_by_xpath('//mat-option[2]/span[contains(text(),"Group")]').click()

    assert wait_on_element(driver, 7, '//ix-fieldset[1]/fieldset[1]/ix-combobox[1]/div[1]/div[1]/input', 'inputable')
    driver.find_element_by_xpath('//ix-fieldset[1]/fieldset[1]/ix-combobox[1]/div[1]/div[1]/input').clear()
    driver.find_element_by_xpath('//ix-fieldset[1]/fieldset[1]/ix-combobox[1]/div[1]/div[1]/input').send_keys(user)
    driver.find_element_by_xpath('//ix-fieldset[1]/fieldset[1]/ix-combobox[1]/div[1]/div[1]/input').send_keys(Keys.TAB)

    assert wait_on_element(driver, 7, '//span[contains(text(),"Modify")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Modify")]').click()
    assert wait_on_element(driver, 7, '//mat-option[4]//span[contains(text(),"Full Control")]', 'clickable')
    time.sleep(0.5)
    driver.find_element_by_xpath('//mat-option[4]//span[contains(text(),"Full Control")]').click()

    # click the Save button, which should be returned to the storage page, on the Edit ACL page, verify that the group name is "{group_name}"
    assert wait_on_element(driver, 7, '//span[contains(text(),"Save Access Control List")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save Access Control List")]').click()
    assert wait_on_element_disappear(driver, 30, '//h6[contains(.,"Please wait")]')
    assert wait_on_element_disappear(driver, 15, '//mat-spinner[@role="progressbar"]')

    # you should be returned to the pool list page, click on the ericbsd_dataset three dots button, view and edit Permissions, and the Edit Permissions page should open
    assert wait_on_element(driver, 10, '//h1[text()="Storage"]')
    assert wait_on_element(driver, 10, '//mat-panel-title[contains(text(),"tank")]')
    assert wait_on_element(driver, 10, f'//div[contains(text(),"{dataset_name}")]')
    assert wait_on_element(driver, 5, '//tr[contains(.,"ericbsd_dataset")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd_dataset")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 5, '//button[normalize-space(text())="View Permissions"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="View Permissions"]').click()


    # verify that the user and group is ericbsd
    assert wait_on_element(driver, 5, '//div[contains(text(),"owner@ - ericbsd")]')
    assert wait_on_element(driver, 5, '//div[contains(text(),"group@ - ericbsd")]')