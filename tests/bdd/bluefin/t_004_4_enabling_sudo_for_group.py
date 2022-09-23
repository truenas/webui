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
    ssh_sudo
)




def test_enabling_sudo_for_group(driver, nas_ip):
    """test_enabling_sudo_for_group"""
    assert wait_on_element(driver, 7, '//h1[contains(text(),"Groups")]')

    # click on Credentials and Local Users
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
    assert wait_on_element(driver, 10, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Users"]', 'clickable')
    driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Users"]').click()


    # create new qetestuser user add to qatest group
    assert wait_on_element(driver, 10, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"Add")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Add")]').click()
    assert wait_on_element(driver, 7, '//h3[contains(.,"Add User")]')
    assert wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')
    """input in the following fields Full Name, Username, and password."""
    assert wait_on_element(driver, 7, '//ix-input[@formcontrolname="full_name"]//input')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="full_name"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="full_name"]//input').send_keys('QE user')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="username"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="username"]//input').send_keys('qetestuser')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="password"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="password"]//input').send_keys('testing')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="password_conf"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="password_conf"]//input').send_keys('testing')
    # set group
    assert wait_on_element(driver, 7, '//ix-select[@formcontrolname="groups"]//mat-select', 'clickable')
    element = driver.find_element_by_xpath('//ix-select[@formcontrolname="groups"]//mat-select')
    # Scroll to qatest
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    driver.find_element_by_xpath('//ix-select[@formcontrolname="groups"]//mat-select').click()
    assert wait_on_element(driver, 7, '//mat-option[span[contains(., "qatest")]]', 'clickable')
    element = driver.find_element_by_xpath('//span[contains(.,"qatest")]')
    # Scroll to qatest
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    assert wait_on_element(driver, 7, '//mat-option[span[contains(., "qatest")]]', 'clickable')
    driver.find_element_by_xpath('//mat-option[span[contains(., "qatest")]]').click()
    driver.find_element_by_xpath('//mat-option[span[contains(., "qatest")]]').send_keys(Keys.TAB)
    assert wait_on_element(driver, 10, '//button[span[contains(.,"Save")]]', 'clickable')
    element = driver.find_element_by_xpath('//button[span[contains(.,"Save")]]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    driver.find_element_by_xpath('//button[span[contains(.,"Save")]]').click()



    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 10, '//div[contains(.,"qetestuser")]')


    # verify user can ssh in and cannot sudo
    time.sleep(1) #race condition if we dont give the OS enough time to preform the function first. 
    global sudo_results
    cmd = 'ls /'
    sudo_results = ssh_sudo(cmd, nas_ip, 'qetestuser', 'testing')
    assert "Sorry, user qetestuser is not allowed to execute" in sudo_results, str(sudo_results)


    # click on Credentials and Local Groups
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
    assert wait_on_element(driver, 10, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Groups"]', 'clickable')
    driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Groups"]').click()


    # on the Groups page expand QE group and click edit
    assert wait_on_element(driver, 10, '//h1[contains(text(),"Groups")]')
    assert wait_on_element(driver, 10, '//td[contains(text(),"qetest")]', 'clickable')
    driver.find_element_by_xpath('//td[contains(text(),"qetest")]').click()
    assert wait_on_element(driver, 7, '//span[contains(text(),"Edit")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Edit")]').click()


    # check the enable sudo box and click save
    assert wait_on_element(driver, 10, '//h3[contains(text(),"Edit Group")]')
    assert wait_on_element(driver, 7, '//ix-checkbox[@formcontrolname="sudo"]//mat-checkbox', 'clickable')
    driver.find_element_by_xpath('//ix-checkbox[@formcontrolname="sudo"]//mat-checkbox').click()
    assert wait_on_element(driver, 7, '//span[contains(text(),"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save")]').click()
    # give middleware time to actually do its work
    time.sleep(4)


    # ssh in with qetest user and try to sudo
    global sudo_results2
    cmd = 'ls /'
    sudo_results2 = ssh_sudo(cmd, nas_ip, 'qetestuser', 'testing')
    assert "vmlinuz" in sudo_results2, str(sudo_results2)
