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




def test_setup_ad(driver):
    """test_wipe_one_disk"""
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Network"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Network"]').click()


    # on the network page, click on setting on the Global Configuration card.')
    time.sleep(2)
    assert wait_on_element(driver, 7, '//h1[contains(.,"Network")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__globalSettings"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__globalSettings"]').click()


    # on the Network Global Configuration page, change the first nameserver to "{nameserver1}"
    time.sleep(2)
    assert wait_on_element(driver, 7, '//h4[contains(.,"Hostname and Domain")]')
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Nameserver 1"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Nameserver 1"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Nameserver 1"]').send_keys(nameserver1)


    # change the Domain for "{ad_domain}", and click Save.
    time.sleep(2)
    global domain
    domain = ad_domain
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Domain"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain"]').send_keys(ad_domain)
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


    # Please wait should appear while settings are being applied.
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    time.sleep(2)
    assert wait_on_element(driver, 7, f'//li[contains(.,"{domain}")]')


    # after, click on Credentials on the left sidebar, then Directory Services.
    time.sleep(2)
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
    assert wait_on_element(driver, 7, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Directory Services"]', 'clickable')
    driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Directory Services"]').click()


    # on the Directory Services page, click Setting on the Active Directory card.
    time.sleep(2)
    assert wait_on_element(driver, 7, '//h1[contains(.,"Directory Services")]')
    assert wait_on_element(driver, 7, '//span[contains(text(),"Configure Active Directory")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Configure Active Directory")]').click()


    # on the Active Directory page, input the Domain name "{ad_domain}"
    time.sleep(2)
    global domain
    domain = ad_domain
    assert wait_on_element(driver, 5, '//h3[@class="formtitle" and text()="Active Directory"]')
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Domain Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain Name"]').send_keys(ad_domain)


    # input the Account name "{ad_user}", the Password "{ad_password}"
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain Account Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain Account Name"]').send_keys(ad_user)
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain Account Password"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Domain Account Password"]').send_keys(ad_password)


    # click advanced, and input the Computer Account OU "{ca_ou}"
    if is_element_present(driver, '//button[@ix-auto="button__ADVANCED OPTIONS"]'):
        driver.find_element_by_xpath('//button[@ix-auto="button__ADVANCED OPTIONS"]').click()
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Computer Account OU"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Computer Account OU"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Computer Account OU"]').send_keys(ca_ou)


    # check the Enable box and click SAVE.
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Enable (requires password or Kerberos principal)"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


    # the Active Directory setup should successfully save without an error.
    assert wait_on_element_disappear(driver, 30, '//h6[contains(.,"Please wait")]')
    assert wait_on_element_disappear(driver, 30, '//h1[text()="Start"]')
    assert wait_on_element(driver, 7, f'//span[text()="{domain.upper()}"]')


    # run "{cmd1}" and verify that "{ad_object1}" is in output
    global ssh_result
    ssh_result = ssh_cmd(cmd1, 'root', root_password, nas_ip)
    assert ssh_result['result'], ssh_result['output']
    assert ad_object1 in ssh_result['output'], ssh_result['output']


    # Run "{cmd3}"
    global ssh_result
    ssh_result = ssh_cmd(cmd3, 'root', root_password, nas_ip)
    assert ssh_result['result'], ssh_result['output']
    assert "succeeded" in ssh_result['output'], ssh_result['output']


    # after open the Storage page and click on the system 3 dots button, select Add Dataset.
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 7, '//h1[text()="Storage"]')
    # This will wait for the spinner to go away and looks like this xpath work for all spinners.
    assert wait_on_element_disappear(driver, 15, '//mat-spinner[@role="progressbar"]')
    assert wait_on_element(driver, 5, '//tr[contains(.,"system")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"system")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 4, '//button[normalize-space(text())="Add Dataset"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="Add Dataset"]').click()


    # on the Add Dataset page, input the dataset name "{dataset_name}"
    assert wait_on_element(driver, 5, '//h3[text()="Add Dataset"]')
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys(dataset_name)
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Share Type"]')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Share Type"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Share Type_SMB"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Share Type_SMB"]').click()


    # click Summit the "{dataset_name}" data should be created
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')


    # click on the "{dataset_name}" 3 dots button, select Edit Permissions
    assert wait_on_element(driver, 7, '//h1[text()="Storage"]')
    assert wait_on_element_disappear(driver, 15, '//mat-spinner[@role="progressbar"]')
    assert wait_on_element(driver, 10, '//div[contains(text(),"my_acl_dataset")]')
    assert wait_on_element(driver, 5, '//tr[contains(.,"my_acl_dataset")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"my_acl_dataset")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 5, '//button[normalize-space(text())="View Permissions"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="View Permissions"]').click()
    assert wait_on_element(driver, 5, '//mat-icon[normalize-space(text())="edit"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[normalize-space(text())="edit"]').click()


    # The Edit ACL page should open, select OPEN for Default ACL Option, select "{group_name}" for Group name, check the Apply Group
    assert wait_on_element(driver, 5, '//h1[text()="Edit ACL"]')
    assert wait_on_element(driver, 5, '//div[contains(.,"Owner Group:") and @class="control"]//input', 'inputable')
    driver.find_element_by_xpath('//div[contains(.,"Owner Group:") and @class="control"]//input').click()
    driver.find_element_by_xpath('//div[contains(.,"Owner Group:") and @class="control"]//input').clear()
    driver.find_element_by_xpath('//div[contains(.,"Owner Group:") and @class="control"]//input').send_keys(group_name)
    assert wait_on_element(driver, 5, '//span[contains(text(),"Save Access Control List")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save Access Control List")]').click()
    assert wait_on_element(driver, 7, '//h1[text()="Storage"]')
    assert wait_on_element_disappear(driver, 15, '//mat-spinner[@role="progressbar"]')
    assert wait_on_element(driver, 5, '//tr[contains(.,"my_acl_dataset")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"my_acl_dataset")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 5, '//button[normalize-space(text())="View Permissions"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="View Permissions"]').click()
    assert wait_on_element(driver, 5, '//div[contains(text(),"Dataset Permissions")]')
    assert wait_on_element(driver, 5, '//mat-icon[normalize-space(text())="edit"]')
    driver.find_element_by_xpath('//mat-icon[normalize-space(text())="edit"]').click()
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Who"]')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Who"]').click()
    driver.find_element_by_xpath('//span[contains(text(),"Group")]').click()
    assert wait_on_element(driver, 5, '//input[@data-placeholder="Group"]', 'inputable')
    driver.find_element_by_xpath('//input[@data-placeholder="Group"]').clear()
    driver.find_element_by_xpath('//input[@data-placeholder="Group"]').send_keys(group_name)
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Permissions"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Permissions"]').click()
    assert wait_on_element(driver, 5, '//div//mat-option//span[contains(text(),"Full Control")]', 'clickable')
    driver.find_element_by_xpath('//div//mat-option//span[contains(text(),"Full Control")]').click()


    # click the Save button, which should be returned to the storage page, on the Edit ACL page, verify that the group name is "{group_name}"
    assert wait_on_element(driver, 5, '//span[contains(text(),"Save Access Control List")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save Access Control List")]').click()
    assert wait_on_element_disappear(driver, 30, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//h1[text()="Storage"]')
    assert wait_on_element_disappear(driver, 15, '//mat-spinner[@role="progressbar"]')
    assert wait_on_element(driver, 10, '//div[contains(text(),"my_acl_dataset")]')
    assert wait_on_element(driver, 5, '//tr[contains(.,"my_acl_dataset")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"my_acl_dataset")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 5, '//button[normalize-space(text())="View Permissions"]')
    driver.find_element_by_xpath('//button[normalize-space(text())="View Permissions"]').click()
    assert wait_on_element(driver, 7, f'//div[text()="Group - {group_name}"]')
