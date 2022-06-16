# !/usr/bin/env python3

import os
import pytest
import random
import string
import time
from configparser import ConfigParser
from platform import system
from selenium import webdriver
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
from selenium.common.exceptions import (
    ElementClickInterceptedException,
    NoSuchElementException,
    TimeoutException
)
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as ec
from selenium.webdriver import ActionChains
from selenium.webdriver.common.keys import Keys

# random hostname
hostname = f'uitest{"".join(random.choices(string.digits, k=3))}'


@pytest.fixture
def nas_hostname():
    return hostname


@pytest.fixture
def nas_ip():
    if os.environ.get("nas_ip"):
        return os.environ.get("nas_ip")
    elif os.path.exists('config.cfg'):
        configs = ConfigParser()
        configs.read('config.cfg')
        return configs['NAS_CONFIG']['ip']
    else:
        return 'none'


@pytest.fixture
def root_password():
    if os.environ.get("nas_password"):
        return os.environ.get("nas_password")
    elif os.path.exists('config.cfg'):
        configs = ConfigParser()
        configs.read('config.cfg')
        return configs['NAS_CONFIG']['password']
    else:
        return 'none'


@pytest.fixture
def iso_version():
    if os.environ.get("nas_version"):
        return os.environ.get("nas_version")
    elif os.path.exists('config.cfg'):
        configs = ConfigParser()
        configs.read('config.cfg')
        return configs['NAS_CONFIG']['version']
    else:
        return 'none'


def browser():
    profile = webdriver.FirefoxProfile()
    profile.set_preference("browser.download.folderList", 2)
    profile.set_preference("browser.download.dir", "/tmp")
    # this is the place to add file type to autosave
    # application/x-tar is use for .tar
    # application/gzip is use for .tgz
    profile.set_preference("browser.helperApps.neverAsk.saveToDisk", "application/x-tar,application/gzip,application/json")
    profile.set_preference("browser.download.manager.showWhenStarting", False)
    # browser.link.open_newwindow is frozen 2 the only way to change it is like bellow
    profile.DEFAULT_PREFERENCES["frozen"]["browser.link.open_newwindow"] = 3
    binary = '/usr/bin/firefox' if system() == "Linux" else '/usr/local/bin/firefox'
    firefox_capabilities = DesiredCapabilities.FIREFOX
    firefox_capabilities['marionette'] = True
    firefox_capabilities['firefox_profile'] = profile.encoded
    firefox_capabilities['binary'] = binary
    web_driver = webdriver.Firefox(capabilities=firefox_capabilities)
    web_driver.set_window_size(1920, 1080)
    web_driver.implicitly_wait(2)
    return web_driver


web_driver = browser()


@pytest.fixture
def driver():
    return web_driver


# Close Firefox after all tests are completed
def pytest_sessionfinish(session, exitstatus):
    web_driver.quit()


@pytest.mark.hookwrapper
def pytest_runtest_makereport(item):
    """
    Handle errors and tack screenshot whenever a test fails.
    """
    outcome = yield
    report = outcome.get_result()
    if report.when == 'call' and report.failed is True:
        folder = report.nodeid.partition('/')[0]
        raw_name = report.nodeid.replace("::", "_").partition('/')[2]
        filename = raw_name.replace('://', '_').replace('/', '_').replace(':', '')
        screenshot_name = f'screenshot/{folder}/{filename}.png'
        screenshot_error_name = f'screenshot/{folder}/{filename}_error.png'
        traceback_name = f'screenshot/{folder}/{filename}.txt'
        # look if there is a Error window
        error_xpath = '//h1[normalize-space(text())="Error"]'
        failed_xpath = '//h1[normalize-space(text())="FAILED"]'
        download_xpath = '//h1[normalize-space(text())="Error Downloading File"]'
        # This looks for plugins install error box and will close the dialog.
        if element_exist(error_xpath) or element_exist(failed_xpath) or element_exist(download_xpath):
            web_driver.find_element_by_xpath('//div[@ix-auto="button__backtrace-toggle"]').click()
            time.sleep(2)
            save_traceback(traceback_name)
            save_screenshot(screenshot_error_name)
            # Press CLOSE if exist only if there is an error box.
            time.sleep(1)
            try:
                web_driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
            except ElementClickInterceptedException:
                # if can't click Close ESCAPE
                ActionChains(web_driver).send_keys(Keys.ESCAPE).perform()
        save_screenshot(screenshot_name)
        # This looks for plugins install error box and will close the dialog.
        if element_exist('//mat-dialog-container[contains(.,"Install") and contains(.,"Error")]'):
            try:
                web_driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
            except ElementClickInterceptedException:
                # if can't click Close ESCAPE
                ActionChains(web_driver).send_keys(Keys.ESCAPE).perform()

        # To make sure we are not stuck on a combobox to stop other test to fail
        if element_exist('//mat-option'):
            ActionChains(web_driver).send_keys(Keys.TAB).perform()
        # If the current tab is not the initial tab close the tab
        # and switch to initial tab
        initial_tab = web_driver.window_handles[0]
        current_tab = web_driver.current_window_handle
        all_tab = web_driver.window_handles
        tab_number = len(all_tab)
        if initial_tab != current_tab:
            web_driver.close()
            web_driver.switch_to.window(initial_tab)
        elif initial_tab == current_tab and tab_number > 1:
            for handle in all_tab:
                web_driver.switch_to.window(handle)
                if handle != initial_tab:
                    web_driver.close()
            web_driver.switch_to.window(initial_tab)
        if 'T1010' in screenshot_name:
            disable_active_directory()
        elif 'T1013' in screenshot_name:
            disable_ldap()


def save_screenshot(name):
    web_driver.save_screenshot(name)


def save_traceback(name):
    traceback_file = open(name, 'w')
    traceback_file.writelines(web_driver.find_element_by_xpath('//textarea[@id="err-bt-text"]').text)
    traceback_file.close()


def element_exist(xpath):
    try:
        web_driver.find_element_by_xpath(xpath)
        return True
    except NoSuchElementException:
        return False


def wait_on_element(wait, xpath, condition=None):
    if condition == 'clickable':
        try:
            WebDriverWait(web_driver, wait).until(ec.element_to_be_clickable((By.XPATH, xpath)))
            return True
        except TimeoutException:
            return False
    if condition == 'presence':
        try:
            WebDriverWait(web_driver, wait).until(ec.presence_of_element_located((By.XPATH, xpath)))
            return True
        except TimeoutException:
            return False
    else:
        try:
            WebDriverWait(web_driver, wait).until(ec.visibility_of_element_located((By.XPATH, xpath)))
            return True
        except TimeoutException:
            return False


def wait_on_element_disappear(wait, xpath):
    timeout = time.time() + wait
    while time.time() <= timeout:
        if not element_exist(xpath):
            return True
        # this just to slow down the loop
        time.sleep(0.1)
    else:
        return False


def attribute_value_exist(xpath, attribute, value):
    element = web_driver.find_element_by_xpath(xpath)
    class_attribute = element.get_attribute(attribute)
    if value in class_attribute:
        return True
    else:
        return False


def enable_failover():
    # make sure to scroll back up the mat-list-item
    element = web_driver.find_element_by_xpath('//span[contains(.,"root")]')
    web_driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    web_driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System"]').click()
    wait_on_element(5, '//mat-list-item[@ix-auto="option__Failover"]')
    web_driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Failover"]').click()
    wait_on_element(5, '//h4[contains(.,"Failover Configuration")]')
    element = web_driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Disable Failover"]')
    class_attribute = element.get_attribute('class')
    if 'mat-checkbox-checked' in class_attribute:
        web_driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Disable Failover"]').click()
        wait_on_element(5, '//button[@ix-auto="button__SAVE"]')
        web_driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
        wait_on_element(5, '//h1[contains(.,"Settings saved")]')
        if element_exist('//button[@ix-auto="button__CLOSE"]'):
            web_driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    time.sleep(1)
    # make sure to scroll back up the mat-list-item
    element = web_driver.find_element_by_xpath('//span[contains(.,"root")]')
    web_driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    web_driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    wait_on_element(90, '//mat-icon[@svgicon="ha_enabled"]')


def disable_active_directory():
    wait_on_element(7, '//mat-list-item[@ix-auto="option__Directory Services"]')
    web_driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Directory Services"]').click()
    wait_on_element(7, '//mat-list-item[@ix-auto="option__Active Directory"]')
    web_driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Active Directory"]').click()
    wait_on_element(5, '//mat-checkbox[@ix-auto="checkbox__Enable (requires password or Kerberos principal)"]')
    value_exist = attribute_value_exist('//mat-checkbox[@ix-auto="checkbox__Enable (requires password or Kerberos principal)"]', 'class', 'mat-checkbox-checked')
    if value_exist:
        web_driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Enable (requires password or Kerberos principal)"]').click()
    wait_on_element(7, '//button[@ix-auto="button__SAVE"]', 'clickable')
    web_driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    if wait_on_element_disappear(120, '//h6[contains(.,"Please wait")]') is False:
        web_driver.refresh()


def disable_ldap():
    wait_on_element(5, '//span[contains(.,"root")]')
    element = web_driver.find_element_by_xpath('//span[contains(.,"root")]')
    web_driver.execute_script("arguments[0].scrollIntoView();", element)
    wait_on_element(7, '//mat-list-item[@ix-auto="option__Directory Services"]')
    web_driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Directory Services"]').click()
    wait_on_element(7, '//mat-list-item[@ix-auto="option__LDAP"]')
    web_driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__LDAP"]').click()
    wait_on_element(5, '//mat-checkbox[@ix-auto="checkbox__Enable"]')
    value_exist = attribute_value_exist('//mat-checkbox[@ix-auto="checkbox__Enable"]', 'class', 'mat-checkbox-checked')
    if value_exist:
        web_driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Enable"]').click()
    wait_on_element(5, '//button[@ix-auto="button__SAVE"]', 'clickable')
    web_driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    if wait_on_element_disappear(60, '//h6[contains(.,"Please wait")]') is False:
        web_driver.refresh()
