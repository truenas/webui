# coding=utf-8
"""SCALE UI: feature tests."""

import pytest
import xpaths
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


@pytest.mark.dependency(name='Certificate_Authority')
@scenario('features/NAS-T1260.feature', 'Verify a certificate authority can be created')
def test_verify_a_certificate_authority_can_be_created():
    """Verify a certificate authority can be created."""


@given('the browser is open, navigate to the SCALE URL, and login')
def the_browser_is_open_navigate_to_the_scale_url_and_login(driver, nas_ip, root_password):
    """the browser is open, navigate to the SCALE URL, and login."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, xpaths.login.user_input)
    if not is_element_present(driver, xpaths.sideMenu.dashboard):
        assert wait_on_element(driver, 10, xpaths.login.user_input)
        driver.find_element_by_xpath(xpaths.login.user_input).clear()
        driver.find_element_by_xpath(xpaths.login.user_input).send_keys('root')
        driver.find_element_by_xpath(xpaths.login.password_input).clear()
        driver.find_element_by_xpath(xpaths.login.password_input).send_keys(root_password)
        assert wait_on_element(driver, 5, xpaths.login.signin_button)
        driver.find_element_by_xpath(xpaths.login.signin_button).click()
    else:
        assert wait_on_element(driver, 10, xpaths.sideMenu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()


@when('on the Dashboard, click on credentials and certificates')
def on_the_dashboard_click_on_credentials_and_certificates(driver):
    """on the Dashboard, click on credentials and certificates."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.systemInfoCardTitle)
    assert wait_on_element(driver, 7, xpaths.sideMenu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.credentials).click()
    assert wait_on_element(driver, 7, xpaths.sideMenu.certificates, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.certificates).click()


@then('click on CA add')
def click_on_ca_add(driver):
    """click on CA add."""
    assert wait_on_element(driver, 7, xpaths.certificates.title)
    assert wait_on_element(driver, 7, '//h3[contains(text(),"Certificate Authorities")]')
    assert wait_on_element(driver, 5, '//mat-card[contains(.,"Certificate Authorities")]//button[contains(.,"Add")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"Certificate Authorities")]//button[contains(.,"Add")]').click()


@then('set name and type and click next')
def set_name_and_type_and_click_next(driver):
    """set name and type and click next."""
    assert wait_on_element(driver, 10, '//h3[contains(text(),"Add CA")]')
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys('ca1')
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Type"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Type"]').click()
    assert wait_on_element(driver, 10, '//span[contains(.," Internal CA ")]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Type_Internal CA"]').click()
    assert wait_on_element(driver, 10, '//div[contains(.,"Identifier and Type") and contains(@class,"mat-step")]//button[@ix-auto="button__NEXT"]', 'clickable')
    driver.find_element_by_xpath('//div[contains(.,"Identifier and Type") and contains(@class,"mat-step")]//button[@ix-auto="button__NEXT"]').click()


@then('set key info and click next')
def set_key_info_and_click_next(driver):
    """set key info and click next."""
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Key Type"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Key Type"]').click()
    assert wait_on_element(driver, 10, '//span[contains(.,"RSA")]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Key Type_RSA"]').click()
    assert wait_on_element(driver, 10, '//div[contains(.,"Certificate Options") and contains(@class,"mat-step")]//button[@ix-auto="button__NEXT"]', 'clickable')
    driver.find_element_by_xpath('//div[contains(.,"Certificate Options") and contains(@class,"mat-step")]//button[@ix-auto="button__NEXT"]').click()


@then('set company info and click next')
def set_company_info_and_click_next(driver):
    """set company info and click next."""
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

    assert wait_on_element(driver, 5, xpaths.certificates.email_input, 'inputable')
    driver.find_element_by_xpath(xpaths.certificates.email_input).clear()
    driver.find_element_by_xpath(xpaths.certificates.email_input).send_keys('qa@ixsystems.com')

    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Common Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Common Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Common Name"]').send_keys('qe.ixsystems.com')

    assert wait_on_element(driver, 5, '//mat-chip-list[@ix-auto="input__Subject Alternate Names"]', 'inputable')
    driver.find_element_by_xpath('//input[@placeholder="Subject Alternate Names"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Subject Alternate Names"]').send_keys('qa.ixsystems.com')

    assert wait_on_element(driver, 10, '//div[contains(.,"Certificate Subject") and contains(@class,"mat-step")]//button[@ix-auto="button__NEXT"]', 'clickable')
    driver.find_element_by_xpath('//div[contains(.,"Certificate Subject") and contains(@class,"mat-step")]//button[@ix-auto="button__NEXT"]').click()


@then('set extra constraints and click next')
def set_extra_constraints_and_click_next(driver):
    """set extra constraints and click next."""
    # May add later for more indepth testing
    assert wait_on_element(driver, 10, '//div[contains(.,"Extra Constraints") and contains(@class,"mat-step")]//button[@ix-auto="button__NEXT"]', 'clickable')
    driver.find_element_by_xpath('//div[contains(.,"Extra Constraints") and contains(@class,"mat-step")]//button[@ix-auto="button__NEXT"]').click()


@then('click save on the confirm options page')
def click_save_on_the_confirm_options_page(driver):
    """click save on the confirm options page."""
    assert wait_on_element(driver, 10, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element(driver, 5, '/*[contains(.,"Please wait")]')
    assert wait_on_element_disappear(driver, 10, xpaths.popup.pleaseWait)


@then('verify that the CA was added')
def verify_that_the_ca_was_added(driver):
    """verify that the CA was added."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Name: ca1")]')
