import javax.swing.*;
import java.awt.BorderLayout;
import java.util.Date;

class TextBanner extends JFrame implements Runnable {
Thread th;
JLabel txt = new JLabel();

public TextBanner(){
        this.setTitle("");
        txt.setText("Hello, World!");
        txt.setBounds(0, 0, 600, 30);
        this.setLayout(null); 
        this.add(txt);
        th = new Thread(this);
        th.start();
}
    public static void main(String[] args) {
        TextBanner app = new TextBanner();
        app.setBounds(0, 0, 600, 400);
        app.setVisible(true);
    }

    public void run() {
        int w = this.getWidth();
        int current = 0;
        txt.setBounds(current,0,600,30);
        while (true) {
            current += 20;
            if (current >= w) current = 0 ;
            txt.setBounds(current, 0, 600, 30);
            try {
                Thread.sleep(1000); 
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
}
}