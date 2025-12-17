package com.example.androidtoyapp;

import android.media.MediaPlayer;
import android.os.Bundle;
import android.widget.CompoundButton;
import android.widget.Switch;
import androidx.appcompat.app.AppCompatActivity;

public class AirConditionerActivity extends AppCompatActivity {

    private MediaPlayer acPlayer;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_air_conditioner);

        acPlayer = MediaPlayer.create(this, R.raw.ac_sound);
        if (acPlayer != null) {
            acPlayer.setLooping(true);
        }

        Switch acSwitch = findViewById(R.id.ac_switch);
        acSwitch.setOnCheckedChangeListener(new CompoundButton.OnCheckedChangeListener() {
            @Override
            public void onCheckedChanged(CompoundButton buttonView, boolean isChecked) {
                if (acPlayer != null) {
                    if (isChecked) {
                        acPlayer.start();
                    } else {
                        acPlayer.pause();
                    }
                }
            }
        });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (acPlayer != null) {
            acPlayer.release();
            acPlayer = null;
        }
    }
}
