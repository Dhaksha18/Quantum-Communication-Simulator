# backend/eve.py
import random

def eve_intercept(bits, alice_bases):
    """
    Simulates Eve performing an intercept-resend attack.
    Eve measures each qubit in a random basis and resends it.
    """
    intercepted_bits = []

    for i in range(len(bits)):
        eve_basis = random.choice(['Z', 'X'])

        # If Eve chooses wrong basis, measurement disturbs the qubit
        if eve_basis == alice_bases[i]:
            intercepted_bits.append(bits[i])
        else:
            intercepted_bits.append(random.randint(0, 1))

    return intercepted_bits