# coding=utf-8
"""BLUEFIN UI feature tests."""

from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)
import pytest
pytestmark = [pytest.mark.debug_test]


@scenario('features/NAS-T1561.feature', 'Bluefin UI: Cert Tests')
def test_cert_tests(driver):
    """cert tests."""
    pass


@given('the browser is open, navigate to the SCALE URL, and login')
def the_browser_is_open_navigate_to_the_scale_url(driver, nas_ip, root_password):
    """the browser is open, navigate to the SCALE URL."""
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
            driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()

        #    """on the dashboard click on the System Settings side menu, then click services."""
        assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')

@then('create a csr')
def create_a_csr(driver):
    """create_a_csr"""
    import t_005_1_create_a_csr
    t_005_1_create_a_csr.test_create_a_csr(driver)


@then('create a ca')
def create_a_ca(driver):
    """create_a_ca"""
    import t_005_2_create_a_ca
    t_005_2_create_a_ca.test_create_a_ca(driver)


@then('create an internal cert')
def create_an_internal_cert(driver):
    """create an internal cert"""
    import t_005_3_create_an_internal_cert
    t_005_3_create_an_internal_cert.test_create_an_internal_cert(driver)


@then('delete an internal cert')
def delete_an_interal_cert(driver):
    """delete_an_interal_cert"""
    import t_005_4_delete_an_internal_cert
    t_005_4_delete_an_internal_cert.test_delete_an_internal_cert(driver)


@then('import a cert')
def import_a_cert(driver):
    """import a cert"""
    import t_005_5_import_a_cert
    t_005_5_import_a_cert.test_import_a_cert(driver)


@then('delete a ca')
def delete_a_ca(driver):
    """delete_a_ca"""
    import t_005_6_delete_a_ca
    t_005_6_delete_a_ca.test_delete_a_ca(driver)

@then('delete a csr')
def delete_a_csr(driver):
    """delete_a_csr"""
    import t_005_6_delete_a_csr
    t_005_6_delete_a_csr.test_delete_a_csr(driver)