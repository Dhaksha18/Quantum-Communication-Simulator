// API URL (Render backend)
const API_URL = "https://quantum-communication-simulator.onrender.com/simulate";


// Get elements
const distanceSlider = document.getElementById("distance");
const repeatersSlider = document.getElementById("repeaters");
const speedSlider = document.getElementById("speedControl");
const eveCheckbox = document.getElementById("eve");

const distVal = document.getElementById("distVal");
const repVal = document.getElementById("repVal");
const speedVal = document.getElementById("speedVal");

const statusText = document.getElementById("status");
const liveQBERText = document.getElementById("liveQBER");
const securityAlert = document.getElementById("securityAlert");

const keyLength = document.getElementById("keyLength");
const qberValue = document.getElementById("qberValue");
const fidelityValue = document.getElementById("fidelityValue");
const eveStatus = document.getElementById("eveStatus");

// Slider updates
distanceSlider.oninput = () => distVal.innerText = distanceSlider.value;
repeatersSlider.oninput = () => repVal.innerText = repeatersSlider.value;
speedSlider.oninput = () => speedVal.innerText = speedSlider.value;

// Chart setup
let distances = [];
let qberData = [];

const chart = new Chart(document.getElementById("qberChart"), {
    type: "line",
    data: {
        labels: distances,
        datasets: [{
            label: "QBER",
            data: qberData,
            borderWidth: 2,
            tension: 0.2
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                min: 0,
                max: 1
            }
        }
    }
});

// Animation setup
const canvas = document.getElementById("networkCanvas");
const ctx = canvas.getContext("2d");

let qubits = [];
let animationRunning = false;

// Noise model
function getNoiseProbability(distance, repeaters, eve) {
    let noise = Math.min(distance * 0.002, 0.25);
    if (eve) noise += 0.05;
    if (repeaters > 0) noise *= (1 / (repeaters + 1));
    return noise;
}

// Create qubits
function createQubits(distance, repeaters, eve) {
    qubits = [];
    let noiseProb = getNoiseProbability(distance, repeaters, eve);

    for (let i = 0; i < 15; i++) {
        qubits.push({
            x: 60,
            y: 50 + Math.random() * 50,
            noisy: Math.random() < noiseProb
        });
    }
}

// Live QBER calculation
function updateLiveQBER() {
    if (qubits.length === 0) return;

    let noisy = qubits.filter(q => q.noisy).length;
    let qber = noisy / qubits.length;
    liveQBERText.innerText = qber.toFixed(3);

    if (qber > 0.11) {
        securityAlert.style.display = "block";
    }
}

// Draw network animation
function drawNetwork(eve, repeaters) {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Alice
    ctx.fillText("Alice", 40, 20);
    ctx.beginPath();
    ctx.arc(60, 75, 15, 0, Math.PI * 2);
    ctx.fill();

    // Bob
    ctx.fillText("Bob", 620, 20);
    ctx.beginPath();
    ctx.arc(640, 75, 15, 0, Math.PI * 2);
    ctx.fill();

    // Eve
    if (eve) {
        ctx.fillText("Eve", 330, 20);
        ctx.beginPath();
        ctx.arc(350, 75, 12, 0, Math.PI * 2);
        ctx.fill();
    }

    // Repeaters
    for (let i = 1; i <= repeaters; i++) {
        let x = 60 + i * 100;
        ctx.fillText("R", x - 5, 20);
        ctx.beginPath();
        ctx.arc(x, 75, 10, 0, Math.PI * 2);
        ctx.fill();
    }

    let speed = parseFloat(speedSlider.value);

    qubits.forEach(q => {
        q.x += speed;
        if (q.x > 640) q.x = 60;

        ctx.beginPath();
        ctx.fillStyle = q.noisy ? "red" : "green";
        ctx.arc(q.x, q.y, 4, 0, Math.PI * 2);
        ctx.fill();
    });

    updateLiveQBER();

    if (animationRunning) {
        requestAnimationFrame(() => drawNetwork(eve, repeaters));
    }
}

// Run simulation
function runSimulation() {

    statusText.innerText = "Running...";
    securityAlert.style.display = "none";
    liveQBERText.innerText = "0.00";

    const d = parseInt(distanceSlider.value);
    const r = parseInt(repeatersSlider.value);
    const eve = eveCheckbox.checked;

    createQubits(d, r, eve);

    animationRunning = true;
    drawNetwork(eve, r);

    fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            qubits: 100,
            distance: d,
            repeaters: r,
            eve: eve
        })
    })
    .then(res => res.json())
    .then(data => {

        keyLength.innerText = data.final_key_length;
        qberValue.innerText = data.qber;
        fidelityValue.innerText = data.fidelity;
        eveStatus.innerText = data.eve_detected ? "Detected" : "Not Detected";

        if (data.eve_detected) {
            securityAlert.style.display = "block";
        }

        distances.push(d);
        qberData.push(data.qber);
        chart.update();

        statusText.innerText = "Simulation Complete";
        animationRunning = false;
    })
    .catch(err => {
        console.error(err);
        statusText.innerText = "Backend Error";
        animationRunning = false;
    });
}
