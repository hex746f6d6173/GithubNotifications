var red = "red",
    green = "rgb(27,242,0)",
    orange = "orange";

function plot() {

    var now = new Date().getTime();

    var bound = parseInt($("#bounds").val());

    var min = new Date(now).setHours(new Date(now).getHours() + bound);

    console.log(now, min);

    $.getJSON("/api/temps", function(d) {
        $.plot("#plot", [d], {
            xaxis: {
                mode: "time",
                min: min,
                max: now
            },
            series: {
                lines: {
                    show: true
                },
                points: {
                    show: true
                }
            }
        });
    });
    $.getJSON("/api/totalGraph", function(d) {
        $.plot("#his", d, {
            xaxis: {
                mode: "time",
                min: min,
                max: now
            },
            series: {
                lines: {
                    show: true
                },
                points: {
                    show: true
                }
            }
        });
    });
    $.getJSON("/api/lights", function(d) {
        $.plot("#lLights", [d], {
            xaxis: {
                mode: "time",
                min: min,
                max: now
            },
            series: {
                lines: {
                    show: true
                },
                points: {
                    show: true
                }
            }
        });
    });
}
$(document).ready(function() {

    $("#bounds").change(function() {
        plot();
    });

    var socket = io.connect('http://' + window.location.hostname);

    socket.on('connect', function() {

        $(".connection").html('<i class="glyphicon glyphicon-ok" style="color:' + green + ';"></i>');

        if (localStorage.me === undefined || localStorage.me === "") {

            var name = prompt("Geef mij een naam");
            localStorage.me = name;
            socket.emit("me", name);


        } else {
            socket.emit("me", localStorage.me);
        }

    });
    socket.on('refreshE', function(data) {
        console.log('refreshE', data);
        if (data.event === "restart") {
            setTimeout(function() {
                window.location.reload();
            }, 10000);
        }
    })
    socket.on('connecting', function() {

        $(".connection").html('<i class="glyphicon glyphicon-minus"></i>');
        $(".ssh").html('');
    });

    socket.on('connect_failed', function() {

        $(".connection").html('<i class="glyphicon glyphicon-remove" style="color:' + red + ';"></i>');
        $(".ssh").html('');
    });

    socket.on('disconnect', function() {

        $(".connection").html('<i class="glyphicon glyphicon-remove" style="color:' + red + ';"></i>');
        $(".ssh").html('');
    });


    socket.on('switches', function(data) {
        var html = "<div class=\"row\">";
        $.each(data, function(x, y) {
            var color = red;
            if (y.state === 1) {
                color = green;
            }

            html += '<div class="col-md-3"><a class="switch well" id="switch-' + x + '" style="background:' + color + '"><h3><span class="' + y.icon + '"></span> ' + y.name + '</h3></a></div>';
        });

        $(".switches").html(html + "</div>");

        $(".switch").each(function() {
            $(this).click(function(e) {
                e.preventDefault();
                $(this).css({
                    "background": orange
                });
                socket.emit("switch", {
                    id: $(this).attr("id").replace("switch-", "")
                });
            });
        });

        localStorage.setItem("switches", JSON.stringify(data));

    });

    socket.on("clients", function(data) {
        data = JSON.parse(data);
        console.log(data);

        var html = "";
        $.each(data, function(x, y) {
            var color = red;
            if (y === true) {
                color = green;
            }
            if (x != "" && x != null)
                html += '<span class="device well" id="device-' + x + '" style="background:' + color + '">' + x + '</span>';
        });

        $(".clients").html(html);
        localStorage.setItem("clients", JSON.stringify(data));
    });

    socket.on("devices", function(data) {
        console.log(data);

        var html = "";
        $.each(data, function(x, y) {
            var color = red;
            if (y.state === 1) {
                color = green;
            }

            html += '<span class="device well" id="device-' + x + '" style="background:' + color + '"><span class="' + y.icon + '"></span> ' + y.name + '</span>';
        });

        $(".devices").html(html);
        localStorage.setItem("devices", JSON.stringify(data));
    });

    socket.on("deviceChange", function(data) {
        console.log(data);
        var color = red;
        if (data.state === 1) {
            color = green;
        }

        $("#device-" + data.id).css({
            "background": color
        });
    });
    var alarmArm = 0;
    socket.on("alarmArm", function(data) {

        console.log("alarmArm", data);

        var color = red;
        if (data === 1) {
            color = green;
        }

        alarmArm = data;

        $(".alarm").css({
            background: color
        });

    });

    $(".alarm").click(function() {
        if (alarmArm === 1) {
            setA = 0;
        } else {
            setA = 1;
        }
        socket.emit("setAlarm", setA);
    });

    var triggerArm = 0;
    socket.on("triggerArm", function(data) {

        console.log("triggerArm", data);

        var color = red;
        if (data === 1) {
            color = green;
        }

        triggerArm = data;

        $(".trigger").css({
            background: color
        });

    });

    $(".trigger").click(function() {
        if (triggerArm === 1) {
            setT = 0;
        } else {
            setT = 1;
        }
        console.log("Set trigger", setT);
        socket.emit("setTrigger", setT);
    });

    socket.on("switched", function(data) {

        console.log("SWITCH", data);

        var color = red;
        if (data.
            switch.state === 1) {
            color = green;
        }

        $("#switch-" + data.id).css({
            "background": color
        });

    });

    socket.on("log", function(data) {
        console.log("LOG", data);

        var log = "";
        var i = 0;

        $.each(data, function(x, y) {
            log = '<p class="l">' + jQuery.timeago(new Date(y.time)) + ': ' + y.action + '</p>' + log;
        });

        $(".log").html(log);

    });

    socket.on("logAdd", function(y) {
        console.log("logAdd", y);
        $(".log").prepend('<p class="l">' + jQuery.timeago(new Date(y.time)) + ': ' + y.action + '</p>');
    });
    socket.on("state", function(data) {

        if (data.ssh) {

            $(".ssh").html('<i class="glyphicon glyphicon-ok" style="color:' + green + ';"></i>');

        } else {
            $(".ssh").html('<i class="glyphicon glyphicon-remove" style="color:' + red + ';"></i>');
        }

    });

    socket.on('temp', function(data) {
        console.log("TEMP", data);

        $(".temp").html(data);

    });

    socket.on('lightsLume', function(data) {
        console.log("lightsLume", data);

        $(".lightsLume").html(data);

    });

    $(".refresh").click(function() {
        socket.emit("refresh", true);
    });
    plot();
    setTimeout(function() {
        plot();
    }, 10000);
});