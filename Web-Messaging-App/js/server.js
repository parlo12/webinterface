$(document).ready(function() {
    $("form").submit(function(event) {
        event.preventDefault(); 

        const username = $("input[name='user']").val();
        const password = $("input[name='password']").val();

        const payload = {
            email: username, 
            password: password
        };

        $.ajax({
            url: "http://68.183.112.242/api/login", 
            method: "POST",
            data: JSON.stringify(payload),
            contentType: "application/json",
            success: function(response) {
                console.log("Login successful:", response);

                // Store the access token with the "Bearer" prefix
                const accessToken = "Bearer " + response.access_token; 
                const userId = response.user.id;
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('userId', userId);

                // Redirect or update the UI as needed
                window.location.href = "conversation.html"; 
            },
            error: function(xhr, status, error) {
                console.error("Login failed:", error);
                alert("Invalid username or password.");
            }
        });
    });
});
