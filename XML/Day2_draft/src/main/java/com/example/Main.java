package com.example;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;

public class Main {
    public static void main(String[] args) {
        cmp company = new cmp();
        company.setName("Giza");
        company.setLocation("Alexandria");
        
       
        Employee emp1 = new Employee(30, "Medhat Mohamed", 45, "Project Manager", 120000, "ahmedMohamed@yahoo.com", "555-5678");
        Employee emp2 = new Employee(50, "Fares Ahmed", 28, "UI/UX Designer", 85000, "faresedres1@gmail.com", "55523e3432432");
        company.addEmployee(emp1);
        company.addEmployee(emp2);
        
        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        
        try (FileWriter writer = new FileWriter("company.json")) {
            gson.toJson(company, writer);
        } catch (IOException e) {
            e.printStackTrace();
        }
                try (FileReader reader = new FileReader("company.json")) {
            cmp deserializedCompany = gson.fromJson(reader, cmp.class);
            System.out.println("Deserialized Company:");
            System.out.println(deserializedCompany);
            
            System.out.println("Employees:");
            for (Employee e : deserializedCompany.getEmployees()) {
                System.out.println(e);
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
