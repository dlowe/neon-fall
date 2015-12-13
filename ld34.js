(function ld34(c) {
    'use strict';

    // embed max is 900 x 600
    c.width = 480;
    c.height = 580;

    var new_player = function() {
        return {
            'press_left':  false,
            'press_right': false,
            'x':           250,
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
            'yaccel':      0.08,
            'yterm':       function(p) { return Math.min(21.0, Math.max(7.0, p.r * 0.17)) },
        };
    };
    var player = null;

    var move = function(obj) {
        if (! collides_with_solids(obj)) {
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

            obj.yspeed = Math.min(obj.yterm(obj), obj.yspeed + obj.yaccel);
        } else {
            obj.xspeed = 0;
            obj.yspeed = 0;
        }

        var new_x = obj.x + obj.xspeed;
        var new_y = obj.y + obj.yspeed;

        obj.x = new_x;
        obj.y = new_y;

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

    var maybe_spawn_thingy = function() {
        var new_thingy = null;
        if (Math.random() < 0.8) {
            new_thingy = new_pellet;
        } else if (Math.random() < 0.6) {
            new_thingy = new_bumper;
        } else {
            new_thingy = new_pester;
        }
        if ((thingies.length < 100) && (Math.random() < 0.14)) {
            var t = new_thingy(Math.random() * player.r * 10 + player.x - (player.r * 5),
                        Math.random() * 100 + player.y + (c.height / zoom),
                        Math.random() * player.r * 0.7 + 0.3);
            for (var ti = 0; ti < thingies.length; ++ti) {
                if (collides(thingies[ti], t)) {
                    return;
                }
            }
            thingies.push(t);
        }
    };
    var maybe_despawn_thingies = function() {
        thingies = thingies.filter(function(t) {
            return (! t.gone) && (t.y > (player.y - (c.height / zoom)));
        });
    };

    var frameno = 0;
    var game_over = false;

    var dead_since_frame = -1;
    var dead_frame_limit = 180;
    var check_for_endgame = function() {
        var dead = (player.r < 1) || (player.yspeed < 0.01);
        if (dead) {
            if (dead_since_frame === -1) {
                dead_since_frame = frameno;
            }
            if ((frameno - dead_since_frame) > dead_frame_limit) {
                game_over = 1;
            }
        } else {
            dead_since_frame = -1;
        }
    };

    var update = function() {
        ++frameno;

        if (player.target_r > player.r) {
            player.r = Math.min(player.target_r, player.r + player.rspeed);
        } else if (player.target_r < player.r) {
            player.r = Math.max(player.target_r, player.r - player.rspeed);
        }

        move(player);
        for (var ti = 0; ti < thingies.length; ++ti) {
            if (! thingies[ti].gone) {
                if (collides(thingies[ti], player)) {
                    thingies[ti].collide(thingies[ti], player);
                }
                thingies[ti].move(thingies[ti]);
            }
        }

        maybe_despawn_thingies();
        maybe_spawn_thingy();

        check_for_endgame();
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

    var new_obj_at = function(obj, new_x, new_y) {
        return {
            'x': new_x,
            'y': new_y,
            'r': obj.r
        };
    };

    var collides_with_solids = function(obj) {
        for (var ti = 0; ti < thingies.length; ++ti) {
            if ((thingies[ti].solid) && (collides(thingies[ti], obj))) {
                return true;
            }
        }
        return false;
    };

    var new_pellet = function(x, y, r) {
        return {
            'x':     x,
            'y':     y,
            'r':     r,
            'gone':  false,
            'speed': 2.9,
            'fillStyle': "blue",
            'solid': false,
            'move': function(t) {
                var distance = -1 * length_between(t, player);
                var dest = destination(t, angle_between(t, player), (t.y > player.y) ? t.speed : -t.speed);
                t.x = dest.x;
                t.y = dest.y;
                return;
            },
            'collide': function(t, obj) {
                t.gone = 1;
                obj.target_r = a2r(r2a(obj.r) + r2a(t.r));
            },
        };
    };

    var new_pester = function(x, y, r) {
        return {
            'x':     x,
            'y':     y,
            'r':     r,
            'gone':  false,
            'speed': 3.6,
            'fillStyle': "yellow",
            'solid': false,
            'move': function(t) {
                var distance = -1 * length_between(t, player);
                var dest = destination(t, angle_between(t, player), (t.y > player.y) ? -t.speed : t.speed);
                t.x = dest.x;
                t.y = dest.y;
                return;
            },
            'collide': function(t, obj) {
                t.gone = 1;
                obj.target_r = a2r(Math.max(0.3, r2a(obj.r) - r2a(t.r) / 2));
            },
        };
    };

    var new_bumper = function(x, y, r) {
        return {
            'x':     x,
            'y':     y,
            'r':     r,
            'gone':  false,
            'speed': 0.3,
            'fillStyle': "green",
            'angle': 0,
            'frames': 0,
            'solid': true,
            'move': function(t) {
                if (t.speed !== 0) {
                    var dest = destination(t, t.angle, t.speed);
                    t.x = dest.x;
                    t.y = dest.y;
                    if (t.speed > 0) {
                        t.speed = Math.max(0, t.speed - 0.18);
                    } else {
                        t.speed = Math.min(0, t.speed + 0.18);
                    }
                }
                return;
            },
            'collide': function(t, obj) {
                t.speed    = (t.y > obj.y ? (1) : (-1)) *
                    Math.max(0.02, (Math.abs(obj.yspeed) + Math.abs(obj.xspeed)) * Math.min(1, (r2a(obj.r) / (r2a(t.r) * 1.5))));
                t.angle    = angle_between(obj, t);
                obj.yspeed = 0;
            },
        };
    };

    // rendering
    var ctx = c.getContext("2d");
    var zoom = 1;
    var zoom_factor = 0.0045;
    var render = function() {
        // scale and translate before drawing everything else
        ctx.save();
        var target_a = 5000;
        var scaled_a = r2a(player.r * zoom);
        if (scaled_a < (target_a - (100 / zoom))) {
            zoom = zoom * (1 + zoom_factor);
        } else if (scaled_a > (target_a + (100 / zoom))) {
            zoom = zoom * (1 - zoom_factor);
        }
        var cx = (c.width / zoom / 2) - player.x;
        var cy = (80 / zoom) - (Math.max(player.y, 0));
        ctx.translate(cx * zoom, cy * zoom);
        ctx.scale(zoom, zoom);

        // the checkerboard
        var size = 5000;
        var cx = Math.floor(player.x / size);
        var cy = Math.floor(player.y / size);
        var nx = Math.floor(c.width / size / zoom) + 2;
        var ny = Math.floor(c.height / size / zoom) + 2;
        for (var gx = cx - nx; gx < (cx + nx); ++gx) {
            var xodd = ((gx % 2) != 0);
            for (var gy = cy - ny; gy < (cy + ny); ++gy) {
                var yodd = ((gy % 2) != 0);
                if ((xodd && yodd) || (! (xodd || yodd))) {
                    ctx.fillStyle = "black";
                } else {
                    ctx.fillStyle = "white";
                }
                ctx.fillRect(gx * size, gy * size, size, size);
            }
        }

        // the player
        ctx.beginPath();
        ctx.fillStyle = "red";
        ctx.arc(player.x, player.y, player.r, 0, 2 * Math.PI);
        ctx.fill();

        // the thingies
        for (var ti = 0; ti < thingies.length; ++ti) {
            if (! thingies[ti].gone) {
                ctx.beginPath();
                ctx.fillStyle = thingies[ti].fillStyle;
                ctx.arc(thingies[ti].x, thingies[ti].y, thingies[ti].r, 0, 2 * Math.PI);
                ctx.fill();

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
    var render_game_over = function() {
        ctx.save();
        ctx.font = "30px Verdana";
        ctx.fillStyle = "#FF0000";
        ctx.fillText("Game over :(", 30, 40);
        ctx.fillText("(press a key to restart)", 30, 80);
        ctx.restore();
    };

    // main game event loop
    var STEP  = 1/60;
    var delta = 0;
    var last  = window.performance.now();
    var frame = function() {
        // render before update, since the event is "screen is ready"!
        if (! game_over) {
            render();
        } else {
            render_game_over();
        }

        // update if necessary
        if (! game_over) {
            var now = window.performance.now();
            delta = delta = Math.min(1, (now - last) / 1000);
            while (delta > STEP) {
                delta = delta - STEP;
                update();
                last = now;
            }
        }

        // recur
        requestAnimationFrame(frame);
    };

    var start_game = function() {
        game_over = false;
        player = new_player();
        thingies = [];
        zoom = 1;
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
        if (game_over) {
            start_game();
        }
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

    start_game();
    requestAnimationFrame(frame);
})(document.getElementById("ld34"));
