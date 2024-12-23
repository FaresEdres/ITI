import java.util.ArrayList;
import java.util.List;
import MyPkg.Circle;
import MyPkg.Shape;
import MyPkg.Rect;


class Test{
    void drawShape(List<? extends Shape> shapes){
        for(Shape s:shapes){
            s.draw();
        }
    }
    public static void main(String args[]){
       List<Shape> s= new ArrayList<>();
       
       Test t=new Test();
       s.add(new Rect());
       s.add(new Circle());
       t.drawShape(s);


    }
}