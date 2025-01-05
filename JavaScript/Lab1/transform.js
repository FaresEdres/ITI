function ordersAddressFormat(orders){
    orders.forEach(order => {
        var address=order.deliveryAddress.split(", ")
        order.deliveryCountry=address.pop();
        order.deliveryCity=address.pop();
        order.deliveryStreet=address.pop();
        if(isNaN(address.at(-1)))
          {order.buildingNumber=address.pop();}
        else 
          {order.buildingNumber=Number(address.pop());}
        delete order.deliveryAddress;

    });
}
function ordersTotalItems(orders){
   orders.forEach(order => {
      var calcTotalItems=order
      .items.split(",")
      .map(item=>item.slice(-1))
      .reduce((total,curr)=>total+Number(curr),0);
      order.totalItems=calcTotalItems;
      delete order.items;
      });
}
function ordersDateFormat(orders){
   orders.forEach(order => {
const orderDateTemp=new Date(order.orderDate);
      const milliToDays=24*3600*1000;
      const deliveryDateTemp=new Date(order.deliveryDate);
      const deliveryDurationCalc=Math.abs(deliveryDateTemp-orderDateTemp) /milliToDays;
      order.deliveryDuration=deliveryDurationCalc;
      });
}
function ordersCopy(orders){
var newOrders=JSON.parse(JSON.stringify(orders));
return newOrders;
}
function transform(orders){
    var newOrders=ordersCopy(orders)
    ordersAddressFormat(newOrders);
    ordersDateFormat(newOrders);
    ordersTotalItems(newOrders)
    console.log(newOrders)
}

var orders = [
  {
    orderId: 'ORD001',
    customer: 'John Doe',
    items: 'item1:2,item2:1,item3:5',
    orderDate: '2023-12-01',
    deliveryDate: '2023-12-05',
    deliveryAddress: '123, Main Street, Springfield, USA',
  },
  {
    orderId: 'ORD002',
    customer: 'Jane Smith',
    items: 'itemA:3,itemB:4',
    orderDate: '2023-11-15',
    deliveryDate: '2023-11-20',
    deliveryAddress: 'Flat 4B, Elmwood Apartments, New York, USA',
  },
  {
    orderId: 'ORD003',
    customer: 'Alice Johnson',
    items: 'itemX:1',
    orderDate: '2023-10-10',
    deliveryDate: '2023-10-15',
    deliveryAddress: '456, Pine Lane, Denver, USA',
  }
];

transform(orders);
console.log(orders);