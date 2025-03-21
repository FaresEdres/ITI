<?php
require_once "../utils.php";

$headers = ["ID", "First Name", "Last Name", "Address", "Country", "Username", "Department"];
$tableData = [];

if (file_exists("customers.txt")) {
    $lines = file("customers.txt");
    
    foreach ($lines as $line) {
        $fields = explode(":", trim($line));
        
        $tableData[] = [
            $fields[0], // ID
            htmlspecialchars($fields[1]), // First Name
            htmlspecialchars($fields[2]), // Last Name
            htmlspecialchars($fields[3]), // Address
            htmlspecialchars($fields[4]), // Country
            htmlspecialchars($fields[5]), // Username
            htmlspecialchars($fields[7])  // Department
        ];
    }
}

echo '<div class="container mt-4">';
if (!empty($tableData)) {
    drawTable($headers, $tableData);
} else {
    echo '<div class="alert alert-warning">No registrations found</div>';
}
echo '</div>';