# coding=utf-8
"""SCALE UI: feature tests."""

import pytest
import xpaths
from selenium.webdriver.common.keys import Keys
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)


@pytest.mark.dependency(name='Internal_Certificate')
@scenario('features/NAS-T1261.feature', 'Verify an internal certificate can be created')
def test_verify_an_internal_certificate_can_be_created():
    """Verify an internal certificate can be created."""


@given('the browser is open, navigate to the SCALE URL, and login')
def the_browser_is_open_navigate_to_the_scale_url_and_login(driver, nas_ip, root_password):
    """the browser is open, navigate to the SCALE URL, and login."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, xpaths.login.user_Input)
    if not is_element_present(driver, xpaths.side_Menu.dashboard):
        assert wait_on_element(driver, 10, xpaths.login.user_Input)
        driver.find_element_by_xpath(xpaths.login.user_Input).clear()
        driver.find_element_by_xpath(xpaths.login.user_Input).send_keys('root')
        driver.find_element_by_xpath(xpaths.login.password_Input).clear()
        driver.find_element_by_xpath(xpaths.login.password_Input).send_keys(root_password)
        assert wait_on_element(driver, 5, xpaths.login.signin_Button)
        driver.find_element_by_xpath(xpaths.login.signin_Button).click()
    else:
        assert wait_on_element(driver, 10, xpaths.side_Menu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.side_Menu.dashboard).click()


@when('on the Dashboard, click on credentials and certificates')
def on_the_dashboard_click_on_credentials_and_certificates(driver):
    """on the Dashboard, click on credentials and certificates."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.system_Info_Card_Title)
    assert wait_on_element(driver, 7, xpaths.side_Menu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.credentials).click()
    assert wait_on_element(driver, 7, xpaths.side_Menu.certificates, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.certificates).click()


@then('click on Certificate add')
def click_on_certificate_add(driver):
    """click on Certificate add."""
    assert wait_on_element(driver, 7, xpaths.certificates.title)
    assert wait_on_element(driver, 7, '//h3[contains(text(),"Certificates")]')
    assert wait_on_element(driver, 5, '//mat-card[contains(.,"Certificates")]//button[contains(.,"Add")]', 'clickable')
    driver.find_element_by_xpath('//mat-card[contains(.,"Certificates")]//button[contains(.,"Add")]').click()


@then('set name and type and click next')
def set_name_and_type_and_click_next(driver):
    """set name and type and click next."""
    assert wait_on_element(driver, 10, '//h3[contains(text(),"Add Certificate")]')
    assert wait_on_element(driver, 5, xpaths.common_Input.name, 'inputable')
    driver.find_element_by_xpath(xpaths.common_Input.name).clear()
    driver.find_element_by_xpath(xpaths.common_Input.name).send_keys('cert1')
    assert wait_on_element(driver, 5, xpaths.certificates.type_select, 'clickable')
    driver.find_element_by_xpath(xpaths.certificates.type_select).click()
    assert wait_on_element(driver, 10, xpaths.certificates.type_Internal_Certificate_Option, 'clickable')
    driver.find_element_by_xpath(xpaths.certificates.type_Internal_Certificate_Option).click()
    assert wait_on_element(driver, 10, xpaths.certificates.identifier_Next_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.certificates.identifier_Next_Button).click()


@then('set cert options and click next')
def set_cert_options_and_click_next(driver):
    """set cert options and click next."""
    assert wait_on_element(driver, 5, xpaths.certificates.signing_Certificate_Authority_Select, 'clickable')
    driver.find_element_by_xpath(xpaths.certificates.signing_Certificate_Authority_Select).click()
    assert wait_on_element(driver, 10, '//mat-option[@data-test="option-signedby-ca-1"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@data-test="option-signedby-ca-1"]').click()
    assert wait_on_element(driver, 5, xpaths.certificates.key_Type_Select, 'clickable')
    driver.find_element_by_xpath(xpaths.certificates.key_Type_Select).click()
    assert wait_on_element(driver, 10, xpaths.certificates.key_Type_RSA_Option, 'clickable')
    driver.find_element_by_xpath(xpaths.certificates.key_Type_RSA_Option).click()
    assert wait_on_element(driver, 10, xpaths.certificates.cert_Options_Next_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.certificates.cert_Options_Next_Button).click()


@then('set cert subject and click next')
def set_cert_subject_and_click_next(driver):
    """set cert subject and click next."""
    assert wait_on_element(driver, 5, xpaths.certificates.state_Input, 'inputable')
    driver.find_element_by_xpath(xpaths.certificates.state_Input).clear()
    driver.find_element_by_xpath(xpaths.certificates.state_Input).send_keys('TN')

    assert wait_on_element(driver, 5, xpaths.certificates.locality_Input, 'inputable')
    driver.find_element_by_xpath(xpaths.certificates.locality_Input).clear()
    driver.find_element_by_xpath(xpaths.certificates.locality_Input).send_keys('Maryville')

    driver.find_element_by_xpath(xpaths.certificates.organization_Input).clear()
    driver.find_element_by_xpath(xpaths.certificates.organization_Input).send_keys('iXsystems')

    driver.find_element_by_xpath(xpaths.certificates.organizational_Unit_Input).clear()
    driver.find_element_by_xpath(xpaths.certificates.organizational_Unit_Input).send_keys('QE')

    driver.find_element_by_xpath(xpaths.certificates.email_Input).clear()
    driver.find_element_by_xpath(xpaths.certificates.email_Input).send_keys('qa@ixsystems.com')

    driver.find_element_by_xpath(xpaths.certificates.common_Name_Input).clear()
    driver.find_element_by_xpath(xpaths.certificates.common_Name_Input).send_keys('qe.ixsystems.com')

    driver.find_element_by_xpath(xpaths.certificates.subject_Alternate_Names_Input).clear()
    driver.find_element_by_xpath(xpaths.certificates.subject_Alternate_Names_Input).send_keys('qa.ixsystems.com' + Keys.ENTER)

    assert wait_on_element(driver, 10, xpaths.certificates.cert_Subject_Next_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.certificates.cert_Subject_Next_Button).click()


@then('set extra constraints and click next')
def set_extra_constraints_and_click_next(driver):
    """set extra constraints and click next."""
    # May add later for more indepth testing
    assert wait_on_element(driver, 10, xpaths.certificates.extra_Constraints_Next_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.certificates.extra_Constraints_Next_Button).click()


@then('click save on the confirm options page')
def click_save_on_the_confirm_options_page(driver):
    """click save on the confirm options page."""
    assert wait_on_element(driver, 10, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 90, xpaths.progress.progressbar)


@then('verify that the Cert was added')
def verify_that_the_cert_was_added(driver):
    """verify that the Cert was added."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Name: cert1")]')
