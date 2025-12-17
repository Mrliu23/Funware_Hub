package com.example.androidtoyapp;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import androidx.appcompat.app.AppCompatActivity;
import androidx.cardview.widget.CardView;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        CardView woodenFishCard = findViewById(R.id.card_wooden_fish);
        CardView airConditionerCard = findViewById(R.id.card_air_conditioner);

        woodenFishCard.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent intent = new Intent(MainActivity.this, WoodenFishActivity.class);
                startActivity(intent);
            }
        });

        airConditionerCard.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Intent intent = new Intent(MainActivity.this, AirConditionerActivity.class);
                startActivity(intent);
            }
        });
    }
}
