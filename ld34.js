(function ld34(c) {
    'use strict';

    // embed max is 900 x 600
    c.width = 480;
    c.height = 580;

    // game tick
    var press_left = false;
    var press_right = false;
    var x = c.width / 2;
    var y = -80;
    var xspeed = 0;
    var xaccel = 0.3;
    var xdecel = 1.2;
    var xterm  = 4;
    var xfrict = 1;
    var yspeed = 0;
    var yaccel = 0.1;
    var yterm  = 3;
    var update = function() {
        if (press_left) {
            if (xspeed > 0) {
                xspeed -= xdecel;
            } else if (xspeed >= (-xterm + xaccel)) {
                xspeed -= xaccel;
            } else {
                xspeed = -xterm;
            }
        } else if (press_right) {
            if (xspeed < 0) {
                xspeed += xdecel;
            } else if (xspeed <= (xterm - xaccel)) {
                xspeed += xaccel;
            } else {
                xspeed = xterm;
            }
        } else {
            if (xspeed > 0) {
                xspeed = Math.max(0, xspeed - xfrict);
            } else {
                xspeed = Math.min(0, xspeed + xfrict);
            }
        }
        x = x + xspeed;

        yspeed = Math.max(yterm, yspeed + yaccel);
        y = y + yspeed;

        return;
    };

    // rendering
    var ctx = c.getContext("2d");
    var zoom = 1;
    var zoomFactor = 0.001;
    var render = function() {
        // clear and border (unscaled)
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.beginPath();
        ctx.lineWidth = "5";
        ctx.strokeStyle = "red";
        ctx.rect(0, 0, c.width, c.height);
        ctx.stroke();
        ctx.restore();

        // scale
        ctx.save();
        var cx = (c.width / zoom / 2) - x;
        var cy = (80 / zoom) - (Math.max(y, 0));
        ctx.translate(cx * zoom, cy * zoom);
        zoom = zoom + zoomFactor;
        ctx.scale(zoom, zoom);

        // everything else is scaled
        ctx.beginPath();
        ctx.lineWidth = "5";
        ctx.strokeStyle = "red";
        ctx.arc(x, y, 10, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.beginPath();
        ctx.lineWidth = "4";
        ctx.strokeStyle = "blue";
        ctx.arc(300, 400, 5, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.beginPath();
        ctx.lineWidth = "4";
        ctx.strokeStyle = "green";
        ctx.arc(100, 500, 6, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.restore();
    };

    // main game event loop
    var STEP  = 1/60;
    var delta = 0;
    var last  = window.performance.now();
    var frame = function() {
        var now = window.performance.now();
        delta = delta = Math.min(1, (now - last) / 1000);
        while (delta > STEP) {
            delta = delta - STEP;
            update();
        }
        render();
        last = now;
        requestAnimationFrame(frame);
    };

    var keydown = function(e) {
        switch (e.keyCode) {
            case 37:
            case 65:
                press_left = true;
                return false;
            case 39:
            case 68:
                press_right = true;
                return false;
        }
    };
    var keyup = function(e) {
        switch (e.keyCode) {
            case 37:
            case 65:
                press_left = false;
                return false;
            case 39:
            case 68:
                press_right = false;
                return false;
        }
    };
    $(document).keydown(keydown);
    $(document).keyup(keyup);

    requestAnimationFrame(frame);
})(document.getElementById("ld34"));
