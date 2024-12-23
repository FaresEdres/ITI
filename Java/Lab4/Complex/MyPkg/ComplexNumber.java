package MyPkg;
public class ComplexNumber<T extends Number> {
    private T real;
    private T img;

    public ComplexNumber(T real, T img) {
        this.real = real;
        this.img = img;
    }


    public ComplexNumber<T> add(ComplexNumber<T> c) {
        double newReal = real.doubleValue() + c.real.doubleValue();
        double newImg = img.doubleValue() + c.img.doubleValue();
        return new ComplexNumber<>((T) Double.valueOf(newReal), (T) Double.valueOf(newImg));
    }


    public ComplexNumber<T> subtract(ComplexNumber<T> c) {
        double newReal = real.doubleValue() - c.real.doubleValue();
        double newImg = img.doubleValue() - c.img.doubleValue();
        return new ComplexNumber<>((T) Double.valueOf(newReal), (T) Double.valueOf(newImg));
    }

    public ComplexNumber<T> multiply(ComplexNumber<T> c) {
        double newReal = real.doubleValue() * c.real.doubleValue() - img.doubleValue() * c.img.doubleValue();
        double newImg = real.doubleValue() * c.img.doubleValue() + img.doubleValue() * c.real.doubleValue();
        return new ComplexNumber<>((T)Double.valueOf(newReal),(T) Double.valueOf(newImg));
    }

    public void display() {
        System.out.println(real + " + " + img + "i");
    }
}
