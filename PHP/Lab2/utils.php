<?php
ini_set('display_startup_errors',1);
ini_set('display_errors', 1);
error_reporting(-1);


echo '<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>';

function generateTitle($title, $color = 'black', $size = 1) {
    echo "<hr>";
    echo "<h{$size} style='color:{$color}' class='text-center'> {$title} </h{$size}>";
}


function appendDataToFile($fileName, $data) {
    $file = fopen($fileName, "a");
    if ($file) {
        fwrite($file, $data);
        fclose($file);
        return true;
    }
    return false;
}

function drawTable($header, $tableData) {

    echo '<div class="table-responsive">
        <table class="table table-hover table-bordered align-middle">
            <thead class="table-dark">
            <tr>';
    foreach ($header as $value) {
        echo "<th>$value</th>";
    }
    echo "</tr></thead><tbody>";

    foreach ($tableData as $row) {
        echo "<tr>";
        foreach ($row as  $field) {
            echo "<td>{$field}</td>";
        }
        echo "</tr>";
    }

    echo "</tbody></table></div> </div>";
}

function generateID() {
        if(file_exists("ids.txt")){
        // read id in ids.txt
        $id=  file_get_contents("ids.txt");
        $id = (int)$id + 1;
        // increment +1
    }else{
        $id  =1 ;
    }
    // save incremented in the ids.txt
    file_put_contents("ids.txt", $id);
    // return with id
    return $id;
}
function validatePostData($post) {
    $errors = [];
    $data = [];
    $required = [
        'firstName', 'lastName', 'address', 'country',
        'gender', 'username', 'password', 'department',
        'captcha'
    ];
    $validGenders = ["Male", "Female"];
    $validSkills = ['PHP', 'MySQL', 'PostgreSQL', 'HTML'];
    $correctCaptcha = 'X7Y9Z';

    foreach ($required as $field) {
        if (empty($post[$field])) {
            $errors[$field] = "This field is required";
        }
    }

    if (!empty($post['gender']) && !in_array($post['gender'], $validGenders)) {
        $errors['gender'] = "Invalid gender selection";
    }

    if (empty($post['skills'])) {
        $errors['skills'] = "At least one skill is required";
    } else {
        foreach ($post['skills'] as $skill) {
            if (!in_array($skill, $validSkills)) {
                $errors['skills'] = "Invalid skill selected";
                break;
            }
        }
    }

    if (!isset($post['captcha']) || $post['captcha'] !== $correctCaptcha) {
        $errors['captcha'] = "Incorrect CAPTCHA";
    }

    foreach ($post as $key => $value) {
        if (is_array($value)) {
            $data[$key] = array_map('trim', $value);
        } else {
            $data[$key] = trim($value);
        }
    }

    return ['errors' => $errors, 'data' => $data];
}