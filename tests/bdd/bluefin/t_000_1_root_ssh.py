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


"""Verify SSH Access with root works."""

def test_root_ssh(nas_ip, driver, root_password):
    """test root ssh."""
    #    """the browser is open, navigate to the SCALE URL."""
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__System Settings"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System Settings"]').click()
    assert wait_on_element(driver, 10, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Services"]', 'clickable')
    driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Services"]').click()


    #    """on the service page, press on configure(pencil) SSH."""
    assert wait_on_element(driver, 5, '//td[contains(text(),"Dynamic DNS")]')
    element = driver.find_element_by_xpath('//td[contains(text(),"Dynamic DNS")]')
        # Scroll to SSH service
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    assert wait_on_element(driver, 5, '//tr[contains(.,"SSH")]//button', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"SSH")]//button').click()


    #    """the SSH General Options page should open."""
    assert wait_on_element(driver, 10, '//legend[contains(text(),"General Options")]')


    #    """click the checkbox "Log in as root with password"."""
    assert wait_on_element(driver, 10, '//ix-checkbox[@formcontrolname="rootlogin"]//mat-checkbox', 'clickable')
    time.sleep(0.5)
    value_exist = attribute_value_exist(driver, '//ix-checkbox[@formcontrolname="rootlogin"]//mat-checkbox', 'class', 'mat-checkbox-checked')
    if not value_exist:
        driver.find_element_by_xpath('//ix-checkbox[@formcontrolname="rootlogin"]//mat-checkbox').click()


    #    """verify the checkbox works and click Save."""
    wait_for_value = wait_for_attribute_value(driver, 5, '//ix-checkbox[@formcontrolname="rootlogin"]//mat-checkbox', 'class', 'mat-checkbox-checked')
    assert wait_for_value
    assert wait_on_element(driver, 5, '//span[contains(text(),"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save")]').click()
    wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')


    #    """click the Start Automatically SSH checkbox and enable the SSH service."""
    assert wait_on_element(driver, 5, '//td[contains(text(),"Dynamic DNS")]')
        # Scroll to SSH service
    element = driver.find_element_by_xpath('//td[contains(text(),"Dynamic DNS")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    assert wait_on_element(driver, 5, '//tr[contains(.,"SSH")]//mat-checkbox')
    value_exist = attribute_value_exist(driver, '//tr[contains(.,"SSH")]//mat-checkbox', 'class', 'mat-checkbox-checked')
    if not value_exist:
        driver.find_element_by_xpath('//tr[contains(.,"SSH")]//mat-checkbox').click()
    assert wait_on_element(driver, 5, '//tr[contains(.,"SSH")]//mat-slide-toggle/label', 'clickable')
    value_exist = attribute_value_exist(driver, '//tr[contains(.,"SSH")]//mat-slide-toggle', 'class', 'mat-checked')
    if not value_exist:
        driver.find_element_by_xpath('//tr[contains(.,"SSH")]//mat-slide-toggle/label').click()


    #    """the service should be enabled with no errors."""
    wait_on_element_disappear(driver, 30, '//mat-spinner[@role="progressbar"]')
    assert wait_for_attribute_value(driver, 20, '//tr[contains(.,"SSH")]//mat-slide-toggle', 'class', 'mat-checked')


    #    """ssh to a NAS with root and the root password should work."""
    global ssh_result
    ssh_result = ssh_cmd('ls', 'root', root_password, nas_ip)
    assert ssh_result['result'], ssh_result['output']
    assert 'syslog' in ssh_result['output'], ssh_result['output']

