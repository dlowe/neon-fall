(function ld34(c) {
    'use strict';

    // embed max is 900 x 600
    c.width = 480;
    c.height = 580;

    // game tick
    var player = {
        'press_left':  false,
        'press_right': false,
        'x':           0,
        'y':           -80,
        'r':           10,
        'target_r':    10,
        'rspeed':      0.5,
        'xspeed':      0,
        'xaccel':      0.3,
        'xdecel':      1.2,
        'xterm':       4,
        'xfrict':      1,
        'yspeed':      0,
        'yaccel':      0.1,
        'yterm':       function(p) { return Math.max(8.0, p.r * 0.18) },
    };
    var move = function(obj) {
        if (obj.press_left) {
            if (obj.xspeed > 0) {
                obj.xspeed -= obj.xdecel;
            } else if (obj.xspeed >= (-obj.xterm + obj.xaccel)) {
                obj.xspeed = obj.xspeed - obj.xaccel;
            } else {
                obj.xspeed = -obj.xterm;
            }
        } else if (obj.press_right) {
            if (obj.xspeed < 0) {
                obj.xspeed += obj.xdecel;
            } else if (obj.xspeed <= (obj.xterm - obj.xaccel)) {
                obj.xspeed = obj.xspeed + obj.xaccel;
            } else {
                obj.xspeed = obj.xterm;
            }
        } else {
            if (obj.xspeed > 0) {
                obj.xspeed = Math.max(0, obj.xspeed - obj.xfrict);
            } else {
                obj.xspeed = Math.min(0, obj.xspeed + obj.xfrict);
            }
        }
        obj.x = obj.x + obj.xspeed;

        obj.yspeed = Math.min(obj.yterm(obj), obj.yspeed + obj.yaccel);
        obj.y = obj.y + obj.yspeed;

        return;
    };

    var collides = function(obj1, obj2) {
        var dx = obj2.x - obj1.x;
        var dy = obj2.y - obj1.y;
        var rr = obj1.r + obj2.r;
        if ( ((dx * dx) + (dy * dy)) < (rr * rr) ) {
            return true;
        }
        return false;
    };

    var thingies = [];

    var r2a = function(r) {
        return (Math.PI * r * r);
    };
    var a2r = function(a) {
        return Math.sqrt(a / Math.PI);
    };

    var update = function() {
        if (player.target_r > player.r) {
            player.r = Math.min(player.target_r, player.r + player.rspeed);
        } else if (player.target_r < player.r) {
            player.r = Math.max(player.target_r, player.r - player.rspeed);
        }

        move(player);
        for (var ti = 0; ti < thingies.length; ++ti) {
            if (! thingies[ti].gone) {
                if (collides(thingies[ti], player)) {
                    thingies[ti].gone = 1;
                    player.target_r = a2r(r2a(player.r) + r2a(thingies[ti].r));
                }
                thingies[ti].move(thingies[ti]);
            }
        }
    };

    var angle_between = function(obj1, obj2) {
        return Math.atan((obj1.x - obj2.x) / (obj1.y - obj2.y));
    };

    var length_between = function(obj1, obj2) {
        var dx = obj1.x - obj2.x;
        var dy = obj1.y - obj2.y;
        var l = Math.sqrt((dx * dx) + (dy * dy));
        return (dy < 0) ? l : -l;
    };

    var destination = function(obj1, angle, length) {
        var dx = Math.sin(angle) * length;
        var dy = Math.cos(angle) * length;
        var x = obj1.x + dx;
        var y = obj1.y + dy;

        return {
            'x': x,
            'y': y
        };
    };

    var new_thingy = function(x, y, r) {
        return {
            'x':     x,
            'y':     y,
            'r':     r,
            'gone':  false,
            'speed': 0.9,
            'move': function(t) {
                var distance = -1 * length_between(t, player);
                var dest = destination(t, angle_between(t, player), (t.y > player.y) ? t.speed : -t.speed);
                t.x = dest.x;
                t.y = dest.y;
                return;
            },
        };
    };

    for (var i = 0; i < 100; ++i) {
        thingies.push(new_thingy(Math.random() * 600 - 300, Math.random() * 10000 + 100, Math.random() * 30 + 2));
    }

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

        // scale and translate before drawing everything else
        ctx.save();
        var target_a = 5000;
        var scaled_a = r2a(player.r * zoom);
        if (scaled_a < (target_a - 100)) {
            zoom = zoom + zoomFactor;
        } else if (scaled_a > (target_a + 100)) {
            zoom = zoom - zoomFactor;
        }
        var cx = (c.width / zoom / 2) - player.x;
        var cy = (80 / zoom) - (Math.max(player.y, 0));
        ctx.translate(cx * zoom, cy * zoom);
        ctx.scale(zoom, zoom);

        // the player
        ctx.beginPath();
        ctx.lineWidth = "5";
        ctx.strokeStyle = "red";
        ctx.arc(player.x, player.y, player.r, 0, 2 * Math.PI);
        ctx.stroke();

        // the thingies
        for (var ti = 0; ti < thingies.length; ++ti) {
            if (! thingies[ti].gone) {
                ctx.beginPath();
                ctx.lineWidth = "4";
                ctx.strokeStyle = "blue";
                ctx.arc(thingies[ti].x, thingies[ti].y, thingies[ti].r, 0, 2 * Math.PI);
                ctx.stroke();

                // debugging thingy->player vectors
                // ctx.beginPath();
                // ctx.lineWidth = "0.4";
                // ctx.strokeStyle = "green";
                // ctx.moveTo(thingies[ti].x, thingies[ti].y);
                // var dest = destination(thingies[ti], angle_between(thingies[ti], player), length_between(thingies[ti], player));
                // ctx.lineTo(dest.x, dest.y);
                // ctx.stroke();
            }
        }

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
                player.press_left = true;
                return false;
            case 39:
            case 68:
                player.press_right = true;
                return false;
        }
    };
    var keyup = function(e) {
        switch (e.keyCode) {
            case 37:
            case 65:
                player.press_left = false;
                return false;
            case 39:
            case 68:
                player.press_right = false;
                return false;
        }
    };
    $(document).keydown(keydown);
    $(document).keyup(keyup);

    requestAnimationFrame(frame);
})(document.getElementById("ld34"));
