(function neon_fall(c) {
    'use strict';

    // embed max is 900 x 600
    c.width = 480;
    c.height = 580;

    var high_score = 0;

    var sounds = {
        'background':       new Audio("background.mp3"),
        'spawn':            new Audio("spawn.mp3"),
        'warning':          new Audio("warning.mp3"),
        "game_over":        new Audio("game_over.mp3"),
        "collision_bumper": new Audio("collision_bumper.mp3"),
        "collision_pellet": new Audio("collision_pellet.mp3"),
        "collision_pester": new Audio("collision_pester.mp3"),
        "collision_killer": new Audio("collision_killer.mp3"),
    };

    var sprites = {
        'player': new Image(),
        'pellet': new Image(),
        'pester': new Image(),
        'bumper': new Image(),
        'killer': new Image(),
    };

    sprites.player.src = 'player.png';
    sprites.pellet.src = 'pellet.png';
    sprites.pester.src = 'pester.png';
    sprites.bumper.src = 'bumper.png';
    sprites.killer.src = 'killer.png';

    var new_player = function() {
        return {
            'press_left':  false,
            'press_right': false,
            'x':           250,
            'y':           -80,
            'r':           10,
            'angle':       0,
            'spin':        1,
            'target_r':    10,
            'max_r':       10,
            'rspeed':      0.02,
            'xspeed':      0,
            'xaccel':      0.4,
            'xdecel':      1.2,
            'xterm':       4,
            'xfrict':      1,
            'yspeed':      0,
            'yaccel':      0.08,
            'yterm':       function(p) { return Math.min(23.0, Math.max(5.0, p.r * 0.18)) },
            'score':       0,
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

        obj.angle = (obj.angle + obj.spin) % 360;

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
    var trailers = [];
    var flares   = [];

    var r2a = function(r) {
        return (Math.PI * r * r);
    };
    var a2r = function(a) {
        return Math.sqrt(a / Math.PI);
    };

    var maybe_spawn_thingy = function() {
        if (((frameno % 3) === 0) && (thingies.length < 100)) {
            var constructors = [ new_pellet, new_bumper, new_killer, new_pester ];
            var new_thingy = constructors[Math.floor(Math.random() * constructors.length)];

            var t = new_thingy(Math.random() * player.r * 10 + player.x - (player.r * 5), Math.random() * 100 + player.y + (c.height / zoom), frameno);
            if (t) {
                for (var ti = 0; ti < thingies.length; ++ti) {
                    if (collides(thingies[ti], t)) {
                        return;
                    }
                }
                thingies.push(t);
            }
        }
    };
    var maybe_despawn_thingies = function() {
        thingies = thingies.filter(function(t) {
            return (! t.gone) && (t.y > (player.y - (c.height / zoom)));
        });
    };
    var maybe_despawn_trailers = function() {
        trailers = trailers.filter(function(t) {
            return (t.despawn_frame > frameno);
        });
    };
    var maybe_despawn_flares = function() {
        flares = flares.filter(function(f) {
            return (f.despawn_frame > frameno);
        });
    };

    var frameno = 1;
    var game_over = false;
    var title_screen = true;

    var too_small;
    var too_slow;
    var dead_since_frame = -1;
    var dead_frame_limit = 180;
    var check_for_endgame = function() {
        too_small = player.r < 3;
        too_slow  = player.yspeed < 0.17;

        var dead = too_small || too_slow;
        if (dead) {
            if (dead_since_frame === -1) {
                dead_since_frame = frameno;
            }

            if ((frameno - dead_since_frame) > dead_frame_limit) {
                if (player.score > high_score) {
                    high_score = player.score;
                }
                game_over = true;
                sounds.background.pause();

                sounds.game_over.load();
                sounds.game_over.volume = 0.3;
                sounds.game_over.play();
            } else {
                // annoying warning klaxon!
                if (((frameno - dead_since_frame) % 30) === 29) {
                    sounds.warning.load();
                    sounds.warning.volume = 0.3;
                    sounds.warning.play();
                }
            }
        } else {
            dead_since_frame = -1;
        }
    };

    var update = function() {
        ++frameno;

        if (player.target_r > player.r) {
            player.r = Math.min(player.target_r, player.r * (1 + player.rspeed));
        } else if (player.target_r < player.r) {
            player.r = Math.max(player.target_r, player.r * (1 - player.rspeed));
        }
        if (player.r > player.max_r) {
            player.max_r = player.r;
        }

        move(player);
        for (var ti = 0; ti < thingies.length; ++ti) {
            if (! thingies[ti].gone) {
                if (collides(thingies[ti], player)) {
                    thingies[ti].collide(thingies[ti], player);
                }
                thingies[ti].move(thingies[ti], frameno);
            }
        }

        maybe_despawn_thingies();
        maybe_despawn_trailers();
        maybe_despawn_flares();
        maybe_spawn_thingy();

        player.score = Math.floor(Math.max(0, Math.log((player.max_r - 9) / 7) + Math.log(Math.max(0, player.y / 500))));

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

    // difficulty-ramping fn
    // given: low and high values; start/end/current frame numbers
    // returns a value between low and high, linear distributed between start->end frames and flat (low or high) outside that range
    var ramp = function(low, high, start, end, frameno) {
        if (frameno <= start) {
            return low;
        }
        if (frameno >= end) {
            return high;
        }
        return low + (((high - low) / (end - start)) * (frameno - start));
    };

    var new_pellet = function(x, y, frameno) {
        if (Math.random() > (0.85 - ramp(0, 0.35, 1800, 18000, frameno))) {
            return null;
        }
        var r = Math.random() * player.r * (0.8 - ramp(0, 0.3, 120, 9000, frameno)) + 0.3;
        var s = 0.3 + (Math.random() * ramp(0.3, 5.5, 0, 12000, frameno));
        return {
            'x':     x,
            'y':     y,
            'r':     r,
            'gone':  false,
            'speed': s,
            'sprite': sprites.pellet,
            'angle': 0,
            'solid': false,
            'move': function(t, frameno) {
                if ((frameno % 8) === 0) {
                    trailers.push(new_trailer(t.x, t.y, t.r * 0.8, "#4D4DFF"));
                }

                var distance = -1 * length_between(t, player);
                var dest = destination(t, angle_between(t, player), (t.y > player.y) ? t.speed : -t.speed);
                t.x = dest.x;
                t.y = dest.y;
                return;
            },
            'collide': function(t, obj) {
                flares.push(new_flare(t.x, t.y, angle_between(t, obj), t.r, "#4D4DFF"));
                t.gone = 1;
                obj.target_r = a2r(r2a(obj.target_r) + r2a(t.r * 0.70));
                obj.spin += Math.random() * 10 - 5;
                sounds.collision_pellet.load();
                sounds.collision_pellet.volume = 0.3;
                sounds.collision_pellet.play();
            },
        };
    };

    var new_pester = function(x, y, frameno) {
        if (Math.random() > ramp(0.25, 0.55, 180, 4800, frameno)) {
            return null;
        }
        var r = Math.random() * player.r * ramp(0.2, 1.6, 300, 18000, frameno) + 0.3;
        var s = 1.0 + Math.random() * ramp(2, 8, 0, 18000, frameno);
        return {
            'x':     x,
            'y':     y,
            'r':     r,
            'gone':  false,
            'speed': s,
            'sprite': sprites.pester,
            'angle': 0,
            'solid': false,
            'move': function(t, frameno) {
                if ((frameno % 4) === 0) {
                    trailers.push(new_trailer(t.x, t.y, t.r * 0.8, "#FFFF00"));
                }

                var distance = -1 * length_between(t, player);
                var a = angle_between(t, player);
                t.angle = a / (Math.PI / 180);
                var dest = destination(t, a, (t.y > player.y) ? -t.speed : t.speed);
                t.x = dest.x;
                t.y = dest.y;
                return;
            },
            'collide': function(t, obj) {
                flares.push(new_flare(t.x, t.y, angle_between(t, obj), t.r, "#FFFF00"));
                t.gone = 1;
                obj.target_r = a2r(Math.max(0.3, r2a(obj.target_r) - r2a(t.r) / 2));
                sounds.collision_pester.load();
                sounds.collision_pester.volume = 0.3;
                sounds.collision_pester.play();
                obj.spin += Math.random() * 10 - 5;
            },
        };
    };

    var new_flare = function(x, y, angle, width, color) {
        var duration = 10;
        return {
            'x': x,
            'y': y,
            'width': width,
            'angle': angle,
            'color': color,
            'duration': duration,
            'despawn_frame': frameno + duration,
        };
    };

    var new_trailer = function(x, y, r, color) {
        var duration = 60;
        return {
            'x': x,
            'y': y,
            'r': r,
            'duration': duration,
            'despawn_frame': frameno + duration,
            'color': color,
        };
    };

    var new_bumper = function(x, y, frameno) {
        if (Math.random() > ramp(0.14, 0.64, 0, 18000, frameno)) {
            return null;
        }
        var r = Math.random() * player.r * ramp(0.4, 1.3, 0, 18000, frameno) + 0.3;
        var s = 0;
        return {
            'x':     x,
            'y':     y,
            'r':     r,
            'gone':  false,
            'speed': s,
            'sprite': sprites.bumper,
            'angle': 0,
            'frames': 0,
            'solid': true,
            'move': function(t, frameno) {
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
                if (obj.yspeed > 0.08) {
                    sounds.collision_bumper.load();
                    sounds.collision_bumper.volume = 0.3;
                    sounds.collision_bumper.play();
                }
                obj.yspeed = 0;
                obj.spin /= 2;
            },
        };
    };

    var new_killer = function(x, y, frameno) {
        if (Math.random() > ramp(0.01, 0.20, 2700, 18000, frameno)) {
            return null;
        }
        var r = Math.random() * player.r * 0.2 + 0.3;
        var s = Math.random() * ramp(0, 7, 0, 18000, frameno) + 3.8;
        return {
            'x':     x,
            'y':     y,
            'r':     r,
            'gone':  false,
            'speed': s,
            'sprite': sprites.killer,
            'angle': 0,
            'solid': false,
            'move': function(t, frameno) {
                trailers.push(new_trailer(t.x, t.y, t.r * 1.8, "#FF3105"));

                var distance = -1 * length_between(t, player);
                var a = angle_between(t, player);
                t.angle = a / (Math.PI / 180);
                var dest = destination(t, a, (t.y > player.y) ? -t.speed : t.speed);
                t.x = dest.x;
                t.y = dest.y;
                return;
            },
            'collide': function(t, obj) {
                flares.push(new_flare(t.x, t.y, angle_between(t, obj), obj.r, "#FF3105"));
                t.gone = 1;
                obj.target_r = obj.target_r / 2;
                obj.spin += Math.random() * 10 - 5;
                sounds.collision_killer.load();
                sounds.collision_killer.volume = 0.3;
                sounds.collision_killer.play();
            },
        };
    };

    // rendering
    var ctx = c.getContext("2d");
    var zoom = 1;
    var zoom_factor = 0.005;
    var zoom_max    = 5;
    var zoom_min    = 0.04;
    var render = function() {
        // scale and translate before drawing everything else
        ctx.save();
        var target_a = 5000;
        var scaled_a = r2a(player.r * zoom);
        if (scaled_a < (target_a - (100 / zoom))) {
            zoom = Math.max(zoom_min, Math.min(zoom_max, zoom * (1 + zoom_factor)));
        } else if (scaled_a > (target_a + (100 / zoom))) {
            zoom = Math.max(zoom_min, Math.min(zoom_max, zoom * (1 - zoom_factor)));
        }
        var cx = (c.width / zoom / 2) - player.x;
        var cy = (80 / zoom) - (Math.max(player.y, 0));
        ctx.translate(cx * zoom, cy * zoom);
        ctx.scale(zoom, zoom);

        // the background
        var size = 900;
        var cx = Math.floor(player.x / size);
        var cy = Math.floor(player.y / size);
        var nx = Math.floor(c.width / size / zoom) + 2;
        var ny = Math.floor(c.height / size / zoom) + 2;
        for (var gx = cx - nx; gx < (cx + nx); ++gx) {
            for (var gy = cy - ny; gy < (cy + ny); ++gy) {
                var grd = ctx.createRadialGradient(gx * size + (size/2), gy * size + (size/2), size/2, gx * size + (size/2), gy * size + (size/2), size * 1.65);
                grd.addColorStop(0.0, "#000000");
                grd.addColorStop(1.0, "#FFCCCC");
                ctx.fillStyle = grd;
                ctx.fillRect(gx * size, gy * size, size, size);
            }
        }

        // the player
        ctx.save();
        ctx.translate(player.x, player.y)
        ctx.rotate(player.angle * (Math.PI / 180));
        ctx.drawImage(sprites.player, -player.r, -player.r, 2*player.r, 2*player.r);
        ctx.restore();

        // the thingies
        for (var ti = 0; ti < thingies.length; ++ti) {
            if (! thingies[ti].gone) {
                ctx.save();
                ctx.translate(thingies[ti].x, thingies[ti].y);
                ctx.rotate(thingies[ti].angle * (Math.PI / 180));
                ctx.drawImage(thingies[ti].sprite, -thingies[ti].r, -thingies[ti].r, 2 * thingies[ti].r, 2 * thingies[ti].r);
                ctx.restore();

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

        // the trailers
        for (var ri = 0; ri < trailers.length; ++ri) {
            ctx.fillStyle = trailers[ri].color;
            ctx.globalAlpha = 0.2 - (0.2 * (1 - ((trailers[ri].despawn_frame - frameno) / trailers[ri].duration)));
            ctx.beginPath();
            ctx.arc(trailers[ri].x, trailers[ri].y, trailers[ri].r * ((trailers[ri].despawn_frame - frameno) / trailers[ri].duration), 0, 2 * Math.PI);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }

        // the flares
        for (var fi = 0; fi < flares.length; ++fi) {
            ctx.strokeStyle = flares[fi].color;
            ctx.lineWidth = flares[fi].width * ((flares[fi].despawn_frame - frameno) / flares[fi].duration);
            ctx.globalAlpha = 0.5 - (0.5 * (1 - ((flares[fi].despawn_frame - frameno) / flares[fi].duration)));
            for (var i = 0; i < 4; ++i) {
                ctx.beginPath();
                ctx.moveTo(flares[fi].x, flares[fi].y);
                var dest = destination(flares[fi], flares[fi].angle + (i * 1.5708), 1000 / zoom);
                ctx.lineTo(dest.x, dest.y);
                ctx.stroke();
            }
            ctx.globalAlpha = 1.0;
        }

        ctx.restore();

        // unscaled stuff
        ctx.save();
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = "#FF0000";
        ctx.fillRect(20, 20, c.width - 40, 24);
        ctx.font = "20px Impact";
        ctx.fillStyle = "#000000";
        ctx.fillText("SCORE: " + player.score, 30, 40);
        ctx.fillText("HIGH SCORE: " + high_score, c.width - 180, 40);
        ctx.globalAlpha = 1.0;

        // annoying warning banners!
        if ((dead_since_frame !== -1) && ((frameno - dead_since_frame) > 30) && (frameno % 3)) {
            ctx.font = "140px Impact";
            ctx.fillStyle = "#772222";
            ctx.globalAlpha = Math.min(1.0, ((frameno - dead_since_frame) / dead_frame_limit) * 0.6);
            if (too_slow) {
                ctx.fillText("FASTER!", 22, 210);
            }
            if (too_small) {
                ctx.fillText("BIGGER!", 17, 370);
            }
            ctx.globalAlpha = 1.0;
        }
        ctx.restore();
    };
    var render_game_over = function() {
        ctx.save();
        ctx.fillStyle = "#0000000";
        ctx.fillRect(0, 0, c.width, c.height);

        ctx.font = "82px Impact";
        ctx.fillStyle = "#993CF3";
        ctx.fillText("GAME OVER", 22, 130);
        ctx.fillText("SCORE: " + player.score, 22, 280);
        if ((player.score) && (player.score === high_score)) {
            ctx.fillText("HIGH SCORE!", 22, 420);
        }
        ctx.restore();
    };
    var render_title_screen = function() {
        ++frameno;
        ctx.save();
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, c.width, c.height);

        ctx.font = "94px Impact";
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = "#993CF3";
        ctx.fillText("NEON FALL", 52, 130);
        ctx.globalAlpha = 1.0;
        ctx.font = "91px Impact";
        ctx.fillText("NEON FALL", 58, 131);

        if (high_score > 0) {
            ctx.font = "30px Impact";
            ctx.fillStyle = "#772222";
            ctx.fillText("HIGH SCORE: " + high_score, 148, 170);
        }

        ctx.font = "22px Impact";

        ctx.save();
        ctx.translate(230, 240);
        ctx.rotate((frameno % 360) * (Math.PI / 180));
        ctx.drawImage(sprites.player, -30, -30, 60, 60);
        ctx.restore();
        ctx.fillStyle = "#FF00FF";
        ctx.fillText("PRESS <- TO GO LEFT", 25, 246);
        ctx.fillText("PRESS -> TO GO RIGHT", 265, 246);

        ctx.save();
        ctx.translate(135, 310);
        ctx.rotate((frameno % 360) * (Math.PI / 180));
        ctx.drawImage(sprites.pellet, -20, -20, 40, 40);
        ctx.restore();
        ctx.fillStyle = "#4D4DFF";
        ctx.fillText("MAKES YOU BIGGER", 160, 316);

        ctx.save();
        ctx.translate(135, 360);
        ctx.rotate((frameno % 360) * (Math.PI / 180));
        ctx.drawImage(sprites.pester, -20, -20, 40, 40);
        ctx.restore();
        ctx.fillStyle = "#FFFF00";
        ctx.fillText("MAKES YOU SMALLER", 160, 366);

        ctx.save();
        ctx.translate(135, 410);
        ctx.rotate((frameno % 360) * (Math.PI / 180));
        ctx.drawImage(sprites.bumper, -20, -20, 40, 40);
        ctx.restore();
        ctx.fillStyle = "#6FFF00";
        ctx.fillText("SLOWS YOU DOWN", 160, 416);

        ctx.save();
        ctx.translate(135, 460);
        ctx.rotate((frameno % 360) * (Math.PI / 180));
        ctx.drawImage(sprites.killer, -20, -20, 40, 40);
        ctx.restore();
        ctx.fillStyle = "#FF3105";
        ctx.fillText("CRUSHES YOUR SOUL", 160, 466);

        ctx.restore();
    };

    // main game event loop
    var STEP  = 1/60;
    var delta = 0;
    var last  = window.performance.now();
    var frame = function() {
        // render before update, since the event is "screen is ready"!
        if (game_over) {
            render_game_over();
        } else if (title_screen) {
            render_title_screen();
        } else {
            render();

            // update if necessary
            var now = window.performance.now();
            delta = delta = Math.min(1, (now - last) / 1000);
            while (delta > STEP) {
                delta = delta - STEP;
                update();
                last = now;
            }

            sounds.background.playbackRate = 2.0 - ramp(0.1, 1.4, 3, 200, player.r);
        }

        // recur
        requestAnimationFrame(frame);
    };

    var start_game = function() {
        game_over = false;
        title_screen = false;
        player = new_player();
        thingies = [];
        trailers = [];
        flares   = [];
        zoom = 1;
        frameno = 1;
        sounds.spawn.load();
        sounds.spawn.volume = 0.3;
        sounds.spawn.play();

        sounds.background.load();
        sounds.background.volume = 0.2;
        sounds.background.loop = true;
        sounds.background.play();
    };

    var keypress = function(e) {
        if (title_screen) {
            start_game();
        } else if (game_over) {
            game_over = false;
            title_screen = true;
        }
        return false;
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
    $(document).keypress(keypress);

    requestAnimationFrame(frame);
})(document.getElementById("neon-fall"));
