//-----------------------------------------------Demo-Day2--------------------------------------------//
// Demo 1 -> Update (updateOne, updateMany)
//---------------------------------------------------------------------------------------------------//
//method_arg1:  what is the document should update (all filters used in Read section are valid), method_arg2: what is the change needed

db.employee.updateOne({_id:  ObjectId('67976ed5d8aa9f9423cb0ce2')}, {salary: 30000}) // throw error -> need atomic operators
db.employee.updateMany({name: "p1"}, {salary:30000})                                 // throw error -> need atomic operators
db.employee.update({name: "p1"}, {salary:30000})                                     // throw error -> need atomic operators  //in older versions less than mongodb 5.0 it will work and replace the entire document

//a) field operators ($set, $inc, $min, $max, $mul, $unset, $rename, $upsert, $setOnInsert)
//1) $set
db.employee.updateMany({}, {$set: {salary: 30000}})
db.employee.updateOne({name: "P1"}, {$set: {salary: 30000, hobbies: [{name: "sports", frequeny: 3}, {name: "dance", frequeny: 2}]}})

//2) $inc 
db.employee.updateOne({name: "P2"}, {$inc: {salary: 2}})
db.employee.updateOne({_id:  ObjectId('67976ed5d8aa9f9423cb0ce2')}, {$inc: {age: -1}})

db.employee.updateOne({name: "P3"}, {$set: {salary: 10000}, $inc: {salary: 5}})

db.employee.updateOne({_id:  ObjectId('67976ed5d8aa9f9423cb0ce2')}, {$set: {salary: 10000}, $inc: {salary: -2000}}) // error -> conflict 

//3) $min
db.employee.updateOne({name: "P1"}, {$min: {age: 38}})
db.employee.updateOne({_id:  ObjectId('67976ed5d8aa9f9423cb0ce2')}, {$min: {age: 12}})

//4) $max
db.employee.updateOne({_id:  ObjectId('67976ed5d8aa9f9423cb0ce2')}, {$max: {age: 38}})
db.employee.updateOne({_id:  ObjectId('67976ed5d8aa9f9423cb0ce2')}, {$max: {age: 12}})

//5) $mul
db.employee.updateOne({}, {$mul: {salary: 10}})

//6) $unset
db.employee.updateOne({_id:  ObjectId('67976ed5d8aa9f9423cb0ce2')}, {$unset: {phone: ""}})

//7) $rename
db.employee.updateOne({_id:  ObjectId('67976ed5d8aa9f9423cb0ce2')}, {$rename: {salary: "netSalary"}})

//8) $upsert (stands for "update or insert")
db.employee.updateOne({name: "Moaaz"}, {$set: {salary: 10000}, $mul: {age: 5}}, {upsert: true})

db.employee.updateOne({name: "max"}, {$set: {salary: 10000, name: 'amany'}, $mul: {age: 5}}, {upsert: true})

//9) $setOnInsert
db.employee.updateOne({name: "nour"}, {$set: {salary: 10000, name: "zahra"}, $mul: {age: 2}, $setOnInsert: { createdAt: new Date() } }, {upsert: true})

// b) Array operators ($push, $each, $addToSet ---  $pop, $pull, $pullAll ---  $, $[]])
//1) $push
db.employee.updateOne({}, {$push: {tagsIds: 10}})
//2) $each
db.employee.updateOne({}, {$push: {tagsIds: {$each:[3,4,5]}}})
//3) $addToSet
db.employee.updateOne({}, {$addToSet: {tagsIds: {$each:[3,4,5]}}})

//4) $pop
db.employee.updateOne({}, {$pop: {tagsIds:1 }})
db.employee.updateOne({}, {$pop: {tagsIds:-1 }})

//5) $pull
db.employee.updateOne({}, {$pull: {tagsIds:{$eq:3} }})  

//6) $pullAll  //self study
db.employee.updateOne({}, {$pullAll: {tagsIds:[1, { name: 'tag1' }] }})  

//7) $
db.employee.updateMany({tagsIds: 2}, {$set:{"tagsIds.$": 10}})   //try this with $in
db.employee.updateOne({_id:  ObjectId('67976ed5d8aa9f9423cb0ce2')}, {$set:{"tagsIds.$": 10}})      // error
db.employee.updateMany({ tagsIds: 2}, {$set:{"tagsIds.$": 10}})

db.employee.updateOne({history:{$elemMatch:{"title": "sw","years": 2}}}, {$set:{"history.$": {title: 'newTitle', freq: 5}}})
db.employee.updateOne({history:{$elemMatch:{"title": "HR","years": 3}}}, {$set:{"hobbies.$": 20 }})


// 8) $[]
db.employee.updateMany({}, {$set:{"tagsIds.$[]": 10}})
db.employee.updateMany({}, {$set:{"history.$[].freq": 100 }})
 

//-----------------------------------------------------------------------------------------------------------------------//
// Demo 2 -> delete (daleteOne, daleteMany)
//---------------------------------------------------------------------------------------------------//
db.employee.deleteOne() /*or*/  db.deleteMany() //error ->  Missing required argument at position 0
db.employee.deleteOne({})
db.deleteMany({})

//-----------------------------------------------------------------------------------------------------------------------//
// Demo 3 -> Relations
//---------------------------------------------------------------------------------------------------//
// 1) one-to-one (person and address)

// a) using embedded documents
db.persons.insertOne({name: "ahmed", age: 30, address: {city: "cairo", street: "st1."}})
// b) using references
db.persons.insertOne({name: "ahmed", age: 30, address: "add1"})
db.address.insertOne({_id: "add1", city: "cairo", street: "st1."})

let addId = db.persons.findOne({name:"ahmed"}).address
db.address.find({_id: addId})
// 2) one-to-many (question and answers)

// a) using embedded documents
db.questions.insertOne({title: "q1", describtion: "describtion q1", answers: [{ creatorName: "ahmed", answer: "answer1"}, {creator: "mohamed", answer: "answer2"}]})
// b) using references
db.questions.insertOne({title: "q1", describtion: "describtion q1", answers: ["q1-a1", "q1-a2" ]})
db.answers.insertMany([{ _id: "q1-a1", creatorName: "ahmed", answer: "answer1"},  {_id: "q1-a2",creator: "mohamed", answer: "answer2"}])

let answersIds = db.persons.find({name:"ahmed"}).answers
db.answers.find({_id: {$in: answersIds}})

// 3) many-to-many 
// a) using embedded documents (authors and books)
db.books.insertOne({name: "book1", describtion: "good book", price: 100, authors: [{name: "ahmed", age: 50}, {name: "mohamed", age: 30}]})
db.books.insertOne({name: "book2", describtion: "nice book", price: 150, authors: [{name: "ahmed", age: 50}, {name: "khaled", age: 30}]})

// b) using references
db.books.insertOne({name: "book1", describtion: "good book", price: 100, authors: ["aut1", "aut2"]})
db.authors.insertMany([{_id: "auth1", name: "ahmed", age: 50},{_id: "aut2", name: "khaled", age: 30}])

let autIds = db.books.find({name:"book1"}).authors
db.authors.find({_id: {$in: authors}})

// exercise (users, posts, comments)
use blog
db.users.insertMany([{name: "max", age: 30,email: "max@mail.com"}, {name: "john", age: 20,email: "john@mail.com"}])
db.users.find()
db.posts.insertOne({title: 'my first post', test: 'nice to meet you', tags: ['new', 'tech'], creator: objectId('.......'), comments: [{text: 'first comment on the post', author: objectId('......')}]})
db.posts.find()

//-----------------------------------------------------------------------------------------------------------------------//
// Demo 4 -> Schema
//---------------------------------------------------------------------------------------------------//
db.getCollectionInfos({name: "collectionName"})
db.createCollection("users", {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: [ "email", "age"],
        properties: {
          name: {
            bsonType: "string",
            description: "must be a string and is required",
          },
          email: {
            bsonType: "string",
            // pattern: "^.+@.+\..+$",
            description: "must be a valid email address and is required",
          },
          age: {
            bsonType: "int",
            minimum: 18,
            description: "must be an integer greater than or equal to 18 and is required",
          },
          address: {
            bsonType: "object",
            properties: {
              city: {
                bsonType: "string",
                description: "must be a string",
              },
            },
          },
        },
      },
    },
  });
  
db.runCommand({
  collMod: "users", 
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["name", "email", "age"], 
      properties: {
        name: {
          bsonType: "string",
          description: "must be a string and is required",
        },
        email: {
          bsonType: "string",
          description: "must be a valid email address and is required",
        },
        age: {
          bsonType: "int",
          minimum: 18,
          description: "must be an integer >= 18 and is required",
        },
        address: {
          bsonType: "object",
          properties: {
            city: {
              bsonType: "string",
              description: "must be a string",
            },
            
          },
        },
      },
    },
  },
  validationLevel: "moderate", // Set validation level (strict/moderate/off)
  validationAction: "error", // "error" blocks invalid docs; "warn" logs a warning
});


//------------------------------------------------------------------------//
//-------------------------------------------------------------------------------------------------//

// drop collection and database  
use <database_name>
db.<collection_name>.drop()   // drop collection
db.dropDatabase()            // delete databse

