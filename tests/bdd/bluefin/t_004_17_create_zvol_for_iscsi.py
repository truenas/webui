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




def test_create_zvol_for_iscsi(driver, name, zvol_1G_size):
    """test_create_zvol_for_iscsi"""
    if not is_element_present(driver, '//h1[contains(.,"Datasets")]'):
        #assert wait_on_element_disappear(driver, 15, '//div[contains(@class,"cdk-overlay-backdrop-showing")]')
        driver.find_element_by_xpath('//a//span[contains(text(),"Datasets")]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Datasets")]')


    # click on the tank, then Add Zvol, and the Add Zvol page should open
    if not is_element_present(driver, '//div[((contains(@class,"selected")) and (contains(.,"tank")) and not(contains(.,"encrypted_tank")))]'):
        assert wait_on_element(driver, 10, '//span[(contains(.,"tank")) and not(contains(.,"encrypted_tank"))]', 'clickable')
        driver.find_element_by_xpath('//span[(contains(.,"tank")) and not(contains(.,"encrypted_tank"))]').click()
    assert wait_on_element( driver, 10, '//div[((contains(@class,"selected")) and (contains(.,"tank")) and not(contains(.,"encrypted_tank")))]') 
    assert wait_on_element(driver, 10, '//span[contains(text(),"Add Zvol")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Add Zvol")]').click()


    # input {name} for Zvol Name and "{zvol_1G_size}" for Zvol Size, click the SUBMIT button,
    assert wait_on_element(driver, 10, '//ix-input//ix-label//label//span[contains(.,"Zvol name")]//ancestor::ix-input//div//input', 'inputable')

    driver.find_element_by_xpath('//ix-input//ix-label//label//span[contains(.,"Zvol name")]//ancestor::ix-input//div//input').send_keys(name)
    assert wait_on_element(driver, 10, '//ix-input//ix-label//label//span[contains(.,"Size for this zvol")]//ancestor::ix-input//div//input', 'inputable')
    driver.find_element_by_xpath('//ix-input//ix-label//label//span[contains(.,"Size for this zvol")]//ancestor::ix-input//div//input').clear()
    driver.find_element_by_xpath('//ix-input//ix-label//label//span[contains(.,"Size for this zvol")]//ancestor::ix-input//div//input').send_keys(zvol_1G_size)
    assert wait_on_element(driver,  10, '//span[contains(.,"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Save")]').click()



    # Please wait should appear, And the nopeer1 zvol should be created
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//div[contains(.,"nopeer1")]')