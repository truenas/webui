# coding=utf-8
"""SCALE UI feature tests."""
import time
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_for_attribute_value,
    wait_on_element_disappear,
    ssh_cmd,
)




def test_setup_ldap(driver, nas_ip, root_password, hostname, base_DN, bind_DN, bind_password, command, user):
    """test_setup_ldap"""
#    if not is_element_present(driver, '//h1[contains(.,"Storage")]'):
#        assert wait_on_element(driver, 10, '//span[contains(text(),"Storage")]', 'clickable')
#        driver.find_element_by_xpath('//span[contains(text(),"Storage")]').click()
#    assert wait_on_element(driver, 10, '//h1[contains(.,"Storage Dashboard")]')

   # click on sharing and click add
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
    assert wait_on_element(driver, 7, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Directory Services"]', 'clickable')
    driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Directory Services"]').click()


    # the Directory Services page should open, then click LDAP settings button
    # Verify the page is starting to load
    assert wait_on_element(driver, 5, '//h1[text()="Directory Services"]')
    time.sleep(1)
    # First we have to disable AD
    assert wait_on_element(driver, 5, '//mat-card//span[contains(text(),"Settings")]', 'clickable')
    driver.find_element_by_xpath('//mat-card//span[contains(text(),"Settings")]').click()
    # Verify the box is starting to load
    assert wait_on_element(driver, 5, '//h3[text()="Active Directory"]')
    assert wait_on_element(driver, 5, '//ix-fieldset//fieldset//ix-checkbox/mat-checkbox[1]/label[1]//following-sibling::span[contains(.,"Enable")]', 'clickable')
    driver.find_element_by_xpath('//ix-fieldset//fieldset//ix-checkbox/mat-checkbox[1]/label[1]//following-sibling::span[contains(.,"Enable")]').click()
    checkbox_checked = attribute_value_exist(driver, '//ix-fieldset//fieldset//ix-checkbox/mat-checkbox[1]/label[1]//following-sibling::span[contains(.,"Enable")]', 'class', 'mat-checkbox-checked')

    # The checkbox should be checked
    if checkbox_checked:
        driver.find_element_by_xpath('//ix-fieldset//fieldset//ix-checkbox/mat-checkbox[1]/label[1]//following-sibling::span[contains(.,"Enable")]').click()
    assert wait_on_element(driver, 5, '//span[contains(text(),"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save")]').click()
    #assert wait_on_element_disappear(driver, 15, '//h6[contains(.,"Please wait")]')
    # Make sure Active Directory and LDAP are both disabled
    assert wait_on_element(driver, 20, '//h3[text()="Active Directory and LDAP are disabled."]')
    assert wait_on_element(driver, 7, '//span[contains(text(),"Configure LDAP")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Configure LDAP")]').click()
    # Verify the LDAP box is starting to load
    assert wait_on_element(driver, 5, '//h3[text()="LDAP"]')


    # input "{hostname}" for Hostname
    assert wait_on_element(driver, 5, '//span[contains(text(),"Configure LDAP")]', 'clickable')

    assert wait_on_element(driver, 7, '//ix-chips//ix-label//label//span[contains(.,"Hostname")]')
    assert wait_on_element(driver, 5, '//ix-chips//ix-label//label//span[contains(.,"Hostname")]//ancestor::ix-chips//div//mat-chip-list//div//input', 'inputable')
    driver.find_element_by_xpath('//ix-chips//ix-label//label//span[contains(.,"Hostname")]//ancestor::ix-chips//div//mat-chip-list//div//input').clear()
    driver.find_element_by_xpath('//ix-chips//ix-label//label//span[contains(.,"Hostname")]//ancestor::ix-chips//div//mat-chip-list//div//input').send_keys(hostname)

    # input "{base_DN}" Base DN
    assert wait_on_element(driver, 7, '//span[contains(text(),"Base DN")]')
    assert wait_on_element(driver, 5, '//ix-fieldset//fieldset//ix-input//ix-label//label//span[contains(text(),"Base DN")]//ancestor::ix-input//div//input', 'inputable')
    driver.find_element_by_xpath('//ix-fieldset//fieldset//ix-input//ix-label//label//span[contains(text(),"Base DN")]//ancestor::ix-input//div//input').clear()
    driver.find_element_by_xpath('//ix-fieldset//fieldset//ix-input//ix-label//label//span[contains(text(),"Base DN")]//ancestor::ix-input//div//input').send_keys(base_DN)

    # input "{bind_DN}" for Bind DN
    assert wait_on_element(driver, 7, '//span[contains(text(),"Bind DN")]')
    assert wait_on_element(driver, 5, '//ix-fieldset//fieldset//ix-input//ix-label//label//span[contains(text(),"Bind DN")]//ancestor::ix-input//div//input', 'inputable')
    driver.find_element_by_xpath('//ix-fieldset//fieldset//ix-input//ix-label//label//span[contains(text(),"Bind DN")]//ancestor::ix-input//div//input').clear()
    driver.find_element_by_xpath('//ix-fieldset//fieldset//ix-input//ix-label//label//span[contains(text(),"Bind DN")]//ancestor::ix-input//div//input').send_keys(bind_DN)

    # input "{bind_password}" for Bind Password
    assert wait_on_element(driver, 7, '//span[contains(text(),"Bind Password")]')
    assert wait_on_element(driver, 5, '//ix-fieldset//fieldset//ix-input//ix-label//label//span[contains(text(),"Bind Password")]//ancestor::ix-input//div//input', 'inputable')
    driver.find_element_by_xpath('//ix-fieldset//fieldset//ix-input//ix-label//label//span[contains(text(),"Bind Password")]//ancestor::ix-input//div//input').clear()
    driver.find_element_by_xpath('//ix-fieldset//fieldset//ix-input//ix-label//label//span[contains(text(),"Bind Password")]//ancestor::ix-input//div//input').send_keys(bind_password)


    # click Advanced Options, then click Enable checkbox, then check Samba Schema, select ON for Encryption Mode, then click save
    assert wait_on_element(driver, 5, '//ix-fieldset//fieldset//ix-checkbox/mat-checkbox[1]/label[1]//following-sibling::span[contains(.,"Enable")]', 'clickable')
    driver.find_element_by_xpath('//ix-fieldset//fieldset//ix-checkbox/mat-checkbox[1]/label[1]//following-sibling::span[contains(.,"Enable")]').click()
    assert wait_on_element(driver, 10, '//span[contains(text(),"Advanced Options")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Advanced Options")]').click()
    #time.sleep(2)
    #assert wait_on_element(driver, 5, '//ix-fieldset//fieldset//ix-checkbox/mat-checkbox[1]/label[1]//following-sibling::span[contains(.,"Samba")]', 'clickable')
    #checkbox_checked = attribute_value_exist(driver, '//ix-fieldset//fieldset//ix-checkbox/mat-checkbox[1]/label[1]//following-sibling::span[contains(.,"Samba")]', 'class', 'mat-checkbox-checked')
    #if not checkbox_checked:
    #    driver.find_element_by_xpath('//ix-fieldset//fieldset//ix-checkbox/mat-checkbox[1]/label[1]//following-sibling::span[contains(.,"Samba")]').click()
    time.sleep(1) #let the form settle

    assert wait_on_element(driver, 7, '//span[contains(text(),"OFF")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"OFF")]').click()
    assert wait_on_element(driver, 7, '//mat-option[2]//span[contains(text(),"ON")]', 'clickable')
    time.sleep(0.5)
    driver.find_element_by_xpath('//mat-option[2]//span[contains(text(),"ON")]').click()
 
    element = driver.find_element_by_xpath('//span[contains(text(),"Basic Options")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    assert wait_on_element(driver, 5, '//span[contains(text(),"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save")]').click()


    # wait for Please wait should appear while settings are applied, then after settings are applied, you should see "{hostname}" Settings saved
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    # Add validation of elements
    assert wait_on_element(driver, 20, '//mat-card//span[contains(text(),"Hostname:")]')


    # run {command} trough ssh, the ssh result should pass and return {user} info
    global ldap_ssh_result
    ldap_ssh_result = ssh_cmd(command, 'root', root_password, nas_ip)
    assert ldap_ssh_result['result'], ldap_ssh_result['output']
    assert "eturgeon" in ldap_ssh_result['output'], ldap_ssh_result['output']


