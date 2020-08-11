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
            file_name = f'screenshot/{report.nodeid.replace("::", "_")}.png'
            # look if there is a Error window
            error_exist = element_exist('//h1[contains(.,"Error")]')
            if error_exist:
                web_driver.find_element_by_xpath('//div[@ix-auto="button__backtrace-toggle"]').click()
                time.sleep(2)
            # //textarea <- xpath for TraceBack
            capture_screenshot(file_name)
            # Press CLOSE if exist
            close_button_exist = element_exist('//button[@ix-auto="button__CLOSE"]')
            if close_button_exist:
                web_driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()


def capture_screenshot(name):
    web_driver.save_screenshot(name)


def element_exist(xpath):
    try:
        web_driver.find_element_by_xpath(xpath)
        return True
    except NoSuchElementException:
        return False
