
import xpaths
from function import (
    wait_on_element
)


def click_theSommit_button(driver):
    assert wait_on_element(driver, 7, xpaths.button.summit, 'clickable')
    driver.find_element_by_xpath(xpaths.button.summit).click()
