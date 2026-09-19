> **Language / Idioma**: [Versão original em português](docs/pt-br/README.md)

# Synapse - Active Learning Agent

An educational platform grounded in cognitive neuroscience and the learning sciences, designed to replace passive study with productive mental effort, long-term retention, and solid mental model formation.

---

## 1. What Is Synapse?

Synapse is an artificial intelligence-driven tutor and study environment engineered to act as a cognitive mediator. Unlike conventional assistants that deliver ready-made answers, condensed summaries, and pre-packaged solutions—behaviors that foster passive consumption—Synapse acts as an intellectual provocateur:

- **Never hands out ready answers**: Guides the student through investigative questions so they deduce the solution themselves.
- **Dismantles the illusion of competence**: Compels the student to articulate concepts in their own words, stripping away empty technical jargon.
- **Demands deliberate retrieval effort**: Replaces passive rereading with recall tests drawn from long-term memory.
- **Adapts to the student's metacognitive state**: Modulates questioning rigor based on the student's reported certainty level.

---

## 2. Why Does Synapse Exist? (The Science of Learning)

### The Problem with Traditional Studying: The Illusion of Fluency

Most students rely on biologically inefficient methods:

- **Passive rereading and colored highlighting**: Reading a text repeatedly builds visual familiarity. The brain mistakes ease of recognition for actual mastery (*illusion of fluency*).
- **Passive consumption of lectures and videos**: Listening to a linear explanation requires no synaptic reconstruction effort. Hours after the session ends, most of the material is discarded by the hippocampus as biological noise.
- **Memorizing hollow jargon**: Memorizing the name of a formula or concept without grasping the underlying causal mechanism masks conceptual gaps (*illusion of explanatory depth*).

### The Biological Solution: Long-Term Potentiation (LTP)

For a memory to endure and transfer from the hippocampus to the neocortex, conscious cognitive effort is required. Synapse integrates six pillars validated by cognitive science:

1. **Retrieval Practice (Active Recall - Roediger & Karpicke, 2006)**:
   Forcing the brain to retrieve information without consulting notes triggers the synthesis of permanent synaptic proteins. The act of recalling strengthens memory up to three times more than another reading.
2. **The Feynman Technique (Richard Feynman / Rozenblit & Keil)**:
   If you cannot explain a concept in simple terms to a child or layperson, you have memorized a label without understanding the mechanism. The system demands the deconstruction of jargon into concrete analogies.
3. **The Socratic Method & Elaborative Interrogation (Pressley et al., 1992)**:
   Questions like "Why does this happen this way and not another?" anchor new content to pre-existing neural networks, erecting scaffolding for reasoning.
4. **Cognitive Load Theory (John Sweller, 1988)**:
   Working memory can hold only 4 to 7 elements simultaneously. Synapse deconstructs complex topics, isolating essential prerequisites and eliminating distractions to focus on building durable neural schemas (*germane load*).
5. **Desirable Difficulties (Robert & Elizabeth Bjork, 2011)**:
   Learning that feels easy and fast is forgotten just as quickly. The productive struggle of attempting to remember or structure an idea is the biological hallmark of neuroplasticity in action.
6. **Metacognitive Calibration (John Flavell, 1979 / Kruger & Dunning)**:
   Assessing one's own degree of certainty before verifying an answer curbs overconfidence and reveals cognitive blind spots.

---

## 3. How to Use Synapse Effectively

To maximize cognitive gain from the tool, follow this recommended study cycle:

```
[1. Pin Concept] ──> [2. Map Cognitive Load] ──> [3. Engage Socratic Tutor]
                                                               │
[6. Monitor Stats] <── [5. Active Retrieval Lab] <── [4. Feynman Studio]
```

### Step 1: Define and Pin the Core Concept

Use the persistent bar at the top of the screen to enter your study topic (e.g., *Photosynthesis*, *Dijkstra's Algorithm*, *Monetary Inflation*, *Synaptic Mechanisms*). This concept will be synchronized automatically across all platform tools.

### Step 2: Map the Conceptual Structure

Open the **Cognitive Load** tab and click **Deconstruct Cognitive Load**:

- Check the **Prerequisites**: Ensure you master foundational ideas before moving forward.
- Read the **Core Mechanism**: Grasp the essential engine in a single sentence.
- Review **Cognitive Traps**: Guard against common misconceptions.
- Anchor your understanding with the **Physical World Analogy**.

### Step 3: Build Reasoning with the Socratic Tutor

Navigate to the **Socratic Tutor** tab:

- Adjust the **Metacognitive Calibration** slider (1 to 5) to indicate your current confidence on the topic.
- Choose your pedagogical mode (`socratic`, `active_retrieval`, `feynman`, or `metacognition`).
- Answer the tutor's questions by formulating hypotheses in your own words. Avoid copying and pasting pre-made answers.
- Use the **Recommended Cognitive Actions** displayed at the end of each response to guide your next reasoning step.

### Step 4: Test Understanding in the Feynman Studio

Open the **Feynman Studio**:

- Select the target audience (e.g., *Curious 10-year-old*).
- In the text area, write a complete explanation of the phenomenon without consulting reference materials.
- Click **Audit with Feynman Technique**.
- Analyze the results: see which terms were flagged as unexplained jargon and where logical leaps occurred (*conceptual gaps*).
- Click **Discuss with Tutor** to take the generated closing question directly into the Socratic Tutor and bridge the gap.

### Step 5: Consolidate Memory in the Active Retrieval Lab

Open the **Active Retrieval** tab:

- When viewing a card, **do not flip it immediately**.
- Type your answer or deduction in the **Force Generation** field. Writing beforehand eliminates hindsight bias ("I already knew that").
- Click **Check Mental Model & Answer** to evaluate your attempt against the benchmark.
- Rate your recall difficulty (*Forgot*, *Very Hard*, *Good Effort*, *Perfect*). The spaced repetition algorithm recalculates your next review date based on Ebbinghaus's forgetting curve.
- When needed, synthesize new cards by clicking **Synthesize New Deck**.

### Step 6: Deepen Scientific Foundations

Visit the **Neuroscience Guide** tab at any time to review the empirical studies supporting each step of the methodology.

---

## 4. Local Execution Instructions

### Prerequisites

- [Node.js](https://nodejs.org/) version 18 or higher installed.
- Google Gemini API key (optional for basic testing; recommended for full AI responses).

### Installation Steps

1. **Clone or navigate to the project directory**:

   ```bash
   cd /home/gui/Projects/synapse
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create or edit the `.env` file in the project root and add your Gemini API key:

   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

   *Note: If the key is not set, Synapse remains fully operational using its internal deterministic pedagogical fallbacks.*

4. **Start in development mode**:

   ```bash
   npm run dev
   ```

   The application will be accessible at `http://localhost:3000`.

5. **Type check and linting**:

   ```bash
   npm run lint
   ```

6. **Build and production run**:

   ```bash
   npm run build
   npm run start
   ```

---

## 5. File Structure

For detailed technical documentation aimed at developers and AI agents, see `AGENTS.md`.

- `server.ts`: Unified Express server with Gemini API integration and Vite middleware.
- `src/App.tsx`: Main state manager, navigation tabs, and persistence.
- `src/types.ts`: Application type definitions and data contracts.
- `src/components/`: UI components for each pedagogical mode.
- `src/data/neurosciencePillars.ts`: Scientific foundation content and demonstration flashcards.
