package MyPkg;
public class ComplexNumber<T extends Number> {
    private T real;
    private T img;

    public ComplexNumber(T real, T img) {
        this.real = real;
        this.img = img;
    }


    public ComplexNumber<T> add(ComplexNumber<T> other) {
        double newReal = real.doubleValue() + other.real.doubleValue();
        double newImg = img.doubleValue() + other.img.doubleValue();
        return new ComplexNumber<>((T) Double.valueOf(newReal), (T) Double.valueOf(newImg));
    }


    public ComplexNumber<T> subtract(ComplexNumber<T> other) {
        double newReal = real.doubleValue() - other.real.doubleValue();
        double newImg = img.doubleValue() - other.img.doubleValue();
        return new ComplexNumber<>((T) Double.valueOf(newReal), (T) Double.valueOf(newImg));
    }

    public ComplexNumber<T> multiply(ComplexNumber<T> other) {
        double newReal = real.doubleValue() * other.real.doubleValue() - img.doubleValue() * other.img.doubleValue();
        double newImg = real.doubleValue() * other.img.doubleValue() + img.doubleValue() * other.real.doubleValue();
        return new ComplexNumber<>((T)Double.valueOf(newReal),(T) Double.valueOf(newImg));
    }

    public void display() {
        System.out.println(real + " + " + img + "i");
    }
}
