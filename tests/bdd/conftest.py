# !/usr/bin/env python3

import os
import pytest
import time
import xpaths
from configparser import ConfigParser
from function import (
    is_element_present,
    wait_on_element
)
from platform import system
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities
from selenium.common.exceptions import ElementClickInterceptedException

# To avoid hostname need to be unique so using the PID should avoid this
pid = str(os.getpid())
hostname = f'uitest{pid}'


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
# def pytest_sessionfinish(session, exitstatus):
#     web_driver.quit()


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
            screenshot_name = f'screenshot/{report.nodeid.partition("[")[0].replace("::", "_")}.png'
            # look if there is a Error window
            if is_element_present(web_driver, '//h1[contains(.,"Error")]') or is_element_present(web_driver, '//h1[contains(.,"FAILED")]'):
                web_driver.find_element_by_xpath('//ix-icon[@fonticon="add_circle_outline"]').click()
                time.sleep(2)
                traceback_name = f'screenshot/{report.nodeid.partition("[")[0].replace("::", "_")}_error.txt'
                screenshot_error = f'screenshot/{report.nodeid.partition("[")[0].replace("::", "_")}_error.png'
                save_traceback(traceback_name)
                # take a screenshot of the error
                save_screenshot(screenshot_error)
                # Press CLOSE if exist
                if is_element_present(web_driver, xpaths.button.close):
                    web_driver.find_element_by_xpath(xpaths.button.close).click()

            # take screenshot after looking for error
            save_screenshot(screenshot_name)

            if is_element_present(web_driver, '//h1[contains(text(),"Installing")]') and is_element_present(web_driver, '//mat-dialog-content[contains(.,"Error:")]'):
                web_driver.find_element_by_xpath(xpaths.button.close).click()

            if wait_on_element(web_driver, 1, '//ix-icon[@id="ix-close-icon"]', 'clickable'):
                try:
                    web_driver.find_element_by_xpath('//ix-icon[@id="ix-close-icon"]').click()
                except ElementClickInterceptedException:
                    try:
                        # Press Tab in case a dropdown is in the way
                        actions = ActionChains(web_driver)
                        actions.send_keys(Keys.TAB)
                        actions.perform()
                        web_driver.find_element_by_xpath('//ix-icon[@id="ix-close-icon"]').click()
                    except ElementClickInterceptedException:
                        pass


def save_screenshot(name):
    web_driver.save_screenshot(name)


def save_traceback(name):
    traceback_file = open(name, 'w')
    traceback_file.writelines(web_driver.find_element_by_xpath('//div[@id="err-bt-text"]').text)
    traceback_file.close()
