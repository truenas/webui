
import xpaths
import time
from function import (
    wait_on_element
)


def click_The_Summit_Button(driver):
    assert wait_on_element(driver, 7, xpaths.button.summit, 'clickable')
    driver.find_element_by_xpath(xpaths.button.summit).click()


def wait_For_The_Tab_To_Close(driver):
    for num in range(10):
        if len(driver.window_handles) == 1:
            return True
        time.sleep(1)
    else:
        return False


def scroll_To(driver, xpath):
    assert wait_on_element(driver, 5, xpath)
    element = driver.find_element_by_xpath(xpath)
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.5)
