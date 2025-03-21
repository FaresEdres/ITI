package com.example;

import java.util.ArrayList;

public class cmp {
    private String name;
    private  String location;
    ArrayList<Employee> Employees = new ArrayList<>();
     public String getName(){
         return name;
     }
     public void setName(String name){
         this.name = name;
     }
     public String getLocation(){
         return location;
     }
     public void setLocation(String location){
         this.location = location;
     }
     
     public String toString(){
         return "Company: " + name + "\nLocation: " + location + "\n";
     }
     public void addEmployee(Employee e)
     {
        Employees.add(e);
     }

    public ArrayList<Employee> getEmployees() {
        return Employees;
    }

    
}