# coding=utf-8
"""SCALE UI: feature tests."""


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


@scenario('features/NAS-T1215.feature', 'Kerberos Keytab Validation')
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


@when('you should be on the dashboard, click on Directory Services in the side menu')
def you_should_be_on_the_dashboard_click_on_directory_services_in_the_side_menu(driver):
    """you should be on the dashboard, click on Directory Services in the side menu."""
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
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
    assert wait_on_element(driver, 7, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Directory Services"]', 'clickable') 
    driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Directory Services"]').click()


@then('click on advanced and Kerberos Keytab Add')
def click_on_advanced_and_kerberos_keytab_add(driver):
    """click on advanced and Kerberos Keytab Add."""
    time.sleep(1)
    driver.find_element_by_xpath('//span[contains(text(),"Show")]').click()
    time.sleep(1)
    assert wait_on_element(driver, 7, '//h1[contains(.,"Warning")]')
    driver.find_element_by_xpath('//span[contains(text(),"CONTINUE")]').click()
    time.sleep(1)
    driver.find_element_by_xpath('//mat-card[contains(.,"Kerberos Keytab")]//span[contains(text(),"Add")]').click()

@then(parsers.parse('open the zip with {zipstring}'))
def open_the_zip_with_zipstring(driver, zipstring):
    """open the zip with zipstring,"""
    # openzip zip
    global zip_file
    global keytab_zip
    global keytab_zip_path
    keytab_zip_path = os.getcwd() + '/KEYTABNAME.zip'
    assert glob.glob(keytab_zip_path)
    keytab_zip = sorted(glob.glob(keytab_zip_path))[-1]
    zip_file = zipfile.ZipFile(keytab_zip)
    zip_file.extractall(pwd = bytes(zipstring, 'utf-8'))
    zip_file.close()


@then('name the keytab and upload the file and click save')
def name_the_keytab_and_upload_the_file_and_click_save(driver):
    """name the keytab and upload the file and click save."""
    time.sleep(1)
    assert wait_on_element(driver, 7, '//h3[contains(text(),"Add Kerberos Keytab")]')
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
    driver.find_element_by_xpath('//span[contains(text(),"Save")]').click()



@then('verify that the file was accepted and utilized')
def verify_that_the_file_was_accepted_and_utilized(driver):
    """verify that the file was accepted and utilized."""
    time.sleep(1)
    assert wait_on_element(driver, 7, '//mat-card[contains(.,"Kerberos Keytab")]//div[contains(text(),"keytab_test")]')

    ## return to dashboard
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    time.sleep(1)
