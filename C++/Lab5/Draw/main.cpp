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
    int cNum, rNum, lNum;
    Circle* pCircles;
    Rect* pRects;
    Line* pLines;

public:
    Picture() : cNum(0), rNum(0), lNum(0), pCircles(nullptr), pRects(nullptr), pLines(nullptr) {}

    void setCircles(int cn, Circle* pC) {
        cNum = cn;
        pCircles = pC;
    }

    void setRects(int rn, Rect* pR) {
        rNum = rn;
        pRects = pR;
    }
    void setLines(int ln, Line* pL) {
        lNum = ln;
        pLines = pL;
    }

    void paint() {
        for (int i = 0; i < cNum; i++) {
            pCircles[i].draw();
        }
        for (int i = 0; i < rNum; i++) {
            pRects[i].draw();
        }
        for (int i = 0; i < lNum; i++) {
            pLines[i].draw();
        }
    }
};


int main() {

    int g = DETECT, gm;
    initgraph(&g, &gm,"");
    Picture myPic;
    int cRect=73;
    int cCircle=2;
    int cLine=40;
    Circle cArr[3] = { Circle(50, 50, 50,cCircle), Circle(200, 100, 100,cCircle), Circle(420, 50, 30,cCircle) };
    Rect rArr[2] = { Rect(30, 40, 170, 100,cRect), Rect(420, 50, 500, 300,cRect) };
    Line lArr[2] = { Line(420, 50, 300, 300,cLine), Line(40, 500, 500, 400,cLine) };

    myPic.setCircles(3, cArr);
    myPic.setRects(2, rArr);
    myPic.setLines(2, lArr);

    myPic.paint();
    getch();
    return 0;
}
