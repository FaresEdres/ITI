class Vehicle {
  static count = 0;
  constructor(type, speed, state) {
    if (this.count > 50) throw new Error("Vehicle limit reached!");
    this.type = type;
    this.speed = speed;
    this.state = state;
    this.count++;
  }
  start() {
    //this.state = true;
    console.log("Starting");
  }
  stop() {
    this.state = false;
  }
}

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

class Car extends Vehicle {
  constructor(type, speed, state) {
    super("name", 150, true);
  }
  drive() {
    console.log("Driving");
  }
}
Object.setPrototypeOf(Car.prototype, Vehicle.prototype);

var bmw = new Car("BMW", 240, false);
var ferrari = new Car("BMW", 240, false);
console.log(bmw.drive());
