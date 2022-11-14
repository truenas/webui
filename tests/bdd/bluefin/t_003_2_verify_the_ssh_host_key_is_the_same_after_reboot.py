# coding=utf-8
"""SCALE UI feature tests."""
import time
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_for_attribute_value,
    wait_on_element_disappear,
    ssh_cmd
)




def test_verify_the_ssh_host_key_is_the_same_after_reboot(driver, nas_ip, root_password):
    """test_verify_the_ssh_host_key_is_the_same_after_reboot"""
    if not is_element_present(driver, '//span[contains(text(),"System Information")]'):
        assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    assert wait_on_element(driver, 7, '//h1[text()="Dashboard"]')


    # on the Dashboard, get the ssh host key
    global hostkey_before
    assert wait_on_element(driver, 10, '//h1[text()="Dashboard"]')
    results = ssh_cmd('ssh-keyscan 127.0.0.1', 'root', root_password, nas_ip)
    assert results['result'], results['output']
    hostkey_before = results['output']


    # click on the power button then Restart
    assert wait_on_element(driver, 10, '//button[@name="Power"]', 'clickable')
    driver.find_element_by_xpath('//button[@name="Power"]').click()
    assert wait_on_element(driver, 5, '//button[@name="power-restart"]', 'clickable')
    driver.find_element_by_xpath('//button[@name="power-restart"]').click()
    assert wait_on_element(driver, 5, '//h1[text()="Restart"]')
    assert wait_on_element(driver, 5, '//mat-checkbox[@name="confirm_checkbox"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@name="confirm_checkbox"]').click()
    assert wait_on_element(driver, 5, '//button[@name="ok_button"]', 'clickable')
    driver.find_element_by_xpath('//button[@name="ok_button"]').click()


    # wait for the login UI to come back and login
    assert wait_on_element_disappear(driver, 15, '//h6[contains(.,"Please wait")]')
    time.sleep(5)
    assert wait_on_element(driver, 300, '//input[@data-placeholder="Username"]')
    driver.find_element_by_xpath('//input[@data-placeholder="Username"]').clear()
    driver.find_element_by_xpath('//input[@data-placeholder="Username"]').send_keys('root')
    driver.find_element_by_xpath('//input[@data-placeholder="Password"]').clear()
    driver.find_element_by_xpath('//input[@data-placeholder="Password"]').send_keys(root_password)
    assert wait_on_element(driver, 5, '//button[@name="signin_button"]', 'clickable')
    driver.find_element_by_xpath('//button[@name="signin_button"]').click()


    # on the Dashboard click on Systems Settings then Services
    assert wait_on_element(driver, 10, '//h1[text()="Dashboard"]')
    assert wait_on_element(driver, 7, '//a[@name="System_Settings-menu"]', 'clickable')
    driver.find_element_by_xpath('//a[@name="System_Settings-menu"]').click()
    assert wait_on_element(driver, 5, '//div[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Services"]', 'clickable')
    driver.find_element_by_xpath('//div[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Services"]').click()


    # on the Services page, verify SSH is enabled
    assert wait_on_element(driver, 10, '//h1[text()="Services"]')
    assert wait_on_element(driver, 5, '//tr[contains(.,"S3")]//button', 'clickable')
    element = driver.find_element_by_xpath('//tr[contains(.,"S3")]//button')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    assert wait_on_element(driver, 5, '//tr[contains(.,"SSH")]//mat-slide-toggle/label', 'clickable')
    assert attribute_value_exist(driver, '//tr[contains(.,"SSH")]//mat-slide-toggle', 'class', 'mat-checked')


    # get the ssh host key again
    global hostkey_after
    results = ssh_cmd('ssh-keyscan 127.0.0.1', 'root', root_password, nas_ip)
    assert results['result'], results['output']
    hostkey_after = results['output']


    # verify that both ssh host keys match
    for line in hostkey_after:
        assert line in hostkey_before
