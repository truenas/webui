# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 9

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


xpaths = {
        'navAccount' : "//*[@id='nav-1']/div/a[1]",
        'submenuUser' : "//*[@id='1-1']",
        'submenuGroup' : "//*[@id='1-0']",
        }

class delete_test(unittest.TestCase):
    @classmethod
    def setUpClass(inst):
        driver.implicitly_wait(30)
        pass

    # Test navigation Account>Users>Hover>New User and enter username,fullname,password,confirmation and wait till user is  visibile in the list
    def test_01_00_nav_acc_user(self):
        # Click  Account menu
        print (" navigating to the user submenu")
        a = driver.find_element_by_xpath(xpaths['navAccount'])
        a.click()
        # allowing the button to load
        time.sleep(1)
        # Click User submenu
        driver.find_element_by_xpath(xpaths['submenuUser']).click()
        # get the ui element
        ui_element=driver.find_element_by_xpath("/html/body/app-root/app-admin-layout/md-sidenav-container/div[6]/app-breadcrumb/div/ul/li[2]/a")
        # get the weather data
        page_data=ui_element.text
        print ("the Page now is: " + page_data)
        # assert response
        self.assertTrue("User" in page_data)

    def test_01_01_delete_user(self):
        print (" deleting a user: " + newusername)
        time.sleep(2)
        self.delete("user", newusername)

    def test_01_02_delete_user(self):
        print (" deleting a user: " + newusernameuncheck)
        time.sleep(2)
        self.delete("user", newusernameuncheck)

    def test_01_03_delete_user(self):
        print (" deleting a user: " + superusername)
        time.sleep(2)
        self.delete("user", superusername)
        time.sleep(2)

    def test_02_00_nav_acc_group(self):
        # Click  Account menu
        print (" navigating to the group submenu")
        # Click User submenu
        driver.find_element_by_xpath(xpaths['submenuGroup']).click()
        # get the ui element
        ui_element=driver.find_element_by_xpath("/html/body/app-root/app-admin-layout/md-sidenav-container/div[6]/app-breadcrumb/div/ul/li[2]/a")
        # get the weather data
        page_data=ui_element.text
        print ("the Page now is: " + page_data)
        # assert response
        self.assertTrue("Group" in page_data)

    def test_02_01_delete_group(self):
        print (" deleting a group: " + newusername)
        time.sleep(2)
        self.delete("group", newusername)

    def test_02_02_delete_group(self):
        print (" deleting a group: " + superusername)
        time.sleep(2)
        self.delete("group", superusername)

    def test_02_03_delete_group(self):
        print (" deleting a group: " + newgroupname)
        time.sleep(2)
        self.delete("group", newgroupname)

    def test_02_04_delete_group(self):
        print (" deleting a group: " + supergroupname)
        time.sleep(2)
        self.delete("group", supergroupname)
        time.sleep(20)


    # Next step-- To check if the new user is present in the list via automation


    # method to test if an element is present
    def is_element_present(self, how, what):
        """
        Helper method to confirm the presence of an element on page
        :params how: By locator type
        :params what: locator value
        """
        try: driver.find_element(by=how, value=what)
        except NoSuchElementException: return False
        return True

    def error_check(self):
        if self.is_element_present(By.XPATH,"/html/body/div[3]/div/div[2]/md-dialog-container/error-dialog/div[1]/p"):
            ui_element=driver.find_element_by_xpath("/html/body/div[3]/div/div[2]/md-dialog-container/error-dialog/div[1]/p")
            error_element=ui_element.text
            print (error_element)
            driver.find_element_by_xpath("/html/body/div[3]/div/div[2]/md-dialog-container/error-dialog/div[2]/button").click()

    def delete(self, type, name):
        # the convention is set in such a way tha a single funtion can cleanup both type:user/group, name:name of the group or user
        # path plugs in the xpath of user or group , submenu{User/Group}
        # num specifies the column of the 3 dots which is different in user/group
        # delNum speifies the option number where del is after clicking on the 3 dots
        if (type == "user"):
            path = "User"
            num = 7
            delNum = 2
        elif (type == "group"):
            path = "Group"
            num = 4
            delNum = 3

        # Click User submenu
        driver.find_element_by_xpath(xpaths['submenu' + path]).click()
        # click on the item per page option
#        driver.find_element_by_xpath("//*[@id='entity-table-component']/div[3]/md-paginator/div[1]/md-select/div").click()
#        time.sleep(1)
        # click select the highest number i.e 100

#        for y in range(0, 10):
#            if self.is_element_present(By.XPATH, "/html/body/div[3]/div[2]/div/div/md-option[" + str(y) + "]"):
#                search=driver.find_element_by_xpath("/html/body/div[3]/div[2]/div/div/md-option[" + str(y) + "]")
#                #get element data
#                search_data=search.text
#                print ("Loop first condition satisfied at: " + str(y))
#                if search_data == "100":
#                    driver.find_element_by_xpath("/html/body/div[3]/div[2]/div/div/md-option[" + str(y) + "]").click()
#                    print ("Loop Second condition satisfied at: "+ str(y))
#                    break
#            else:
#                print ("Loop not working at all")

#        driver.find_element_by_xpath("/html/body/div[3]/div[2]/div/div/md-option[4]").click()
        # wait till the list is loaded
        time.sleep(2)
        index = 1
        ui_text = "null"
        for x in range(1, 8):
            if self.is_element_present(By.XPATH, "/html/body/app-root/app-admin-layout/md-sidenav-container/div[6]/div/app-" + path + "-list/entity-table/div/div[5]/ngx-datatable/div/datatable-body/datatable-selection/datatable-scroller/datatable-row-wrapper[" + str(x) + "]/datatable-body-row/div[2]/datatable-body-cell[1]/div/div"):
                ui_element=driver.find_element_by_xpath("/html/body/app-root/app-admin-layout/md-sidenav-container/div[6]/div/app-" + path + "-list/entity-table/div/div[5]/ngx-datatable/div/datatable-body/datatable-selection/datatable-scroller/datatable-row-wrapper[" + str(x) + "]/datatable-body-row/div[2]/datatable-body-cell[1]/div/div")
                ui_text = ui_element.text
            if (ui_text == name):
                index = x
                break
            ui_element = " "

        print ("index, delNum, num: " + str(index) + ", " + str(delNum) + "," + str(num))
        time.sleep(1)

        # click on the 3 dots
        driver.find_element_by_xpath("//*[@id='entity-table-component']/div[5]/ngx-datatable/div/datatable-body/datatable-selection/datatable-scroller/datatable-row-wrapper[" + str(index) + "]/datatable-body-row/div[2]/datatable-body-cell[" + str(num) + "]/div/app-entity-table-actions/div/md-icon").click()
        time.sleep(1)
#        """
#        for z in range(0, 10):
#            if self.is_element_present(By.XPATH,"/html/body/div[4]/div[" + str(z) + "]/div/div/span[" + str(delNum) + "]/button"):
#                print ("first condition satisfied at z=" + str(z))
#                ui_option = driver.find_element_by_xpath("/html/body/div[4]/div[" + str(z) + "]/div/div/span[" + str(delNum) + "]/button")
#                ui_text = ui_option.text
#                if (ui_text == "Delete"):
#                    print ("second condition satisfied at z= " + str(z))
#                    driver.find_element_by_xpath("/html/body/div[4]/div[" + str(z) + "]/div/div/span[" + str(delNum) + "]/button").click()
#                    print ("Delete click attempted")
                    #click on confirmation checkbox
#                    driver.find_element_by_xpath("/html/body/div[4]/div[" + str(z) + "]/div[2]/md-dialog-container/confirm-dialog/div[1]/md-checkbox/label/div").click()
                    #click on Ok
#                    driver.find_element_by_xpath("/html/body/div[4]/div[" + str(z) + "]/div[2]/md-dialog-container/confirm-dialog/div[2]/button[1]").click()
#                    print (name + " deleted")
#                    break
#            ui_option = " "
#        """
        # click on delete option
        driver.find_element_by_xpath("/html/body/div[4]/div[" + str(index + 1) + "]/div/div/span[" + str(delNum) + "]/button/div").click()
#        driver.find_element_by_xpath("/html/body/div[3]/div[3]/div/div/span[3]/button/div").click()
        # click on confirmation checkbox
#        driver.find_element_by_xpath("/html/body/div[3]/div[3]/div[2]/md-dialog-container/confirm-dialog/div[1]/md-checkbox/label/div").click()
        # click on Ok
#        driver.find_element_by_xpath("/html/body/div[3]/div[3]/div[2]/md-dialog-container/confirm-dialog/div[2]/button[1]").click()
#        print (name + " deleted")



    @classmethod
    def tearDownClass(inst):
        pass

def run_delete_test(webdriver):
    global driver
    driver = webdriver
    suite = unittest.TestLoader().loadTestsFromTestCase(delete_test)
    xmlrunner.XMLTestRunner(output=results_xml, verbosity=2).run(suite)
