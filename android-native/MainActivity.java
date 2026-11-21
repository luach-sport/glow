package com.luachsport.glow;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

/** The app's only screen (the web app inside), with Glow's wallpaper engine plugged in. */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(GlowPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
