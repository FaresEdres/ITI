/*1- Show all databases available on your MongoDB server.
*/
show dbs
/*2- Create database named: OpenSourceDB or CloudDB.
*/
use OpenSourceDB
/*3- Create collection (student) that has:
  - FirstName: string, LastName: string, Age: Number, Faculty: An object that has (Name, Department),
    Grades: An array of objects, each object has: (CourseName: string, Grade: number, Pass: Boolean) and hobbies: array of strings.
  - Insert 2 (at least) documents in Student collection with different values (one record each time).
  - Insert 3 (at least) documents in Student collection with different values (using one insert statment).
*/



db.student.insertOne({firstName: 'Ahmed',lastName: 'Salem',age: 24,faculty: {name: "Medicine",department: 'Surgery'},grades: [{ courseName: 'Anatomy', grade: 86, pass: true },{ courseName: 'Pathology', grade: 80, pass: true }],hobbies: ['Cycling', 'Swimming']})


db.student.insertOne({firstName: 'Mona',lastName: 'Fouad',age: 30,faculty: {name: "Arts",department: 'Literature'},grades: [{ courseName: 'World Literature', grade: 90, pass: true },{ courseName: 'Creative Writing', grade: 87, pass: true } ],hobbies: ['Writing', 'Traveling']})

 db.student.insertMany([{firstName:'Fares',lastName:'Edres',age:25,faculty:{name:"Engineering",department:'Electrical'},grades:[{courseName:'Antenna',grade:89,pass:true},{courseName:'Numerical theory',grade:95,pass:true}],hobbies:['Football','tennis']},{firstName:'Ahmed',lastName:'Emad',age:40,faculty:{name:"Computer Science",department:'AI'},grades:[{courseName:'Deep Learning',grade:45,pass:false},{courseName:'Statistics',grade:98,pass:true}],hobbies:['Video Games','BasketBall']},{firstName:'Ahmed',lastName:'Zaki',age:25,faculty:{name:"",department:'Electrical'},grades:[{courseName:'Antenna',grade:89,pass:true},{courseName:'Numerical theory',grade:95,pass:true}],hobbies:['Football','tennis']},{firstName: 'Lina',lastName: 'Mohamed',age: 23,faculty: {name: "Engineering",department: 'Computer Science'},grades: [{ courseName: 'Data Structures', grade: 91, pass: true },{ courseName: 'Algorithms', grade: 88, pass: true }],hobbies: ['Reading', 'Chess']}])


/*4- Retrieve the following data:
  - First student in the collection
  */
  db.student.findOne()
  
  /*
  - Only FirstName and LastName of all students*/
  
  db.student.find({},{firstName:1,lastName:1,_id:0})
  /*
  - All students 
  */
 db.student.find()
 /*
  - Students count
  */
 db.student.find().count()
  /*
  - Second 2 students in the collection
*/
db.student.find().skip(2).limit(2)
/*
  - All students sorted by age Ascending
  */
 db.student.find().sort({age:1})
  /*
  - Students with specific FirstName
  */
 db.student.find({firstName:'Fares'})
  /*
  - Students with age greater than or equal 20*/
  
  db.student.find({age:{$gte:20}})
  /*
  - Students with age either 30 or 40*/
  db.student.find({age:{$in:[30,40]}})
  
  /*
  - Students with hobbies contains "sports"*/
  db.student.find({hobbies:"sports"})
  
  /*
  - Students with hobbies only contains "sports"*/
  
  db.student.find({hobbies:["sports"]})
  /*
  - Students with FirstName=Ahmed or LastName= Ahmed*/
  db.student.find({$or:[{firstName:'Ahmed'},{lastName:'Ahmed'}]})
  /*

  - Students with FirstName=Ahmed and age greater than 40*/
  
  db.student.find({firstName:"Ahmed",age:{$gt:40}})
  /*
  - Students that have address field */
  db.student.find({address:{$exists:true}})
  /*
  - Students with faculty name contain Engineer*/
  
  db.student.find({"faculty.name":{$regex:/Engineer/}}) //db.student.find({"faculty.name":{$regex:/Engineer/}})
  /*
*/
/*
5- Run the following command and just explore the output:
   - db.collection.find().help()     //to explore the cursor object
   - db.stats()                      // db general info.

*/
/*
Bouns:

6- Create collection (course) that has: _id: unique field, courseName: string and try to insert the following (using insertMany)
   - [{"_id": "python", courseName: "Python"}, {"_id": "mongodb", courseName: "MongoDB"}, {"_id": "nodejs", courseName: "NodeJs"}] 
   - [{"_id": "js", courseName: "JS"}, {"_id": "mongodb", courseName: "MongoDB"}, {"_id": "java", courseName: "Jave"}], i need the first document only success .
   - [{"_id": "js", courseName: "JS"}, {"_id": "mongodb", courseName: "MongoDB"}, {"_id": "java", courseName: "Jave"}], i need the last document to success .

*/


db.student.insertMany([{"_id": "js", courseName: "JS"}, {"_id": "mongodb", courseName: "MongoDB"}, {"_id": "java", courseName: "Jave"}],{
  :false})