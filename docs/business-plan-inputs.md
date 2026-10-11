# cfo.ai inputs for ReleaseCrew

Paste this into [cfo.ai](https://cfo.ai) after you sign up (card required; cancel immediately in Settings → Billing — neatHack credits the account). Ask Ari to build a 18-month model with a Base and a Growth scenario.

The exported plan belongs in [`docs/business-plan.md`](./business-plan.md).

## What the product is

ReleaseCrew is a crew of agents that turns a GitHub repo + release tag into a **verified** launch kit: changelog, X thread, and a short trailer. The verifier rejects invented features. State is durable, so a failed run resumes.

Customer: open-source maintainers, DX teams, and product marketers who ship weekly and still write release notes by hand.

## Pricing (ask Ari to model these three plans)

| Plan | Price | Who | Included runs / month | Seats |
| --- | --- | --- | --- | --- |
| Indie | $29 / month | solo maintainers | 20 kits | 1 |
| Team | $149 / month | product + DX | 150 kits | 5 |
| Launch | $499 / month | companies with a release train | 600 kits | 20 |

Annual: 2 months free (Indie $290, Team $1,490, Launch $4,990).

Overage: $2.50 per extra kit. Trailer render over 30s: +$0.40.

## Starting customers (month 0 = November 2026)

- Indie: 40
- Team: 6
- Launch: 1
- Paid conversion from the neatHack demo waitlist: 12 Indie in month 1

## Growth and retention assumptions

Label these as assumptions, not actuals.

- Indie monthly new logos: 25 in month 1, +8% month-over-month through month 8, then +4%
- Team monthly new logos: 3 in month 1, +10% through month 8
- Launch: 1 new logo every other month
- Monthly logo churn: Indie 6%, Team 3%, Launch 1.5%
- Expansion: 8% of Indie upgrade to Team each year; 5% of Team upgrade to Launch
- Collection: 100% card, billed in advance, recognized monthly
- Annual mix: 35% of Team and Launch pay annually by month 6

## Cost of revenue (per kit, Base)

| Driver | Assumption |
| --- | --- |
| LLM tokens (writer + planner + optional verifier rewrite) | $0.18 average with GPT-4.1-mini / Claude Haiku class |
| GitHub API | $0 (public repos; fine-grained token on the customer side) |
| ffmpeg / render CPU | $0.04 on a 2 vCPU burst |
| neatlogs export | $0.01 (Pro workspace, spanned per run) |
| Storage of kits (30 days) | $0.01 |
| **Fully loaded COGS / kit** | **$0.24** |

Growth scenario: same COGS until month 7, then $0.16 / kit after prompt cache + reserved render capacity.

## Operating expenses

Monthly, Base, starting November 2026:

| Item | Month 1 | Notes |
| --- | --- | --- |
| Founder salary (part-time) | $4,000 | 1 founder, 0.5 FTE until month 6 |
| Contractor (frontend, 0.25 FTE) | $2,000 | starts month 3 |
| First engineer | $0 then $12,000 loaded | hire month 7 in Growth only |
| neatlogs Pro | $500 | 3 months free if we place; budget $500 after |
| Entire (self-hosted CLI + optional cloud) | $0 then $200 | cloud workspace month 4 |
| cfo.ai Startup | $375 | billed annually; cancel trial if unused |
| Hosting (Vercel + object storage) | $80 | |
| Domain, email, extras | $40 | |
| Payment fees | 2.9% + $0.30 | Dodo / Stripe |
| Marketing | $600 | X ads + launch week only in months 1–2, then $250 |

## Cash and runway

- Starting cash: $12,000 (founder savings + leftover hackathon AWS/credits, treat credits as $0 cash)
- No debt
- No extra raise in Base
- Growth: $150,000 angel in month 5 if Team logos > 25

Ask Ari:

1. Monthly P&L, cash, and runway for Base and Growth for 18 months.
2. Gross margin by month (target ≥ 80% by month 6).
3. When cash dips below 4 months of opex.
4. Payback on the month-7 engineer hire.
5. Sensitivity: Indie churn 6% vs 9%; Team price $149 vs $99.

## Unit economics checks Ari should print

- Blended ARPU
- COGS / kit and kits / customer
- LTV (24-month, by plan) and LTV:CAC if CAC = $40 Indie / $220 Team / $900 Launch
- Contribution margin after payment fees

## Scenarios to create in cfo.ai

Keep **Main** as Base. Create:

- **Growth** — faster Team logos, engineer in month 7, $150k raise
- **Price cut** — Team at $99, hold other prices
- **Hiring freeze** — no engineer, marketing $250 flat

## Prompt to paste to Ari

```
Build an 18-month financial model for ReleaseCrew, a multi-agent SaaS that
turns a GitHub release into verified notes, an X thread, and a trailer.

Use the pricing, customer, growth, churn, COGS, opex, and cash assumptions
in this document. Mark every number that is an assumption. Create Main as
the Base case, plus Growth, Price cut, and Hiring freeze scenarios.

I need:
- monthly revenue by plan
- COGS and gross margin
- opex and operating income
- ending cash and runway
- the unit economics checks listed above
- a one-page narrative I can export as the business plan
```
