# coding=utf-8
"""SCALE UI feature tests."""
import time
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_for_attribute_value,
    wait_on_element_disappear,
)




def test_change_a_group_name(driver):
    """test_change_a_group_name"""
    # on the Groups page expand QE group and click edit
    assert wait_on_element(driver, 10, '//h1[contains(text(),"Groups")]')
    assert wait_on_element(driver, 7, '//span[contains(text(),"Edit")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Edit")]').click()


    # change the group name from qetest to qatest and click save
    assert wait_on_element(driver, 10, '//h3[contains(text(),"Edit Group")]')
    assert wait_on_element(driver, 7, '//ix-input[@formcontrolname="name"]//input')
    driver.find_element_by_xpath('//ix-input[@formcontrolname="name"]//input').clear()
    driver.find_element_by_xpath('//ix-input[@formcontrolname="name"]//input').send_keys('qatest')
    assert wait_on_element(driver, 7, '//span[contains(text(),"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save")]').click()


    # verify that the group name shows as qatest
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//h1[contains(.,"Groups")]')
    assert wait_on_element(driver, 10, '//div[contains(.,"qatest")]')