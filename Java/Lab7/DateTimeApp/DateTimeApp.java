import javax.swing.*;
import java.util.Date;
import java.awt.BorderLayout;


public class DateTimeApp extends JFrame implements Runnable {
    Thread th; 
    JLabel timeLabel = new JLabel();

    public DateTimeApp() {
        this.setTitle("Date & Time Frame Application");
        timeLabel.setHorizontalAlignment(JLabel.CENTER);
        timeLabel.setText(new Date().toString());
        this.add(timeLabel, BorderLayout.NORTH);
        th = new Thread(this);
        th.start();
    }

    public static void main(String[] args) {
        DateTimeApp app = new DateTimeApp();
        app.setBounds(50, 50, 600, 400);
        app.setVisible(true);
    }

    public void run() {
        while (true) {
            timeLabel.setText(new Date().toString());
            try {
                Thread.sleep(1000); // Update every second
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}
