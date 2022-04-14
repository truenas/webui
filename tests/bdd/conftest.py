# !/usr/bin/env python3

import os
import pytest
import random
import string
import time
from configparser import ConfigParser
from platform import system
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
from selenium.common.exceptions import (
    NoSuchElementException,
    TimeoutException,
    ElementClickInterceptedException
)
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as ec

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
    profile.set_preference("browser.helperApps.neverAsk.saveToDisk", "application/x-tar,application/gzip")
    profile.set_preference("browser.download.manager.showWhenStarting", False)
    profile.set_preference("browser.link.open_newwindow", 3)
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
    Extends the PyTest Plugin to take and embed screenshot whenever test fails.
    """
    outcome = yield
    report = outcome.get_result()
    if report.when == 'call' or report.when == "setup":
        xfail = hasattr(report, 'wasxfail')
        if (report.skipped and xfail) or (report.failed and not xfail):
            screenshot_name = f'screenshot/{report.nodeid.replace("::", "_")}.png'
            # look if there is a Error window
            if element_exist('//h1[contains(.,"Error")]') or element_exist('//h1[contains(.,"FAILED")]'):
                web_driver.find_element_by_xpath('//div[@ix-auto="button__backtrace-toggle"]').click()
                time.sleep(2)
                traceback_name = f'screenshot/{report.nodeid.replace("::", "_")}_error.txt'
                screenshot_error = f'screenshot/{report.nodeid.replace("::", "_")}_error.png'
                save_traceback(traceback_name)
                # take a screenshot of the error
                save_screenshot(screenshot_error)
                # Press CLOSE if exist
                if element_exist('//button[@ix-auto="button__CLOSE"]'):
                    web_driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
            # take screenshot after looking for error
            save_screenshot(screenshot_name)
            if wait_on_element(1, '//mat-icon[@id="close-icon" and text()="cancel"]', 'clickable'):
                try:
                    web_driver.find_element_by_xpath('//mat-icon[@id="close-icon" and text()="cancel"]').click()
                except ElementClickInterceptedException:
                    try:
                        # Press Tab in case a dropdown is in the way
                        actions = ActionChains(web_driver)
                        actions.send_keys(Keys.TAB)
                        actions.perform()
                        web_driver.find_element_by_xpath('//mat-icon[@id="close-icon" and text()="cancel"]').click()
                    except ElementClickInterceptedException:
                        pass


def save_screenshot(name):
    web_driver.save_screenshot(name)


def save_traceback(name):
    traceback_file = open(name, 'w')
    traceback_file.writelines(web_driver.find_element_by_xpath('//div[@id="err-bt-text"]').text)
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
    elif condition == 'inputable':
        time.sleep(1)
        try:
            WebDriverWait(web_driver, wait).until(ec.element_to_be_clickable((By.XPATH, xpath)))
            return True
        except TimeoutException:
            return False
    elif condition == 'presence':
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


def enable_failover():
    web_driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    wait_on_element(web_driver, 0.5, 7, '//mat-list-item[@ix-auto="option__System Settings"]')
    web_driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System Settings"]').click()
    wait_on_element(web_driver, 0.5, 7, '//mat-list-item[@ix-auto="option__Misc"]')
    web_driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Misc"]').click()
    assert wait_on_element(web_driver, 0.5, 7, '//h1[contains(.,"Miscellaneous")]')
    assert wait_on_element(web_driver, 0.5, 7, '//li[contains(.,"Failover")]')
    web_driver.find_element_by_xpath('//li[contains(.,"Failover")]').click()
    assert wait_on_element(web_driver, 0.5, 7, '//h1[contains(.,"Failover")]')
    element = web_driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Disable Failover"]')
    class_attribute = element.get_attribute('class')
    if 'mat-checkbox-checked' in class_attribute:
        web_driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Disable Failover"]').click()
        wait_on_element(0.5, 5, '//button[@ix-auto="button__SAVE"]')
        web_driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
        wait_on_element(0.5, 4, '//h1[contains(.,"Settings saved")]')
        if element_exist('//button[@ix-auto="button__CLOSE"]'):
            web_driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    time.sleep(1)
    web_driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
