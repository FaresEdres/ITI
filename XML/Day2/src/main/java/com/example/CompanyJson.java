package com.example;

import jakarta.json.Json;
import jakarta.json.JsonObject;

public class CompanyJson {
   
        
        JsonObject companyObj = Json.createObjectBuilder()
        .add("name", "TechCorp")
        .add("location", "New York")
        .add("employees", Json.createArrayBuilder()
            .add(Json.createObjectBuilder()
                .add("id", 2)
                .add("name", "Bob Smith")
                .add("age",45)
                .add("position", "Project Manager")
                .add("salary", 120000)
                .add("contact", Json.createObjectBuilder()
                    .add("email", "bob.smith@techcorp.com")
                    .add("phone", "555-5678")
                )
            ) 
            .add(Json.createObjectBuilder()
                .add("id", 3)  
                .add("name", "Charlie Brown")
                .add("age",28)
                .add("position", "UI/UX Designer")
                .add("salary", 85000)
                .add("contact", Json.createObjectBuilder()
                    .add("email", "charile.brown@techcorp.com")
                    .add("phone", "555-8765")))) 
        .build();

        
    }
