# backend/metrics.py
from backend.bb84 import generate_bits, generate_bases, measure_bits, sift_key, calculate_qber
def calculate_fidelity(alice_bits, bob_bits, alice_bases, bob_bases):
    correct = 0
    total = 0

    for i in range(len(alice_bits)):
        if alice_bases[i] == bob_bases[i]:
            total += 1
            if alice_bits[i] == bob_bits[i]:
                correct += 1

    if total == 0:
        return 1.0

    return round(correct / total, 3)