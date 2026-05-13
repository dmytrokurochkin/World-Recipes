<?php

// Function to connect to the SQLite database
function getDbConnection() {
    $dbPath = __DIR__ . '/../data/recipes.sqlite';
    $dbDir = dirname($dbPath);

    // Create the data folder if it doesn't exist
    if (!is_dir($dbDir)) {
        mkdir($dbDir, 0777, true);
    }

    // Connect to the SQLite database
    $pdo = new PDO('sqlite:' . $dbPath);
    
    // Show errors and fetch associative arrays
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // Run the SQL script to create tables
    $initSql = file_get_contents(__DIR__ . '/../sql/init.sql');
    if ($initSql) {
        $pdo->exec($initSql);
    }

    return $pdo;
}
