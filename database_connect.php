<?php
// Request method validation.
// We use GET since POST requests are blocked in University.
if (strcasecmp($_SERVER['REQUEST_METHOD'], 'GET') === 0) {
    //if (strcasecmp($_SERVER['REQUEST_METHOD'], 'POST') == 0) {

    if (!isset($_GET['dataRetrieval'])) {
        http_response_code(400);
        echo "400 Bad Request. Data retrieval not specified.";
        exit;
    }

    // Case where client wants to insert to database.
    if ($_GET['dataRetrieval'] === "false") {
        // JSON data from $_GET.
        $jsonData = $_GET['jsonData'];
        //$jsonData = trim(file_get_contents("php://input"));

        if (empty($jsonData)) {
            http_response_code(400);
            echo "400 Bad Request. No data.";
            exit;
        }

        $data = json_decode($jsonData, true);

        // Data validation.
        if ($data == null || !isset($data['username']) || !isset($data['region']) || !isset($data['city']) || !isset($data['country'])) {
            http_response_code(400);
            echo "400 Bad Request. Invalid data.";
            exit;
        }

        $username = $data['username'];
        $region = $data['region'];
        $city = $data['city'];
        $country = $data['country'];
        $req_address = $_SERVER['REMOTE_ADDR'];
        $req_time = time();
    } else {
        // If client wants to retrieve data, then username is required.
        if (!isset($_GET['username'])) {
            http_response_code(400);
            echo "400 Bad Request. Username not specified.";
            exit;
        }
        $username = $_GET['username'];
    }
}

// Database config.
$db_host = "dbserver.in.cs.ucy.ac.cy";
$db_username = "student";
$db_pass = "gtNgMF8pZyZq6l53";
$db = "epl425";

$conn = new mysqli($db_host, $db_username, $db_pass, $db);

if ($conn->connect_errno) {
    echo "Failed to connect to MySQL Database: $conn->connect_error";
    exit();
}

// Case where client wants to insert to database.
if ($_GET['dataRetrieval'] === "false") {
    # Query.
    // Prepared statement.
    $stmt = $conn->prepare("INSERT INTO requests(username, timestamp, address, region, city, country)
                         VALUES (?, ?, ?, ?, ?, ?)");

    $stmt->bind_param("sissss", $username, $req_time, $req_address, $region, $city, $country);

    // Successful insertion.
    if ($stmt->execute()) {
        http_response_code(201);
        echo "201 Created";
    }
    // Failed insertion.
    else {
        http_response_code(500);
        echo "500 Server Error";
    }
}

// Case where client wants to retrieve data from database.
else {
    // Retrieves 5 latest records from db for specified username. First row is latest one.
    $stmt = $conn->prepare("SELECT timestamp, region, city, country 
                            FROM requests 
                            WHERE username = ? 
                            ORDER BY timestamp DESC
                            LIMIT 5");
    $stmt->bind_param("s", $username);

    // Successful retrieval.
    if ($stmt->execute()) {
        http_response_code(200);
    }
    // Failed retrieval.
    else {
        http_response_code(500);
        echo "500 Server Error. Cound not retreive";
    }

    $result = $stmt->get_result();

    $data = [];

    # Appends 5 latest records in array. 1st row is latest record.
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }

    $stmt->close();

    header('Content-Type: application/json');
    echo json_encode($data);
}

$conn->close();
