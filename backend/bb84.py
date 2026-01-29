# backend/bb84.py
import random

def generate_bits(n):
    return [random.randint(0, 1) for _ in range(n)]

def generate_bases(n):
    return [random.choice(['Z', 'X']) for _ in range(n)]

def measure_bits(bits, alice_bases, bob_bases, eve=False):
    measured_bits = []

    for i in range(len(bits)):
        # Eve intercepts
        if eve:
            eve_basis = random.choice(['Z', 'X'])
            if eve_basis != alice_bases[i]:
                bits[i] = random.randint(0, 1)

        # Bob measures
        if alice_bases[i] == bob_bases[i]:
            measured_bits.append(bits[i])
        else:
            measured_bits.append(random.randint(0, 1))

    return measured_bits

def sift_key(alice_bits, bob_bits, alice_bases, bob_bases):
    key = []
    for i in range(len(alice_bits)):
        if alice_bases[i] == bob_bases[i]:
            key.append(alice_bits[i] == bob_bits[i])
    return key

def calculate_qber(key):
    if len(key) == 0:
        return 0
    errors = key.count(False)
    return errors / len(key)