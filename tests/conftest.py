# !/usr/bin/env python

import pytest
import os
import json
from config import browser, ip
from platform import system
from selenium import webdriver
# from example import run_creat_nameofthetest
from selenium.webdriver.firefox.firefox_binary import FirefoxBinary
from selenium.webdriver import FirefoxProfile
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities

cwd = str(os.getcwd())


def webDriverFirefox():
    profile = FirefoxProfile()
    profile.set_preference('font.default.x-western', 'sans-serif')
    profile.set_preference('font.name.serif.x-western', 'sans-serif')
    profile.set_preference('font.size.variable.x-western', 14)
    profile.set_preference('general.warnOnAboutConfig', False)
    profile.set_preference('layout.css.devPixelsPerPx', '1.0')
    profile.set_preference('browser.sessionstore.resume_from_crash', False)
    profile.set_preference('dom.webnotifications.enabled', False)
    profile.update_preferences()

    if system() == "FreeBSD":
        binary = FirefoxBinary('/usr/local/bin/firefox')
    elif system() == "Linux":
        binary = FirefoxBinary('/usr/bin/firefox')
    elif system() == "Windows":
        pass

    caps = DesiredCapabilities.FIREFOX.copy()
    caps['marionette'] = True
    caps['screenResolution'] = '2560x1440'
    # marionette setting is fixed in selenium 3.0 and above by default
    driver = webdriver.Firefox(
        firefox_profile=profile,
        capabilities=caps,
        firefox_binary=binary
    )
    driver.set_window_size(1470, 900)
    return driver


def webDriverChrome():
    # marionette setting is fixed in selenium 3.0 and above by default
    # caps = webdriver.DesiredCapabilities().FIREFOX
    # caps["marionette"] = False
    driver = webdriver.Chrome()
    driver.implicitly_wait(30)
    driver.maximize_window()
    return driver


if browser == "Firefox":
    driver = webDriverFirefox()
elif browser == "Chrome":
    driver = webDriverChrome()


@pytest.fixture
def wb_driver():
    global driver
    return driver


@pytest.fixture
def ui_url():
    global url
    url = "http://%s" % ip
    return url


@pytest.fixture
def login_json():
    json_file = open(f'{cwd}/side/login.side', 'r')
    data = json.load(json_file)
    json_file.close()
    return data
