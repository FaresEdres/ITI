#include <iostream>

using namespace std;
class GeoShop{
protected:
float dim1;
float dim2;
public:
    GeoShop(){
        dim1 =0;
        dim2=0;
    }
    GeoShop(float dim1 ,float dim2){
        this ->dim1 = dim1;
        this ->dim2 = dim2;
    }

    GeoShop(float dim1 ){
        this->dim1 = dim2 =dim1;
    }
    void setdim1(float dim1){
        this->dim1=dim1;
    }
    void setdim2(float dim2){
        this->dim2=dim2;
    }
    float getdim1(){
    return dim1;
    }
    float getdim2(){
    return dim2;
    }
    virtual float calArea()=0;
    virtual ~GeoShop() {}
};
class Triangle :public GeoShop{
    public:
        Triangle():GeoShop(){}
        Triangle(float height ,float base):GeoShop(height,base){}
        float calArea(){
            return (1/2) * dim1 * dim2;
        }
};
class Rectangle :public GeoShop{
    public:
        Rectangle():GeoShop(){}
        Rectangle(float j):GeoShop(j){}
        Rectangle(float j ,float k):GeoShop(j,k){
        }
        float calArea(){
            return dim1 * dim2;
        }
};
class Square :private Rectangle{
    public:
        Square():Rectangle(){
        }
        Square(float side):Rectangle(side,side){}
        void setSide(float side){
            dim1 = dim2 =side;
        }
        float getSide(){
            return dim1;
        }
        float calArea(){
            return dim1*dim2;
        }
};
class Circle :private GeoShop{
    protected:
        float radius;
    public:
        Circle():GeoShop(){
            radius=0;
        }
        Circle(float raduis):GeoShop(raduis){
            this ->radius=raduis;
        }
        void setRedius(float radius){
            this->radius = dim1=dim2= radius;
        }
        float getRedius(){
            return dim1;
        }
        float calArea(){
            return (22/7) * dim1*dim2;
        }
};
int main()
{
     Square s(2);
    cout << "Square Area \t" << s.getSide() << endl;
    
      Circle c(5);
    cout << "Circle area \t" << c.calArea() << endl;

    Triangle t(2, 3);
    cout << "Triangle area\t" << t.calArea() << endl;

    Rectangle r(4, 6);
    cout << "Rectangle area\t" << r.calArea() << endl;

   
    
    return 0;
}