
import xpaths
import time
from function import (
    wait_on_element,
    attribute_value_exist
)
from selenium.webdriver import ActionChains


def click_The_Summit_Button(driver: classmethod):
    assert wait_on_element(driver, 7, xpaths.button.summit, 'clickable')
    driver.find_element_by_xpath(xpaths.button.summit).click()


def double_click(driver: classmethod, xpath: str, wait: bool = True):
    assert wait_on_element(driver, 10, xpath)
    driver.find_element_by_xpath(xpath).click()
    action = ActionChains(driver)
    action.double_click(driver.find_element_by_xpath(xpath)).perform()
    time.sleep(1)


def wait_For_The_Tab_To_Close(driver: classmethod):
    for num in range(10):
        if len(driver.window_handles) == 1:
            return True
        time.sleep(1)
    else:
        return False


def scroll_To(driver: classmethod, xpath: str):
    assert wait_on_element(driver, 5, xpath, 'clickable')
    element = driver.find_element_by_xpath(xpath)
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(0.2)


def click_on_element(driver: classmethod, xpath: str):
    assert wait_on_element(driver, 5, xpath, 'clickable')
    driver.find_element_by_xpath(xpath).click()


def click_If_Element_Exist(driver: classmethod, xpath: str):
    if wait_on_element(driver, 5, xpath, 'clickable'):
        driver.find_element_by_xpath(xpath).click()


def set_service_checkbox(driver: classmethod, service_name: str):
    """
    This function will toggle the service on.

    :param driver: Webdriver Instance
    :param service_name: Name of the service ex. 'SMB'

    Example:
        set_service_checkbox(driver, 'SMB')
    """
    assert wait_on_element(driver, 7, f'//*[@ix-auto="checkbox__{service_name}_Start Automatically"]', 'clickable')
    value_exist = attribute_value_exist(driver, f'//*[@ix-auto="checkbox__{service_name}_Start Automatically"]', 'class',
                                        'mat-checkbox-checked')
    if not value_exist:
        driver.find_element_by_xpath(f'//*[@ix-auto="checkbox__{service_name}_Start Automatically"]').click()


def set_service_toggle(driver: classmethod, service_name: str):
    """
    This function will toggle the service on.

    :param driver: Webdriver Instance
    :param service_name: Name of the service ex. 'SMB'

    Example:
        set_service_toggle(driver, 'SMB')
    """
    assert wait_on_element(driver, 7, f'//*[@ix-auto="overlay__{service_name}_Running"]', 'clickable')
    value_exist = attribute_value_exist(driver, f'//*[@ix-auto="slider__{service_name}_Running"]', 'class',
                                        'mat-checked')
    if not value_exist:
        driver.find_element_by_xpath(f'//*[@ix-auto="overlay__{service_name}_Running"]').click()
        time.sleep(2)
