package com.example.androidtoyapp;

import android.media.MediaPlayer;
import android.os.Bundle;
import android.view.View;
import android.view.animation.AlphaAnimation;
import android.view.animation.Animation;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;

public class WoodenFishActivity extends AppCompatActivity {

    private MediaPlayer woodenFishPlayer;
    private TextView meritText;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_wooden_fish);

        woodenFishPlayer = MediaPlayer.create(this, R.raw.wooden_fish_sound);
        ImageView woodenFishImage = findViewById(R.id.wooden_fish_image);
        meritText = findViewById(R.id.merit_text);

        woodenFishImage.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (woodenFishPlayer != null) {
                    if (woodenFishPlayer.isPlaying()) {
                        woodenFishPlayer.seekTo(0);
                    } else {
                        woodenFishPlayer.start();
                    }
                }
                showMeritAnimation();
            }
        });
    }

    private void showMeritAnimation() {
        meritText.setVisibility(View.VISIBLE);
        Animation fadeOut = new AlphaAnimation(1, 0);
        fadeOut.setDuration(1000);
        fadeOut.setAnimationListener(new Animation.AnimationListener() {
            @Override
            public void onAnimationStart(Animation animation) { }

            @Override
            public void onAnimationEnd(Animation animation) {
                meritText.setVisibility(View.GONE);
            }

            @Override
            public void onAnimationRepeat(Animation animation) { }
        });
        meritText.startAnimation(fadeOut);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (woodenFishPlayer != null) {
            woodenFishPlayer.release();
            woodenFishPlayer = null;
        }
    }
}
