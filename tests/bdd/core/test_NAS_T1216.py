# coding=utf-8
"""CORE UI: feature tests."""

import time
import glob
import sys
import os
import zipfile
from selenium.webdriver.common.keys import Keys
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    attribute_value_exist,
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T1216.feature', 'Kerberos Keytab Validation')
def test_kerberos_keytab_validation():
    """Kerberos Keytab Validation."""


@given('the browser is open, the FreeNAS URL and logged in')
def the_browser_is_open_the_freenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open, the FreeNAS URL and logged in."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, '//input[@data-placeholder="Username"]')
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 10, '//input[@data-placeholder="Username"]')
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').send_keys('root')
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').send_keys(root_password)
        assert wait_on_element(driver, 5, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('you should be on the dashboard, click on Directory Services and then Kerberos Keytabs in the side menu')
def you_should_be_on_the_dashboard_click_on_directory_services_and_then_kerberos_keytabs_in_the_side_menu(driver):
    """you should be on the dashboard, click on Directory Services and then Kerberos Keytabs in the side menu."""
    time.sleep(2)
    # temp fix for 1st start popup bug
    assert wait_on_element(driver, 5, '//div[contains(.,"Welcome to your new NAS")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CLOSE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    # / temp fix for 1st start popup bug
    time.sleep(1)
    assert wait_on_element(driver, 7, '//span[contains(text(),"Directory Services")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Directory Services")]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[ix-auto="option__Kerberos Keytabs"]', 'clickable') 
    driver.find_element_by_xpath('//mat-list-item[ix-auto="option__Kerberos Keytabs"]').click()


@then('click on Add on the Kerberos Keytab page')
def click_on_add_on_the_kerberos_keytab_page(driver):
    """click on Add on the Kerberos Keytab page."""
    time.sleep(1)
    assert wait_on_elemtn(driver, 7, '//div[contains(text(),"Kerberos Keytabs")]')
    time.sleep(1)
    driver.find_element_by_xpath('//mat-card[contains(.,"Kerberos Keytab")]//span[contains(text(),"Add")]').click()    


@then(parsers.parse('decode the tabfile with {tabfile_string}'))
def decode_the_tabfile_with_tabfile_string(driver, tabfile_string):
    """decode the tabfile with tabfile_string."""
    # open tabfile
    global tabfile
    global tab_result
    tabfile_path = os.getcwd() + '/tabfile'
    assert glob.glob(tabfile_path)
    tabfile = sorted(glob.glob(tabfile_path))[-1]
    tab_result = word_xor(tabfile, tabfile_string)
    open('KEYTABNAME.KEYTAB','wb')write(tab_result)


@then('name the keytab and upload the file and click save')
def name_the_keytab_and_upload_the_file_and_click_save(driver):
    """name the keytab and upload the file and click save."""
    time.sleep(1)
    assert wait_on_element(driver, 7, '//a[contains(text(),"Add")]')
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys("keytab_test")
    # define file
    global keytab_file
    global keytab_file_path
    keytab_file_path = os.getcwd() + '/KEYTABNAME.KEYTAB'
    assert glob.glob(keytab_file_path)
    keytab_file = sorted(glob.glob(keytab_file_path))[-1]
    assert wait_on_element(driver, 7, '//input[@type="file"]', 'clickable')
    driver.find_element_by_xpath('//input[@type="file"]').send_keys(keytab_file)
    #save
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__SUBMIT"', 'clickable') 
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"').click()


@then('verify that the file was accepted and utilized')
def verify_that_the_file_was_accepted_and_utilized(driver):
    """verify that the file was accepted and utilized."""
    time.sleep(1)
    assert wait_on_element(driver, 7, '//div[contains(text(),"keytab_test")]')

    ## return to dashboard
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    time.sleep(1)