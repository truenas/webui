# coding=utf-8
"""SCALE UI feature tests."""
import time
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_for_attribute_value,
    wait_on_element_disappear,
    ssh_sudo
)




def test_enabling_sudo_for_group(driver):
    """test_enabling_sudo_for_group"""
    if not is_element_present(driver, '//h1[contains(text(),"Groups")]'):
        assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
        assert wait_on_element(driver, 10, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Groups"]', 'clickable')
        driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Groups"]').click()
    assert wait_on_element(driver, 7, '//h1[contains(text(),"Groups")]')

    # click on Credentials and Local Users
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
    assert wait_on_element(driver, 10, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Users"]', 'clickable')
    driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Local Users"]').click()


    # create new qetestuser user add to qatest group
    assert wait_on_element(driver, 10, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 10, '//button[@ix-auto="button__Users_ADD"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__Users_ADD"]').click()
    assert wait_on_element(driver, 7, '//h3[contains(.,"Add User")]')
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Full Name"]')
    driver.find_element_by_xpath('//input[@ix-auto="input__Full Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Full Name"]').send_keys('QE user')
    driver.find_element_by_xpath('//input[@ix-auto="input__Username"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Username"]').send_keys('qetestuser')
    driver.find_element_by_xpath('//input[@ix-auto="input__Password"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Password"]').send_keys('testing')
    driver.find_element_by_xpath('//input[@ix-auto="input__Confirm Password"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Confirm Password"]').send_keys('testing')
    assert wait_on_element(driver, 7, '//mat-select[@ix-auto="select__Auxiliary Groups"]', 'clickable')
    # scroll down to Auxiliary Groups
    element = driver.find_element_by_xpath('//mat-select[@ix-auto="select__Auxiliary Groups"]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    assert wait_on_element(driver, 7, '//mat-select[@ix-auto="select__Auxiliary Groups"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Auxiliary Groups"]').click()
    element = driver.find_element_by_xpath('//span[contains(.,"qatest")]')
    # Scroll to qatest
    driver.execute_script("arguments[0].scrollIntoView();", element)
    assert wait_on_element(driver, 15, '//mat-option[@ix-auto="option__Auxiliary Groups_qatest"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Auxiliary Groups_qatest"]').click()
    # time.sleep(2)
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Auxiliary Groups_qatest"]').send_keys(Keys.TAB)
    element = driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    wait_on_element(driver, 10, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 10, '//div[contains(.,"qetestuser")]')


    # verify user can ssh in and cannot sudo
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
    assert wait_on_element(driver, 10, '//tr[@ix-auto="expander__qatest"]/td', 'clickable')
    driver.find_element_by_xpath('//tr[@ix-auto="expander__qatest"]/td').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__EDIT_qatest_qatest"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__EDIT_qatest_qatest"]').click()


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
