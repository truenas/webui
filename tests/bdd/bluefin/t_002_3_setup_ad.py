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
    ssh_cmd
)




def test_setup_ad(driver, nas_ip, root_password, ad_ns, ad_domain, ad_user, ad_password, ca_ou, cmd1, ad_object1, cmd2, dataset_name, group_name):
    """test_wipe_one_disk"""
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Network"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Network"]').click()


    # on the network page, click on setting on the Global Configuration card.')
    time.sleep(1)
    assert wait_on_element(driver, 7, '//h1[contains(.,"Network")]')
    assert wait_on_element(driver, 10, '//h3[contains(text(),"Global Configuration")]//following-sibling::button//span[contains(.,"Settings")]')
    driver.find_element_by_xpath('//h3[contains(text(),"Global Configuration")]//following-sibling::button//span[contains(.,"Settings")]').click()
  

    # on the Network Global Configuration page, change the first nameserver to "{nameserver1}"
    time.sleep(2)
    #assert wait_on_element(driver, 7, '//h4[contains(.,"Hostname and Domain")]')
    #assert wait_on_element(driver, 5, '//input[@ix-auto="input__Nameserver 1"]', 'inputable')
    #driver.find_element_by_xpath('//input[@ix-auto="input__Nameserver 1"]').clear()
    #driver.find_element_by_xpath('//input[@ix-auto="input__Nameserver 1"]').send_keys(ad_ns)

    # change the Domain for "{ad_domain}", and click Save.
    time.sleep(2)
    global domain
    domain = ad_domain
    assert wait_on_element(driver, 5, '//ix-input//ix-label//label//span[contains(text(),"Domain")]//ancestor::ix-input/div/input')
    driver.find_element_by_xpath('//ix-input//ix-label//label//span[contains(text(),"Domain")]//ancestor::ix-input/div/input').clear()
    driver.find_element_by_xpath('//ix-input//ix-label//label//span[contains(text(),"Domain")]//ancestor::ix-input/div/input').send_keys(ad_domain)
    assert wait_on_element(driver, 7, '//span[contains(.,"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Save")]').click()


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
    global addomain
    addomain = ad_domain
    assert wait_on_element(driver, 5, '//ix-modal-header//div//h3[contains(.,"Active Directory")]')
    assert wait_on_element(driver, 7, '//ix-input//ix-label//label//span[contains(text(),"Domain Name")]//ancestor::ix-input/div/input', 'inputable')
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
    assert wait_on_element(driver, 7, '//ix-input//ix-label//label//span[contains(text(),"Computer Account OU")]', 'inputable')
    driver.find_element_by_xpath('//ix-input//ix-label//label//span[contains(text(),"Computer Account OU")]//ancestor::ix-input//div//input').clear()
    driver.find_element_by_xpath('//ix-input//ix-label//label//span[contains(text(),"Computer Account OU")]//ancestor::ix-input//div//input').send_keys(ca_ou)


    # check the Enable box and click SAVE.
    driver.find_element_by_xpath('//ix-fieldset//fieldset//ix-checkbox/mat-checkbox[1]/label[1]//following-sibling::span[contains(.,"Enable")]').click()
    assert wait_on_element(driver, 7, '//span[contains(.,"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Save")]').click()


    # the Active Directory setup should successfully save without an error.
    assert wait_on_element_disappear(driver, 30, '//h6[contains(.,"Please wait")]')
    assert wait_on_element_disappear(driver, 30, '//h1[text()="Start"]')
    time.sleep(0.5) #page needs to settle
    assert wait_on_element(driver, 15, f'//span[text()="{domain.upper()}"]')


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
    assert wait_on_element(driver, 5, '//span[contains(text(),"Storage (Deprecated)")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Storage (Deprecated)")]').click()
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
    assert wait_on_element(driver, 5, '//span[contains(.,"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Save")]').click()
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
    driver.find_element_by_xpath('//div[contains(.,"Owner Group:") and @class="control"]//input').send_keys(Keys.TAB)
    time.sleep(1) #button is detected clickable before before it can actually be cleanly clicked resulting in failure 
    assert wait_on_element(driver, 5, '//span[contains(text(),"Save Access Control List")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save Access Control List")]').click()
    assert wait_on_element_disappear(driver, 15, '//mat-spinner[@role="progressbar"]')
    assert wait_on_element(driver, 10, '//div[contains(text(),"my_acl_dataset")]')
    assert wait_on_element(driver, 10, '//tr[contains(.,"my_acl_dataset")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"my_acl_dataset")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 5, '//button[normalize-space(text())="View Permissions"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="View Permissions"]').click()
    assert wait_on_element(driver, 5, '//div[contains(text(),"Dataset Permissions")]')
    assert wait_on_element(driver, 5, '//mat-icon[normalize-space(text())="edit"]')
    driver.find_element_by_xpath('//mat-icon[normalize-space(text())="edit"]').click()




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
    assert wait_on_element_disappear(driver, 15, '//mat-spinner[@role="progressbar"]')
    assert wait_on_element(driver, 10, '//div[contains(text(),"my_acl_dataset")]')
    assert wait_on_element(driver, 5, '//tr[contains(.,"my_acl_dataset")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"my_acl_dataset")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 5, '//button[normalize-space(text())="View Permissions"]')
    driver.find_element_by_xpath('//button[normalize-space(text())="View Permissions"]').click()
    assert wait_on_element(driver, 7, f'//div[text()="Group - {group_name}"]')
