#!/usr/bin/env python3

import time
from selenium.common.exceptions import (
    NoSuchElementException,
    TimeoutException
)
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as ec

header = {'Content-Type': 'application/json', 'Vary': 'accept'}


def is_element_present(driver, xpath):
    try:
        driver.find_element_by_xpath(xpath)
    except NoSuchElementException:
        return False
    return True


def wait_on_element(driver, wait, xpath, condition=None):
    if condition == 'clickable':
        try:
            WebDriverWait(driver, wait).until(ec.element_to_be_clickable((By.XPATH, xpath)))
            return True
        except TimeoutException:
            return False
    if condition == 'presence':
        try:
            WebDriverWait(driver, wait).until(ec.presence_of_element_located((By.XPATH, xpath)))
            return True
        except TimeoutException:
            return False
    else:
        try:
            WebDriverWait(driver, wait).until(ec.visibility_of_element_located((By.XPATH, xpath)))
            return True
        except TimeoutException:
            return False


def wait_on_element_disappear(driver, wait, xpath):
    timeout = time.time() + wait
    while time.time() <= timeout:
        if not is_element_present(driver, xpath):
            return True
        # this just to slow down the loop
        time.sleep(0.1)
    else:
        return False


def attribute_value_exist(driver, xpath, attribute, value):
    element = driver.find_element_by_xpath(xpath)
    class_attribute = element.get_attribute(attribute)
    if value in class_attribute:
        return True
    else:
        return False


def wait_for_attribute_value(driver, wait, xpath, attribute, value):
    timeout = time.time() + wait
    while time.time() <= timeout:
        if attribute_value_exist(driver, xpath, attribute, value):
            return True
        # this just to slow down the loop
        time.sleep(0.1)
    else:
        return False
