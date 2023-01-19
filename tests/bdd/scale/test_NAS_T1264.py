# coding=utf-8
"""SCALE UI: feature tests."""

import xpaths
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
from pytest_dependency import depends


@scenario('features/NAS-T1264.feature', 'Verify a certificate authority can be deleted')
def test_verify_a_certificate_authority_can_be_deleted():
    """Verify a certificate authority can be deleted."""


@given('the browser is open, navigate to the SCALE URL, and login')
def the_browser_is_open_navigate_to_the_scale_url_and_login(driver, nas_ip, root_password, request):
    """the browser is open, navigate to the SCALE URL, and login."""
    depends(request, ['Certificate_Authority'], scope='session')
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, xpaths.login.user_input)
    if not is_element_present(driver, xpaths.sideMenu.dashboard):
        assert wait_on_element(driver, 10, xpaths.login.user_input)
        driver.find_element_by_xpath(xpaths.login.user_input).clear()
        driver.find_element_by_xpath(xpaths.login.user_input).send_keys('root')
        driver.find_element_by_xpath(xpaths.login.password_Input).clear()
        driver.find_element_by_xpath(xpaths.login.password_Input).send_keys(root_password)
        assert wait_on_element(driver, 5, xpaths.login.signin_button)
        driver.find_element_by_xpath(xpaths.login.signin_button).click()
    else:
        assert wait_on_element(driver, 10, xpaths.sideMenu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()


@when('on the Dashboard, click on credentials and certificates')
def on_the_dashboard_click_on_credentials_and_certificates(driver):
    """on the Dashboard, click on credentials and certificates."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.system_Info_Card_Title)
    assert wait_on_element(driver, 7, xpaths.sideMenu.credentials, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.credentials).click()
    assert wait_on_element(driver, 7, xpaths.sideMenu.certificates, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.certificates).click()


@then('click on the trash icon for ca1')
def click_on_the_trash_icon_for_ca1(driver):
    """click on the trash icon for ca1."""
    assert wait_on_element(driver, 7, xpaths.certificates.title)
    assert wait_on_element(driver, 7, '//h3[contains(text(),"Certificate Authorities")]')
    assert wait_on_element(driver, 5, '//tr[contains(.,"ca1")]//mat-icon[contains(text(),"delete")]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ca1")]//mat-icon[contains(text(),"delete")]').click()


@then('click the confirm checkbox and click delete')
def click_the_confirm_checkbox_and_click_delete(driver):
    """click the confirm checkbox and click delete."""
    assert wait_on_element(driver, 5, '//h1[contains(.,"Delete")]')
    assert wait_on_element(driver, 10, xpaths.checkbox.old_confirm, 'clickable')
    driver.find_element_by_xpath(xpaths.checkbox.old_confirm).click()
    assert wait_on_element(driver, 10, xpaths.button.delete, 'clickable')
    driver.find_element_by_xpath(xpaths.button.delete).click()


@then('verify that the CA was deleted')
def verify_that_the_ca_was_deleted(driver):
    """verify that the CA was deleted."""
    assert wait_on_element_disappear(driver, 20, '//li[contains(.,"Name: ca1")]')
