package com.example;
public class Employee{
private  int id;
private  String name;
private int age;
private String position;
private int salary;
private String email;
private String phone;

public int getId(){
    return id;
}
public void setId(int id){
    this.id = id;
}

public String getName(){
    return name;
}

public void setName(String name){
    this.name = name;
}

public int getAge(){
    return age;
}

public void setAge(int age){
    this.age = age;
}

public String getPosition(){
    return position;
}

public void setPosition(String position){
    this.position = position;
}

public int getSalary(){
    return salary;
}

public void setSalary(int salary){
    this.salary = salary;
}

public String getEmail(){
    return email;
}

public void setEmail(String email){
    this.email = email;
}

public String getPhone(){
    return phone;
}

public void setPhone(String phone){
    this.phone = phone;
}

public Employee(){
}

public Employee(int id, String name, int age, String position, int salary, String email, String phone){
    this.id = id;
    this.name = name;
    this.age = age;
    this.position = position;
    this.salary = salary;
    this.email = email;
    this.phone = phone;
}

public String toString(){
    return
            "id=" + id +
            ", name='" + name + '\'' +
            ", age=" + age +
            ", position='" + position + '\'' +
            ", salary=" + salary +
            ", email='" + email + '\'' +
            ", phone='" + phone + '\'' +
            '}';
    
}

}

