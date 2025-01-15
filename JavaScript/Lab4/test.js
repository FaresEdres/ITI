const obj = {
  name: "fares",
  getName: function () {
    return () => {
      return this.name;
    };
  },
};
/*Output: name*/
/*console.log(obj.getName()());*/
/* Output:name
const getObj = obj.getName();
console.log(getObj());
*/
/* Output : Undefined since getName is called as a standalone function*/

const getObj = obj.getName.bind(obj);
console.log(getObj);
//console.log(getObj()());
