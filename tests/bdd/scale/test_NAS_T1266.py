# coding=utf-8
"""SCALE UI: feature tests."""

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


@scenario('features/NAS-T1266.feature', 'Verify a Certificate Signing Request can be deleted')
def test_verify_a_certificate_signing_request_can_be_deleted():
    """Verify a Certificate Signing Request can be deleted."""


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


@then('click on the trash icon for csr1')
def click_on_the_trash_icon_for_csr1(driver):
    """click on the trash icon for csr1."""
    assert wait_on_element(driver, 7, '//h3[contains(text(),"Certificate Signing Requests")]')
    assert wait_on_element(driver, 5, '//tr[contains(.,"csr1")]//mat-icon[contains(text(),"delete")]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"csr1")]//mat-icon[contains(text(),"delete")]').click()


@then('click the confirm checkbox and click delete')
def click_the_confirm_checkbox_and_click_delete(driver):
    """click the confirm checkbox and click delete."""
    assert wait_on_element(driver, 5, '//h1[contains(.,"Delete")]')
    assert wait_on_element(driver, 10, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 10, '//button[@ix-auto="button__DELETE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__DELETE"]').click()
    assert wait_on_element(driver, 5, '//*[contains(.,"Deleting")]')
    assert wait_on_element_disappear(driver, 10, '//*[contains(.,"Deleteing")]')


@then('verify that the CSR was deleted')
def verify_that_the_csr_wasdeleted(driver):
    """verify that the CSR was deleted."""
    assert wait_on_element_disappear(driver, 20, '//li[contains(.,"Name: csr1")]')
