# coding=utf-8
"""SCALE UI: feature tests."""

import os
from pathlib import Path
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)


@scenario('features/NAS-T1263.feature', 'Verify a Certficate can be imported')
def test_verify_a_certficate_can_be_imported():
    """Verify a Certficate can be imported."""


@given('the browser is open, navigate to the SCALE URL, and login')
def the_browser_is_open_navigate_to_the_scale_url_and_login(driver, nas_ip, root_password):
    """the browser is open, navigate to the SCALE URL, and login."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, '//input[@data-placeholder="Username"]')
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 10, '//input[@data-placeholder="Username"]')
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').send_keys('root')
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').send_keys(root_password)
        assert wait_on_element(driver, 5, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('on the Dashboard, click on credentials and certificates')
def on_the_dashboard_click_on_credentials_and_certificates(driver):
    """on the Dashboard, click on credentials and certificates."""
    assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
    assert wait_on_element(driver, 7, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Certificates"]', 'clickable')
    driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Certificates"]').click()


@then('click on Certificate add')
def click_on_certificate_add(driver):
    """click on Certificate add."""
    assert wait_on_element(driver, 7, '//h1[contains(text(),"Certificates")]')
    assert wait_on_element(driver, 5, '//mat-card[contains(.,"Certificates")]//button[contains(.,"Add")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"Certificates")]//button[contains(.,"Add")]').click()


@then('set name and type select type of import cert and click next')
def set_name_and_type_select_type_of_import_cert_and_click_next(driver):
    """set name and type select type of import cert and click next."""
    assert wait_on_element(driver, 10, '//h3[contains(text(),"Add Certificate")]')
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys('cert2')
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Type"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Type"]').click()
    assert wait_on_element(driver, 10, '//span[contains(.," Internal Certificate ")]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Type_Import Certificate"]').click()
    assert wait_on_element(driver, 10, '//div[contains(.,"Identifier and Type") and contains(@class,"mat-step")]//button[@ix-auto="button__NEXT"]', 'clickable')
    driver.find_element_by_xpath('//div[contains(.,"Identifier and Type") and contains(@class,"mat-step")]//button[@ix-auto="button__NEXT"]').click()


@then('set cert options and click next')
def set_cert_options_and_click_next(driver):
    """set cert options and click next."""
    # Testing this may be added later
    # assert wait_on_element(driver, 10, '//mat-option[@ix-auto="checkbox__CSR exists on this system"]', 'clickable')
    # driver.find_element_by_xpath('//mat-option[@ix-auto="checkbox__CSR exists on this system"]').click()
    # assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Signing Certificate Authority" and not(contains(@class,"mat-select-disabled"))]', 'clickable')
    # driver.find_element_by_xpath('//mat-select[@ix-auto="select__Signing Certificate Authority" and not(contains(@class,"mat-select-disabled"))]').click()
    # assert wait_on_element(driver, 10, '//span[contains(.," csr1 ")]', 'clickable')
    # driver.find_element_by_xpath('//mat-option[@ix-auto="option__Signing Certificate Authority_csr1"]').click()
    assert wait_on_element(driver, 10, '//div[contains(.,"Certificate Options") and contains(@class,"mat-step")]//button[@ix-auto="button__NEXT"]', 'clickable')
    driver.find_element_by_xpath('//div[contains(.,"Certificate Options") and contains(@class,"mat-step")]//button[@ix-auto="button__NEXT"]').click()


@then('set extra constraints and click next')
def set_extra_constraints_and_click_next(driver):
    """set extra constraints and click next."""
    
    cert2c_path = os.getcwd() + '/cert2c'
    cert2c = Path(cert2c_path).read_text()
    assert wait_on_element(driver, 5, '//div[@ix-auto="textarea__Certificate"]//textarea', 'inputable')
    driver.find_element_by_xpath('//div[@ix-auto="textarea__Certificate"]//textarea').clear()
    driver.find_element_by_xpath('//div[@ix-auto="textarea__Certificate"]//textarea').send_keys(cert2c)   

    cert2k_path = os.getcwd() + '/cert2k'
    cert2k = Path(cert2k_path).read_text()
    assert wait_on_element(driver, 5, '//div[@ix-auto="textarea__Private Key"]//textarea', 'inputable')
    driver.find_element_by_xpath('//div[@ix-auto="textarea__Private Key"]//textarea').clear()
    driver.find_element_by_xpath('//div[@ix-auto="textarea__Private Key"]//textarea').send_keys(cert2k)
    
    assert wait_on_element(driver, 10, '//div[contains(.,"Extra Constraints") and contains(@class,"mat-step")]//button[@ix-auto="button__NEXT"]', 'clickable')
    driver.find_element_by_xpath('//div[contains(.,"Extra Constraints") and contains(@class,"mat-step")]//button[@ix-auto="button__NEXT"]').click()


@then('click save on the confirm options page')
def click_save_on_the_confirm_options_page(driver):
    """click save on the confirm options page."""
    assert wait_on_element(driver, 10, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element(driver, 5, '/*[contains(.,"Creating Certificate")]')
    assert wait_on_element_disappear(driver, 10, '//*[contains(.,"Creating Certificate")]')


@then('verify that the Cert was added')
def verify_that_the_cert_was_added(driver):
    """verify that the Cert was added."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Name: cert2")]')
