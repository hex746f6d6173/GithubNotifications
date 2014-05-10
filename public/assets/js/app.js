var notify = function(title, body, id) {
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
            title, {
                'body': body,
                // ...prevent duplicate notifications
                'tag': id
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
$(document).ready(function() {
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
            $(".user").html("<em>Welcome " + data.user.login + "</em>");
            socket.emit("getList");
        });

        socket.on("getListRes", function(data) {
            console.log("list", data);

            var html = "",
                count = 0;

            data.forEach(function(item) {
                var string = "",
                    url = "",
                    classString = "well";
                switch (item.payload.subject.type) {
                    case "PullRequest":
                        classString += item.seen ? " seen well-sm" : " unseen";

                        if (!item.seen)
                            count++;
                        var pullLink = item.payload.subject.url.split('/');
                        var pullID = pullLink[pullLink.length - 1];
                        url = "https://github.com/" + item.payload.repository.full_name + "/pull/" + pullID;
                        string = "New Pull Request!<br>[" + item.payload.repository.name + "] " + item.payload.subject.title + "";
                        break;

                    case "Issue":
                        classString += item.seen ? " seen well-sm" : " unseen";

                        if (!item.seen)
                            count++;
                        var issueLink = item.payload.subject.url.split('/');
                        var issueID = issueLink[issueLink.length - 1];
                        url = "https://github.com/" + item.payload.repository.full_name + "/issues/" + issueID;
                        string = "New Issue!<br>[" + item.payload.repository.name + "] " + item.payload.subject.title + "";
                        break;
                }

                if (string != "") {
                    html = html + '<div class="' + classString + '" id="' + item.id + '"><a href="' + url + '" target="_blank">' + string + '</a></div>';
                }
            });
            if (data.length === 0) {
                html = "<h2>Hmm, you don't have notifications (jet)!</h2>";
            }
            $("#notifications").html(html);
            $("#counter").html((count == 0) ? "" : count);
            document.title = (count == 0) ? "" : " (" + count + ")";
            $("#notifications .well a").unbind('click').click(function() {
                var id = $(this).parent().attr("id");
                socket.emit("seen", {
                    id: id
                });
            });
        });

        socket.on("notification", function(data) {
            var title = "",
                id = data.id,
                message = "";
            switch (data.payload.subject.type) {
                case "PullRequest":
                    title = "New Pull Request!";
                    message = "" + data.payload.repository.name + ": " + data.payload.subject.title + "";
                    break;

                case "Issue":
                    title = "New Issue!";
                    message = "" + data.payload.repository.name + ": " + data.payload.subject.title + "";
                    break;
            }
            notify(title, message, id);
        });

        socket.on("updateNotification", function(data) {
            console.log("updateNotification", data);
        });

        socket.on("logout", function() {
            location.href = "/logout";
        });

    });
});