"use strict";

const commentForm = document.querySelector("#commentForm");
const errorContainer = document.querySelector("#errorContainer");

async function subComment(event){
    event.preventDefault();
    
    const commentText = document.querySelector("#commentinput").value;
    console.log("here ");
    let url = new URL(`http://localhost:8000/posts/${postid}/comments`);
    const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({commentText})
        });
    console.log(url + response);
    if (response.ok){
        event.submit();
    }
    return false;
}
// commentForm.addEventListener('submit', subComment);