import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-clock-background',
  standalone: true,
  imports: [],
  templateUrl: './clock-background.component.html',
  styleUrl: './clock-background.component.css'
})
export class ClockBackgroundComponent implements OnInit {

  ngOnInit() {
    this.updateClock();
  }
  updateClock() {
    const hourHand = document.getElementById('hour-hand');
    const minuteHand = document.getElementById('minute-hand');
    const secondHand = document.getElementById('second-hand');
    let lastSecondAngle = 0;

    const update = () => {
      const now = new Date();
      const hours = now.getHours() % 12;
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      const milliseconds = now.getMilliseconds();

      const hourAngle = (hours / 12) * 360 + (minutes / 60) * 30;
      const minuteAngle = (minutes / 60) * 360 + (seconds / 60) * 6;
      const secondAngle = (seconds + milliseconds / 1000) / 60 * 360;

      if (hourHand) hourHand.style.transform = `rotate(${hourAngle}deg)`;
      if (minuteHand) minuteHand.style.transform = `rotate(${minuteAngle}deg)`;
      if (secondHand) {
        if (Math.abs(secondAngle - lastSecondAngle) > 180) {
          secondHand.style.transition = 'none';
        } else {
          secondHand.style.transition = 'transform 0.2s ease-out';
        }
        secondHand.style.transform = `rotate(${secondAngle}deg)`;
        lastSecondAngle = secondAngle;
      }

      requestAnimationFrame(update);
    };

    update();
  }



}
