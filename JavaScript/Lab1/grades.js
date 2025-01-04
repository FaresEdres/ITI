function grades(){
    var name=prompt("Insert your name");
    var grades=prompt("Insert your grades");
    console.log(`Hello, ${name}`);
    const gradesList=grades.split(",");
    const gradesSum=gradesList.reduce((total,curr)=>Number(curr)+total,0);
    const gradesAvg=gradesSum/gradesList.length;
    var course1={name:"English",grade:gradesList[0]};
    var course2={name:"French",grade:gradesList[1]};
    var course3={name:"Physics",grade:gradesList[2]};
    var course4={name:"Chemistry",grade:gradesList[3]};
    var averageCourses={Average:gradesAvg};
console.table([course1,course2,course3,course4,averageCourses]);

}


grades();