<?php
require_once "../utils.php";

$formDataIssues = validatePostData($_POST);
$formErrors = $formDataIssues['errors'];
$oldData = $formDataIssues['data'];

    if(count($formErrors)) {


        $errors = json_encode($formErrors);
        $queryString ="errors={$errors}";
        $old_data = json_encode($oldData);
        if($old_data){
            $queryString .= "&old={$old_data}";
        }


        header("location:register.php?{$queryString}");
    }
// Process valid data
$userData = [
    generateID(),
    $oldData['firstName'],
    $oldData['lastName'],
    $oldData['address'],
    $oldData['country'],
    $oldData['gender'],
    implode(',', $oldData['skills']), // Convert array to string
    $oldData['username'],
    $oldData['password'],
    $oldData['department'],
];

$saved = appendDataToFile("customers.txt", implode(':', $userData) . PHP_EOL);

if ($saved) {
    header("Location: table.php");
} else {
 echo '<h1 class="mt-5 fw-bold text-danger">Contact your Admin </h1>';
}
exit;