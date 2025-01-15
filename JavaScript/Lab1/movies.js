function copyMovies(movies) {
  var newMovies = [];
  movies.forEach(function (movie) {
    newMovies.push(movie);
  });
  // movies.slice()
  return newMovies;
}
function printLastMovie(newMovies) {
  console.log(newMovies[newMovies.length - 1]);
  console.log(newMovies.at(-1));
  console.log(newMovies.slice(-1));

  var temp = newMovies.pop();
  newMovies.push(temp);
  console.log(temp);
}
function getThirdMovie(newMovies) {
  //newMovies[2]="Venom";
  console.log(newMovies);
  newMovies.splice(2, 1, "Venom");
  console.log(newMovies);
}
function removeFirstMovie(newMovies) {
  newMovies.shift("SpiderMan");
  console.log(newMovies);
}

function movieFunction(movie) {
  var newMovies = copyMovies(movies);
  printLastMovie(newMovies);
  getThirdMovie(newMovies);
  removeFirstMovie(newMovies);
}
var movies = ["Interstellar", "Inception", "The Hobbit"];
movieFunction(movies);
