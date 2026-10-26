package com.shiurim.app;

// tools/java/MainActivity.java.in — זהות המעטפת: הערכים שנבדלים בין האפליקציות, מהתצורה
public class MainActivity extends ShellActivity {

    @Override
    protected String appUrl() { return "https://ygtotlrl-lab.github.io/shiurim/"; }

    @Override
    protected String offlineLine() { return "השיעורים לא הצליחו להתחבר."; }

    @Override
    protected String accentColor() { return "#1e3a6e"; }
}
