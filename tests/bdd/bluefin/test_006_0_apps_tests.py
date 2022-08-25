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


@then('validate collabora')
def validate_collabora(driver):
    """validate_collabora"""
    import t_006_3_validate_collabora
    t_006_3_validate_collabora.test_validate_collabora(driver)


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


@then('validate ipfs')
def validate_ipfs(driver):
    """validate_ipfs"""
    import t_006_6_validate_ipfs
    t_006_6_validate_ipfs.test_validate_ipfs(driver)


@then('import pool with apps')
def import_pool_with_apps(driver):
    """import_pool_with_apps"""
    import t_006_7_import_pool_with_apps
    t_006_7_import_pool_with_apps.test_import_pool_with_apps(driver)


@then('change pool for apps')
def change_pool_for_apps(driver):
    """change_pool_for_apps"""
    import t_006_8_change_pool_for_apps
    t_006_8_change_pool_for_apps.test_change_pool_for_apps(driver)


@then('validate minio')
def validate_minio(driver):
    """validate_minio"""
    import t_006_9_validate_minio
    t_006_9_validate_minio.test_validate_minio(driver)


@then('validate nextcloud')
def validate_nextcloud(driver):
    """validate_nextcloud"""
    import t_006_10_validate_nextcloud
    t_006_10_validate_nextcloud.test_validate_nextcloud(driver)


@then('validate chia')
def validate_chia(driver):
    """validate_chia"""
    import t_006_11_validate_chia
    t_006_11_validate_chia.test_validate_chia(driver)


@then('validate plex')
def validate_plex(driver):
    """validate_plex"""
    import t_006_12_validate_plex
    t_006_12_validate_plex.test_validate_plex(driver)


@then('validate machinaris')
def validate_machinaris(driver):
    """validate_machinaris"""
    import t_006_13_validate_machinaris
    t_006_13_validate_machinaris.test_validate_machinaris(driver)


@then('add a catalog')
def add_a_catalog(driver):
    """add_a_catalog"""
    import t_006_14_add_a_catalog
    t_006_14_add_a_catalog.test_add_a_catalog(driver)


@then('remove a catalog')
def remove_a_catalog(driver):
    """remove_a_catalog"""
    import t_006_15_remove_a_catalog
    t_006_15_remove_a_catalog.test_remove_a_catalog(driver)


@then('remove another app')
def remove_another_app(driver):
    """remove_an_app"""
    import t_006_16_remove_another_app
    t_006_16_remove_another_app.test_remove_another_app(driver)


@then('validate truecommand')
def validate_truecommand(driver):
    """validate_truecommand"""
    import t_006_17_validate_truecommand
    t_006_17_validate_truecommand.test_validate_truecommand(driver)


@then('delete a container')
def delete_a_container(driver):
    """delete_a_container"""
    import t_006_18_delete_a_container
    t_006_16_delete_a_container.test_delete_a_container(driver)


@then('delete a container image')
def delete_a_container_image(driver):
    """delete_a_container_image"""
    import t_006_16_delete_a_container_image
    t_006_18_delete_a_container_image.test_delete_a_container_image(driver)
