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


@scenario('features/NAS-T1562.feature', 'Apps Tests')
def test_apps_tests(driver):
    """apps tests."""
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

@then('apps page validation')
def apps_page_validation(driver):
    """apps_page_validation"""
    import t_006_1_apps_page_validation
    t_006_1_apps_page_validation.test_apps_page_validation(driver)


@then('apps remove and readd pool')
def apps_remove_and_readd_pool(driver):
    """apps_remove_and_readd_pool"""
    import t_006_2_apps_remove_and_readd_pool
    t_006_2_apps_remove_and_readd_pool.test_apps_remove_and_readd_pool(driver)


@then('validate minio')
def validate_minio(driver):
    """validate_minio"""
    import t_006_3_validate_minio
    t_006_3_validate_minio.test_validate_minio(driver)


@then('stop an app')
def stop_an_app(driver):
    """stop_an_app"""
    import t_006_4_stop_an_app
    t_006_4_stop_an_app.test_stop_an_app(driver)


@then('remove an app')
def remove_an_app(driver):
    """remove_an_app"""
    import t_006_5_remove_an_app
    t_006_5_remove_an_app.test_remove_an_app(driver)


@then('delete a container image')
def delete_a_container_image(driver):
    """delete_a_container_image"""
#    import t_006_6_delete_a_container_image
#    t_006_6_delete_a_container_image.test_delete_a_container_image(driver)


@then('validate minio with docker image')
def validate_truecommand(driver):
    """validate_truecommand"""
#    import t_006_7_validate_minio
#    t_006_7_validate_minio.test_validate_minio(driver)


@then('import pool with apps')
def import_pool_with_apps(driver):
    """import_pool_with_apps"""
#    import t_006_8_import_pool_with_apps
#    t_006_8_import_pool_with_apps.test_import_pool_with_apps(driver)


@then('change pool for apps')
def change_pool_for_apps(driver):
    """change_pool_for_apps"""
#    import t_006_9_change_pool_for_apps
#    t_006_9_change_pool_for_apps.test_change_pool_for_apps(driver)


@then('add a catalog')
def add_a_catalog(driver):
    """add_a_catalog"""
#    import t_006_10_add_a_catalog
#    t_006_10_add_a_catalog.test_add_a_catalog(driver)


@then('remove a catalog')
def remove_a_catalog(driver):
    """remove_a_catalog"""
#    import t_006_11_remove_a_catalog
#    t_006_11_remove_a_catalog.test_remove_a_catalog(driver)


@then('delete a docker container')
def delete_a_docker_container(driver):
    """delete_a_container"""
#    import t_006_12_delete_a_docker_container
#    t_006_12_delete_a_docker_container.test_delete_a_docker_container(driver)



