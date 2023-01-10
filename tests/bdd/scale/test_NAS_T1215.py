# coding=utf-8
"""SCALE UI: feature tests."""


import time
import glob
import os
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    word_xor
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


@given('the browser is open, the TrueNAS URL and logged in')
def the_browser_is_open_the_truenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open, the TrueNAS URL and logged in."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, xpaths.login.user_input)
    if not is_element_present(driver, xpaths.sideMenu.dashboard):
        assert wait_on_element(driver, 10, xpaths.login.user_input)
        driver.find_element_by_xpath(xpaths.login.user_input).clear()
        driver.find_element_by_xpath(xpaths.login.user_input).send_keys('root')
        driver.find_element_by_xpath(xpaths.login.password_input).clear()
        driver.find_element_by_xpath(xpaths.login.password_input).send_keys(root_password)
        assert wait_on_element(driver, 5, xpaths.login.signin_button)
        driver.find_element_by_xpath(xpaths.login.signin_button).click()
    else:
        driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()


@when('you should be on the dashboard, click on Directory Services in the side menu')
def you_should_be_on_the_dashboard_click_on_directory_services_in_the_side_menu(driver):
    """you should be on the dashboard, click on Directory Services in the side menu."""
    time.sleep(2)
    # temp fix for 1st start popup bug
    # assert wait_on_element(driver, 5, '//div[contains(.,"Welcome to your new NAS")]')
    # assert wait_on_element(driver, 5, xpaths.button.close, 'clickable')
    # driver.find_element_by_xpath(xpaths.button.close).click()
    # assert wait_on_element(driver, 10, xpaths.dashboard.title)
    # assert wait_on_element(driver, 10, xpaths.sideMenu.dashboard, 'clickable')
    # driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()
    # / temp fix for 1st start popup bug
    time.sleep(1)
    assert wait_on_element(driver, 7, xpaths.sideMenu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.credentials).click()
    assert wait_on_element(driver, 7, xpaths.sideMenu.directoryServices, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.directoryServices).click()


@then('click on advanced and Kerberos Keytab Add')
def click_on_advanced_and_kerberos_keytab_add(driver):
    """click on advanced and Kerberos Keytab Add."""
    time.sleep(1)
    driver.find_element_by_xpath('//span[contains(text(),"Show")]').click()
    time.sleep(1)
    assert wait_on_element(driver, 7, xpaths.popup.warning)
    driver.find_element_by_xpath('//span[contains(text(),"CONTINUE")]').click()
    time.sleep(1)
    driver.find_element_by_xpath('//mat-card[contains(.,"Kerberos Keytab")]//span[contains(text(),"Add")]').click()


@then(parsers.parse('decode the tabfile with "{tabfile_string}"'))
def decode_the_tabfile_with_tabfile_string(driver, tabfile_string):
    """decode the tabfile with tabfile_string."""
    # open tabfile
    global tabfile
    global tab_result
    global datafile
    tabfile_path = os.getcwd() + '/tabfile'
    assert glob.glob(tabfile_path)
    tabfile = sorted(glob.glob(tabfile_path))[-1]
    datafile = open(os.path.expanduser(tabfile_path), 'rb').read()
    tab_result = word_xor(datafile, tabfile_string)
    time.sleep(2)
    open('KEYTABNAME.KEYTAB', 'wb').write(tab_result)


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
    # save
    driver.find_element_by_xpath('//span[contains(text(),"Save")]').click()


@then('verify that the file was accepted and utilized')
def verify_that_the_file_was_accepted_and_utilized(driver):
    """verify that the file was accepted and utilized."""
    time.sleep(1)
    assert wait_on_element(driver, 7, '//mat-card[contains(.,"Kerberos Keytab")]//div[contains(text(),"keytab_test")]')

    # return to dashboard
    assert wait_on_element(driver, 10, xpaths.sideMenu.dashboard, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()
    time.sleep(1)
