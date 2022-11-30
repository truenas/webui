# coding=utf-8
"""SCALE UI feature tests."""
import time
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    ssh_cmd
)


def test_setup_ad(driver, nas_ip, root_password, ad_ns, ad_domain, ad_user, ad_password, ca_ou, cmd1, ad_object1, cmd2, dataset_name, group_name):
    """test_wipe_one_disk"""

    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Network"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Network"]').click()

    # on the network page, click on setting on the Global Configuration card.')
    time.sleep(1)
    assert wait_on_element(driver, 10, '//h1[contains(.,"Network")]')
    assert wait_on_element(driver, 10, '//h3[contains(text(),"Global Configuration")]//following-sibling::button//span[contains(.,"Settings")]')
    driver.find_element_by_xpath('//h3[contains(text(),"Global Configuration")]//following-sibling::button//span[contains(.,"Settings")]').click()

    # on the Network Global Configuration page, change the first nameserver to "{nameserver1}"
    # assert wait_on_element(driver, 110, '//h4[contains(.,"Hostname and Domain")]')
    # assert wait_on_element(driver, 10, '//input[@ix-auto="input__Nameserver 1"]', 'inputable')
    # driver.find_element_by_xpath('//input[@ix-auto="input__Nameserver 1"]').clear()
    # driver.find_element_by_xpath('//input[@ix-auto="input__Nameserver 1"]').send_keys(ad_ns)

    # change the Domain for "{ad_domain}", and click Save.
    time.sleep(2)
    global domain
    domain = ad_domain
    assert wait_on_element(driver, 10, '//ix-input//ix-label//label//span[contains(text(),"Domain")]//ancestor::ix-input/div/input')
    driver.find_element_by_xpath('//ix-input//ix-label//label//span[contains(text(),"Domain")]//ancestor::ix-input/div/input').clear()
    driver.find_element_by_xpath('//ix-input//ix-label//label//span[contains(text(),"Domain")]//ancestor::ix-input/div/input').send_keys(ad_domain)
    assert wait_on_element(driver, 10, '//span[contains(.,"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Save")]').click()

    # Please wait should appear while settings are being applied.
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    time.sleep(2)
    assert wait_on_element(driver, 110, f'//li[contains(.,"{domain}")]')

    # after, click on Credentials on the left sidebar, then Directory Services.
    time.sleep(2)
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
    assert wait_on_element(driver, 10, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Directory Services"]', 'clickable')
    driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Directory Services"]').click()

    # on the Directory Services page, click Setting on the Active Directory card.
    time.sleep(2)
    assert wait_on_element(driver, 10, '//h1[contains(.,"Directory Services")]')
    assert wait_on_element(driver, 10, '//span[contains(text(),"Configure Active Directory")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Configure Active Directory")]').click()

    # on the Active Directory page, input the Domain name "{ad_domain}"
    time.sleep(2)
    global addomain
    addomain = ad_domain
    assert wait_on_element(driver, 10, '//ix-modal-header//div//h3[contains(.,"Active Directory")]')
    assert wait_on_element(driver, 10, '//ix-input//ix-label//label//span[contains(text(),"Domain Name")]//ancestor::ix-input/div/input', 'inputable')
    driver.find_element_by_xpath('//ix-input//ix-label//label//span[contains(text(),"Domain Name")]//ancestor::ix-input/div/input').clear()
    driver.find_element_by_xpath('//ix-input//ix-label//label//span[contains(text(),"Domain Name")]//ancestor::ix-input/div/input').send_keys(ad_domain)

    # input the Account name "{ad_user}", the Password "{ad_password}"
    driver.find_element_by_xpath('//ix-input//ix-label//label//span[contains(text(),"Domain Account Name")]//ancestor::ix-input/div/input').clear()
    driver.find_element_by_xpath('//ix-input//ix-label//label//span[contains(text(),"Domain Account Name")]//ancestor::ix-input/div/input').send_keys(ad_user)
    driver.find_element_by_xpath('//ix-input//ix-label//label//span[contains(text(),"Domain Account Password")]//ancestor::ix-input/div/input').clear()
    driver.find_element_by_xpath('//ix-input//ix-label//label//span[contains(text(),"Domain Account Password")]//ancestor::ix-input/div/input').send_keys(ad_password)

    # click advanced, and input the Computer Account OU "{ca_ou}"
    if is_element_present(driver, '//span[contains(.,"Advanced Options")]'):
        driver.find_element_by_xpath('//span[contains(.,"Advanced Options")]').click()
    assert wait_on_element(driver, 10, '//ix-input//ix-label//label//span[contains(text(),"Computer Account OU")]', 'inputable')
    driver.find_element_by_xpath('//ix-input//ix-label//label//span[contains(text(),"Computer Account OU")]//ancestor::ix-input//div//input').clear()
    driver.find_element_by_xpath('//ix-input//ix-label//label//span[contains(text(),"Computer Account OU")]//ancestor::ix-input//div//input').send_keys(ca_ou)

    # check the Enable box and click SAVE.
    driver.find_element_by_xpath('//ix-fieldset//fieldset//ix-checkbox/mat-checkbox[1]/label[1]//following-sibling::span[contains(.,"Enable")]').click()
    assert wait_on_element(driver, 110, '//span[contains(.,"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Save")]').click()

    # the Active Directory setup should successfully save without an error.
    assert wait_on_element_disappear(driver, 30, '//h6[contains(.,"Please wait")]')
    assert wait_on_element_disappear(driver, 30, '//h1[text()="Start"]')
    time.sleep(1)  # page needs to settle
    assert wait_on_element(driver, 30, f'//span[text()="{domain.upper()}"]')

    # run "{cmd1}" and verify that "{ad_object1}" is in output
    global ad_ssh_result_1
    ad_ssh_result_1 = ssh_cmd(cmd1, 'root', root_password, nas_ip)
    assert ad_ssh_result_1['result'], ad_ssh_result_1['output']
    assert ad_object1 in ad_ssh_result_1['output'], ad_ssh_result_1['output']

    # Run "{cmd2}"
    global ad_ssh_result_2
    ad_ssh_result_2 = ssh_cmd(cmd2, 'root', root_password, nas_ip)
    assert ad_ssh_result_2['result'], ad_ssh_result_2['output']
    assert "succeeded" in ad_ssh_result_2['output'], ad_ssh_result_2['output']

    # after open the Storage page and click on the system 3 dots button, select Add Dataset.
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Datasets"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Datasets"]').click()

    assert wait_on_element(driver, 7, '//h1[text()="Datasets"]')

    assert wait_on_element(driver, 7, '//ix-dataset-node[contains(.,"system")]/div', 'clickable')
    driver.find_element_by_xpath('//ix-dataset-node[contains(.,"system")]/div').click()

    assert wait_on_element(driver, 7, '//span[text()="system" and contains(@class,"own-name")]')

    assert wait_on_element(driver, 4, '//span[contains(text(),"Add Dataset")]', 'clickable')
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

    assert wait_on_element(driver, 7, '//ix-dataset-node[contains(.,"system")]/div', 'clickable')
    driver.find_element_by_xpath('//ix-dataset-node[contains(.,"system")]/div').click()
    assert wait_on_element(driver, 7, '//span[text()="system" and contains(@class,"own-name")]')

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
    assert wait_on_element(driver, 10, '//h1[text()="Edit ACL"]')
    assert wait_on_element(driver, 10, '//div[contains(.,"Owner Group:") and @class="control"]//input', 'inputable')
    driver.find_element_by_xpath('//div[contains(.,"Owner Group:") and @class="control"]//input').click()
    driver.find_element_by_xpath('//div[contains(.,"Owner Group:") and @class="control"]//input').clear()
    driver.find_element_by_xpath('//div[contains(.,"Owner Group:") and @class="control"]//input').send_keys(group_name)
    assert wait_on_element(driver, 5, f'//mat-option[contains(.,"{group_name}")]', 'clickable')
    driver.find_element_by_xpath(f'//mat-option[contains(.,"{group_name}")]').click()
    assert wait_on_element(driver, 5, '//mat-checkbox[contains(.,"Apply Group")]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[contains(.,"Apply Group")]').click()
    time.sleep(1)  # button is detected clickable before before it can actually be cleanly clicked resulting in failure
    assert wait_on_element(driver, 10, '//span[contains(text(),"Save Access Control List")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save Access Control List")]').click()
    assert wait_on_element_disappear(driver, 110, '//mat-spinner[@role="progressbar"]')
    assert wait_on_element(driver, 10, f'//span[contains(text(),"{dataset_name}")]')

    assert wait_on_element(driver, 7, '//ix-dataset-node[contains(.,"system")]/div', 'clickable')
    driver.find_element_by_xpath('//ix-dataset-node[contains(.,"system")]/div').click()
    assert wait_on_element(driver, 7, '//span[text()="system" and contains(@class,"own-name")]')

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

    assert wait_on_element(driver, 110, '//span[contains(text(),"Who")]//ancestor::ix-select//div//mat-select')
    driver.find_element_by_xpath('//span[contains(text(),"Who")]//ancestor::ix-select//div//mat-select').click()
    driver.find_element_by_xpath('//mat-option[2]/span[contains(text(),"Group")]').click()

    assert wait_on_element(driver, 110, '//ix-fieldset[1]/fieldset[1]/ix-combobox[1]/div[1]/div[1]/input', 'inputable')
    driver.find_element_by_xpath('//ix-fieldset[1]/fieldset[1]/ix-combobox[1]/div[1]/div[1]/input').clear()
    driver.find_element_by_xpath('//ix-fieldset[1]/fieldset[1]/ix-combobox[1]/div[1]/div[1]/input').send_keys(group_name)

    assert wait_on_element(driver, 110, '//span[contains(text(),"Full Control")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Full Control")]').click()
    assert wait_on_element(driver, 110, '//mat-option[4]//span[contains(text(),"Full Control")]', 'clickable')
    time.sleep(0.5)
    driver.find_element_by_xpath('//mat-option[4]//span[contains(text(),"Full Control")]').click()

    # click the Save button, which should be returned to the storage page, on the Edit ACL page, verify that the group name is "{group_name}"
    assert wait_on_element(driver, 110, '//span[contains(text(),"Save Access Control List")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save Access Control List")]').click()
    assert wait_on_element_disappear(driver, 30, '//h6[contains(.,"Please wait")]')
    assert wait_on_element_disappear(driver, 110, '//mat-spinner[@role="progressbar"]')

    assert wait_on_element(driver, 110, f'//div[text()="Group - {group_name}"]')
