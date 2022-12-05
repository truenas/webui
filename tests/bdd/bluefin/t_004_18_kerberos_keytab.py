# coding=utf-8
"""SCALE UI feature tests."""
import time
import os
import glob
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_for_attribute_value,
    wait_on_element_disappear,
    word_xor
)




def test_kerberos_keytab(driver, tabfile_string):
    """test_kerberos_keytab"""
    assert wait_on_element(driver,  15, '//mat-list-item[@ix-auto="option__Credentials"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Credentials"]').click()
    assert wait_on_element(driver,  15, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Directory Services"]', 'clickable') 
    driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Directory Services"]').click()


    # click on advanced and Kerberos Keytab Add
    time.sleep(1)
    assert wait_on_element(driver,  15, '//span[contains(text(),"Show")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Show")]').click()
    assert wait_on_element(driver,  15, '//h1[contains(.,"Warning")]')
    assert wait_on_element(driver,  15, '//span[contains(text(),"Continue")]', 'clickable')
    driver.find_element_by_xpath('//span[contains(text(),"Continue")]').click()
    time.sleep(1)
    driver.find_element_by_xpath('//mat-card[contains(.,"Kerberos Keytab")]//span[contains(text(),"Add")]').click()



    # decode the tabfile with "{tabfile_string}"
    # open tabfile
    global tabfile
    global tab_result
    global datafile
    tabfile_path = os.getcwd() + '/tabfile'
    assert glob.glob(tabfile_path)
    tabfile = sorted(glob.glob(tabfile_path))[-1]
    datafile = open(os.path.expanduser(tabfile_path), 'rb').read()
    tab_result = word_xor(datafile, tabfile_string)
    time.sleep(2)
    open('KEYTABNAME.KEYTAB','wb').write(tab_result)


    # name the keytab and upload the file and click save
    time.sleep(1)

    assert wait_on_element(driver, 10, '//ix-input//ix-label//label//span[contains(.,"Name")]//ancestor::ix-input//div//input', 'inputable')
    driver.find_element_by_xpath('//ix-input//ix-label//label//span[contains(.,"Name")]//ancestor::ix-input//div//input').clear()
    driver.find_element_by_xpath('//ix-input//ix-label//label//span[contains(.,"Name")]//ancestor::ix-input//div//input').send_keys("keytab_test")
    # define file
    global keytab_file
    global keytab_file_path
    keytab_file_path = os.getcwd() + '/KEYTABNAME.KEYTAB'
    assert glob.glob(keytab_file_path)
    keytab_file = sorted(glob.glob(keytab_file_path))[-1]


    assert wait_on_element(driver, 15, '//ix-file-input//div//div//label[contains(.,"Choose File")]', 'clickable')
    driver.find_element_by_xpath('//ix-file-input[@formcontrolname="file"]//input').send_keys(keytab_file)
    #save
    driver.find_element_by_xpath('//span[contains(text(),"Save")]').click()


    # verify that the file was accepted and utilized
    time.sleep(1)
    assert wait_on_element(driver, 15, '//mat-card[contains(.,"Kerberos Keytab")]//div[contains(text(),"keytab_test")]')
