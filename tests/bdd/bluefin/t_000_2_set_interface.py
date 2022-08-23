# coding=utf-8
"""SCALE UI feature tests."""

import time
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_on_element_disappear,
)


def test_interface(driver, nas_ip, nas_hostname, nameserver1, nameserver2, nameserver3, gateway):
    """test interface."""

    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Network"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Network"]').click()


    # the Network page will open, click Global Configuration Settings
    assert wait_on_element(driver, 10, '//h1[contains(.,"Network")]')
    assert wait_on_element(driver, 10, '//button[contains(.,"Settings")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"Settings")]').click()


    #the global config page will open and input Nameservers "{nameserver1}", "{nameserver2}" and "{nameserver3}
    assert wait_on_element(driver, 10, '//h3[contains(.,"Global Configuration")]')
    assert wait_on_element(driver, 7, '//ix-input[contains(.,"Nameserver 3")]//input', 'inputable')
    driver.find_element_by_xpath('//ix-input[contains(.,"Nameserver 1")]//input').clear()
    driver.find_element_by_xpath('//ix-input[contains(.,"Nameserver 1")]//input').send_keys(nameserver1)
    driver.find_element_by_xpath('//ix-input[contains(.,"Nameserver 2")]//input').clear()
    driver.find_element_by_xpath('//ix-input[contains(.,"Nameserver 2")]//input').send_keys(nameserver2)
    driver.find_element_by_xpath('//ix-input[contains(.,"Nameserver 3")]//input').clear()
    driver.find_element_by_xpath('//ix-input[contains(.,"Nameserver 3")]//input').send_keys(nameserver3)


    #input gateway "{gateway}" and an hostname and click SAVE
    driver.find_element_by_xpath('//ix-input[contains(.,"IPv4 Default")]//input').clear()
    driver.find_element_by_xpath('//ix-input[contains(.,"IPv4 Default")]//input').send_keys(gateway)
    driver.find_element_by_xpath('//ix-input[contains(.,"Hostname")]//input').clear()
    driver.find_element_by_xpath('//ix-input[contains(.,"Hostname")]//input').send_keys(nas_hostname)
    assert wait_on_element(driver, 7, '//button[contains(.,"Save")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"Save")]').click()


    #Please wait" should appear, changes should be saved without errors, the network page will reload
    assert wait_on_element_disappear(driver, 20, '//div[contains(@class,"mat-progress-bar-element")]')
    assert wait_on_element(driver, 10, '//h1[contains(.,"Network")]')


    #click the interface field, uncheck dhcp and click add and enter IP and click Apply.
    driver.find_element_by_xpath('//mat-icon[@id="enp0s8"]').click()
    assert wait_on_element(driver, 7, '//ix-checkbox//mat-checkbox//label[contains(.,"DHCP")]', 'clickable')
    if attribute_value_exist(driver, '//ix-checkbox//mat-checkbox//label[contains(.,"DHCP")]', 'class', 'mat-checkbox-checked'):
        driver.find_element_by_xpath('//ix-checkbox//mat-checkbox//label[contains(.,"DHCP")]').click()
    assert wait_on_element(driver, 7, '//ix-list//button//span[contains(.,"Add")]', 'clickable')
    driver.find_element_by_xpath('//ix-list//button//span[contains(.,"Add")]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"IP Address")]')
    driver.find_element_by_xpath('//ix-list-item//div//div[contains(.,"IP Address")]//input').clear()
    driver.find_element_by_xpath('//ix-list-item//div//div[contains(.,"IP Address")]//input').send_keys(nas_ip)
    driver.find_element_by_xpath('//ix-list-item//div//div[contains(.,"IP Address")]//mat-select').click()
    assert wait_on_element(driver, 10, '//span[contains(.,"22")]')
    driver.find_element_by_xpath('//span[contains(.,"22")]').click()
    assert wait_on_element(driver, 7, '//button//span[contains(.,"Save")]', 'clickable')
    driver.find_element_by_xpath('//button//span[contains(.,"Save")]').click()

    #"Please wait" should appear while settings are being applied, when the Interfaces page appears verify Nameservers do not list (DHCP)
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//h1[contains(.,"Network")]')
    assert wait_on_element_disappear(driver, 10, '//span[contains(.,"DHCP")]')


    #click Test Changes, check Confirm, click Test Changes again
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__testChange"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__testChange"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Test Changes")]')
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__TEST CHANGES"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__TEST CHANGES"]').click()


    #when "Please wait" goes away, and there are unapplied network changes, click "Save Changes"
    assert wait_on_element_disappear(driver, 85, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//h1[contains(.,"Network")]')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__keepChange"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__keepChange"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Save Changes")]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


    #on the Save Changes widget, click Save
    assert wait_on_element(driver, 10, '//div[contains(.,"Network interface changes have been made permanent.")]')
    #assert wait_on_element(driver, 7, '//button[@ix-auto="button__CLOSE"]', 'clickable')
    #driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()


    #on the Interfaces page, Nameservers do not list (DHCP)
    assert wait_on_element(driver, 10, '//h1[contains(.,"Network")]')
    assert wait_on_element_disappear(driver, 10, '//span[contains(.,"DHCP")]')
