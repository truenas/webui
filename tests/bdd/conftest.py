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
from selenium.webdriver.firefox.options import Options

# To avoid hostname need to be unique so using the PID should avoid this
pid = str(os.getpid())
hostname = f'uitest{pid}'


def get_config_value(key: str) -> str:
    """
    This function return the value of the given key in environment or config.cfg file.
    """
    if os.environ.get(f'nas_{key}'):
        return os.environ.get(f'nas_{key}')
    elif os.path.exists('config.cfg'):
        configs = ConfigParser()
        configs.read('config.cfg')
        os.environ[f'nas_{key}'] = configs['NAS_CONFIG']['key']
        return configs['DEFAULT'][key]
    else:
        return 'none'


@pytest.fixture
def nas_hostname():
    return hostname


@pytest.fixture
def nas_ip():
    return get_config_value('ip')


@pytest.fixture
def nas_ip2():
    return get_config_value('ip2')


@pytest.fixture
def nas_vip():
    return get_config_value('vip')


@pytest.fixture
def root_password():
    return get_config_value('password')


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
    if report.when in ['call', 'setup', 'teardown']:
        xfail = hasattr(report, 'wasxfail')
        if (report.skipped and xfail) or (report.failed and not xfail):
            screenshot_name = f'screenshot/{report.nodeid.partition("[")[0].replace("::", "_")}.png'
            # look if there is a Error window
            errors = [
                is_element_present(web_driver, '//h1[contains(text(),"Error")]'),
                is_element_present(web_driver, '//h1[contains(text(),"FAILED")]'),
                is_element_present(web_driver, '//h1[contains(text(),"VALIDATION")]')
            ]
            if any(errors):
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
            substrings = ('T0962', 'T0964', 'T1120', 'T1104')
            if any(sub in screenshot_name for sub in substrings):
                disable_active_directory()


def save_screenshot(name):
    web_driver.save_screenshot(name)


def save_traceback(name):
    with open(name, 'w') as traceback_file:
        traceback_file.writelines(web_driver.find_element_by_xpath('//div[@id="err-bt-text"]').text)


def disable_active_directory():
    ip = (
        os.environ.get("nas_ip")
        if os.environ.get("nas_vip") == 'none'
        else os.environ.get("nas_vip")
    )
    if 'ad_user' in os.environ and 'ad_password' in os.environ:
        results = get(ip, '/activedirectory/get_state/', ('root', os.environ.get("nas_password")))
        assert results.status_code == 200, results.text
        if results.json() != 'DISABLED':
            payload = {
                "username": os.environ.get("ad_user"),
                "password": os.environ.get("ad_password")
            }
            results = post(os.environ.get("nas_ip"), "/activedirectory/leave/", ('root', os.environ.get("nas_password")), payload)
            assert results.status_code == 200, results.text
