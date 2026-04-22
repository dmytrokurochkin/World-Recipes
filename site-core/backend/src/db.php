<?php

declare(strict_types=1);

function getDbConnection(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dbPath = __DIR__ . '/../data/recipes.sqlite';
    $dbDir = dirname($dbPath);

    if (!is_dir($dbDir)) {
        mkdir($dbDir, 0775, true);
    }

    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // Run schema bootstrap on first connection to keep setup minimal.
    $initSql = file_get_contents(__DIR__ . '/../sql/init.sql');
    if ($initSql !== false) {
        $pdo->exec($initSql);
    }

    return $pdo;
}
