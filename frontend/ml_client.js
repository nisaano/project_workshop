async function sendToML(text) {
    const response = await fetch("http://localhost:8000/ml/process", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ text })
    });

    const data = await response.json();
    return data.result;
}

document.getElementById("btn").onclick = async () => {
    const input = document.getElementById("text").value;
    const result = await sendToML(input);
    document.getElementById("output").innerText = result;
};
