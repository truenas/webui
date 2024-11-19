# coding=utf-8
"""Core UI feature tests."""

"""
You need to have AWS credentials in ~/.aws/credentials
[default]
aws_access_key_id=KEY_ID
aws_secret_access_key=ACCESS_KEY
"""

import boto3
import time
import reusableSeleniumCode as rsc
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    ssh_cmd
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T1121.feature', 'Verify Amazon S3 Cloud Sync task works')
def test_verify_amazon_s3_cloud_sync_task_works(driver):
    """Verify Amazon S3 Cloud Sync task works."""
    pass


@given('the browser is open on the TrueNAS URL and logged in')
def the_browser_is_open_on_the_truenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open on the TrueNAS URL and logged in."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, '//input[@placeholder="Username"]')
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 10, '//input[@placeholder="Username"]')
        driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys('root')
        driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys(root_password)
        assert wait_on_element(driver, 5, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    if not is_element_present(driver, '//li[contains(.,"Dashboard")]'):
        rsc.scroll_To(driver, xpaths.sideMenu.root)
        assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('on the dashboard, click on Storage on the side menu, click on Pools')
def on_the_dashboard_click_on_storage_on_the_side_menu_click_on_pools(driver):
    """on the dashboard, click on Storage on the side menu, click on Pools."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Pools"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Pools"]').click()


@then('click on the tank pool three dots button, select Add Dataset')
def click_on_the_tank_pool_three_dots_button_select_add_dataset(driver):
    """click on the tank pool three dots button, select Add Dataset."""
    assert wait_on_element(driver, 5, '//div[contains(.,"Pools")]')
    assert wait_on_element(driver, 5, '//mat-icon[@id="actions_menu_button__tank"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__tank"]').click()
    assert wait_on_element(driver, 7, '//div[@class="title" and contains(.,"Dataset Actions")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__tank_Create Snapshot"]', 'clickable')
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__tank_Add Dataset"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__tank_Add Dataset"]').click()
    assert wait_on_element(driver, 5, '//h4[contains(.,"Name and Options")]')


@then('input aws_share for Name, select Generic as Share Type and click Submit')
def input_aws_share_for_name_select_generic_as_share_type_and_click_submit(driver):
    """input aws_share for Name, select Generic as Share Type and click Submit."""
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys('aws_share')
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Share Type"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Share Type"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Share Type_Generic"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Share Type_Generic"]').click()
    rsc.click_The_Summit_Button(driver)


@then('the dataset should be created without error')
def the_dataset_should_be_created_without_error(driver):
    """the dataset should be created without error."""
    assert wait_on_element_disappear(driver, 30, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"aws_share")]')


@then('click Tasks on the left sidebar, then click on Cloud Sync Tasks')
def click_tasks_on_the_left_sidebar_then_click_on_cloud_sync_tasks(driver):
    """click Tasks on the left sidebar, then click on Cloud Sync Tasks."""
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Tasks"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Tasks"]').click()
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Cloud Sync Tasks"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Cloud Sync Tasks"]').click()


@then('on the Cloud Sync Tasks, click ADD')
def on_the_cloud_sync_tasks_click_add(driver):
    """on the Cloud Sync Tasks, click ADD."""
    assert wait_on_element(driver, 5, '//div[contains(.,"Cloud Sync Tasks")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__Cloud Sync Tasks_ADD"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__Cloud Sync Tasks_ADD"]').click()


@then('input a description and ensure PULL is selected as the Direction')
def input_a_description_and_ensure_pull_is_selected_as_the_direction(driver):
    """input a description and ensure PULL is selected as the Direction."""
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Follow Symlinks"]', 'clickable')
    assert wait_on_element(driver, 5, '//input[@placeholder="Description"]', 'inputable')
    driver.find_element_by_xpath('//input[@placeholder="Description"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Description"]').send_keys('My S3 AWS Share')
    assert wait_on_element(driver, 5, '//mat-select[contains(.,"PULL")]')


@then(parsers.parse('select "{selection}" under the Credential drop-down'))
def select_selection_under_the_credential_dropdown(driver, selection):
    """select "selection" under the Credential drop-down."""
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Credential"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Credential"]').click()
    assert wait_on_element(driver, 5, f'//mat-option[@ix-auto="option__Credential_{selection}"]', 'clickable')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__Credential_{selection}"]').click()
    time.sleep(0.5)


@then(parsers.parse('select the {bucket} bucket, then Under Directory/Files, choose aws_share'))
def select_the_bucket_bucket_then_under_directoryfiles_choose_aws_share(driver, bucket):
    """select the {bucket} bucket, then Under Directory/Files, choose aws_share."""
    global my_bucket
    my_bucket = bucket
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Bucket"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Bucket"]').click()
    assert wait_on_element(driver, 5, f'//mat-option[@ix-auto="option__Bucket_{bucket}"]', 'clickable')
    driver.find_element_by_xpath(f'//mat-option[@ix-auto="option__Bucket_{bucket}"]').click()
    assert wait_on_element(driver, 5, '//input[@placeholder="Directory/Files"]', 'inputable')
    driver.find_element_by_xpath('//input[@placeholder="Directory/Files"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Directory/Files"]').send_keys('/mnt/tank/aws_share')


@then('under Transfer Mode, select COPY, click Save')
def under_transfer_mode_select_copy_click_save(driver):
    """under Transfer Mode, select COPY, click Save."""
    assert wait_on_element(driver, 5, '//mat-select[contains(.,"COPY")]')
    rsc.click_The_Summit_Button(driver)
    assert wait_on_element_disappear(driver, 30, '//h6[contains(.,"Please wait")]')


@then('the new Cloud Sync Tasks should save without error')
def the_new_cloud_sync_tasks_should_save_without_error(driver):
    """the new Cloud Sync Tasks should save without error."""
    assert wait_on_element(driver, 5, '//div[contains(.,"Cloud Sync Tasks")]')
    assert wait_on_element(driver, 5, '//div[contains(.,"My S3 AWS Share")]')


@then('open a new tab navigate to <s3_url> and input <account_id>')
def open_a_new_tab_navigate_to_s3_url_and_input_account_id(driver, s3_url, account_id):
    """open a new tab navigate to <s3_url> and input <account_id>."""
    driver.execute_script("window.open();")
    driver.switch_to.window(driver.window_handles[1])
    driver.get(s3_url)
    assert wait_on_element(driver, 5, '//*[contains(text(),"IAM user sign in")]')
    assert wait_on_element(driver, 5, '//*[@id="account"]', 'inputable')
    driver.find_element_by_xpath('//*[@id="account"]').send_keys(account_id)


@then('input <user_name> and <password>, click Sign in')
def input_user_name_and_password_click_sign_in(driver, user_name, password):
    """input <user_name> and <password>, click Sign in."""
    assert wait_on_element(driver, 5, '//input[@id="username"]', 'inputable')
    driver.find_element_by_xpath('//input[@id="username"]').send_keys(user_name)
    driver.find_element_by_xpath('//input[@id="password"]').send_keys(password)
    assert wait_on_element(driver, 5, '//*[@id="signin_button"]', 'clickable')
    driver.find_element_by_xpath('//*[@id="signin_button"]').click()


@then('click on the bucket being used and then upload a file')
def click_on_the_bucket_being_used_and_then_upload_a_file(driver):
    """click on the bucket being used and then upload a file."""
    assert wait_on_element(driver, 10, '//div[contains(.,"Amazon S3")]')
    assert wait_on_element(driver, 5, f'//a[text()="{my_bucket}"]', 'clickable')
    driver.find_element_by_xpath(f'//a[text()="{my_bucket}"]').click()
    assert wait_on_element(driver, 5, xpaths.aws.folder_header(my_bucket))
    assert wait_on_element(driver, 5, xpaths.aws.upload_Button, 'clickable')
    rsc.click_If_Element_Exist(driver, xpaths.button.close_Popover)

    s3_client = boto3.client('s3')
    s3_client.upload_file('cloud_test.txt', my_bucket, 'cloud_test.txt')
    driver.refresh()
    assert wait_on_element(driver, 5, xpaths.aws.folder_header(my_bucket))
    assert wait_on_element(driver, 5, '//span[text()="cloud_test.txt"]', 'clickable')
    time.sleep(0.5)


@then('on the NAS tab, expand the task on the NAS UI and click Run Now')
def on_the_nas_tab_expand_the_task_on_the_nas_ui_and_click_run_now(driver):
    """on the NAS tab, expand the task on the NAS UI and click Run Now."""
    driver.switch_to.window(driver.window_handles[0])
    assert wait_on_element(driver, 7, '//div[contains(.,"Cloud Sync Tasks")]')
    assert wait_on_element(driver, 5, '//div[contains(.,"My S3 AWS Share")]')
    assert wait_on_element(driver, 5, '//a[@title="Expand/Collapse Row"]', 'clickable')
    driver.find_element_by_xpath('//a[@title="Expand/Collapse Row"]').click()
    time.sleep(0.5)
    assert wait_on_element(driver, 5, '//button[@id="action_button___run_now"]', 'clickable')
    driver.find_element_by_xpath('//button[@id="action_button___run_now"]').click()
    assert wait_on_element(driver, 5, '//h1[text()="Test Cloud Sync" or text()="Run Now"]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()
    assert wait_on_element(driver, 7, '//h1[contains(text(),"Task Started")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CLOSE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    assert wait_on_element_disappear(driver, 30, '//h1[contains(text(),"Task Started")]')
    assert wait_on_element(driver, 180, '//button[@id="My S3 AWS Share_Status-button" and contains(.,"SUCCESS")]')
    time.sleep(5)


@then('verify the file is copied from the S3 bucket into the dataset')
def verify_the_file_is_copied_from_the_s3_bucket_into_the_dataset(driver, nas_ip):
    """verify the file is copied from the S3 bucket into the dataset."""
    cmd = 'test -f /mnt/tank/aws_share/cloud_test.txt'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is True


@then('on the bucket tab, create a folder, and upload a file in it')
def on_the_bucket_tab_create_a_folder_and_upload_a_file_in_it(driver):
    """on the bucket tab, create a folder, and upload a file in it."""
    driver.switch_to.window(driver.window_handles[1])
    assert wait_on_element(driver, 5, xpaths.aws.folder_header(my_bucket))
    assert wait_on_element(driver, 5, xpaths.aws.create_Folder_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.aws.create_Folder_Button).click()
    assert wait_on_element(driver, 10, '//div[contains(.,"Create folder")]')
    assert wait_on_element(driver, 10, '//input[@placeholder="Enter folder name"]', 'inputable')
    driver.find_element_by_xpath('//input[@placeholder="Enter folder name"]').send_keys('my_folder')
    assert wait_on_element(driver, 5, xpaths.aws.create_The_Folder_Button, 'clickable')
    rsc.scroll_To(driver, xpaths.aws.create_The_Folder_Button)
    driver.find_element_by_xpath(xpaths.aws.create_The_Folder_Button).click()
    assert wait_on_element(driver, 10, xpaths.aws.folder_header(my_bucket))
    assert wait_on_element(driver, 5, '//span[text()="my_folder/"]', 'clickable')
    s3_client = boto3.client('s3')
    s3_client.upload_file('cloud_test.txt', my_bucket, 'my_folder/cloud_test.txt')
    assert wait_on_element(driver, 5, '//span[text()="my_folder/"]', 'clickable')
    driver.find_element_by_xpath('//span[text()="my_folder/"]').click()
    assert wait_on_element(driver, 5, xpaths.aws.folder_header("my_folder/"))
    assert wait_on_element(driver, 5, '//span[text()="cloud_test.txt"]', 'clickable')


@then('on the NAS tad on the cloud sync task, click Run Now')
def on_the_nas_tad_on_the_cloud_sync_task_click_run_now(driver):
    """on the NAS tad on the cloud sync task, click Run Now."""
    driver.switch_to.window(driver.window_handles[0])
    assert wait_on_element(driver, 7, '//div[contains(.,"Cloud Sync Tasks")]')
    assert wait_on_element(driver, 5, '//div[contains(.,"My S3 AWS Share")]')
    time.sleep(1)
    if not wait_on_element(driver, 2, '//button[@id="action_button___run_now"]'):
        assert wait_on_element(driver, 5, '//a[@title="Expand/Collapse Row"]', 'clickable')
        driver.find_element_by_xpath('//a[@title="Expand/Collapse Row"]').click()
    time.sleep(1)
    assert wait_on_element(driver, 5, '//button[@id="action_button___run_now"]', 'clickable')
    driver.find_element_by_xpath('//button[@id="action_button___run_now"]').click()
    assert wait_on_element(driver, 5, '//h1[text()="Run Now"]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()
    assert wait_on_element(driver, 7, '//h1[contains(text(),"Task Started")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CLOSE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    assert wait_on_element_disappear(driver, 30, '//h1[contains(text(),"Task Started")]')
    assert wait_on_element(driver, 180, '//button[@id="My S3 AWS Share_Status-button" and contains(.,"SUCCESS")]')
    time.sleep(5)


@then('verify the folder and file is copied from the S3 bucket to the dataset')
def verify_the_folder_and_file_is_copied_from_the_s3_bucket_to_the_dataset(driver, nas_ip):
    """verify the folder and file is copied from the S3 bucket to the dataset."""
    cmd = 'test -f /mnt/tank/aws_share/my_folder/cloud_test.txt'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is True


@then('delete the folder from the NAS dataset')
def delete_the_folder_from_the_nas_dataset(driver, nas_ip):
    """Delete the folder from the NAS dataset."""
    cmd = 'rm -rf /mnt/tank/aws_share/my_folder'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is True
    cmd = 'rm -f /mnt/tank/aws_share/cloud_test.txt'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is True


@then('on the cloud sync task and click Edit')
def on_the_cloud_sync_task_and_click_edit(driver):
    """on the cloud sync task and click Edit."""
    driver.switch_to.window(driver.window_handles[0])
    assert wait_on_element(driver, 5, '//div[contains(.,"Cloud Sync Tasks")]')
    assert wait_on_element(driver, 5, '//div[contains(.,"My S3 AWS Share")]')
    time.sleep(1)
    assert wait_on_element(driver, 5, '//a[@title="Expand/Collapse Row"]', 'clickable')
    if not wait_on_element(driver, 2, '//button[@ix-auto="button___edit"]'):
        assert wait_on_element(driver, 5, '//a[@title="Expand/Collapse Row"]', 'clickable')
        driver.find_element_by_xpath('//a[@title="Expand/Collapse Row"]').click()
    assert wait_on_element(driver, 7, '//p[contains(text(),"amazons3creds")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button___edit"]')
    time.sleep(2)
    assert wait_on_element(driver, 5, '//button[@ix-auto="button___edit"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button___edit"]').click()
    assert wait_on_element(driver, 5, '//h4[contains(.,"Transfer")]')
    assert wait_on_element(driver, 5, '//h4[contains(.,"Advanced Options")]')
    time.sleep(1)


@then('under Transfer Mode, select MOVE, click Save')
def under_transfer_mode_select_move_click_save(driver):
    """under Transfer Mode, select MOVE, click Save."""
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Follow Symlinks"]', 'clickable')
    assert wait_on_element(driver, 5, '//mat-select[contains(.,"COPY")]')
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Transfer Mode"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Transfer Mode"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Transfer Mode_MOVE"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Transfer Mode_MOVE"]').click()
    assert wait_on_element(driver, 5, '//mat-select[contains(.,"MOVE")]')
    assert wait_on_element(driver, 5, '//button[@id="save_button"]', 'clickable')
    driver.find_element_by_xpath('//button[@id="save_button"]').click()
    assert wait_on_element_disappear(driver, 30, '//h6[contains(.,"Please wait")]')
    # give time to the system to handle changes
    time.sleep(2)


@then('on the bucket add a file in the folder')
def on_the_bucket_add_a_file_in_the_folder(driver):
    """on the bucket add a file in the folder."""
    driver.switch_to.window(driver.window_handles[1])
    assert wait_on_element(driver, 5, xpaths.aws.folder_header("my_folder/"))
    assert wait_on_element(driver, 5, f'//span[text()="{my_bucket}"]')
    driver.find_element_by_xpath(f'//span[text()="{my_bucket}"]').click()
    assert wait_on_element(driver, 5, xpaths.aws.folder_header(my_bucket))
    s3_client = boto3.client('s3')
    s3_client.upload_file('cloud_test.txt', my_bucket, 'cloud_test.txt')
    driver.refresh()
    assert wait_on_element(driver, 5, '//span[text()="cloud_test.txt"]', 'clickable')
    s3_client = boto3.client('s3')
    s3_client.upload_file('cloud_test.txt', my_bucket, 'my_folder/cloud_test.txt')
    assert wait_on_element(driver, 5, '//span[text()="my_folder/"]', 'clickable')
    driver.find_element_by_xpath('//span[text()="my_folder/"]').click()
    assert wait_on_element(driver, 5, xpaths.aws.folder_header("my_folder/"))
    assert wait_on_element(driver, 5, '//span[text()="cloud_test.txt"]', 'clickable')


@then('verify all files are moved from the S3 bucket to the dataset')
def verify_all_files_are_moved_from_the_s3_bucket_to_the_dataset(driver, nas_ip):
    """verify all files is moved from the S3 bucket to the dataset."""
    cmd = 'test -f /mnt/tank/aws_share/cloud_test.txt'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is True
    cmd = 'test -f /mnt/tank/aws_share/my_folder/cloud_test.txt'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is True
    driver.switch_to.window(driver.window_handles[1])
    driver.refresh()
    assert wait_on_element(driver, 5, xpaths.aws.folder_header("my_folder/"))
    assert wait_on_element(driver, 5, f'//span[text()="{my_bucket}"]')
    assert not wait_on_element(driver, 1, '//span[text()="cloud_test.txt"]')
    driver.find_element_by_xpath(f'//span[text()="{my_bucket}"]').click()
    assert wait_on_element(driver, 5, xpaths.aws.folder_header(my_bucket))
    assert not wait_on_element(driver, 1, '//span[text()="cloud_test.txt"]', 'clickable')


@then('under Transfer Mode, select SYNC, then click Save')
def under_transfer_mode_select_sync_then_click_save(driver):
    """under Transfer Mode, select SYNC, then click Save."""
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Follow Symlinks"]', 'clickable')
    assert wait_on_element(driver, 5, '//mat-select[contains(.,"MOVE")]')
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Transfer Mode"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Transfer Mode"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Transfer Mode_SYNC"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Transfer Mode_SYNC"]').click()
    assert wait_on_element(driver, 5, '//mat-select[contains(.,"SYNC")]')
    assert wait_on_element(driver, 5, '//button[@id="save_button"]', 'clickable')
    driver.find_element_by_xpath('//button[@id="save_button"]').click()
    assert wait_on_element_disappear(driver, 30, '//h6[contains(.,"Please wait")]')
    # give time to the system to handle changes
    time.sleep(2)


@then('on the bucket tab, upload a file')
def on_the_bucket_tab_upload_a_file(driver):
    """on the bucket tab, upload a file."""
    driver.switch_to.window(driver.window_handles[1])
    assert wait_on_element(driver, 5, xpaths.aws.folder_header(my_bucket))
    assert wait_on_element(driver, 5, xpaths.aws.upload_Button, 'clickable')
    s3_client = boto3.client('s3')
    s3_client.upload_file('cloud_test.txt', my_bucket, 'cloud_test.txt')
    driver.refresh()
    assert wait_on_element(driver, 5, xpaths.aws.folder_header(my_bucket))
    assert wait_on_element(driver, 5, '//span[text()="cloud_test.txt"]', 'clickable')
    time.sleep(1)


@then('verify the file is sync from the S3 bucket to the dataset')
def verify_the_file_is_sync_from_the_s3_bucket_to_the_dataset(driver, nas_ip):
    """verify the file is sync from the S3 bucket to the dataset."""
    cmd = 'test -f /mnt/tank/aws_share/cloud_test.txt'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is True
    driver.switch_to.window(driver.window_handles[1])
    driver.refresh()
    assert wait_on_element(driver, 5, xpaths.aws.folder_header(my_bucket))
    assert wait_on_element(driver, 5, '//span[text()="cloud_test.txt"]', 'clickable')


@then('delete the file from the S3 bucket in the AWS web console')
def delete_the_file_from_the_s3_bucket_in_the_aws_web_console(driver):
    """delete the file from the S3 bucket in the AWS web console."""
    driver.switch_to.window(driver.window_handles[1])
    driver.refresh()
    time.sleep(0.5)
    assert wait_on_element(driver, 5, xpaths.aws.folder_header(my_bucket))
    assert wait_on_element(driver, 5, '//span[text()="cloud_test.txt"]', 'clickable')
    driver.find_element_by_xpath(xpaths.aws.check_All_Checkbox).click()
    assert wait_on_element(driver, 5, xpaths.aws.delete_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.aws.delete_Button).click()
    assert wait_on_element(driver, 5, '//div[contains(.,"Delete objects")]')
    assert wait_on_element(driver, 5, '//input[@placeholder="permanently delete"]', 'inputable')
    driver.find_element_by_xpath('//input[@placeholder="permanently delete"]').send_keys('permanently delete')
    assert wait_on_element(driver, 5, xpaths.aws.delete_Objects_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.aws.delete_Objects_Button).click()
    assert wait_on_element(driver, 5, '//div[contains(.,"Delete objects: status")]')
    time.sleep(0.5)
    assert wait_on_element(driver, 5, xpaths.aws.close, 'clickable')
    driver.find_element_by_xpath(xpaths.aws.close).click()
    assert wait_on_element(driver, 5, xpaths.aws.folder_header(my_bucket))


@then('verify that the file is deleted on the NAS dataset')
def verify_that_the_file_is_deleted_on_the_nas_dataset(driver, nas_ip):
    """verify that the file is deleted on the NAS dataset."""
    cmd = 'test -f /mnt/tank/aws_share/cloud_test.txt'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is False


@then('create a folder, and upload a file in it')
def create_a_folder_and_upload_a_file_in_it(driver):
    """create a folder, and upload a file in it."""
    driver.switch_to.window(driver.window_handles[1])
    time.sleep(1)
    assert wait_on_element(driver, 5, xpaths.aws.folder_header(my_bucket))
    assert wait_on_element(driver, 5, xpaths.aws.create_Folder_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.aws.create_Folder_Button).click()
    assert wait_on_element(driver, 10, '//div[contains(.,"Create folder")]')
    assert wait_on_element(driver, 10, '//input[@placeholder="Enter folder name"]', 'inputable')
    driver.find_element_by_xpath('//input[@placeholder="Enter folder name"]').send_keys('my_folder')
    assert wait_on_element(driver, 5, xpaths.aws.create_The_Folder_Button, 'clickable')
    rsc.scroll_To(driver, xpaths.aws.create_The_Folder_Button)
    driver.find_element_by_xpath(xpaths.aws.create_The_Folder_Button).click()
    assert wait_on_element(driver, 5, xpaths.aws.folder_header(my_bucket))
    assert wait_on_element(driver, 5, '//span[text()="my_folder/"]', 'clickable')
    s3_client = boto3.client('s3')
    s3_client.upload_file('cloud_test.txt', my_bucket, 'my_folder/cloud_test.txt')
    assert wait_on_element(driver, 5, '//span[text()="my_folder/"]', 'clickable')
    driver.find_element_by_xpath('//span[text()="my_folder/"]').click()
    assert wait_on_element(driver, 5, xpaths.aws.folder_header("my_folder/"))
    assert wait_on_element(driver, 5, '//span[text()="cloud_test.txt"]', 'clickable')


@then('verify the folder and file is moved from the S3 bucket to the dataset')
def verify_the_folder_and_file_is_moved_from_the_s3_bucket_to_the_dataset(driver, nas_ip):
    """verify the folder and file is moved from the S3 bucket to the dataset."""
    cmd = 'test -f /mnt/tank/aws_share/my_folder/cloud_test.txt'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is True


@then('delete the folder from the S3 bucket in the AWS web console')
def delete_the_folder_from_the_s3_bucket_in_the_aws_web_console(driver, nas_ip):
    """delete the folder from the S3 bucket in the AWS web console."""
    driver.switch_to.window(driver.window_handles[1])
    driver.refresh()
    time.sleep(1)
    assert wait_on_element(driver, 5, xpaths.aws.folder_header("my_folder/"))
    assert wait_on_element(driver, 5, f'//span[text()="{my_bucket}"]')
    driver.find_element_by_xpath(f'//span[text()="{my_bucket}"]').click()
    assert wait_on_element(driver, 5, xpaths.aws.folder_header(my_bucket))
    time.sleep(1)
    driver.find_element_by_xpath(xpaths.aws.check_All_Checkbox).click()
    assert wait_on_element(driver, 5, xpaths.aws.delete_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.aws.delete_Button).click()
    assert wait_on_element(driver, 5, '//div[contains(.,"Delete objects")]')
    assert wait_on_element(driver, 5, '//input[@placeholder="permanently delete"]', 'inputable')
    driver.find_element_by_xpath('//input[@placeholder="permanently delete"]').send_keys('permanently delete')
    assert wait_on_element(driver, 5, xpaths.aws.delete_Objects_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.aws.delete_Objects_Button).click()
    assert wait_on_element(driver, 5, '//div[contains(.,"Delete objects: status")]')
    time.sleep(0.5)
    assert wait_on_element(driver, 5, xpaths.aws.close, 'clickable')
    driver.find_element_by_xpath(xpaths.aws.close).click()
    assert wait_on_element(driver, 5, xpaths.aws.folder_header(my_bucket))
    cmd = 'rm -r /mnt/tank/aws_share/my_folder'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is True


@then('verify that the folder is not on the NAS dataset')
def verify_that_the_folder_is_not_on_the_nas_dataset(driver, nas_ip):
    """verify that the folder is not on the NAS dataset."""
    cmd = 'test -f /mnt/tank/aws_share/my_folder/cloud_test.txt'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is False


@then('select PUSH as the Direction then under Transfer Mode, select COPY')
def select_push_as_the_direction_then_under_transfer_mode_select_copy(driver):
    """select PUSH as the Direction then under Transfer Mode, select COPY."""
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Follow Symlinks"]', 'clickable')
    assert wait_on_element(driver, 5, '//mat-select[contains(.,"PULL")]')
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Direction"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Direction"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Direction_PUSH"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Direction_PUSH"]').click()
    assert wait_on_element(driver, 5, '//mat-select[contains(.,"PUSH")]')
    assert wait_on_element(driver, 5, '//h1[contains(.,"Transfer Mode Reset")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CLOSE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    assert wait_on_element(driver, 5, '//mat-select[contains(.,"COPY")]')


@then('click Save, the Cloud Sync Tasks should save without error')
def click_save_the_cloud_sync_tasks_should_save_without_error(driver):
    """click Save, the Cloud Sync Tasks should save without error."""
    assert wait_on_element(driver, 5, '//button[@id="save_button"]', 'clickable')
    driver.find_element_by_xpath('//button[@id="save_button"]').click()
    assert wait_on_element_disappear(driver, 30, '//h1[contains(.,"Please wait")]')
    # give time to the system to handle changes
    time.sleep(2)


@then('create a file in the directory of the dataset')
def create_a_file_in_the_directory_of_the_dataset(driver, nas_ip):
    """create a file in the directory of the dataset."""
    cmd = 'touch /mnt/tank/aws_share/cloud_test.txt'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is True
    cmd = 'test -f /mnt/tank/aws_share/cloud_test.txt'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is True


@then('on the NAS tab, expand the task and click Run Now')
def on_the_nas_tab_expand_the_task_and_click_run_now(driver):
    """on the NAS tab, expand the task and click Run Now."""
    driver.switch_to.window(driver.window_handles[0])
    assert wait_on_element(driver, 7, '//div[contains(.,"Cloud Sync Tasks")]')
    assert wait_on_element(driver, 5, '//div[contains(.,"My S3 AWS Share")]')
    time.sleep(1)
    if not wait_on_element(driver, 2, '//button[@id="action_button___run_now"]'):
        assert wait_on_element(driver, 5, '//a[@title="Expand/Collapse Row"]', 'clickable')
        driver.find_element_by_xpath('//a[@title="Expand/Collapse Row"]').click()
    assert wait_on_element(driver, 5, '//button[@id="action_button___run_now"]', 'clickable')
    driver.find_element_by_xpath('//button[@id="action_button___run_now"]').click()
    assert wait_on_element(driver, 5, '//h1[text()="Run Now"]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()
    assert wait_on_element(driver, 7, '//h1[contains(text(),"Task Started")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CLOSE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    assert wait_on_element_disappear(driver, 30, '//h1[contains(text(),"Task Started")]')
    assert wait_on_element(driver, 180, '//button[@id="My S3 AWS Share_Status-button" and contains(.,"SUCCESS")]')
    time.sleep(5)


@then('verify the file appear in the S3 bucket')
def verify_the_file_appear_in_the_s3_bucket(driver):
    """verify the file appear in the S3 bucket."""
    driver.switch_to.window(driver.window_handles[1])
    driver.refresh()
    assert wait_on_element(driver, 5, xpaths.aws.folder_header(my_bucket))
    assert wait_on_element(driver, 5, '//span[text()="cloud_test.txt"]', 'clickable')


@then('verify that the file is not deleted on the NAS')
def verify_that_the_file_is_not_deleted_on_the_nas(driver, nas_ip):
    """verify that the file is not deleted on the NAS."""
    cmd = 'test -f /mnt/tank/aws_share/cloud_test.txt'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is True


@then('create a sub-folder within the dataset folder create a file into it')
def create_a_subfolder_within_the_dataset_folder_create_a_file_into_it(driver, nas_ip):
    """create a sub-folder within the dataset folder create a file into it."""
    cmd = 'mkdir /mnt/tank/aws_share/my_folder'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is True
    cmd = 'touch /mnt/tank/aws_share/my_folder/cloud_test.txt'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is True
    cmd = 'test -f /mnt/tank/aws_share/my_folder/cloud_test.txt'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is True


@then('verify the folder appear in the S3 bucket with the file')
def verify_the_folder_appear_in_the_s3_bucket_with_the_file(driver):
    """verify the folder appear in the S3 bucket with the file."""
    driver.switch_to.window(driver.window_handles[1])
    driver.refresh()
    assert wait_on_element(driver, 5, xpaths.aws.folder_header(my_bucket))
    assert wait_on_element(driver, 5, '//span[text()="my_folder/"]', 'clickable')
    driver.find_element_by_xpath('//span[text()="my_folder/"]').click()
    assert wait_on_element(driver, 5, xpaths.aws.folder_header("my_folder/"))
    assert wait_on_element(driver, 5, '//span[text()="cloud_test.txt"]', 'clickable')


@then('verify the file appear into the S3 bucket and is removed from the NAS')
def verify_the_file_appear_into_the_s3_bucket_and_is_removed_from_the_nas(driver, nas_ip):
    """verify the file appear into the S3 bucket and is removed from the NAS."""
    driver.switch_to.window(driver.window_handles[1])
    driver.refresh()
    assert wait_on_element(driver, 5, xpaths.aws.folder_header(my_bucket))
    assert wait_on_element(driver, 5, '//span[text()="cloud_test.txt"]', 'clickable')
    cmd = 'test -f /mnt/tank/aws_share/cloud_test.txt'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is False


@then('delete the file from the dataset and click Run Now')
def delete_the_file_from_the_dataset_and_click_run_now(driver, nas_ip):
    """delete the file from the dataset and click Run Now."""
    cmd = 'rm -rf /mnt/tank/aws_share/cloud_test.txt'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is True
    driver.switch_to.window(driver.window_handles[0])
    assert wait_on_element(driver, 7, '//div[contains(.,"Cloud Sync Tasks")]')
    assert wait_on_element(driver, 5, '//div[contains(.,"My S3 AWS Share")]')
    time.sleep(1)
    if not wait_on_element(driver, 2, '//button[@id="action_button___run_now"]'):
        assert wait_on_element(driver, 5, '//a[@title="Expand/Collapse Row"]', 'clickable')
        driver.find_element_by_xpath('//a[@title="Expand/Collapse Row"]').click()
    assert wait_on_element(driver, 5, '//button[@id="action_button___run_now"]', 'clickable')
    driver.find_element_by_xpath('//button[@id="action_button___run_now"]').click()
    assert wait_on_element(driver, 5, '//h1[text()="Run Now"]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()
    assert wait_on_element(driver, 7, '//h1[contains(text(),"Task Started")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CLOSE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    assert wait_on_element_disappear(driver, 30, '//h1[contains(text(),"Task Started")]')
    assert wait_on_element(driver, 180, '//button[@id="My S3 AWS Share_Status-button" and contains(.,"SUCCESS")]')
    time.sleep(5)


@then('on the bucket tab, verify the file is deleted')
def on_the_bucket_tab_verify_the_file_is_deleted(driver):
    """on the bucket tab, verify the file is deleted."""
    driver.switch_to.window(driver.window_handles[1])
    driver.refresh()
    assert wait_on_element(driver, 5, xpaths.aws.folder_header(my_bucket))
    assert not wait_on_element(driver, 2, '//span[text()="cloud_test.txt"]', 'clickable')


@then('delete the folder from the dataset then click Run Now')
def delete_the_folder_from_the_dataset_then_click_run_now(driver, nas_ip):
    """delete the folder from the dataset then click Run Now."""
    cmd = 'rm -rf /mnt/tank/aws_share/my_folder'
    results = ssh_cmd(cmd, 'root', 'testing', nas_ip)
    assert results['result'] is True
    driver.switch_to.window(driver.window_handles[0])
    assert wait_on_element(driver, 7, '//div[contains(.,"Cloud Sync Tasks")]')
    assert wait_on_element(driver, 5, '//div[contains(.,"My S3 AWS Share")]')
    time.sleep(1)
    if not wait_on_element(driver, 2, '//button[@id="action_button___run_now"]'):
        assert wait_on_element(driver, 5, '//a[@title="Expand/Collapse Row"]', 'clickable')
        driver.find_element_by_xpath('//a[@title="Expand/Collapse Row"]').click()
    assert wait_on_element(driver, 5, '//button[@id="action_button___run_now"]', 'clickable')
    driver.find_element_by_xpath('//button[@id="action_button___run_now"]').click()
    assert wait_on_element(driver, 5, '//h1[text()="Run Now"]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()
    assert wait_on_element(driver, 7, '//h1[contains(text(),"Task Started")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CLOSE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    assert wait_on_element_disappear(driver, 30, '//h1[contains(text(),"Task Started")]')
    assert wait_on_element(driver, 180, '//button[@id="My S3 AWS Share_Status-button" and contains(.,"SUCCESS")]')
    time.sleep(5)


@then('on the bucket tab, verify the folder is deleted')
def on_the_bucket_tab_verify_the_folder_is_deleted(driver):
    """on the bucket tab, verify the folder is deleted."""
    driver.switch_to.window(driver.window_handles[1])
    assert wait_on_element(driver, 5, xpaths.aws.folder_header("my_folder/"))
    assert wait_on_element(driver, 5, f'//span[text()="{my_bucket}"]')
    driver.find_element_by_xpath(f'//span[text()="{my_bucket}"]').click()
    assert wait_on_element(driver, 5, xpaths.aws.folder_header(my_bucket))
    driver.refresh()
    assert wait_on_element(driver, 5, xpaths.aws.folder_header(my_bucket))
    assert not wait_on_element(driver, 1, '//span[text()="my_folder/"]', 'clickable')
    driver.close()
    driver.switch_to.window(driver.window_handles[0])
