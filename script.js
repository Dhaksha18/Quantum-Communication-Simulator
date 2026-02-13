// API URL
const API_URL = "https://quantum-communication-simulator.onrender.com/simulate";

// Elements
const distanceSlider = document.getElementById("distance");
const repeatersSlider = document.getElementById("repeaters");
const speedSlider = document.getElementById("speedControl");
const eveCheckbox = document.getElementById("eve");
const comparisonModeCheckbox = document.getElementById("comparisonMode");

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
const keyRateText = document.getElementById("keyRate");
const historyList = document.getElementById("historyList");

const securityBanner = document.getElementById("securityStatus");
const channelLossText = document.getElementById("channelLoss");

// Sliders
distanceSlider.oninput = () => distVal.innerText = distanceSlider.value;
repeatersSlider.oninput = () => repVal.innerText = repeatersSlider.value;
speedSlider.oninput = () => speedVal.innerText = speedSlider.value;

// Graph
let distances = [];
let qberData = [];
let qberDataEve = [];

const chart = new Chart(document.getElementById("qberChart"), {
    type: "line",
    data: {
        labels: distances,
        datasets: [
            {
                label: "QBER Normal",
                data: qberData,
                borderWidth: 2,
                tension: 0.2
            },
            {
                label: "QBER Eve",
                data: qberDataEve,
                borderWidth: 2,
                tension: 0.2
            }
        ]
    },
    options: {
        responsive: true,
        scales: { y: { min: 0, max: 1 } }
    }
});

// Canvas setup
const canvas = document.getElementById("networkCanvas");
const ctx = canvas.getContext("2d");

const topoCanvas = document.getElementById("topologyCanvas");
const topoCtx = topoCanvas.getContext("2d");

let qubits = [];
let photons = [];
let animationRunning = false;
let currentDistance = 10;
let currentRepeaters = 0;
let currentEve = false;

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

// Create photons
function createPhotons(distance, repeaters, eve) {
    photons = [];
    let noiseProb = getNoiseProbability(distance, repeaters, eve);

    for (let i = 0; i < 12; i++) {
        photons.push({
            x: 80,
            y: 60,
            noisy: Math.random() < noiseProb,
            speed: 1 + Math.random() * 2
        });
    }
}

// Live QBER
function updateLiveQBER() {
    if (qubits.length === 0) return;

    let noisy = qubits.filter(q => q.noisy).length;
    let qber = noisy / qubits.length;
    liveQBERText.innerText = qber.toFixed(3);

    if (qber > 0.11) securityAlert.style.display = "block";
}

// Topology drawing
function getLinkColor(noise) {
    if (noise < 0.05) return "#22c55e";
    if (noise < 0.11) return "#eab308";
    return "#ef4444";
}

function drawTopology(distance, repeaters, eve) {

    topoCtx.clearRect(0, 0, topoCanvas.width, topoCanvas.height);

    let noise = getNoiseProbability(distance, repeaters, eve);
    let color = getLinkColor(noise);

    topoCtx.strokeStyle = color;
    topoCtx.lineWidth = 4 + Math.sin(Date.now() / 200) * 1.5;

    topoCtx.beginPath();
    topoCtx.moveTo(80, 60);
    topoCtx.lineTo(620, 60);
    topoCtx.stroke();

    topoCtx.fillText("Alice", 60, 40);
    topoCtx.fillText("Bob", 600, 40);

    // Photons
    photons.forEach(p => {
        p.x += p.speed;
        if (p.x > 620) p.x = 80;

        topoCtx.beginPath();
        topoCtx.fillStyle = p.noisy ? "#ef4444" : "#22c55e";
        topoCtx.arc(p.x, p.y, 4, 0, Math.PI * 2);
        topoCtx.fill();
    });
}

// Network animation
function drawNetwork() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillText("Alice", 40, 20);
    ctx.beginPath(); ctx.arc(60, 75, 15, 0, Math.PI * 2); ctx.fill();

    ctx.fillText("Bob", 620, 20);
    ctx.beginPath(); ctx.arc(640, 75, 15, 0, Math.PI * 2); ctx.fill();

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
    drawTopology(currentDistance, currentRepeaters, currentEve);

    if (animationRunning) requestAnimationFrame(drawNetwork);
}

// Run simulation
function runSimulation() {

    statusText.innerText = "Running sweep...";
    securityAlert.style.display = "none";

    distances.length = 0;
    qberData.length = 0;
    qberDataEve.length = 0;
    chart.update();

    const r = parseInt(repeatersSlider.value);
    const comparisonMode = comparisonModeCheckbox.checked;

    let sweep = [10,20,30,40,50,60,70,80,90,100];
    let index = 0;

    function runNext() {

        if (index >= sweep.length) {
            statusText.innerText = "Simulation Complete";
            animationRunning = false;
            return;
        }

        let d = sweep[index];

        currentDistance = d;
        currentRepeaters = r;
        currentEve = false;

        createQubits(d, r, false);
        createPhotons(d, r, false);

        animationRunning = true;
        drawNetwork();

        fetch(API_URL,{
            method:"POST",
            headers:{"Content-Type":"application/json"},
            body:JSON.stringify({
                qubits:100,
                distance:d,
                repeaters:r,
                eve:false
            })
        })
        .then(res=>res.json())
        .then(normalData=>{

            distances.push(d);
            qberData.push(normalData.qber);

            keyLength.innerText = normalData.final_key_length;
            qberValue.innerText = normalData.qber;
            fidelityValue.innerText = normalData.fidelity;
            eveStatus.innerText = normalData.eve_detected ? "Detected" : "Not Detected";

            if (keyRateText) keyRateText.innerText = normalData.key_rate;
            if (channelLossText) channelLossText.innerText = normalData.channel_loss;

            // Security banner
            if (securityBanner) {
                if (normalData.secure) {
                    securityBanner.className = "security-banner secure";
                    securityBanner.innerText = "Network Status: Secure";
                } else {
                    securityBanner.className = "security-banner compromised";
                    securityBanner.innerText = "Network Status: Compromised";
                }
            }

            if (comparisonMode) {
                fetch(API_URL,{
                    method:"POST",
                    headers:{"Content-Type":"application/json"},
                    body:JSON.stringify({
                        qubits:100,
                        distance:d,
                        repeaters:r,
                        eve:true
                    })
                })
                .then(res=>res.json())
                .then(eveData=>{
                    qberDataEve.push(eveData.qber);
                    chart.update();
                    addHistory(d, normalData.qber, eveData.qber);
                    index++;
                    setTimeout(runNext,700);
                });

            } else {
                qberDataEve.push(null);
                chart.update();
                addHistory(d, normalData.qber, null);
                index++;
                setTimeout(runNext,700);
            }
        });
    }

    runNext();
}

// History
function addHistory(distance, qberNormal, qberEve){
    if (!historyList) return;

    let li = document.createElement("li");

    if (qberEve !== null) {
        li.innerText = `Distance: ${distance} km | QBER Normal: ${qberNormal} | QBER Eve: ${qberEve}`;
    } else {
        li.innerText = `Distance: ${distance} km | QBER: ${qberNormal}`;
    }

    historyList.appendChild(li);
}

// Export CSV
function exportResults(){
    let csv="Distance,QBER_Normal,QBER_Eve\n";
    for(let i=0;i<distances.length;i++){
        csv+=distances[i]+","+qberData[i]+","+qberDataEve[i]+"\n";
    }

    let blob=new Blob([csv],{type:"text/csv"});
    let link=document.createElement("a");
    link.href=URL.createObjectURL(blob);
    link.download="results.csv";
    link.click();
}

// Dark mode toggle
const darkToggle = document.getElementById("darkToggle");
if(darkToggle){
    darkToggle.addEventListener("change", function(){
        document.body.classList.toggle("dark-mode");
    });
}
