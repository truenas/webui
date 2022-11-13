# coding=utf-8
"""SCALE UI feature tests."""
import time
from selenium.webdriver.common.keys import Keys
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_for_attribute_value,
    wait_on_element_disappear
)




def test_create_a_csr(driver):
    """test_create_a_csr"""
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
    assert wait_on_element(driver, 7, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Certificates"]', 'clickable')
    driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Certificates"]').click()


    # click on CSR add
    assert wait_on_element(driver, 7, '//h3[contains(text(),"Certificate Signing Requests")]')
    assert wait_on_element(driver, 5, '//mat-card[contains(.,"Certificate Signing Requests")]//button[contains(.,"Add")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"Certificate Signing Requests")]//button[contains(.,"Add")]').click()


    # set name and type and click next
    assert wait_on_element(driver, 10, '//h3[contains(text(),"Add CSR")]')
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys('csr1')
    assert wait_on_element(driver, 10, '//div[contains(.,"Identifier and Type") and contains(@class,"mat-step")]//button[@ix-auto="button__NEXT"]', 'clickable')
    driver.find_element_by_xpath('//div[contains(.,"Identifier and Type") and contains(@class,"mat-step")]//button[@ix-auto="button__NEXT"]').click()


    # set key info and click next
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Key Type"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Key Type"]').click()
    assert wait_on_element(driver, 10, '//span[contains(.,"RSA")]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Key Type_RSA"]').click()

    assert wait_on_element(driver, 10, '//div[contains(.,"Certificate Options") and contains(@class,"mat-step")]//button[@ix-auto="button__NEXT"]', 'clickable')
    driver.find_element_by_xpath('//div[contains(.,"Certificate Options") and contains(@class,"mat-step")]//button[@ix-auto="button__NEXT"]').click()


    # set company info and click next
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__State"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__State"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__State"]').send_keys('TN')

    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Locality"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Locality"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Locality"]').send_keys('Maryville')

    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Organization"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Organization"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Organization"]').send_keys('iXsystems')

    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Organizational Unit"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Organizational Unit"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Organizational Unit"]').send_keys('QE')

    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Email"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Email"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Email"]').send_keys('qa@ixsystems.com')

    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Common Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Common Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Common Name"]').send_keys('qe.ixsystems.com')

    assert wait_on_element(driver, 5, '//mat-chip-list[@ix-auto="input__Subject Alternate Names"]', 'inputable')
    driver.find_element_by_xpath('//input[@placeholder="Subject Alternate Names"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Subject Alternate Names"]').send_keys('qa.ixsystems.com')

    assert wait_on_element(driver, 10, '//div[contains(.,"Certificate Subject") and contains(@class,"mat-step")]//button[@ix-auto="button__NEXT"]', 'clickable')
    driver.find_element_by_xpath('//div[contains(.,"Certificate Subject") and contains(@class,"mat-step")]//button[@ix-auto="button__NEXT"]').click()


    # set extra constraints and click next
    assert wait_on_element(driver, 10, '//mat-checkbox[@ix-auto="checkbox__Extended Key Usage"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Extended Key Usage"]').click()
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Usages"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Usages"]').click()
    assert wait_on_element(driver, 10, '//mat-option[@ix-auto="option__Usages_ANY_EXTENDED_KEY_USAGE"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Usages_ANY_EXTENDED_KEY_USAGE"]').click()
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Usages_ANY_EXTENDED_KEY_USAGE"]').send_keys(Keys.TAB)

    assert wait_on_element(driver, 10, '//mat-checkbox[@ix-auto="checkbox__Critical Extension"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Critical Extension"]').click()

    assert wait_on_element(driver, 10, '//mat-checkbox[@ix-auto="checkbox__Key Usage"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Key Usage"]').click()
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Key Usage Config"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Key Usage Config"]').click()
    assert wait_on_element(driver, 10, '//mat-option[@ix-auto="option__Key Usage Config_Digital Signature"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Key Usage Config_Digital Signature"]').click()
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Key Usage Config_Digital Signature"]').send_keys(Keys.TAB)

    assert wait_on_element(driver, 10, '//div[contains(.,"Extra Constraints") and contains(@class,"mat-step")]//button[@ix-auto="button__NEXT"]', 'clickable')
    driver.find_element_by_xpath('//div[contains(.,"Extra Constraints") and contains(@class,"mat-step")]//button[@ix-auto="button__NEXT"]').click()


    # click save on the confirm options page
    assert wait_on_element(driver, 10, '//span[contains(text(),"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save")]').click()
    assert wait_on_element(driver, 5, '/*[contains(.,"Creating Certificate")]')
    assert wait_on_element_disappear(driver, 10, '//*[contains(.,"Creating Certificate")]')


    # verify that the CSR was added
    assert wait_on_element(driver, 10, '//li[contains(.,"Name: csr1")]')
