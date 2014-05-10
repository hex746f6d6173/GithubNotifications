var notify = function(data) {
    // Check for notification compatibility.
    if (!'Notification' in window) {
        // If the browser version is unsupported, remain silent.
        return;
    }
    // Log current permission level
    console.log(Notification.permission);
    // If the user has not been asked to grant or deny notifications
    // from this domain...
    if (Notification.permission === 'default') {
        Notification.requestPermission(function() {
            // ...callback this function once a permission level has been set.
            notify();
        });
    }
    // If the user has granted permission for this domain to send notifications...
    else if (Notification.permission === 'granted') {
        var n = new Notification(
            data.payload.title, {
                'body': data.id,
                // ...prevent duplicate notifications
                'tag': data.payload.id
            }
        );
        // Remove the notification from Notification Center when clicked.
        n.onclick = function() {
            this.close();
        };
        // Callback function when the notification is closed.
        n.onclose = function() {
            console.log('Notification closed');
        };
    }
    // If the user does not want notifications to come from this domain...
    else if (Notification.permission === 'denied') {
        // ...remain silent.
        return;
    }
};

var socket = io.connect('http://' + window.location.hostname);

socket.on('connect', function() {

    socket.emit("login");

    socket.on("config", function(data) {
        console.log("config", data);
        switch (data.status.status) {
            case "loggedOUT":

                $("#github_oauth_link").attr({
                    "href": data.status.authURL
                });
                break;

            case "loggedIN":

                $("#github_oauth").hide();
                $("#github_timeline").show();
                break;

        }
    });

    socket.on("user", function(data) {
        console.log("user", data);
        $(".user").html("<em>Welcome" + data.user.name + "</em>");
        socket.emit("getList");
    });

    socket.on("getListRes", function(data) {
        console.log("list", data);

        var html = "";

        data.forEach(function(item) {
            var string = "";
            var url = "";
            switch (item.payload.subject.type) {
                case "PullRequest":
                    url = "https://github.com/" + item.payload.repository.full_name + "/pulls";
                    string = "<strong>Pull Request!</strong><br>[" + item.payload.repository.name + "] " + item.payload.subject.title + "";
                    break;
            }

            if (string != "") {
                html = html + '<div class="well" id="' + item.id + '"><a href="' + url + '" target="_blank">' + string + '</a></div>';
            }
        });
        $("#notifications").html(html);
        $("#notifications .well a").unbind('click').click(function() {
            var id = $(this).parent().attr("id");
            socket.emit("seen", {
                id: id
            });
        });
    });

    socket.on("notification", function(data) {
        notify(data);
        console.log(data);
    });

    socket.on("updateNotification", function(data) {
        console.log("updateNotification", data);
    });

    socket.on("logout", function() {
        location.href = "/logout";
    });

});