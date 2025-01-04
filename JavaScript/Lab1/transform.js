function transform(orders){
    orders.forEach(order => {
        var address=order.deliveryAddress.split(", ")
        order.deliveryCountry=address.pop();
        order.deliveryCity=address.pop();
        order.deliveryStreet=address.pop();
        order.buildingNumber=Number(address.pop());
        delete order.deliveryAddress;

        var calcTotalItems=order
        .items.split(",")
        .map(item=>item.slice(-1))
        .reduce((total,curr)=>total+Number(curr),0);
        order.totalItems=calcTotalItems;
        delete order.items;

        const orderDateTemp=new Date(order.orderDate);
        const deliveryDateTemp=new Date(order.deliveryDate);
        const deliveryDurationCalc=Math.abs(deliveryDateTemp-orderDateTemp) /(24*3600*1000);
        order.deliveryDuration=deliveryDurationCalc;


    });
    console.log(orders)
}

function copyOrders(orders){
var newOrders=JSON.parse(JSON.stringify(orders));
return newOrders;
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
var newOrders=copyOrders(orders)
transform(newOrders);
console.log(orders);