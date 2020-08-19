# !/usr/bin/env python3

import pytest
import os
import time
from configparser import ConfigParser
from platform import system
from selenium import webdriver
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
from selenium.common.exceptions import NoSuchElementException


def browser():
    profile = webdriver.FirefoxProfile()
    profile.set_preference("browser.download.folderList", 2)
    profile.set_preference("browser.download.dir", "/tmp")
    profile.set_preference("browser.helperApps.neverAsk.saveToDisk", "text/json")
    profile.set_preference("browser.download.manager.showWhenStarting", False)
    profile.set_preference("browser.link.open_newwindow", 3)
    binary = '/usr/bin/firefox' if system() == "Linux" else '/usr/local/bin/firefox'
    firefox_capabilities = DesiredCapabilities.FIREFOX
    firefox_capabilities['marionette'] = True
    firefox_capabilities['firefox_profile'] = profile.encoded
    firefox_capabilities['binary'] = binary
    web_driver = webdriver.Firefox(capabilities=firefox_capabilities)
    web_driver.implicitly_wait(2)
    return web_driver


web_driver = browser()


@pytest.fixture
def driver():
    return web_driver


if os.path.exists('config.cfg'):
    configs = ConfigParser()
    configs.read('config.cfg')
    ip = configs['NAS_CONFIG']['ip']
    password = configs['NAS_CONFIG']['password']

    @pytest.fixture
    def ui_url():
        global url
        url = f"http://{ip}"
        return url

    @pytest.fixture
    def root_password():
        return password


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
            if element_exist('//h1[contains(.,"Error")]'):
                web_driver.find_element_by_xpath('//div[@ix-auto="button__backtrace-toggle"]').click()
                time.sleep(2)
                traceback_name = f'screenshot/{report.nodeid.replace("::", "_")}.txt'
                save_traceback(traceback_name)
            save_screenshot(screenshot_name)
            # Press CLOSE if exist
            if element_exist('//button[@ix-auto="button__CLOSE"]'):
                web_driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
            else:
                if element_exist('//button[@ix-auto="button__I AGREE"]'):
                    web_driver.find_element_by_xpath('//button[@ix-auto="button__I AGREE"]').click()
            # if test that use disable failover make sure to enable failover back.
            if 'T0905' in screenshot_name or 'T0919' in screenshot_name or 'T0920' in screenshot_name or 'T0922' in screenshot_name:
                if element_exist('//mat-icon[@svgicon="ha_disabled"]'):
                    enable_failover()


def save_screenshot(name):
    web_driver.save_screenshot(name)


def save_traceback(name):
    traceback_file = open(name, 'w')
    traceback_file.writelines(web_driver.find_element_by_xpath('//textarea').text)
    traceback_file.close()


def element_exist(xpath):
    try:
        web_driver.find_element_by_xpath(xpath)
        return True
    except NoSuchElementException:
        return False


def wait_on_element(wait, loop, xpath):
    for _ in range(loop):
        time.sleep(wait)
        if element_exist(xpath):
            return True
    else:
        return False


def enable_failover():
    # make sure to scroll back up the mat-list-item
    element = web_driver.find_element_by_xpath('//span[contains(.,"root")]')
    web_driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    web_driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System"]').click()
    wait_on_element(0.5, 7, '//mat-list-item[@ix-auto="option__Failover"]')
    web_driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Failover"]').click()
    wait_on_element(0.5, 7, '//h4[contains(.,"Failover Configuration")]')
    element = web_driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Disable Failover"]')
    class_attribute = element.get_attribute('class')
    if 'mat-checkbox-checked' in class_attribute:
        web_driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Disable Failover"]').click()
        wait_on_element(0.5, 7, '//button[@ix-auto="button__SAVE"]')
        web_driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
        wait_on_element(0.5, 7, '//h1[contains(.,"Settings saved")]')
        web_driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    time.sleep(1)
    # make sure to scroll back up the mat-list-item
    element = web_driver.find_element_by_xpath('//span[contains(.,"root")]')
    web_driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
    web_driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    wait_on_element(1, 90, '//mat-icon[@svgicon="ha_enabled"]')
