<?php
require_once "../utils.php";

$errors = [];
$oldData = [];

if ($_SERVER["REQUEST_METHOD"] == "GET") {
    if (!empty($_GET['errors'])) {
        $errors = json_decode($_GET['errors'], true);
    }
    if (!empty($_GET['old'])) {
        $oldData = json_decode($_GET['old'], true);
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registration Form</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { background-color: #f8f9fa; }
        .form-container { background: white; border-radius: 15px; }
    </style>
</head>
<body class="py-5">
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-md-8 col-lg-6">
                <div class="form-container p-4 shadow">
                    <h2 class="mb-4 text-center text-primary">Registration Form</h2>

               

                    <form method="POST" action="save.php" class="needs-validation" novalidate>
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label for="firstName" class="form-label">First Name</label>
                                <input type="text" class="form-control" name="firstName" 
                                    value="<?= htmlspecialchars($oldData['firstName'] ?? '') ?>" required>
                                <div class="text-danger"><?= $errors['firstName'] ?? '' ?></div>
                            </div>
                            <div class="col-md-6">
                                <label for="lastName" class="form-label">Last Name</label>
                                <input type="text" class="form-control" name="lastName"
                                    value="<?= htmlspecialchars($oldData['lastName'] ?? '') ?>" required>
                                <div class="text-danger"><?= $errors['lastName'] ?? '' ?></div>
                            </div>
                        </div>

                        <div class="mb-3">
                            <label for="address" class="form-label">Address</label>
                            <textarea class="form-control" name="address" rows="3" required><?= htmlspecialchars($oldData['address'] ?? '') ?></textarea>
                            <div class="text-danger"><?= $errors['address'] ?? '' ?></div>
                        </div>

                        <div class="mb-3">
                            <label for="country" class="form-label">Country</label>
                            <select class="form-select" name="country" required>
                                <option value="">Select Country</option>
                                <?php $country = $oldData['country'] ?? ''; ?>
                                <option value="Egypt" <?= $country === 'Egypt' ? 'selected' : '' ?>>Egypt</option>
                                <option value="KSA" <?= $country === 'KSA' ? 'selected' : '' ?>>Saudi Arabia</option>
                                <option value="UAE" <?= $country === 'UAE' ? 'selected' : '' ?>>United Arab Emirates</option>
                            </select>
                            <div class="text-danger"><?= $errors['country'] ?? '' ?></div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Gender</label>
                            <div class="d-flex gap-4">
                                <?php $gender = $oldData['gender'] ?? ''; ?>
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="gender" id="male" 
                                        value="Male" required <?= $gender === 'Male' ? 'checked' : '' ?>>
                                    <label class="form-check-label" for="male">Male</label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="gender" id="female" 
                                        value="Female" <?= $gender === 'Female' ? 'checked' : '' ?>>
                                    <label class="form-check-label" for="female">Female</label>
                                </div>
                            </div>
                            <div class="text-danger"><?= $errors['gender'] ?? '' ?></div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Skills</label>
                            <div class="row g-2">
                                <?php $skills = $oldData['skills'] ?? []; ?>
                                <div class="col-6">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" name="skills[]" 
                                            value="PHP" id="php" <?= in_array('PHP', $skills) ? 'checked' : '' ?>>
                                        <label class="form-check-label" for="php">PHP</label>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" name="skills[]" 
                                            value="MySQL" id="mysql" <?= in_array('MySQL', $skills) ? 'checked' : '' ?>>
                                        <label class="form-check-label" for="mysql">MySQL</label>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" name="skills[]" 
                                            value="PostgreSQL" id="postgres" <?= in_array('PostgreSQL', $skills) ? 'checked' : '' ?>>
                                        <label class="form-check-label" for="postgres">PostgreSQL</label>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="form-check">
                                        <input class="form-check-input" type="checkbox" name="skills[]" 
                                            value="HTML" id="html" <?= in_array('HTML', $skills) ? 'checked' : '' ?>>
                                        <label class="form-check-label" for="html">HTML</label>
                                    </div>
                                </div>
                            </div>
                            <div class="text-danger"><?= $errors['skills'] ?? '' ?></div>
                        </div>

                        <div class="row mb-3">
                            <div class="col-md-6">
                                <label for="username" class="form-label">Username</label>
                                <input type="text" class="form-control" name="username" 
                                    value="<?= htmlspecialchars($oldData['username'] ?? '') ?>" required>
                                <div class="text-danger"><?= $errors['username'] ?? '' ?></div>
                            </div>
                            <div class="col-md-6">
                                <label for="password" class="form-label">Password</label>
                                <input type="password" class="form-control" name="password" required>
                                <div class="text-danger"><?= $errors['password'] ?? '' ?></div>
                            </div>
                        </div>

                        <div class="mb-4">
                            <label for="department" class="form-label">Department</label>
                            <input type="text" class="form-control" name="department" 
                                value="<?= htmlspecialchars($oldData['department'] ?? '') ?>" required>
                            <div class="text-danger"><?= $errors['department'] ?? '' ?></div>
                        </div>

                        <div class="mb-3">
                            <label for="captcha" class="form-label">Captcha (Enter X7Y9Z)</label>
                            <input type="text" class="form-control" name="captcha" required>
                            <div class="text-danger"><?= $errors['captcha'] ?? '' ?></div>
                        </div>

                        <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                            <button type="reset" class="btn btn-outline-secondary btn-lg">Clear</button>
                            <button type="submit" class="btn btn-primary btn-lg px-4">Register</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</body>
</html>