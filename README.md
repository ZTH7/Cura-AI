[English](README.md) | [中文](README.zh-CN.md)

# 🌱 Cura AI — AI + Web3 Mental Health Mini App

## 1. Background & Problem
- **Insufficient Supply & Misconceptions**: Mental health issues are often equated with psychiatric disorders in many hospitals, leading to social stigma and preventing people from seeking help.
- **High Cost & Poor Experience**: Traditional counseling is expensive, and therapists often lack consistent encouragement, leaving users without continuous support.
- **Privacy Risks**: Mental health data is extremely sensitive. Existing platforms lack transparency, and users worry about being labeled or having their information leaked.

👉 As a result, most people with mental health needs are stuck in a state of **“afraid to ask, can’t afford, can’t save.”**

---

## 2. Our Solution
**Cura AI = AI Companionship + Web3 Privacy Protection + Gamified Incentives**

- **AI Companionship**
    - 24/7 AI-powered chatbot for emotional support and self-regulation.
    - Clearly positioned as **“mental health assistant”**, not a medical diagnostic tool — ensuring compliance and safety.
    - *Future plan*: guided breathing, meditation, and emotional journaling tools.

- **NFT Badge System**
    - Users earn **Soulbound NFT badges** by consistent check-ins (daily / cumulative).
    - *Future plan*: journaling, completing exercises.
    - Converts positive behavior into **verifiable digital assets**.
    - Unlike traditional in-app points, NFT badges are **user-owned and portable**, enabling cross-platform display and unlocking future community benefits (e.g., exclusive events, course access).

- **Web3 Privacy Protection**
    - User data is **locally encrypted → stored on IPFS → hash proof anchored on-chain**.
    - Users have full control over who can access their data (grant/revoke permissions).

---

## 3. Technical Architecture (How It Works)
- **Identity**: Wallet / DID login, eliminating phone/email sign-ups.
- **AI Layer**: LLM-powered chatbot for companionship, emotion recognition, and risk alerts (non-diagnostic).
- **Privacy Layer**: AES-GCM local encryption + IPFS storage + `keccak256(CID)` on-chain fingerprint.
  > Only encrypted data is stored in decentralized storage. The blockchain only records its fingerprint (hash). **No one, including our team, can view the plaintext.**
- **Incentive Layer**: Soulbound Token (SBT) badges to reward users and engage content creators.

---

## 4. Why Now (Timing)
- **Rising Demand for Mental Health Support**: Demand has surged post-pandemic, while professional supply remains scarce.
- **AI Companionship Trend**: Users are increasingly comfortable with AI-based mental health assistants and habit-building companions.
- **Web3 Privacy Infrastructure Maturity**: Technologies like IPFS, Account Abstraction, and ZK proofs now make **user-controlled data ownership** feasible.
- **Policy Tailwinds**: Governments are prioritizing mental health, yet existing systems are limited — creating space for complementary solutions.

---

## 5. Market & User Value
- **B2B Partnerships**:
    - Corporate wellness programs (employees access anonymously, employer pays).
    - Schools (privacy-preserving student mental health initiatives).
- **B2C Users**: Students, professionals, and individuals living alone seeking affordable, stigma-free support.
- **Market Size**: The global mental health market is projected to exceed **$500B by 2030**, with **digital mental wellness** as the fastest-growing segment.

---

## 6. Future Business Model
1. **Freemium**: Basic features free to all; advanced features (personalized courses, premium content) available via subscription.
2. **NFT / Badge Economy**: Personalized growth NFTs as positive reinforcement; future integration into community incentives.
3. **Enterprise & School Plans**: Institutions purchase bulk anonymous usage credits.
4. **Creator Revenue Sharing**: Psychologists / wellness creators publish guided content → sold as NFTs → revenue split automatically via smart contracts (Splitter).

---

## 7. Moat & Differentiation
- **AI + Web3 Fusion**: Not just another AI chatbot, not just blockchain storage — but **“data sovereignty + gamified incentives”** in mental health.
- **Privacy First**: Unlike traditional apps, users fully own and control their mental health data.
- **NFT / SBT Integration**: Transform positive behaviors into owned digital assets with verifiable proof.
- **Frictionless UX**: With future **Account Abstraction**, users can interact without blockchain knowledge — no keys, no gas fees, no complexity.

---

## 8. Vision
**Break free from the cycle of “expensive + stigmatized + privacy risks” in mental health.**

Cura AI enables users to:
- **Access emotional support anytime, anywhere**
- **Own and protect their personal mental health data**
- **Join a positive, privacy-first wellness community powered by Web3**

🌟 *Our vision: Cura AI becomes the anonymous, always-available “pocket companion” in everyone’s phone — a safe space to share, reflect, and when needed, connect with real-world resources and professional help.*  
