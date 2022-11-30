# coding=utf-8
"""SCALE UI feature tests."""

from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear
)


def test_create_zvol_for_iscsi(driver, name, zvol_1G_size):
    """test_create_zvol_for_iscsi"""
    if not is_element_present(driver, '//h1[contains(.,"Datasets")]'):
        # assert wait_on_element_disappear(driver, 15, '//div[contains(@class,"cdk-overlay-backdrop-showing")]')
        driver.find_element_by_xpath('//a//span[contains(text(),"Datasets")]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Datasets")]')

    # click on the tank, then Add Zvol, and the Add Zvol page should open
    if not is_element_present(driver, '//div[((contains(@class,"selected")) and (contains(.,"tank")) and not(contains(.,"encrypted_tank")))]'):
        assert wait_on_element(driver, 10, '//span[(contains(.,"tank")) and not(contains(.,"encrypted_tank"))]', 'clickable')
        driver.find_element_by_xpath('//span[(contains(.,"tank")) and not(contains(.,"encrypted_tank"))]').click()
    assert wait_on_element(driver, 10, '//div[((contains(@class,"selected")) and (contains(.,"tank")) and not(contains(.,"encrypted_tank")))]')
    assert wait_on_element(driver, 10, '//span[contains(text(),"Add Zvol")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Add Zvol")]').click()

    assert wait_on_element(driver, 7, '//h3[text()="Add Zvol"]')

    # input {name} for Zvol Name and "{zvol_1G_size}" for Zvol Size, click the SUBMIT button,
    assert wait_on_element(driver, 10, '//input[@ix-auto="input__Zvol name"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Zvol name"]').send_keys(name)
    assert wait_on_element(driver, 10, '//input[@ix-auto="input__Size for this zvol"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Size for this zvol"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Size for this zvol"]').send_keys(zvol_1G_size)
    assert wait_on_element(driver, 10, '//span[contains(.,"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Save")]').click()

    # Please wait should appear, And the nopeer1 zvol should be created
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//div[contains(.,"nopeer1")]')
