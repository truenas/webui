# coding=utf-8
"""SCALE UI feature tests."""
import time
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_for_attribute_value,
    wait_on_element_disappear
)




def test_validate_minio_with_docker(driver):
    """test_validate_minio_with_docker"""
    if not is_element_present(driver, '//h1[contains(.,"Applications")]'):
        assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Apps"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Apps"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Applications")]')


    # when the Apps page loads, open available applications
    assert wait_on_element(driver, 10, '//div[contains(text(),"Available Applications")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Available Applications")]').click()
    assert wait_on_element(driver, 7, '//div[contains(.,"Available Applications")]')


    # click Launch Docker Image
    # Wait for Available Applications UI to load
    assert wait_on_element(driver, 120, '//h3[text()="plex"]')
    assert wait_on_element(driver, 10, '//div[contains(.,"plex") and @class="content"]//button', 'clickable')
    # Sleep to make sure that the drop does not disappear
    time.sleep(1)

    assert wait_on_element(driver, 10, '//span[contains(.,"Launch Docker Image")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(.,"Launch Docker Image")]').click()
    if wait_on_element(driver, 3, '//*[contains(.,"Please wait")]'):
        assert wait_on_element_disappear(driver, 120, '//*[contains(.,"Please wait")]')


    # set Application Name
    assert wait_on_element(driver, 30, '//h3[contains(.,"Launch Docker Image")]')
    assert wait_on_element(driver, 7, '//ix-dynamic-form-item//div//ix-input//ix-label//label//span[contains(.,"Application Name")]//ancestor::ix-input/div/input')
    driver.find_element_by_xpath('//ix-dynamic-form-item//div//ix-input//ix-label//label//span[contains(.,"Application Name")]//ancestor::ix-input/div/input').clear()
    driver.find_element_by_xpath('//ix-dynamic-form-item//div//ix-input//ix-label//label//span[contains(.,"Application Name")]//ancestor::ix-input/div/input').send_keys('minio-test')

    # set Container Images
    assert wait_on_element(driver, 7, '//ix-dynamic-form-item//div//ix-input//ix-label//label//span[contains(.,"Image repository")]')
    driver.find_element_by_xpath('//ix-dynamic-form-item//div//ix-input//ix-label//label//span[contains(.,"Image repository")]//ancestor::ix-input/div/input').clear()
    driver.find_element_by_xpath('//ix-dynamic-form-item//div//ix-input//ix-label//label//span[contains(.,"Image repository")]//ancestor::ix-input/div/input').send_keys('bitnami/minio')

    # set Container Entrypoint

    # set Container Environment Variables

    # set Networking

    # set Port Forwarding List
    assert wait_on_element(driver, 7, '//legend[contains(text(),"Port Forwarding")]//ancestor::ix-fieldset//fieldset//ix-dynamic-form-item//div//ix-list//div//div//button//span[contains(.,"Add")]', 'clickable')
    driver.find_element_by_xpath('//legend[contains(text(),"Port Forwarding")]//ancestor::ix-fieldset//fieldset//ix-dynamic-form-item//div//ix-list//div//div//button//span[contains(.,"Add")]').click()
    assert wait_on_element(driver, 7, '//ix-dynamic-form-item//div//ix-input//ix-label//label//span[contains(.,"Container Port")]')
    driver.find_element_by_xpath('//ix-dynamic-form-item//div//ix-input//ix-label//label//span[contains(.,"Container Port")]//ancestor::ix-input/div/input').clear()
    driver.find_element_by_xpath('//ix-dynamic-form-item//div//ix-input//ix-label//label//span[contains(.,"Container Port")]//ancestor::ix-input/div/input').send_keys('9000')
    assert wait_on_element(driver, 7, '//ix-dynamic-form-item//div//ix-input//ix-label//label//span[contains(.,"Node Port")]')
    driver.find_element_by_xpath('//ix-dynamic-form-item//div//ix-input//ix-label//label//span[contains(.,"Node Port")]//ancestor::ix-input/div/input').clear()
    driver.find_element_by_xpath('//ix-dynamic-form-item//div//ix-input//ix-label//label//span[contains(.,"Node Port")]//ancestor::ix-input/div/input').send_keys('9000')

    assert wait_on_element(driver, 7, '//legend[contains(text(),"Port Forwarding")]//ancestor::ix-fieldset//fieldset//ix-dynamic-form-item//div//ix-list//div//div//button//span[contains(.,"Add")]', 'clickable')
    driver.find_element_by_xpath('//legend[contains(text(),"Port Forwarding")]//ancestor::ix-fieldset//fieldset//ix-dynamic-form-item//div//ix-list//div//div//button//span[contains(.,"Add")]').click()
    assert wait_on_element(driver, 7, '//ix-dynamic-form//ix-fieldset//fieldset//ix-dynamic-form-item//div//ix-list//div//div[2]/ix-list-item[2]/div//ix-dynamic-form-item//div//ix-input//ix-label//label//span[contains(.,"Container Port")]')
    driver.find_element_by_xpath('//ix-dynamic-form//ix-fieldset//fieldset//ix-dynamic-form-item//div//ix-list//div//div[2]/ix-list-item[2]/div//ix-dynamic-form-item//div//ix-input//ix-label//label//span[contains(.,"Container Port")]//ancestor::ix-input/div/input').clear()
    driver.find_element_by_xpath('//ix-dynamic-form//ix-fieldset//fieldset//ix-dynamic-form-item//div//ix-list//div//div[2]/ix-list-item[2]/div//ix-dynamic-form-item//div//ix-input//ix-label//label//span[contains(.,"Container Port")]//ancestor::ix-input/div/input').send_keys('9001')
    assert wait_on_element(driver, 7, '//ix-dynamic-form//ix-fieldset//fieldset//ix-dynamic-form-item//div//ix-list//div//div[2]/ix-list-item[2]/div//ix-dynamic-form-item//div//ix-input//ix-label//label//span[contains(.,"Node Port")]')
    driver.find_element_by_xpath('//ix-dynamic-form//ix-fieldset//fieldset//ix-dynamic-form-item//div//ix-list//div//div[2]/ix-list-item[2]/div//ix-dynamic-form-item//div//ix-input//ix-label//label//span[contains(.,"Node Port")]//ancestor::ix-input/div/input').clear()
    driver.find_element_by_xpath('//ix-dynamic-form//ix-fieldset//fieldset//ix-dynamic-form-item//div//ix-list//div//div[2]/ix-list-item[2]/div//ix-dynamic-form-item//div//ix-input//ix-label//label//span[contains(.,"Node Port")]//ancestor::ix-input/div/input').send_keys('9001')

    # set Storage

    # set Workload Details

    # set Scaling/Upgrade Policy

    # set Resource Reservation

    # set Resource Limits

    # set Portal Configuration


    # Confirm Options
    assert wait_on_element(driver, 7, '//span[contains(text(),"Save")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Save")]').click()

    assert wait_on_element(driver, 5, '//*[contains(.,"Installing")]')
    assert wait_on_element_disappear(driver, 180, '//*[contains(.,"Installing")]')


    # confirm installation is successful
    assert wait_on_element(driver, 180, '//h3[text()="plex"]')
    assert wait_on_element(driver, 10, '//div[contains(.,"plex") and @class="content"]//button', 'clickable')
    time.sleep(1)
    assert wait_on_element(driver, 10, '//div[contains(text(),"Installed Applications")]', 'clickable')
    driver.find_element_by_xpath('//div[contains(text(),"Installed Applications")]').click()
    #assert wait_on_element(driver, 120, '//strong[text()="plex-test"]')
    time.sleep(2)
    if is_element_present(driver, '//mat-card[contains(.,"minio-test")]//span[@class="status active"]') is False:
        assert wait_on_element(driver, 20, '//strong[contains(.,"minio-test")]')
        assert wait_on_element(driver, 20, '//strong[contains(.,"minio-test")]', 'clickable')
        driver.find_element_by_xpath('//strong[contains(.,"minio-test")]').click()
        if wait_on_element(driver, 3, '//*[contains(.,"Please wait")]'):
            assert wait_on_element_disappear(driver, 60, '//*[contains(.,"Please wait")]')
        # refresh loop
        assert wait_on_element(driver, 10, '//mat-panel-title[contains(.,"Application Events")]', 'clickable')
        driver.find_element_by_xpath('//mat-panel-title[contains(.,"Application Events")]').click()
        while is_element_present(driver, '//div[(normalize-space(text())="Created container ix-chart")]') is False:
            time.sleep(2)
            assert wait_on_element(driver, 10, '//span[contains(.,"Refresh Events")]', 'clickable')
            driver.find_element_by_xpath('//span[contains(.,"Refresh Events")]').click()
            # make sure Please wait pop up is gone before continuing.
            if wait_on_element(driver, 3, '//*[contains(.,"Please wait")]'):
                assert wait_on_element_disappear(driver, 10, '//*[contains(.,"Please wait")]')
        else:
            assert wait_on_element(driver, 10, '//span[contains(.,"Close")]', 'clickable')
            driver.find_element_by_xpath('//span[contains(.,"Close")]').click()
        assert wait_on_element(driver, 300, '//mat-card[contains(.,"minio-test")]//span[@class="status active"]')
    else:
        assert wait_on_element(driver, 300, '//mat-card[contains(.,"minio-test")]//span[@class="status active"]')