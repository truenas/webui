# coding=utf-8
"""SCALE UI: feature tests."""


import time
import glob
import os
import reusableSeleniumCode as rsc
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
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
        assert wait_on_element(driver, 10, xpaths.login.user_Input)
    if not is_element_present(driver, xpaths.side_Menu.dashboard):
        assert wait_on_element(driver, 10, xpaths.login.user_Input)
        driver.find_element_by_xpath(xpaths.login.user_Input).clear()
        driver.find_element_by_xpath(xpaths.login.user_Input).send_keys('root')
        driver.find_element_by_xpath(xpaths.login.password_Input).clear()
        driver.find_element_by_xpath(xpaths.login.password_Input).send_keys(root_password)
        assert wait_on_element(driver, 5, xpaths.login.signin_Button)
        driver.find_element_by_xpath(xpaths.login.signin_Button).click()
    else:
        assert wait_on_element(driver, 10, xpaths.side_Menu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.side_Menu.dashboard).click()


@when('on the dashboard, click on Credentials on the left sidebar')
def on_the_dashboard_click_on_credentials_on_the_left_sidebar(driver):
    """on the dashboard, click on Credentials on the left sidebar."""
    rsc.Verify_The_Dashboard(driver)
    assert wait_on_element(driver, 7, xpaths.side_Menu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.credentials).click()


@then('click on Directory Services')
def click_on_directory_services(driver):
    """click on Directory Services."""
    assert wait_on_element(driver, 7, xpaths.side_Menu.directory_Services, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.directory_Services).click()


@then('on the Directory Services page, click Show Advanced')
def on_the_directory_services_page_click_show_advanced(driver):
    """on the Directory Services page, click Show Advanced."""
    assert wait_on_element(driver, 7, xpaths.directory_Services.title)
    assert wait_on_element(driver, 7, xpaths.directory_Services.show_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.directory_Services.show_Button).click()


@then('on the Waring box click Continue')
def on_the_waring_box_click_continue(driver):
    """on the Waring box click Continue."""
    assert wait_on_element(driver, 7, xpaths.popup.warning)
    assert wait_on_element(driver, 7, xpaths.button.Continue, 'clickable')
    driver.find_element_by_xpath(xpaths.button.Continue).click()


@then('on the Kerberos Keytab card click Add')
def on_the_kerberos_keytab_card_click_add(driver):
    """on the Kerberos Keytab card click Add."""
    rsc.Click_On_Element(driver, xpaths.directory_Services.kerberos_Keytab_Add_Button)


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
    assert wait_on_element(driver, 7, xpaths.add_Kerberos_Keytab.title)
    assert wait_on_element(driver, 5, xpaths.add_Kerberos_Keytab.name_Input, 'inputable')
    driver.find_element_by_xpath(xpaths.add_Kerberos_Keytab.name_Input).clear()
    driver.find_element_by_xpath(xpaths.add_Kerberos_Keytab.name_Input).send_keys("keytab_test")
    # define file
    keytab_file_path = f'{os.getcwd()}/KEYTABNAME.KEYTAB'
    assert glob.glob(keytab_file_path)
    keytab_file = sorted(glob.glob(keytab_file_path))[-1]
    driver.find_element_by_xpath(xpaths.add_Kerberos_Keytab.file_input).send_keys(keytab_file)


@then('click save and verify that the file was accepted and utilized')
def click_save_and_verify_that_the_file_was_accepted_and_utilized(driver):
    """click save and verify that the file was accepted and utilized."""
    assert wait_on_element(driver, 7, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 10, xpaths.popup.please_Wait)
    assert wait_on_element(driver, 7, xpaths.directory_Services.title)
    assert wait_on_element(driver, 7, '//ix-kerberos-keytabs-list//span[contains(text(),"keytab_test")]')
