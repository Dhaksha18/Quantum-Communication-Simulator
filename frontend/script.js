/* frontend/script.js */

let distanceData = [];
let qberNoRepeater = [];
let qberWithRepeater = [];

const ctx = document.getElementById('qberChart').getContext('2d');
const chart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: distanceData,
        datasets: [
            {
                label: 'QBER (No Repeaters)',
                data: qberNoRepeater,
                borderColor: '#e74c3c',
                backgroundColor: 'rgba(231, 76, 60, 0.2)',
                borderWidth: 2,
                tension: 0.1
            },
            {
                label: 'QBER (With Repeaters)',
                data: qberWithRepeater,
                borderColor: '#2ecc71',
                backgroundColor: 'rgba(46, 204, 113, 0.2)',
                borderWidth: 2,
                tension: 0.1
            }
        ]
    },
    options: {
        responsive: true,
        scales: {
            x: { title: { display: true, text: 'Distance (km)' } },
            y: { title: { display: true, text: 'QBER' }, min: 0, max: 1 }
        }
    }
});

// Update display values for sliders
document.getElementById('distance').oninput = function() {
    document.getElementById('distVal').innerText = this.value;
};

document.getElementById('repeaters').oninput = function() {
    document.getElementById('repVal').innerText = this.value;
};

function runSimulation() {
    const repeaters = document.getElementById('repeaters').value;
    const eve = document.getElementById('eve').checked;

    // Clear old data for a fresh graph
    distanceData.length = 0;
    qberNoRepeater.length = 0;
    qberWithRepeater.length = 0;
    chart.update();

    let distances = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    let index = 0;

  // ... existing code ...

function runNext() {
    if (index >= distances.length) {
        console.log("Simulation Complete");
        return;
    }

    let d = distances[index];

    // 1. UPDATE THIS FETCH (WITHOUT repeaters)
    fetch('https://quantum-communication-simulator.onrender.com/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qubits: 100, distance: d, repeaters: 0, eve: eve })
    })
    .then(res => res.json())
    .then(noRepData => {
        // 2. UPDATE THIS FETCH (WITH repeaters)
        return fetch('https://quantum-communication-simulator.onrender.com/simulate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ qubits: 100, distance: d, repeaters: repeaters, eve: eve })
        })
// ... rest of the code ...
            .then(res => res.json())
            .then(repData => {
                // 3. Update arrays with new data
                distanceData.push(d);
                qberNoRepeater.push(noRepData.qber);
                qberWithRepeater.push(repData.qber);

                // FIXED: Update the chart visually after every single data point
                chart.update(); 

                // 4. Move to next distance
                index++;
                runNext();
            });
        })
        .catch(err => {
            console.error("Connection Error:", err);
            alert("Backend Error: Make sure your Flask server (app.py) is running!");
        });
    }

    runNext();
}