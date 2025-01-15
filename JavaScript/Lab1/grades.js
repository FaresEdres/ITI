function grades() {
  var name = prompt("Insert your name");
  var gradesList;
  var isValid;
  var grades;
  do {
    grades = prompt("Insert your grades");
    isValid = true;
    gradesList = grades.split(",");
    if (gradesList.length == 4) {
      for (var i = 0; i < gradesList.length; i++) {
        if (isNaN(Number(gradesList[i]))) {
          isValid = false;
          alert("Insert integer values only");
          break;
        }
      }
    } else {
      alert("Insert 4 integer values");
      isValid = false;
    }
  } while (!isValid);

  console.log(`Hello, ${name}`);

  var gradesSum = gradesList.reduce(function (total, curr) {
    return Number(curr) + total;
  }, 0);
  var gradesAvg = gradesSum / gradesList.length;
  var course1 = { name: "English", grade: gradesList[0] };
  var course2 = { name: "French", grade: gradesList[1] };
  var course3 = { name: "Physics", grade: gradesList[2] };
  var course4 = { name: "Chemistry", grade: gradesList[3] };
  var averageCourses = { Average: gradesAvg };
  console.table([course1, course2, course3, course4, averageCourses]);
}

grades();
