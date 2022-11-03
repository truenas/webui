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
    parsers
)
import pytest
pytestmark = [pytest.mark.debug_test]


@scenario('features/NAS-T1560.feature', 'Storage Tests')
def test_storage_tests(driver):
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
        assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()

    #    """on the dashboard click on the System Settings side menu, then click services."""
    assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')


@then('wipe one disk')
def wipe_one_disk(driver):
    """wipe one disk"""
    import t_004_1_wipe_one_disk
    t_004_1_wipe_one_disk.test_wipe_one_disk(driver)


@then('create pool for system dataset')
def create_pool_for_system_dataset(driver):
    """create pool for system dataset"""
    import t_004_2_create_pool_for_system_dataset
    t_004_2_create_pool_for_system_dataset.test_create_pool_for_system_dataset(driver)


@then(parsers.parse('setup ad with "{ad_ns}" "{ad_domain}" "{ad_user}" "{ad_password}" "{ca_ou}" "{cmd1}" "{ad_object1}" "{cmd2}" "{dataset_name}" "{group_name}"'))
def setup_ad(driver, nas_ip, root_password, ad_ns, ad_domain, ad_user, ad_password, ca_ou, cmd1, ad_object1, cmd2, dataset_name, group_name):
    """setup ad"""
    import t_004_3_setup_ad
    t_004_3_setup_ad.test_setup_ad(driver, nas_ip, root_password, ad_ns, ad_domain, ad_user, ad_password, ca_ou, cmd1, ad_object1, cmd2, dataset_name, group_name)


@then(parsers.parse('create ad dataset with "{dataset_name}" "{group_name}"'))
def create_ad_dataset(driver, dataset_name, group_name):
    """create ad dataset"""
    import t_004_4_create_ad_dataset
    t_004_4_create_ad_dataset.test_create_ad_dataset(driver, dataset_name, group_name)


@then(parsers.parse('add acl item on tank with "{input}" "{user}"'))
def add_acl_item_on_tank(driver, input, user):
    """add acl item on tank"""
    import t_004_5_add_acl_item_on_tank
    t_004_5_add_acl_item_on_tank.test_add_acl_item_on_tank(driver, input, user)


@then(parsers.parse('add acl item on system with "{input}" "{user}"'))
def add_acl_item_on_system(driver, input, user):
    """add acl item on tank"""
    import t_004_6_add_acl_item_on_system
    t_004_6_add_acl_item_on_system.test_add_acl_item_on_system(driver, input, user)


@then(parsers.parse('create smb share on system with "{systemsmbpath}" "{systemsmbname}" "{systemsmbdescription}" "{mysmbshare}" "{user}" "{password}"'))
def create_smb_share_on_system(driver, nas_ip, root_password, systemsmbpath, systemsmbname, systemsmbdescription, mysmbshare, user, password):
    """create smb share on system with"""
    import t_004_7_create_smb_share_on_system
    t_004_7_create_smb_share_on_system.test_create_smb_share_on_system(driver, nas_ip, root_password, systemsmbpath, systemsmbname, systemsmbdescription, mysmbshare, user, password)


@then(parsers.parse('create smb share on tank with "{tanksmbpath}" "{tanksmbname}" "{tanksmbdescription}" "{mysmbshare}" "{user}" "{password}"'))
def create_smb_share_on_tank(driver, nas_ip, root_password, tanksmbpath, tanksmbname, tanksmbdescription, mysmbshare, user, password):
    """test_create_smb_share_on_tank"""
    import t_004_8_create_smb_share_on_tank
    t_004_8_create_smb_share_on_tank.test_create_smb_share_on_tank(driver, nas_ip, root_password, tanksmbpath, tanksmbname, tanksmbdescription, mysmbshare, user, password)


@then(parsers.parse('setup ldap with "{hostname}" "{base_DN}" "{bind_DN}" "{bind_password}" "{command}" "{user}"'))
def setup_ldap(driver, nas_ip, root_password, hostname, base_DN, bind_DN, bind_password, command, user):
    """setup ldap"""
#    import t_004_9_setup_ldap
#    t_004_9_setup_ldap.test_setup_ldap(driver, nas_ip, root_password, hostname, base_DN, bind_DN, bind_password, command, user)


@then(parsers.parse('create ldap dataset with "{dataset_name}" "{user}"'))
def create_ldap_dataset(driver, dataset_name, user):
    """create ldap dataset"""
#    import t_004_10_create_ldap_dataset
#    t_004_10_create_ldap_dataset.test_create_ldap_dataset(driver, dataset_name, user)


@then(parsers.parse('create smb share on ldap datasetwith "{smb_ldap_path}" "{ldapsmbsharename}" "{ldapsmbsharedescription}" "{ldapsmbshare}" "{ldap_user}" "{ldap_password}"'))
def create_smb_share_on_ldap_dataset(driver, nas_ip, root_password, smb_ldap_path, ldapsmbsharename, ldapsmbsharedescription, ldapsmbshare, ldap_user, ldap_password):
    """create smb share on ldap dataset"""
#    import t_004_11_create_smb_share_on_ldap_dataset
#    t_004_11_create_smb_share_on_ldap_dataset.test_create_smb_share_on_ldap_dataset(driver, nas_ip, root_password, smb_ldap_path, ldapsmbsharename, ldapsmbsharedescription, ldapsmbshare, ldap_user, ldap_password)


@then('create second user for smb share')
def create_second_user_for_smb_share(driver):
    """create second user for smb share"""
#    import t_004_12_create_second_user_for_smb_share
#    t_004_12_create_second_user_for_smb_share.test_create_second_user_for_smb_share(driver)


@then(parsers.parse('create ericbsd dataset with "{dataset_name}" "{user}"'))
def create_ericbsd_dataset(driver, dataset_name, user):
    """create ericbsd dataset"""
#    import t_004_15_create_ericbsd_dataset
#    t_004_15_create_ericbsd_dataset.test_create_ericbsd_dataset(driver, dataset_name, user)


@then(parsers.parse('create ericbsd smb sharewith "{path}" "{description}" "{sharenaame}" "{smbname}" "{user}" "{password}" "{user2}" "{password2}"'))
def create_ericbsd_smb_share(driver):
    """create ericbsd smb share"""
#    import t_004_16_test_create_ericbsd_smb_share
#    t_004_16_create_ericbsd_smb_share.test_create_ericbsd_smb_share(driver, nas_ip, root_password, path, description, sharename, smbname, user, password, user2, password2)


@then(parsers.parse('create zvol for iscsi with {name} {zvol_1G_size}'))
def create_zvol_for_iscsi(driver):
    """create zvol for iscsi"""
#    import t_004_17_test_create_zvol_for_iscsi
#    t_004_17_create_zvol_for_iscsi.test_create_zvol_for_iscsi(driver, name, zvol_1G_size)


@then(parsers.parse('kerberos keytab with {tabfile_string}'))
def kerberos_keytab(driver):
    """kerberos keytab"""
#    import t_004_18_test_kerberos_keytab
#    t_004_18_kerberos_keytab.test_kerberos_keytab(driver, tabfile_string)


@then(parsers.parse('recursive and transverse acls with {path}'))
def recursive_and_transverse_acls(driver):
    """recursive and transverse acls"""
#    import t_004_19_test_recursive_and_transverse_acls
#    t_004_19_recursive_and_transverse_acls.test_recursive_and_transverse_acls(driver, dataset_name, path)


@then('import disk')
def import_disk(driver):
    """import disk"""
#    import t_004_20_test_import_disk
#    t_004_20_import_disk.test_import_disk(driver)


@then('create encrypted pool')
def create_encrypted_pool(driver):
    """create encrypted pool"""
    import t_004_21_create_encrypted_pool
    t_004_21_create_encrypted_pool.test_create_encrypted_pool(driver)


@then('change encryption key')
def change_encryption_key(driver):
    """change encryption key"""
    import t_004_22_change_encryption_key
    t_004_22_change_encryption_key.test_change_encryption_key(driver)


@then('lock and unlock encrypted dataset')
def lock_and_unlock_encrypted_dataset(driver):
    """lock and unlock encrypted dataset"""
    import t_004_23_lock_and_unlock_encrypted_dataset
    t_004_23_lock_and_unlock_encrypted_dataset.test_lock_and_unlock_encrypted_dataset(driver)


@then('verify fullaudit for smb')
def verify_fullaudit_for_smb(driver):
    """verify fullaudit for smb"""
#    import t_004_24_test_verify_fullaudit_for_smb
#    t_004_24_verify_fullaudit_for_smb.test_verify_fullaudit_for_smb(driver)


@then('delete dataset')
def delete_dataset(driver):
    """delete dataset"""
#    import t_004_25_test_delete_dataset
#    t_004_25_delete_dataset.test_delete_dataset(driver)
