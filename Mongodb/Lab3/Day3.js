//----------------------------- Demo many-to-many relation --------------------//
// users and their favourit books
db.user.inserOne({ name: 'Ahmed', favBooks: ['id1', 'id2'] });
db.books.inserMany([
  { _id: 'id1', title: 'book1' },
  { _id: 'id2', title: 'book2' },
]);

let userFavBooks = db.user.findOne({ name: 'Ahmed' }).favBooks;
let favBook = db.books.find({ _id: { $in: userFavBooks } });

//----------------------------------------- aggregation -----------------------------------//
//1) $match
db.persons.aggregate([{ $match: { gender: 'female' } }]);
db.persons.aggregate([
  { $match: { gender: 'female' } },
  { $count: 'femaleCount' },
]); ==  db.persons.find({gender: "female"}).count()

//2) $group
db.persons.aggregate([
  { $match: { gender: 'female' } },
  { $group: { _id: { state: '$location.state' } } },
]);

db.persons.aggregate([
  { $match: { gender: 'female' } },
  { $group: { _id: { state: '$location.state' } } },
  { $count: 'femaleCount' },
]); // the number before this query and the previous query is not the same, because grouping map n doc. to one doc

db.persons.aggregate([
  { $match: { gender: 'female' } },
  { $group: { _id: { state: '$location.state' }, totalPersons: { $sum: 1 } } },
]);

//3) $project
db.persons.aggregate([
  { $match: { gender: 'female' } },
  { $project: { gender: 1 } },
]); == db.persons.find({gender: "female"}, {_id:0, gender: 1})

//5) $out
db.user.aggregate([
  {
    $lookup: {
      from: 'book',
      localField: 'favBooks',
      foreignField: '_id',
      as: 'myFavBooks',
    },
  },
  { $out: 'myNewUsers' },
]);

//----------------------------------------------- indexes --------------------//
db.persons.find({ 'dob.age': { $gt: 60 } });
db.persons.explain().find({ 'dob.age': { $gt: 60 } }); //COLLSCAN
db.persons.explain('executionStats').find({ 'dob.age': { $gt: 60 } }); // for more details about execution stats --> compare totalDocsExamined with nReturned and check the executionTimeMillis

//1) single field index
db.persons.createIndex({ 'dob.age': 1 });
db.persons.explain('executionStats').find({ 'dob.age': { $gt: 60 } });

db.persons.getIndexes();

db.persons.dropIndex({ 'dob.age': 1 });
db.persons.getIndexes();
$----
db.users.insertOne({_id: "user1", name: "max"})
db.posts.insertMany([{title: "firstPost", userId: 'user1'}, {title: "secondPost", userId: 'user1'}])

//to delete
let userId = db.users.findOne({_id: "user1"})._id
db.users.deleteOne({_id: "user1"})
db.posts.deleteMany({userId: "user1"})
// in most cases this will work 

const session = db.getMongo().startSession()

session.startTransaction()
const userCol = session.getDatabase("Day3").users
const potsCol = session.getDatabase("Day3").posts
userCol.deleteOne({_id: 'user1'})
postsCol.deleteMany({userId: "user1"})

session.commitTransaction()
session.abortTransaction()




//----------------------------------------------------------------------//
// search how to use mongoimport & mongoexport, mongodump & mongorestore
 Ex: mongoimport C:\Users\Alzahraa\Desktop\mongdb\Day3\persons.json -d Day3 -c persons --jsonArray

