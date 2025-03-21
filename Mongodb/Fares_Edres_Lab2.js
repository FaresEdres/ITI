/*a) from student collection in OpenSourceDB/CloudDB: 


    1- retrive students with hobbies length equal 2
    */
db.student.find({ hobbies: { $size: 2 } });

/*
    2- retrive students with hobbies contains sports and cooking
    */
db.student.find({ hobbies: { $all: ["sports", "cooking"] } });
/*
    3- retrive students with grade greater than 35 in python course*/

db.student.find({
  grades: {
    $elemMatch: { courseName: "Statistics", grade: { $gt: 35 } },
  },
});

/*
    4- update the salary of the (firstName lastName) to be 2000 */
db.student.updateOne(
  { firstName: "Mona", lastName: "Fouad" },
  { $set: { salary: 700 } }
);

/*
    5- update the age of all students with 2 years*/
db.student.updateMany({}, { $inc: { age: 2 } });
/*
    6- (firstName lastName) get promoted, increase the salary 30%*/

db.student.updateOne(
  { firstName: "Mona", lastName: "Fouad" },
  { $mul: { salary: 1.3 } }
);
/*
    7- update nade mohamed address,if document not exist -> update operation should insert it with the creation date of the document  */
> db.student.updateOne({ firstName: "nada", lastName: "mohamed" },{$set:{address:"Giza,Egypt"}}, { upsert: true });
/*
    8- update hobbies of all student with new 3 hobbies and guarntee no duplication*/
    
    db.student.updateMany({},{$addToSet:{hobbies:{$each:["Swimming","Cycling","Chess"]}}})
    /*
    9- update students with grade greater than 35 in python course with stars = 5 in this course
    */
   db.student.updateMany({grades:{$elemMatch:{grade:{$gt:35},courseName:"Statistics"}}},{$set:{"grades$.stars":5}});
    /*
    10- replace each element in hobbies array to be cooking in all documents
    
*/
db.student.update({},{$set:{"hobbies.$[]":"Cooking"}})

/*


b)  design a book review system where users can review books. The system should store:
     - Books with titles, authors
     - Reviews written by users, including ratings and comments.
     - identify needed fields in each document and gurantee the data integrity*/
      
db.createCollection("books", {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["ISBN", "title", "authors"],
        properties: {
            ISBN: {
            bsonType: "string",
            description: "required and unique",
          },
          title: {
            bsonType: "string",
            description: "must be a string and is required",
          },
          authors: {
            bsonType: "array",
            minItems:1,
            
          },
        },
      },
    },
  });

db.createCollection("reviews", {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: [ "reviewId","rating"],
        properties: {
            username:{bsonType:"string",
            description:"username reference from users"}
            reviewId: {
            bsonType: "int",
            description:"must be unique and numbers only"
          },
          rating: {
            bsonType: "double",
            description:"required",
          },
          comment: {
            bsonType: "string",
          },
          
        },
      },
    },
  });

db.createCollection("users", {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: [ "username","name", "email","address","phoneNumber"],
        properties: {
            username: {
            bsonType: "string",
            description: "must be a string,unique and is required",
          },
          name: {
            bsonType: "string",
            description: "must be a string and is required",
          },
          email: {
            bsonType: "string",
            pattern: "^.+@.+\..+$",
            description: "must be a valid email address and is required",
          },
          phoneNumber: {
            bsonType: "string",
            
          },
          address: {
            bsonType: "object",
            properties: {
              city: {
                bsonType: "string",
                description: "must be a string",
              },
              country:{
                  bsonType: "string",
                description: "must be a string",

              },
              street:{  bsonType: "string",
                description: "must be a string",}
            },
          },
        },
      },
    },
  });




  

