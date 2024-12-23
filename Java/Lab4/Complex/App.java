import MyPkg.ComplexNumber;


public class App {
    public static void main(String[] args) {
        ComplexNumber<Double> c1 = new ComplexNumber<>(3.0, 20.0);
        ComplexNumber<Double> c2 = new ComplexNumber<>(1.0, 7.0);



        ComplexNumber<Double> sum = c1.add(c2);
        System.out.print("Sum: ");
        sum.display();

        ComplexNumber<Double> difference = c1.subtract(c2);
        System.out.print("Difference: ");
        difference.display();

        ComplexNumber<Double> product = c1.multiply(c2);
        System.out.print("Product: ");
        product.display();
    }
}
