# Stake and Claiming Mechanism
Provers stake $BON to participate proving in the network. The amount of $BON they stake proportionally determines which executuion requests they have access to, as determined by the base fee of the execution request. We call this proportional access the "stake threshold". For example, with a stake threshold of 10x, a prover who stakes 100 $BON tokens can only complete workloads that cost 10 $BON or less.

Since in phase 1, since base fees will be paid in $USDC or $SOL, the stake threshold will be determined by the price of $BON in $USDC or $SOL. For example, with a stake threshold of 10x, a prover who stakes 100 $USDC or $SOL worth of $BON tokens can only complete workloads that cost 10 $USDC or 10 $SOL or less.

Here are some illustrative examples with a stake threshold of 10x:
| Base Fee | Stake | Ratio (Stake/Base Fee) | Claimable? |
|----------|--------|----------------------|-------------|
| $1       | $10    | 10x                  | Yes         |
| $1       | $100   | 100x                 | Yes         |
| $100     | $10    | 0.1x                 | No          |
| $100     | $100   | 1x                   | No          |
| $10      | $101   | 10.01x               | Yes         |

Open questions:
- How do we determine the stake threshold?
- How do we determine the base fee?

# Base Fees
Base fee is the minimum payment to a prover for completing a workload. In phase 1 base fees will be paid in $USDC or $SOL and in phase 2 base fees will be paid in $BON.

Base fees are determined by the cost of the workload. The base fee $F_b$ can be calculated by:

$$F_b = f(ZKP_s, C_{zkp})$$

where $ZKP_s$ is the size of the program to be proven and $C_{zkp}$ is the cost of computing 1000 cycles of the program. To start, this function will be a simple linear function:

$$f(ZKP_s, C_{zkp}) = \frac{ZKP_s}{1000} \times C_{zkp}$$

For example, if we have a program with:
- $ZKP_s = 50,000$ cycles
- $C_{zkp}$ = \$0.1$ per 1000 cycles

Then:
$$f(50000, 0.1) = \frac{50000}{1000} \times 0.1 = 50 \times 0.1 = \$5$$



## Dynamic Base Fees
In the future, we may need to change the way the base fee is calculated. For example, under higher demand, we may want to increase the base fee to attract more demand. In such a case, we can formulate a new equation for the base fee as a polynomial function:

$$f(ZKP_s, C_{zkp}) = a_1(ZKP_s \times C_{zkp}) + a_2(ZKP_s^2 \times C_{zkp}^2) + a_3(ZKP_s^3 \times C_{zkp}^3)$$

Example Scenarios:

| Demand Level | a₁  | a₂    | a₃     | Description |
|-------------|-----|-------|---------|-------------|
| Low         | 1.0 | 0.001 | 0.0001  | Keeps fees close to the original linear model to attract more requests |
| Normal      | 1.0 | 0.01  | 0.001   | Moderate scaling for complex computations |
| High        | 1.0 | 0.1   | 0.01    | Significantly higher fees for complex computations |
| Extreme     | 1.0 | 0.5   | 0.1     | Very aggressive scaling for complex computations |

Sample Calculation (for ZKP_s = 10, C_{zkp} = 10):
| Demand Level | Calculation         | Total |
|--------------|---------------------|-------|
| Low          | 100 + 1 + 1        | 102   |
| Normal       | 100 + 10 + 10      | 120   |
| High         | 100 + 100 + 100    | 300   |
| Extreme      | 100 + 500 + 1000   | 1600  |

## Dynamic Base Fees: Coefficient Adjustment

The coefficients $(a_1, a_2, a_3)$ could be automatically adjusted based on network metrics:

1. Network Utilization Rate $(U)$
   - $U = \frac{\text{active provers}}{\text{total provers}}$
   - Or: $U = \frac{\text{current requests}}{\text{max throughput}}$
   - Example: If $U > 80$%, increase coefficients
   - If $U < 40$%, decrease coefficients

2. Queue Length $(Q)$
   - $Q = \frac{\text{pending requests}}{\text{average processing rate}}$
   - Longer queues → higher coefficients
   - Short/no queues → lower coefficients

3. Moving Average Formula
   For each coefficient $a_i$:
   $$a_i^{new} = a_i^{current} \times (1 + \alpha \times (U - U_{target}))$$
   where:
   - $\alpha$ is a dampening factor (e.g., 0.1)
   - $U_{target}$ is desired network load (e.g., 70%)

# Slashing 
When a prover is selected to complete a workload, they are required to complete the workload within a certain amount of time. If they do not complete the workload within the required time, they lose a portion of their stake (i.e. they are slashed). 

- How much is slashed?
- How long is the timeout?
