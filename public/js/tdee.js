"use strict";

const tdeeForm = document.querySelector("#tdeeForm");
const errorContainer = document.querySelector("#errorContainer");

async function logTDEE (event) {
    event.preventDefault();
    const weight = document.querySelector("#weight").value;
    
    try {
        const response = await fetch("https://topperformance.me/counter", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({weight})
        });

        console.log(response);

        if (response.ok){
            tdeeForm.submit();
        } else if (response.status === 400){
            try{
                const errors = await response.json();

                errorContainer.classList.remove("hidden");
                const errorMessage = errorContainer.querySelector("#errorMessage");
                errorMessage.textContent = errors;
            } catch (err) {
                console.error(err);
                errorContainer.classList.remove("hidden");
                const errorMessage = errorContainer.querySelector("#errorMessage");
                errorMessage.textContent = "Could not calculate";
            }
        } else if (response.status === 500) {
            errorContainer.classList.remove("hidden");
            const errorMessage = errorContainer.querySelector("#errorMessage");
            errorMessage.textContent = "Could not calculate";
        } else {
            errorContainer.classList.remove("hidden");
            const errorMessage = errorContainer.querySelector("#errorMessage");
            errorMessage.textContent = "Could not calculate";
        }
        
    } catch (err) {
        console.error(err);
        errorContainer.classList.remove("hidden");
        const errorMessage = errorContainer.querySelector("#errorMessage");
        errorMessage.textContent = "Could not parse here";
    }
    
    return false;
}


function show() {
    errorContainer.classList.add("hidden");
}


tdeeForm.addEventListener('submit', logTDEE);

function toggle(value) {
    const male = document.querySelector(".male");
    const female = document.querySelector(".female");

    //if female, hide male select
    if (value === "1"){
        console.log("female" + value);
        female.style.display = 'block'
        male.style.display = 'none';
    } else {
        console.log("male" + value);
        male.style.display = 'block';
        female.style.display = 'none';
    }
}

