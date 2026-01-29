# backend/repeater.py
import random

def apply_repeater_noise(bits, distance, repeaters):
    segments = repeaters + 1
    segment_distance = distance / segments
    noise_prob = min(segment_distance / 100, 0.3)

    for _ in range(segments):
        for i in range(len(bits)):
            if random.random() < noise_prob:
                bits[i] = 1 - bits[i]

    return bits