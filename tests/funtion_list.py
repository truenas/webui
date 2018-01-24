    #method to test if an element is present
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
        #the convention is set in such a way tha a single funtion can cleanup both type:user/group, name:name of the group or user
        #path plugs in the xpath of user or group , submenu{User/Group}
        #num specifies the column of the 3 dots which is different in user/group
        #delNum speifies the option number where del is after clicking on the 3 dots
        if (type == "user"):
            path = "User"
            num = 7
            delNum = 2
        elif (type == "group"):
            path = "Group"
            num = 4
            delNum = 3

        #Click User submenu
        driver.find_element_by_xpath(xpaths['submenu' + path]).click()
        #click on the item per page option
        driver.find_element_by_xpath("//*[@id='entity-table-component']/div[3]/md-paginator/div[1]/md-select/div").click()
        time.sleep(1)
        #click select the highest number i.e 100

        for y in range(0, 10):
            if self.is_element_present(By.XPATH, "/html/body/div[" + str(y) + "]/div[2]/div/div/md-option[4]"):
                search=driver.find_element_by_xpath("/html/body/div[" + str(y) + "]/div[2]/div/div/md-option[4]")
                #get element data
                search_data=search.text
                if search_data == "100":
                    driver.find_element_by_xpath("/html/body/div[" + str(y) + "]/div[2]/div/div/md-option[4]").click()
                    break

#        driver.find_element_by_xpath("/html/body/div[3]/div[2]/div/div/md-option[4]").click()
        #wait till the list is loaded
        time.sleep(5)
        index = 0
        ui_text = "null"
        for x in range(0, 8):
            if self.is_element_present(By.XPATH, "/html/body/app-root/app-admin-layout/md-sidenav-container/div[6]/div/app-" + path + "-list/$
                ui_element=driver.find_element_by_xpath("/html/body/app-root/app-admin-layout/md-sidenav-container/div[6]/div/app-" + path + $
                ui_text = ui_element.text
            if (ui_text == name):
                index = x
                break
            ui_element = " "

        #click on the 3 dots
        driver.find_element_by_xpath("//*[@id='entity-table-component']/div[5]/ngx-datatable/div/datatable-body/datatable-selection/datatable$
        #click on delete option
        driver.find_element_by_xpath("/html/body/div[3]/div[3]/div/div/span[" + str(delNum) + "]/button/div").click()
        #click on confirmation checkbox
        driver.find_element_by_xpath("/html/body/div[3]/div[3]/div[2]/md-dialog-container/confirm-dialog/div[1]/md-checkbox/label/div").click$
        #click on Ok
        driver.find_element_by_xpath("/html/body/div[3]/div[3]/div[2]/md-dialog-container/confirm-dialog/div[2]/button[1]").click()
        print (name + " deleted")


