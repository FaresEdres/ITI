package com.example;

import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;

import jakarta.json.Json;
import jakarta.json.JsonObject;
import jakarta.json.JsonReader;
import jakarta.json.JsonWriter;

public class Main {
    @SuppressWarnings("CallToPrintStackTrace")
    public static void main(String[] args) {
        CompanyJson com = new CompanyJson();
        try (JsonWriter writer = Json.createWriter(new FileWriter("src/main/java/com/example/company.json"))) {
            writer.writeObject(com.companyObj);
        } catch (IOException e) {
            e.printStackTrace();
        }
        
        System.out.println("-----------------------------------------------------------------");
        
        try (JsonReader reader = Json.createReader(new FileReader("src/main/java/com/example/company.json"))) {
            JsonObject company = reader.readObject();
            System.out.println(company);
        } catch (IOException e) {
            e.printStackTrace();
        }
        
        
    }
}