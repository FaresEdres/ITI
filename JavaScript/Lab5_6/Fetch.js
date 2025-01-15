/*
2 - Use fetch method with url https://jsonplaceholder.typicode.com/users
To get data asynchronously from the API and display the Result on HTML
table
- Display the following Coulmns in table
    - UserName
    - email
    - Company Name
    - Address geo (address GeoLocation)
    - show users posts’ titles as ul list in this column
        ,,and show how many comments are made by each post. /posts /comments

*/
const userColumns = 5;
const username = document.getElementById("username");
const email = document.getElementById("email");
const companyName = document.getElementById("company-name");
const userAddress = document.getElementById("address");
const activity = document.getElementById("activity");
const content = document.getElementById("content");
async function fetchData() {
  const usersAPI = "https://jsonplaceholder.typicode.com/users";
  const postsAPI = "https://jsonplaceholder.typicode.com/posts";
  const commentsAPI = "https://jsonplaceholder.typicode.com/comments";

  try {
    const usersResponse = await fetch(usersAPI);
    const postsResponse = await fetch(postsAPI);
    const commentsResponse = await fetch(commentsAPI);

    if (!usersResponse.ok) {
      throw new Error(`usersResponse Status: ${usersResponse.status}`);
    }
    if (!postsResponse) {
      throw new Error(`postsResponse Status: ${postsResponse.status}`);
    }
    if (!commentsResponse) {
      throw new Error(`commentsResponse Status: ${commentsResponse.status}`);
    }

    const usersData = await usersResponse.json();
    const postsData = await postsResponse.json();
    const commentsData = await commentsResponse.json();
    //no autocomplete?
    usersData.forEach((user) => {
      const newRow = document.createElement("tr");

      const userId = document.createElement("td");
      const userIdText = document.createTextNode(`${user.id}`);
      userId.appendChild(userIdText);
      newRow.appendChild(userId);

      const userEmail = document.createElement("td");
      const userEmailText = document.createTextNode(`${user.email}`);
      userEmail.appendChild(userEmailText);
      newRow.appendChild(userEmail);

      const userCompanyName = document.createElement("td");
      const userCompanyNameText = document.createTextNode(
        `${user.company.name}`
      );
      userCompanyName.appendChild(userCompanyNameText);
      newRow.appendChild(userCompanyName);

      const userAddress = document.createElement("td");
      const userAddressText = document.createTextNode(
        `Lat=${user.address.geo.lat}  Lng=${user.address.geo.lng} `
      );
      userAddress.appendChild(userAddressText);
      newRow.appendChild(userAddress);

      const postsCategory = document.createElement("td");
      const postsList = document.createElement("ul");
      const postTitle = document.createElement("li");
      const id = user.id;

      const userPosts = postsData
        .filter((post) => post.userId == id)
        .forEach(function (post) {
          let count = 0;
          commentsData.filter(function (comment) {
            if (comment.postId == post.userId) {
              count++;
            }
          });
          const postTitle = document.createElement("li");
          const postText = document.createTextNode(`${post.title}`);
          const commentSection = document.createElement("li");
          const commentText = document.createTextNode(
            `number of comments:${count}`
          );
          postTitle.appendChild(postText);
          commentSection.appendChild(commentText);

          postTitle.appendChild(commentSection);
          postsList.appendChild(postTitle);
        });

      console.log(postsList);
      postsCategory.appendChild(postsList);
      newRow.appendChild(postsCategory);
      content.appendChild(newRow);
    });
  } catch (e) {
    console.error(e.message);
  }
}
fetchData();
