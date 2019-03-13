#!/usr/bin/env python

# Author: Eric Turgeon
# License: BSD
# Location for tests  of FreeNAS new GUI
#Test case count: 1

from source import *
from selenium.webdriver.common.keys import Keys
from selenium import webdriver
from selenium.webdriver.support.ui import Select
from selenium.webdriver.common.by import By
from selenium.common.exceptions import ElementNotVisibleException
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
import time
import unittest
import xmlrunner
import random
try:
    import unittest2 as unittest
except ImportError:
    import unittest


class guide_test(unittest.TestCase):
    @classmethod
    def setUpClass(inst):
        #driver.implicitly_wait(30)
        pass

    #Test navigation Account>Users>Hover>New User and enter username,fullname,password,confirmation and wait till user is  visibile in the list
    def test_1_next_guide(self):
        #Click on the guide button
        driver.find_element_by_xpath("/html/body/div[4]/div[1]/button").click()
        driver.find_element_by_xpath("/html/body/app-root/app-admin-layout/md-sidenav-container/div[6]/topbar/md-toolbar/div/md-toolbar-row/button[4]").click()
        time.sleep(1)
        #Click on Next the first guide
        driver.find_element_by_xpath("/html/body/div[4]/div[1]/div[2]/button[1]").click()
        time.sleep(1)
        #Click on Next the second guide
        driver.find_element_by_xpath("/html/body/div[4]/div[1]/div[2]/button[2]").click()
        time.sleep(1)
        #Click on Next the third guide
        driver.find_element_by_xpath("/html/body/div[4]/div[1]/div[2]/button[2]").click()
        time.sleep(1)
        #Click on Next the fourth guide
        driver.find_element_by_xpath("/html/body/div[4]/div[1]/div[2]/button[2]").click()
        time.sleep(1)

        #self.assertTrue(self.is_element_present(By.XPATH, "//input[@id='md-input-1']"),
                        #"Logout failed")

    # Next step-- To check if the new user is present in the list via automation


    #method to test if an element is present
    def is_element_present(self, how, what):
        """
        Helper met:hod to confirm the presence of an element on page
        :params how: By locator type
        :params what: locator value
        """
        try: driver.find_element(by=how, value=what)
        except NoSuchElementException: return False
        return True

    @classmethod
    def tearDownClass(inst):
        pass

def run_guide_test(webdriver):
    global driver
    driver = webdriver
    suite = unittest.TestLoader().loadTestsFromTestCase(guide_test)
    xmlrunner.XMLTestRunner(output=results_xml, verbosity=2).run(suite)
