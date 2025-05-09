import re
import json
import bcrypt 
from datetime import datetime


mainMenu='''
    1) Register
    2) Login
    
    '''  
projectMenu='''
    Projects
    1) View 
    2) Create
    3) Edit
    4) Delete
    
    '''      
    
validation = {
  "firstName": {
    "pattern": "^[a-zA-Z ]{2,30}$",
    "error": "First name must be 2-30 letters long and contain only alphabets and spaces."
  },
  "lastName": {
    "pattern": "^[a-zA-Z ]{2,30}$",
    "error": "Last name must be 2-30 letters long and contain only alphabets and spaces."
  },
  "email": {
    "pattern": "^([a-z0-9_\\.-]+@[\\da-z\\.-]+\\.[a-z\\.]{2,6})$",
    "error": "Invalid email format. Example: user@example.com"
  },
  "password": {
    "pattern": "^(?=.*\d)(?=.*[A-Z])(?=.*[a-z])(?=.*[\W_])([^\s]){8,16}$",
    "error": "Password must be 8-16 characters, include uppercase, lowercase, number, and special character."
  },
  
    "confirmPassword":{"error":"Confirm Password must match password"}  
  ,
  "mobilePhone": {
    "pattern": "^01[0125]\\d{8}$",
    "error": "Mobile number must start with 010, 011, 012, or 015 and be 11 digits long."
  }
}



def validateUserProperty(inputValue,inputName):
      isInputValid=re.match(validation[inputName]['pattern'],inputValue)
      return True if isInputValid else print(validation[inputName]['error']) 
def validateNumber(num):
    try:
        return int(num);
    except:
        return False  
def validateDateFormat(dateValue):
    try:
         datetime.strptime(dateValue, "%d/%m/%Y")
         return True
    except ValueError:
        return False

def checkConfirmPassword(password,confirmPassword):
    return True if password == confirmPassword else print(validation['confirmPassword']['error'])

def checkUniqueEmailFilter(userEmail,currEmail):
  return True  if userEmail==currEmail else False
        
def checkUniqueEmail(email):
    isEmailUnique=True
    with open('users.json','r') as file:
        users=json.load(file)
        
    for user in users:
        if email==user.get("email"):
            isEmailUnique=False
            break
    return True if isEmailUnique else print("Email must be Unique")    
                
def authenticateUser(email,password):
    password = password.encode('utf-8') 
   

    
    with open('users.json','r') as file:
            users=json.load(file)  
      
        
    for user in users:
        if email==user.get("email"):
            if bcrypt.checkpw(password, user.get("password").encode('utf-8')) :
                return user
         
    return print("Check your credentials again")    

def viewProjects():
    with open('projects.json','r') as file:
                projects=json.load(file)
    print (projects)                 

def createProject(title,details,target,startDate,endDate,userId):
    with open('projects.json','r') as file:
                projects=json.load(file)
    newProject={
        'title':title,
        'details':details,
        'target':target,
        'startDate':startDate,
        'endDate':endDate,
        'userId':userId        
    }
    newProject['projectId']=projects[-1]['projectId']+1 if projects else 1 
    projects.append(newProject)
    with open('projects.json','w') as file:
        json.dump(projects,file,indent=2)
        
def viewUserProjects(userId):
    userProjectsId=[]
    userProjects=[]
    with open('projects.json','r') as file:
                projects=json.load(file)
                
    for project in projects:
        if userId==project['userId']:
            userProjectsId.append(project['projectId'])
            userProjects.append(project)            
    print(userProjects if userProjects else "You don't have projects")
    return userProjectsId                     

def deleteProject(projectId):
    with open('projects.json','r') as file:
                projects=json.load(file)
    for project in projects:
        if projectId==project['projectId']:
            projects.remove(project)
            break
    with open('projects.json','w') as file:
        json.dump(projects,file,indent=2) 

def editProject(updatedProject):
    with open('projects.json','r') as file:
                projects=json.load(file)
    for project in projects:
        print(updatedProject['projectId'],project['projectId'])            
        if updatedProject['projectId']==project['projectId']:
            project.update({key:value for key,value in updatedProject.items() if value !=''})
            print(project)
            break
    with open('projects.json','w') as file:
        json.dump(projects,file,indent=2)    
            



            
            
                        
                       
while(1):
    print(mainMenu)
    mainMenuSelection=input("Select\n")
    match mainMenuSelection:
        case '1':
            valid=False
            while (not valid):
                firstName=input('Enter your first name\n')
                valid=validateUserProperty(firstName,'firstName')
            valid=False   
            while (not valid): 
                lastName=input('Enter your last name\n')
                valid=validateUserProperty(lastName,'lastName')
            valid=False    
            while (not valid):
                email=input('Enter your email\n')
                valid=validateUserProperty(email,'email') and checkUniqueEmail(email)
            valid=False    
            while (not valid):
                password=input('Enter your password\n')
                valid=validateUserProperty(password,'password')
               

                if not valid:
                    continue
                confirmPassword=input('Confirm your password\n')
                valid=checkConfirmPassword(password,confirmPassword)
            bytes = password.encode('utf-8') 
            salt = bcrypt.gensalt() 
            password = bcrypt.hashpw(bytes, salt).decode('utf-8') 
            
            valid=False
            while (not valid):
                mobilePhone=input('Enter your mobile phone\n')
                valid=validateUserProperty(mobilePhone,'mobilePhone')
            
            with open('users.json','r') as file:
                users=json.load(file)   
               
            newUser={
                
                "firstName":firstName,
                'lastName':lastName,
                'email':email,
                'password':password,
                'mobilePhone':mobilePhone,   
            }
            newUser['userId']=users[-1]['userId']+1 if users else 1  
            users.append(newUser)
            with open('users.json','w') as file:
                json.dump(users,file,indent=2)
                
        
            
        case '2':
            email=input('Enter your Email\n')            
            password=input('Enter your password\n')
            user=authenticateUser(email,password)
            while user:
                  print(projectMenu)
                  projectMenuSelection=input("Select\n")
                  match projectMenuSelection:
                    case '1':
                        viewProjects()
                    case '2':
                        valid=False
                        title=input('Enter project Title\n')
                        details=input('Enter project Details\n')
                        valid=False
                        while (not valid):
                                target=input('Enter project Target\n')
                                target=valid=validateNumber(target)
                        while (not valid):
                            startDate=input('Enter project Start Date\n')
                            valid=validateDateFormat(startDate,'startDate')
                        valid=False    
                        while (not valid):
                            endDate=input('Enter project End Date\n')
                            valid=validateDateFormat(endDate,'endDate')
                            

                   
                        createProject(title=title,details=details,target=target,startDate=startDate,endDate=endDate,userId= user['userId'])
                    case '3':
                       
                        valid=False 
                        while (not valid): 
                          userProjectsId=viewUserProjects(userId=user['userId']) 
                          projectId=input('Enter project id that you want to edit\n')
                          projectId=valid=validateNumber(projectId)
                          
                          valid =True if(int(projectId) in userProjectsId) else print("Enter a project id from your list") and False
                            
                        with open('projects.json','r') as file:
                            projects=json.load(file)
                             
                        print('Press ENTER if you do not want to change this field')
                        projectTitle=input('Enter project title that you want to edit\n')
                        title=input('Enter project Title\n')
                        details=input('Enter project Details\n')
                        target=input('Enter project Target\n')
                        valid=False 
                        startDate=''
                        while (not valid):
                            startDate=input('Enter project Start Date\n')
                            if not startDate:
                                valid=True
                            else:    
                                valid=validateDateFormat(startDate)
                        valid=False 
                        endDate=''
                        while (not valid):
                            endDate=input('Enter project End Date\n')
                            if not endDate:
                                valid=True
                            else:    
                                valid=validateDateFormat(endDate)
                        
                        updatedProject={
                            'projectId':projectId,
                            'title':title,
                            'details':details,
                            'target':target,
                            'startDate':startDate,
                            'endDate':endDate
                        }
                        editProject(updatedProject=updatedProject)
                    case '4':
                        valid=False 
                        while (not valid): 
                          userProjectsId=viewUserProjects(userId=user['userId']) 
                          projectId=input('Enter project id that you want to delete\n')
                          projectId=validateNumber(projectId) 
                          valid =True if(projectId in userProjectsId) else print("Enter a project id from your list") and False
                        deleteProject(userProjectId=userProjectsId)
                
                

        case _:
            pass
                   
    