function newPrice(price,discount){
    /***Validations ***/
if(typeof price !=='number' && !isNaN(price))return 0;
if(typeof discount !=='number'&& !isNaN(discount)) return 0;

    /***Price Calculation***/
if(discount>100)return 0;
const result =price-((price*discount)/100) ;
return result;
}
/*newPrice Test*/

const price=50;
const discount=200;
console.log(newPrice(price,discount));