# !/usr/bin/env python3

import os
import pytest
import time
import xpaths
from configparser import ConfigParser
from function import (
    is_element_present,
    wait_on_element,
    get,
    post
)
from platform import system
from selenium import webdriver
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import ElementClickInterceptedException
from selenium.webdriver.firefox.firefox_binary import FirefoxBinary
from selenium.webdriver.firefox.options import Options

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
        os.environ["nas_ip"] = configs['NAS_CONFIG']['ip']
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
        os.environ["nas_password"] = configs['NAS_CONFIG']['password']
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
    options = Options()
    options.set_preference("browser.download.folderList", 2)
    options.set_preference("browser.download.dir", "/tmp")
    options.set_preference("browser.helperApps.neverAsk.saveToDisk", "application/x-tar,application/gzip")
    options.set_preference("browser.download.manager.showWhenStarting", False)
    options.set_preference("browser.link.open_newwindow", 3)
    binary = '/snap/firefox/current/usr/lib/firefox/firefox' if system() == "Linux" else '/usr/local/bin/firefox'
    geckodriver = '/snap/firefox/current/usr/lib/firefox/geckodriver' if system() == "Linux" else '/usr/local/bin/geckodriver'
    options.binary_location = binary
    driver = webdriver.Firefox(options=options, executable_path=geckodriver)
    driver.set_window_size(1920, 1080)
    driver.implicitly_wait(2)
    return driver


web_driver = browser()


@pytest.fixture
def driver():
    return web_driver


# Close Firefox after all tests are completed
def pytest_sessionfinish(session, exitstatus):
    web_driver.quit()


@pytest.hookimpl(hookwrapper=True)
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
            if 'T0962' in screenshot_name or 'T0964' in screenshot_name or 'T1120' in screenshot_name or 'T1104' in screenshot_name:
                disable_active_directory()


def save_screenshot(name):
    web_driver.save_screenshot(name)


def save_traceback(name):
    traceback_file = open(name, 'w')
    traceback_file.writelines(web_driver.find_element_by_xpath('//div[@id="err-bt-text"]').text)
    traceback_file.close()


def disable_active_directory():
    if 'ad_user' in os.environ and 'ad_password' in os.environ:
        results = get(os.environ.get("nas_ip"), '/activedirectory/get_state/', ('root', os.environ.get("nas_password")))
        assert results.status_code == 200, results.text
        if results.json() != 'DISABLED':
            payload = {
                "username": os.environ.get("ad_user"),
                "password": os.environ.get("ad_password")
            }
            results = post(os.environ.get("nas_ip"), "/activedirectory/leave/", ('root', os.environ.get("nas_password")), payload)
            assert results.status_code == 200, results.text
