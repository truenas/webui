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




def test_setup_ldap(driver):
    """test_setup_ldap"""


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
    assert wait_on_element(driver, 5, '//mat-checkbox[contains(@ix-auto, "Enable (requires password")]', 'clickable')
    checkbox_checked = attribute_value_exist(driver, '//mat-checkbox[contains(@ix-auto, "Enable (requires password")]', 'class', 'mat-checkbox-checked')
    # The checkbox should be checked
    if checkbox_checked:
        driver.find_element_by_xpath('//mat-checkbox[contains(@ix-auto, "Enable (requires password")]').click()
    assert wait_on_element(driver, 5, '//span[contains(text(),"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save")]').click()
    assert wait_on_element_disappear(driver, 15, '//h6[contains(.,"Please wait")]')
    # Make sure Active Directory and LDAP are both disabled
    assert wait_on_element(driver, 10, '//h3[text()="Active Directory and LDAP are disabled."]')
    assert wait_on_element(driver, 7, '//span[contains(text(),"Configure LDAP")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Configure LDAP")]').click()
    # Verify the LDAP box is starting to load
    assert wait_on_element(driver, 5, '//h3[text()="LDAP"]')


    # input "{hostname}" for Hostname
    assert wait_on_element(driver, 5, '//span[contains(text(),"Configure LDAP")]', 'clickable')
    assert wait_on_element(driver, 5, '//input[@placeholder="Hostname"]', 'inputable')
    driver.find_element_by_xpath('//input[@placeholder="Hostname"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Hostname"]').send_keys(hostname)


    # input "{base_DN}" Base DN
    driver.find_element_by_xpath('//input[@ix-auto="input__Base DN"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Base DN"]').send_keys(base_DN)


    # input "{bind_DN}" for Bind DN
    driver.find_element_by_xpath('//input[@ix-auto="input__Bind DN"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Bind DN"]').send_keys(bind_DN)


    # input "{bind_password}" for Bind Password
    driver.find_element_by_xpath('//input[@ix-auto="input__Bind Password"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Bind Password"]').send_keys(bind_password)


    # click Advanced Options, then click Enable checkbox, then check Samba Schema, select ON for Encryption Mode, then click save
    assert wait_on_element(driver, 10, '//mat-checkbox[@ix-auto="checkbox__Enable"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Enable"]').click()
    assert wait_on_element(driver, 10, '//span[contains(text(),"Advanced Options")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Advanced Options")]').click()
    assert wait_on_element(driver, 5, '//mat-checkbox[contains(@ix-auto, "Samba Schema")]', 'clickable')
    checkbox_checked = attribute_value_exist(driver, '//mat-checkbox[contains(@ix-auto, "Samba Schema")]', 'class', 'mat-checkbox-checked')
    if not checkbox_checked:
        driver.find_element_by_xpath('//mat-checkbox[contains(@ix-auto, "Samba Schema")]').click()
    time.sleep(5)
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Encryption Mode"]').click()
    assert wait_on_element(driver, 10, '//span[contains(.,"ON")]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Encryption Mode_ON"]').click()
    element = driver.find_element_by_xpath('//span[contains(text(),"Basic Options")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


    # wait for Please wait should appear while settings are applied, then after settings are applied, you should see "{hostname}" Settings saved
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    # Add validation of elements
    assert wait_on_element(driver, 20, '//mat-card//span[contains(text(),"Hostname:")]')


    # run {command} trough ssh, the ssh result should pass and return {user} info
    global ssh_result
    ssh_result = ssh_cmd(command, 'root', root_password, nas_ip)
    assert ssh_result['result'], ssh_result['output']
    assert "eturgeon" in ssh_result['output'], ssh_result['output']


