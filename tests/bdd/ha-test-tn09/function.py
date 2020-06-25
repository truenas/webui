#!/usr/bin/env python3

import time
from selenium.webdriver.common.by import By
from selenium.common.exceptions import NoSuchElementException


def is_element_present(driver, bytype, what):
    if bytype == 'xpath':
        how = By.XPATH
    elif bytype == 'id':
        how = By.ID
    try:
        driver.find_element(by=how, value=what)
    except NoSuchElementException:
        return False
    return True


def wait_on_element(driver, wait, loop, bytype, what):
    for _ in range(loop):
        time.sleep(wait)
        if is_element_present(driver, bytype, what):
            return True
        time.sleep(0.5)
    else:
        return False
