<?php

require_once "../utils.php";

$errors = [];
$skills = [];

$firstName = $lastName = $address = $country = $gender = $skills = $username = $password = $department = '';

$availableGenders = ["Male", "Female"];
$availableSkills = ["PHP", "MYSQL", "PostgreSQL", "HTML"];

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if (empty($_POST["firstName"])) {
        $errors[] = "First Name is required";
    } else {
        $firstName = htmlspecialchars(trim($_POST["firstName"]));
    }
    
    if (empty($_POST["lastName"])) {
        $errors[] = "Last Name is required";
    } else {
        $lastName = htmlspecialchars(trim($_POST["lastName"]));
    }
    
    if (empty($_POST["address"])) {
        $errors[] = "Address is required";
    } else {
        $address = htmlspecialchars(trim($_POST["address"]));
    }
    
    if (empty($_POST["country"])) {
        $errors[] = "Country is required";
    } else {
        $country = htmlspecialchars(trim($_POST["country"]));
    }
    
    if (empty($_POST["gender"]) || !in_array($_POST["gender"], $availableGenders)) {
        $errors[] = "Invalid gender selection";
    } else {
        $gender = htmlspecialchars(trim($_POST["gender"]));
    }
    
    if (!isset($_POST["skills"]) || !is_array($_POST["skills"])) {
        $errors[] = "Invalid skills selection";
    } else {
     $skills = array_map('htmlspecialchars', $_POST["skills"]);

    }
    
    if (empty($_POST["username"])) {
        $errors[] = "Username is required";
    } else {
        $username = htmlspecialchars(trim($_POST["username"]));
    }
    
    if (empty($_POST["password"])) {
        $errors[] = "Password is required";
    }
    
    if (empty($_POST["department"])) {
        $errors[] = "Department is required";
    } else {
        $department = htmlspecialchars(trim($_POST["department"]));
    }
}

if (!empty($errors)) {
    echo "<div class='alert alert-danger'><ul>";
    foreach ($errors as $error) {
        echo "<li>" . htmlspecialchars($error) . "</li>";
    }
    echo "</ul></div>";
    exit;
}
?>

<?php if ($_SERVER["REQUEST_METHOD"] == "POST" && empty($errors)) : ?>
<div id="resultCard" class="mt-4">
    <div class="card shadow">
        <div class="card-body">
            <h4 class="card-title">Submitted Data</h4>
            
            <p>Thanks 
                <?php echo ($gender == "Male") ? "Mr." : "Miss"; ?>
                <strong><?php echo $firstName . ' ' . $lastName; ?></strong>
            </p>
            
            <h3>Please Review Your Information</h3>

            <p><strong>Name:</strong> 
                <span><?php echo $firstName . ' ' . $lastName; ?></span>
            </p>

            <p><strong>Address:</strong> 
                <span><?php echo $address; ?></span>
            </p>
            
            <p><strong>Skills:</strong> 
                <span id="displaySkills"><?php echo implode(', ', $skills); ?></span>
            </p>

            <p><strong>Department:</strong> 
                <span id="displayDepartment"><?php echo $department;?></span>
            </p>
        </div>
    </div>
</div>
<?php endif; ?>
