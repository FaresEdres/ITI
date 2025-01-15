/*

3- You're tasked with modeling vehicles and cars in a transportation app:


 
 
    b- Write a function that checks whether an object is an instance of Car using two different ways

*/
function Vehicle(type, speed, state) {
  if (Vehicle.count > 50) throw new Error("Vehicle limit reached!");
  this.type = type;
  this.speed = speed;
  this.state = state;
  Vehicle.count++;
}

Vehicle.prototype.start = function () {
  //this.state = true;
  console.log("Starting");
};
Vehicle.prototype.stop = function () {
  this.state = false;
};

function checkInstance(obj) {
  /*
  /***dep
  return obj.__proto__ == vehicle ? true : false;
  */

  return Object.getPrototypeOf(obj) == Car.prototype;
  /*
  return obj instanceof Car;
  */
}

function Car(type, speed, state) {
  Vehicle.call(this, "name", 150, true);
}
Car.prototype.drive = function () {
  console.log("Driving");
};
Object.setPrototypeOf(Car.prototype, Vehicle.prototype);

var bmw = new Car("BMW", 240, false);
console.log(bmw.drive());
