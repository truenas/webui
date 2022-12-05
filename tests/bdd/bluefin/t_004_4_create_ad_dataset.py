# coding=utf-8
"""SCALE UI feature tests."""
import time

from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear
)


def test_create_ad_dataset(driver, dataset_name, group_name):
    """test_create_ad_dataset"""

    if not is_element_present(driver, '//h1[contains(.,"Storage")]'):
        assert wait_on_element_disappear(driver, 15, '//div[contains(@class,"cdk-overlay-backdrop-showing")]')
        assert wait_on_element(driver, 10, '//span[contains(text(),"Storage")]', 'clickable')
        driver.find_element_by_xpath('//span[contains(text(),"Storage")]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage Dashboard")]')

    # This will wait for the spinner to go away and looks like this xpath work for all spinners.
    assert wait_on_element_disappear(driver, 15, '//mat-spinner[@role="progressbar"]')

    assert wait_on_element(driver, 5, '//ix-dashboard-pool[contains(.,"tank")]//a[contains(.,"Manage Datasets")]', 'clickable')
    driver.find_element_by_xpath('//ix-dashboard-pool[contains(.,"tank")]//a[contains(.,"Manage Datasets")]').click()

    assert wait_on_element(driver, 7, '//h1[text()="Datasets"]')

    assert wait_on_element(driver, 7, '//ix-dataset-node[contains(.,"tank")]/div', 'clickable')
    driver.find_element_by_xpath('//ix-dataset-node[contains(.,"tank")]/div').click()

    assert wait_on_element(driver, 7, '//span[text()="tank" and contains(@class,"own-name")]')

    assert wait_on_element(driver, 4, '//span[contains(text(),"Add Dataset")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Add Dataset")]').click()

    # on the Add Dataset page, input the dataset name "{dataset_name}"
    assert wait_on_element(driver, 5, '//h3[text()="Add Dataset"]')
    assert wait_on_element(driver, 10, '//div[@ix-auto="textarea__Name"]//div//textarea')
    driver.find_element_by_xpath('//div[@ix-auto="textarea__Name"]//div//textarea').click()
    driver.find_element_by_xpath('//div[@ix-auto="textarea__Name"]//div//textarea').send_keys(dataset_name)
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Share Type"]')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Share Type"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Share Type_SMB"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Share Type_SMB"]').click()

    # click Summit the "{dataset_name}" data should be created
    assert wait_on_element(driver, 5, '//span[contains(.,"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Save")]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element_disappear(driver, 15, '//mat-spinner[@role="progressbar"]')
    assert wait_on_element(driver, 10, f'//span[contains(text(),"{dataset_name}")]')

    assert wait_on_element(driver, 7, '//ix-dataset-node[contains(.,"tank")]/div', 'clickable')
    driver.find_element_by_xpath('//ix-dataset-node[contains(.,"tank")]/div').click()

    assert wait_on_element(driver, 7, '//span[text()="tank" and contains(@class,"own-name")]')

    # click on the "{dataset_name}" 3 dots button, select Edit Permissions
    assert wait_on_element(driver, 7, f'//ix-tree-node[contains(.,"{dataset_name}")]', 'clickable')
    driver.find_element_by_xpath(f'//ix-tree-node[contains(.,"{dataset_name}")]').click()
    assert wait_on_element(driver, 7, f'//span[text()="{dataset_name}" and contains(@class,"own-name")]')

    # Scroll to permissions
    element = driver.find_element_by_xpath('//h3[contains(text(),"Permissions")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)

    # click on edit
    assert wait_on_element(driver, 5, '//mat-card-header[contains(.,"Permissions")]//a[contains(.,"Edit")]', 'clickable')
    driver.find_element_by_xpath('//mat-card-header[contains(.,"Permissions")]//a[contains(.,"Edit")]').click()

    # The Edit ACL page should open, select OPEN for Default ACL Option, select "{group_name}" for Group name, check the Apply Group
    assert wait_on_element(driver, 5, '//h1[text()="Edit ACL"]')
    assert wait_on_element(driver, 5, '//div[contains(.,"Owner Group:") and @class="control"]//input', 'inputable')
    driver.find_element_by_xpath('//div[contains(.,"Owner Group:") and @class="control"]//input').click()
    driver.find_element_by_xpath('//div[contains(.,"Owner Group:") and @class="control"]//input').clear()
    driver.find_element_by_xpath('//div[contains(.,"Owner Group:") and @class="control"]//input').send_keys(group_name)
    assert wait_on_element(driver, 5, f'//mat-option[contains(.,"{group_name}")]', 'clickable')
    driver.find_element_by_xpath(f'//mat-option[contains(.,"{group_name}")]').click()
    assert wait_on_element(driver, 5, '//mat-checkbox[contains(.,"Apply Group")]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[contains(.,"Apply Group")]').click()
    time.sleep(1)

    assert wait_on_element(driver, 7, '//span[contains(text(),"Who")]//ancestor::ix-select//div//mat-select')
    driver.find_element_by_xpath('//span[contains(text(),"Who")]//ancestor::ix-select//div//mat-select').click()
    driver.find_element_by_xpath('//mat-option[2]/span[contains(text(),"Group")]').click()

    assert wait_on_element(driver, 7, '//ix-fieldset[1]/fieldset[1]/ix-combobox[1]/div[1]/div[1]/input', 'inputable')
    driver.find_element_by_xpath('//ix-fieldset[1]/fieldset[1]/ix-combobox[1]/div[1]/div[1]/input').clear()
    driver.find_element_by_xpath('//ix-fieldset[1]/fieldset[1]/ix-combobox[1]/div[1]/div[1]/input').send_keys(group_name)

    assert wait_on_element(driver, 7, '//span[contains(text(),"Full Control")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Full Control")]').click()
    assert wait_on_element(driver, 7, '//mat-option[4]//span[contains(text(),"Full Control")]', 'clickable')
    time.sleep(0.5)
    driver.find_element_by_xpath('//mat-option[4]//span[contains(text(),"Full Control")]').click()

    # click the Save button, which should be returned to the storage page, on the Edit ACL page, verify that the group name is "{group_name}"
    assert wait_on_element(driver, 7, '//span[contains(text(),"Save Access Control List")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save Access Control List")]').click()
    assert wait_on_element_disappear(driver, 30, '//h6[contains(.,"Please wait")]')
    assert wait_on_element_disappear(driver, 110, '//mat-spinner[@role="progressbar"]')

    assert wait_on_element(driver, 7, '//ix-dataset-node[contains(.,"tank")]/div', 'clickable')
    driver.find_element_by_xpath('//ix-dataset-node[contains(.,"tank")]/div').click()
    assert wait_on_element(driver, 7, '//span[text()="tank" and contains(@class,"own-name")]')

    assert wait_on_element(driver, 10, f'//span[contains(text(),"{dataset_name}")]')

    assert wait_on_element(driver, 7, f'//ix-tree-node[contains(.,"{dataset_name}")]', 'clickable')
    driver.find_element_by_xpath(f'//ix-tree-node[contains(.,"{dataset_name}")]').click()
    assert wait_on_element(driver, 7, f'//span[text()="{dataset_name}" and contains(@class,"own-name")]')

    assert wait_on_element(driver, 10, f'//div[text()="Group - {group_name}"]')
