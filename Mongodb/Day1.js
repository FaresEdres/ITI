//-------------------------------------------Day1-----------------------------------------//
// Demo 1 -> Explore database and create first db
//----------------------------------------------------------------------------------------//
show dbs                                           //display all dbs in mongodb server

use company                                        // switch to company db even it's not exist
                                                   // note: if it's not exist -> will created on the fly -> be create actually after inserting data on it
db                                                 //current database
show collections                                   // display the collections in current connected db



db.employees.insertOne({name: "Ahmed", age: 30})   //db -> refares to the current connected db
                                                   // employess -> refare to the collection
                                                   // if the collection doesn't exist, will create on the fly and create actually after inserting data on it

db.employees.find()                                // find all employees
                                                   // note: the new version of the shell display the output in prettier format
                                                   // the old shell to do that  -> db.employees.find().pretty()

db.employees.insertOne({name: "mohamed", email:"mohamed@gmail.com"})

db.employees.find()

db.employees.insertOne({name: "nada", address: { city: "cairo", street: "smart village"}, isAvailable: false}) 

db.employees.find()                                // you notice that each document has different schema

//-------------------------------------------------------------------------------------------------//
// Demo 2 -> datatypes
//-------------------------------------------------------------------------------//
// ObjectId
use library
db.books.insertOne({name: "book 1", price: 200})
db.books.insertOne({name: "book 2", description: "good book", _id: ObjectId('679534eb029ae5a8e3cb0ce6')})
db.books.insertOne({name: "book 3", description: "good book", _id: 5})

// arrays
db.books.insertOne({name: "book 4", versions: ["v1", "v2", "v3"]})
// objects
db.books.insertOne({name: "book 5" , details:{"cover color": "red", publishedAt: "1/1/2001"}})
// array of objects
db.books.insertOne({name: "book 9", authors: [{"name": "ahmed", age: 29}, {name: "mohamed"}]})
//boolean and null
db.books.insertOne({name: "book 11", isPublised: false, publishedAt: null})
// date and Timestamp
db.books.insertOne({name: "book 13" , createdAt: new Date(), time: new Timestamp()})
// embedded documents
db.books.insertOne({name: "book 10", authors: {name: "mohamed", address: {city: "cairo", street: "10 x"}}})
db.books.insertOne({name: "book 10", authors: [{name: "mohamed", address: {city: "cairo", street: "10 x"}}]})

//-------------------------------------------------------------------------------------------------//
//Demo 3 -> Create (insertOne, insertMany, insert)
//-------------------------------------------------------------------------------//

use contactData

//data argument
//insertOne(data, options) method -> data argument should be object 
db.persons.inserOne({name: "ahmed", age: 30, hobbies: ["sports", "cooking"]})    // insert one document
// insertMany(data, options) -> data argumet sould be an array even i will insert one document
db.persons.insertMany([{name: "max", phone: "01133552299"},{name: "mohamed", age: 61}])  // insert many documents or even on document. 
db.persons.insertMany([{name: "max", phone: "01133552299"}])   
// insert(data, options) -> data argument can be doc. or array of docs  -> deprecated
db.persons.insert({name: "ahmed", age: 45})
db.persons.insert([{name: "nour", age: 13}, {name: "zahra", age: 26}])

// options argument
db.hobbies.insertMany([{_id: "sports", name: "Sports"}, {_id: "cars", name: "Cars"}, {_id: "cooking", name: "Cooking"}])
db.hobbies.insertMany([{_id: "dance", name: "Dance"}, {_id: "cars", name: "Cars"}, {_id: "swimming", name: "Swimming"}]) // doc. in index 0 will inserted
db.hobbies.insertMany([{_id: "dance", name: "Dance"}, {_id: "cars", name: "Cars"}, {_id: "swimming", name: "Swimming"}], {ordered: false}) // doc. in index 2 will inserted and the error message more clear
//-------------------------------------------------------------------------------------------------//
// Demo 4 -> Read (findOne, find)
//-------------------------------------------------------------------------------------------------//

use citizens

db.person.insertMany<'insert the data in persons.json file'>

db.person.findOne()   //return the matched first document
db.persons.findOne().name

//---------------------------------------------- Dealing with cursor object ---------------------------------------------//


db.person.find()                                  // what is find will return, is it return an array of documents?, let's try that
                                                  // is find return an array? if that is true, i can access the properties and envoke the methods on array object
let data = db.persons.find()
data[0] or data.length                            // will return nothing or error, so find not return an array  
//find -> return a cursor
// some cursor methods -> count, sort, skip, limit, hasNext, next, toArray, forEach
db.persons.find().count()     
db.persons.find().toArray()    
db.persons.find().sort({ age: 1}) 
db.persons.find().sort({ age: 1, "address.city": -1})
db.persons.find().skip(10)
db.persons.find().limit(10)
db.persons.find().skip(10).limit(10).count()      // from MongoDB v4.4, behaviour of this query change - it can't filter 
db.persons.find().countDocuments()    // can filter 
db.persons.estimatedCountDocuments()  //faster since it is retreived from meta deta,cant filter
                                                  //old behaviour:  designed to return the total count of documents in the collection that match the find() query, regardless of the effects of skip() and limit().
                                                  // now: respects skip() and limit()

// find not return all the data, it return a cursor ->  iterating the cursor
data.hasNext()

data.next()
if(data.hasNext()){ printjson(data.next())}
data.forEach( i => printjson(i))

           //------------------------- Query selectors & projection -------------------------------//
//a) Query selectors
//1) comparison operators  ($eq, $gt, $gte, $lt, $lte, $ne, $in, $nin)
db.persons.find({age: {$eq: 60}})  == db.persons.find({age: 60})  //$eq
db.persons.find({age: {$gt: 60}})                                 //$gt
db.persons.find({age: {$gte: 60}})                                //$gte
db.persons.find({age: {$lt: 60}})                                 //$lt
db.persons.find({age: {$lte: 60}})                                //$lte
db.persons.find({age: {$ne: 60}})                                 //$ne

db.persons.find({"address.city": "cairo"})                        //$lte

db.persons.find({hobbies: "sports"})    //hobbies is an array, return all documents that hobbies contain sports
db.persons.find({hobbies: ["sports"]})  //exact equality
db.persons.find({age: {$in: [20,60]}})  // return only documents that age is 20 or 60
db.persons.find({age: {$nin: [20,60]}})  // return only documents that age isn't 20 or 60

//2) logical operators   ($or, $nor, $and, $not)
db.persons,find({"rating.avg": {$lte: 10}})   db.persons,find({"rating.stars": {$gte: 20}})  
db.persons.find({$or: [{"rating.avg": {$lte: 10}}, {"rating.stars": {$gte: 20}}]})   //$or

db.persons.find({$and: [{"rating.avg": {$lte: 10}}, {"rating.stars": {$gte: 20}}]}) == db.persons.find({"rating.avg": {$lte: 10}, "rating.stars": {$gte: 20}})  //$and
db.persons.find({$and: [{"rating.avg": {$lte: 10}}, {"rating.avg": {$gte: 20}}]})   != db.persons.find({"rating.avg": {$lte: 10}, "rating.avg": {$gte: 20}})  // overwrite

db.persons.find({age: {$not: {$eq: 20}}})   == db.persons.find({age: {$ne: 20}})

//3) Element operators ($exists, $type)
db.persons,find({age: {$exists: true, $ne:null}})              //$exists
db.persons,find({phone: {$type: "number"}})                    //$type
db.persons,find({phone: {$type:[ "number", "string"]}})        //$type

//4) Evaluation operators ($regex, $expr)
db.persons.find({jobTitle: {$regex: /engieer/}})  // contain
db.persons.find({jobTitle: /engieer/)
db.persons.find({jobTitle: {$regex: /^en/}})      // start with
db.persons.find({jobTitle: {$regex: /en$/}})      // end with

db.persons.find({$expr:{$gt:["$rating.avg", "$rating.stars"]}})   //compare fields inside the same document

//5) Array operators  ($size, $all, $elemMatch)
db.persons.find({tagsIds: {$size: 3}})                                                 //$size // take exact number
db.perons.find({tagsIds: {$all: [1,2,3]}}) !== db.perons.find({tagsIds: [1,2,3]})      //$all  //first -> contain, second -> exact match
db.persons.find({$and:{"history.title": "sw", "history.years": {$gt: 2}}})
db.persons.find({history: {$eleMatch: {title: "sw", years: {$gt: 2}}}})               //elemMatch

//b) projection 
db.persons.find({}, {age: 1, _id: 0, "rating.avg":1})

// projection in array ($elemMatch, $slice)
db.persons.find({"history.title": "sw"}, {history:  {$eleMatch: {title: "sw"}}})   //elemMatch
db.persons.find({}, {hobbies: {$slice: 2}})         // first 2 elements in the array
db.persons.find({}, {hobbies: {$slice: [1,2]}})     // retrn the first 2 elements after the first element
db.persons.find({name:/^A/,name:/A*/}) //invalid name can't have both values




//-------------------------------------------------------------------------------------------------//

// drop collection and database  
use <database_name>
db.<collection_name>.drop()  // drop collection
db.dropDatabase()            // delete databse

