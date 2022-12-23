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


@when('on the dashboard, click on Credentials on the left sidebar')
def on_the_dashboard_click_on_credentials_on_the_left_sidebar(driver):
    """on the dashboard, click on Credentials on the left sidebar."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 7, xpaths.sideMenu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.credentials).click()


@then('click on Directory Services')
def click_on_directory_services(driver):
    """click on Directory Services."""
    assert wait_on_element(driver, 7, xpaths.sideMenu.directoryServices, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.directoryServices).click()


@then('on the Directory Services page, click Show Advanced')
def on_the_directory_services_page_click_show_advanced(driver):
    """on the Directory Services page, click Show Advanced."""
    assert wait_on_element(driver, 7, xpaths.directoryServices.title)
    assert wait_on_element(driver, 7, xpaths.directoryServices.showButton, 'clickable')
    driver.find_element_by_xpath(xpaths.directoryServices.showButton).click()


@then('on the Waring box click Continue')
def on_the_waring_box_click_continue(driver):
    """on the Waring box click Continue."""
    assert wait_on_element(driver, 7, xpaths.popup.warning)
    assert wait_on_element(driver, 7, xpaths.button.Continue, 'clickable')
    driver.find_element_by_xpath(xpaths.button.Continue).click()


@then('on the Kerberos Keytab card click Add')
def on_the_kerberos_keytab_card_click_add(driver):
    """on the Kerberos Keytab card click Add."""
    assert wait_on_element(driver, 7, xpaths.directoryServices.kerberosKeytabAdd_button, 'clickable')
    driver.find_element_by_xpath(xpaths.directoryServices.kerberosKeytabAdd_button).click()


@then(parsers.parse('decode the tabfile with "{tabfile_string}"'))
def decode_the_tabfile_with_tabfile_string(driver, tabfile_string):
    """decode the tabfile with tabfile_string."""
    global tabfile
    global tab_result
    global datafile
    # open tabfile
    tabfile_path = f'{os.getcwd()}/tabfile'
    assert glob.glob(tabfile_path)
    tabfile = sorted(glob.glob(tabfile_path))[-1]
    datafile = open(os.path.expanduser(tabfile_path), 'rb').read()
    tab_result = word_xor(datafile, tabfile_string)
    time.sleep(2)
    open('KEYTABNAME.KEYTAB', 'wb').write(tab_result)


@then('on the Add Kerberos Keytab input name and upload the file')
def on_the_add_kerberos_keytab_input_name_and_upload_the_file(driver):
    """on the Add Kerberos Keytab input name and upload the file."""
    assert wait_on_element(driver, 7, xpaths.addKerberosKeytab.title)
    assert wait_on_element(driver, 5, xpaths.addKerberosKeytab.name_input, 'inputable')
    driver.find_element_by_xpath(xpaths.addKerberosKeytab.name_input).clear()
    driver.find_element_by_xpath(xpaths.addKerberosKeytab.name_input).send_keys("keytab_test")
    # define file
    keytab_file_path = f'{os.getcwd()}/KEYTABNAME.KEYTAB'
    assert glob.glob(keytab_file_path)
    keytab_file = sorted(glob.glob(keytab_file_path))[-1]
    driver.find_element_by_xpath(xpaths.addKerberosKeytab.file_input).send_keys(keytab_file)


@then('click save and verify that the file was accepted and utilized')
def click_save_and_verify_that_the_file_was_accepted_and_utilized(driver):
    """click save and verify that the file was accepted and utilized."""
    assert wait_on_element(driver, 7, xpaths.button.save, 'clickabl')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element(driver, 7, '//mat-card[contains(.,"Kerberos Keytab")]//div[contains(text(),"keytab_test")]')
