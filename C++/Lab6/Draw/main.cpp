#include <iostream>
#include <graphics.h>
using namespace std;
class Shape{
private:
int color;
protected:
public:
Shape(int x=0):color(x){}
~Shape(){}
void set_My_Color(int color){
this->color=color;
}

int get_My_Color(){
return this->color;

}
virtual void draw()=0;

};
class Point {
private:
    int x,y;
public:
    Point():x(0),y(0){}
    Point(int x1, int y1) : x(x1), y(y1){}
    int getX()
    {
     return x;
    }
    int getY()
     {
         return y;
     }
};

class Line:public Shape {
private:
    Point start;
    Point end;
public:
    Line() :Shape(), start(), end() {

    }
    Line(int x1, int y1, int x2, int y2,int color) :Shape(color), start(x1, y1), end(x2, y2) {}

     void draw() {
        setcolor(this->get_My_Color());
        line(start.getX(), start.getY(), end.getX(), end.getY());
    }
};

class Rect :public Shape{
private:
    Point ul;
    Point lr;
public:
    Rect() :Shape(), ul(), lr() {}
    Rect(int x1, int y1, int x2, int y2,int color) :Shape(color), ul(x1, y1), lr(x2, y2) {}

     void draw() {

        rectangle(ul.getX(), ul.getY(), lr.getX(), lr.getY());
    }
};

class Circle :public Shape{
private:
    Point center;
    int radius;
public:
    Circle() :Shape(), center(), radius(0) {}
    Circle(int m, int n, int r,int color) :Shape(color), center(m, n), radius(r) {}

      void draw() {
         setcolor(this->get_My_Color());
        circle(center.getX(), center.getY(), radius);
    }
};

class Picture {
private:
    int count;
    int size;
    Shape **items;

public:
    Picture(int size) {
        this->size=size;
count=0;
    items=new Shape*[size];
    }

    void addShape(Shape*s){

    if(count!=size){
items[count++]=s;

    
    
}
    }

    void paint() {
        for (int i = 0; i < count; i++) {
            items[i]->draw();
        }
       
    }
};


int main() {

    int g = DETECT, gm;
    initgraph(&g, &gm,"");   
     Picture myPic(10);

    myPic.addShape(new Circle(50, 50, 50, 1));
    myPic.addShape(new Circle(200, 100, 100, 2));
    myPic.addShape(new Circle(420, 50, 30, 3));
    myPic.addShape(new Rect(30, 40, 170, 100, 4));
    myPic.addShape(new Rect(420, 50, 500, 300, 5));
    myPic.addShape(new Line(420, 50, 300, 300, 6));
    myPic.addShape(new Line(40, 500, 500, 400, 7));

    
    myPic.paint();
    getch();
    return 0;
}
