# coding=utf-8
"""SCALE UI feature tests."""

from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)
import pytest
pytestmark = [pytest.mark.debug_test]


@scenario('features/NAS-T1063.feature', 'Storage Tests')
def storage_tests(driver):
    """storage tests."""
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

        #    """on the dashboard, verify the Welcome box is loaded, click Close."""
        time.sleep(2)
        if wait_on_element(driver, 5, '//div[contains(.,"Looking for help?")]'):
            assert wait_on_element(driver, 10, '//button[@ix-auto="button__CLOSE"]')
            driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()

        #    """on the dashboard click on the System Settings side menu, then click services."""
        assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')

@then('wipe one disk')
def test_wipe_one_disk(driver):
    """wipe one disk"""
    import test_002_1_wipe_one_disk
    test_002_1_wipe_one_disk.test_wipe_one_disk()


@then('create pool for system dataset')
def test_create_pool_for_system_dataset(driver):
    """create pool for system dataset"""
    import test_002_2_create_pool_for_system_dataset
    test_002_2_create_pool_for_system_dataset.test_create_pool_for_system_dataset(driver)


@then(parsers.parse('setup ad with {nameserver1} {ad_domain} {ad_user} {ad_password} {ca_ou} {cmd1} {ad_object1}  {cmd3} {dataset_name} {group_name}'))
def test_setup_ad(driver):
    """setup ad"""
    import test_002_3_setup_ad
    test_002_3_setup_ad.test_setup_ad(driver, nameserver1, ad_domain, ad_user, ad_password, ca_ou, cmd1, ad_object1, cmd3, dataset_name, group_name)


@then(parsers.parse('create ad dataset with {dataset_name} {group_name}'))
def test_create_ad_dataset(driver):
    """create ad dataset"""
    import test_002_4_create_ad_dataset
    test_002_4_create_ad_dataset.test_create_ad_dataset(driver, dataset_name, group_name)


@then(parsers.parse('add acl item on tank with {input} {user}'))
def test_add_acl_item_on_tank(driver):
    """add acl item on tank"""
    import test_002_5_add_acl_item_on_tank
    test_002_5_add_acl_item_on_tank.test_add_acl_item_on_tank(driver, input, user)


@then(parsers.parse('add acl item on system with {input} {user}'))
def test_add_acl_item_on_tank(driver):
    """add acl item on tank"""
    import test_002_6_add_acl_item_on_tank
    test_002_6_add_acl_item_on_tank.test_add_acl_item_on_tank(driver, input, user)


@then(parsers.parse('create smb share on system with {systemsmbpath} {systemsmbname} {systemsmbdescription} {mysmbshare} {user} {password}'))
def test_create_smb_share_on_system(driver):
    """create smb share on system with"""
    import test_002_7_create_smb_share_on_system
    test_002_7_create_smb_share_on_system.test_create_smb_share_on_system(driver, nas_ip, root_password, systemsmbpath, systemsmbname, systemsmbdescription, mysmbshare, user, password)


@then(parsers.parse('create smb share on tank with {tanksmbpath} {tanksmbname} {tanksmbdescription} {mysmbshare} {user} {password}'))
def test_create_smb_share_on_tank(driver):
    """test_create_smb_share_on_tank"""
    import test_002_8_create_smb_share_on_tank
    test_002_8_create_smb_share_on_tank.test_create_smb_share_on_tank(driver, nas_ip, root_password, tanksmbpath, tanksmbname, tanksmbdescription, mysmbshare, user, password)


@then(parsers.parse('setup ldap with {hostname} {base_DN} {bind_DN} {bind_password} {command} {user}'))
def test_setup_ldap(driver):
    """setup ldap"""
    import test_002_9_setup_ldap
    test_002_9_setup_ldap.test_setup_ldap(driver, nas_ip, root_password, hostname, base_DN, bind_DN, bind_password, command, user)


@then(parsers.parse('create ldap dataset with {dataset_name} {user}'))
def test_create_ldap_dataset(driver):
    """create ldap dataset"""
    import test_002_10_create_ldap_dataset
    test_002_10_create_ldap_dataset.test_create_ldap_dataset(driver, dataset_name, user)


@then(parsers.parse('create smb share on ldap datasetwith {path} {smbsharename} {smbsharedescription} {ldapsmbshare} {ldap_user} {ldap_password}'))
def test_create_smb_share_on_ldap_dataset(driver):
    """create smb share on ldap dataset"""
    import test_002_11_create_smb_share_on_ldap_dataset
    test_002_11_create_smb_share_on_ldap_dataset.test_create_smb_share_on_ldap_dataset(driver, nas_ip, root_password, smbsharename, smbsharedescription, ldapsmbshare, ldap_user, ldap_password)


@then('create second user for smb share')
def test_create_second_user_for_smb_share(driver):
    """create second user for smb share"""
    import test_002_12_create_second_user_for_smb_share
    test_002_12_create_second_smb_user_for_share.test_create_second_user_for_smb_share(driver)


@then(parsers.parse('create wheel dataset with {dataset_name}'))
def test_create_wheel_dataset(driver):
    """create wheel dataset"""
    import test_002_13_create_wheel_dataset
    test_002_13_create_wheel_dataset.test_create_wheel_dataset(driver, dataset_name)


@then(parsers.parse('create wheel smb sharewith {path} {smbname} {description} {wheelname} {user} {password}'))
def test_create_wheel_smb_share(driver):
    """create wheel smb share"""
    import test_002_14_create_wheel_smb_share
    test_002_14_create_wheel_smb_share.test_create_wheel_smb_share(driver, nas_ip, root_password, path, smbname, description, wheelname, user, password)


@then(parsers.parse('create ericbsd dataset with {dataset_name} {user} {group}'))
def test_create_ericbsd_dataset(driver):
    """create ericbsd dataset"""
    import test_002_15_test_create_ericbsd_dataset
    test_002_15_create_ericbsd_dataset.test_create_ericbsd_dataset(driver, dataset_name, user, group)


@then(parsers.parse('create ericbsd smb sharewith {path} {description} {sharenaame} {smbname} {user} {password} {user2} {password2}'))
def test_create_ericbsd_smb_share(driver):
    """create ericbsd smb share"""
    import test_002_16_test_create_ericbsd_smb_share
    test_002_16_create_ericbsd_smb_share.test_create_ericbsd_smb_share(driver, nas_ip, root_password, path, description, sharename, smbname, user, password, user2, password2)


@then(parsers.parse('create zvol for iscsi with {name} {zvol_1G_size}'))
def test_create_zvol_for_iscsi(driver):
    """create zvol for iscsi"""
    import test_002_17_test_create_zvol_for_iscsi
    test_002_17_create_zvol_for_iscsi.test_create_zvol_for_iscsi(driver, name, zvol_1G_size)


@then(parsers.parse('kerberos keytab with {tabfile_string}'))
def test_kerberos_keytab(driver):
    """kerberos keytab"""
    import test_002_18_test_kerberos_keytab
    test_002_18_kerberos_keytab.test_kerberos_keytab(driver, tabfile_string)


@then(parsers.parse('recursive and transverse acls with {dataset_name} {path}'))
def test_recursive_and_transverse_acls(driver):
    """recursive and transverse acls"""
    import test_002_19_test_recursive_and_transverse_acls
    test_002_19_recursive_and_transverse_acls.test_recursive_and_transverse_acls(driver, dataset_name, path)


@then('import disk')
def test_import_disk(driver):
    """import disk"""
    import test_002_20_test_import_disk
    test_002_20_import_disk.test_import_disk(driver)


@then('create encrypted pool')
def test_create_encrypted_pool(driver):
    """create encrypted pool"""
    import test_002_21_test_create_encrypted_pool
    test_002_21_create_encrypted_pool.test_create_encrypted_pool(driver)


@then('change encryption key')
def test_change_encryption_key(driver):
    """change encryption key"""
    import test_002_22_test_change_encryption_key
    test_002_22_change_encryption_key.test_change_encryption_key(driver)


@then('lock and unlock encrypted dataset')
def test_lock_and_unlock_encrypted_dataset(driver):
    """lock and unlock encrypted dataset"""
    import test_002_23_test_lock_and_unlock_encrypted_dataset
    test_002_23_lock_and_unlock_encrypted_dataset.test_lock_and_unlock_encrypted_dataset(driver)


@then('verify fullaudit for smb')
def test_verify_fullaudit_for_smb(driver):
    """verify fullaudit for smb"""
    import test_002_24_test_verify_fullaudit_for_smb
    test_002_24_verify_fullaudit_for_smb.test_verify_fullaudit_for_smb(driver)


@then('delete dataset')
def test_delete_dataset(driver):
    """delete dataset"""
    import test_002_25_test_delete_dataset
    test_002_25_delete_dataset.test_delete_dataset(driver)
