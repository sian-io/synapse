import { PedagogicalPillar, Flashcard } from '../types';

export const NEUROSCIENCE_PILLARS_EN: PedagogicalPillar[] = [
  {
    id: 'retrieval_practice',
    name: 'Retrieval Practice (Active Recall)',
    scientist: 'Roediger & Karpicke (2006)',
    neuroBasis: 'Forced retrieval of information activates the prefrontal cortex and hippocampus, triggering Long-Term Potentiation (LTP) and increasing synaptic density of AMPA/NMDA receptors.',
    practicalAction: 'Instead of rereading notes or highlighting text (illusion of fluency), you must answer questions or reconstruct knowledge from scratch without consulting the source.',
    iconName: 'Zap',
  },
  {
    id: 'feynman_technique',
    name: 'Feynman Technique & Deconstruction',
    scientist: 'Richard Feynman (Nobel Laureate in Physics)',
    neuroBasis: 'Breaks the "illusion of explanatory depth" (Rozenblit & Keil). Compels the brain to translate abstract jargon into grounded sensory and conceptual representations.',
    practicalAction: 'Explain the concept in language so simple that a child or layperson can understand, replacing technical jargon with concrete real-world analogies.',
    iconName: 'Sparkles',
  },
  {
    id: 'socratic_inquiry',
    name: 'Elaborative Interrogation & Socratic Method',
    scientist: 'Socrates / Pressley et al. (1992)',
    neuroBasis: 'Stimulates the integration of new data into pre-existing neocortical semantic networks through causal connections ("Why does this make sense?").',
    practicalAction: 'The agent never hands out the final answer; it dismantles the problem into premises and guides you to deduce the mechanics through targeted questions.',
    iconName: 'MessageSquareText',
  },
  {
    id: 'cognitive_load',
    name: 'Cognitive Load Theory',
    scientist: 'John Sweller (1988)',
    neuroBasis: 'Working memory has an ultra-limited capacity (only 4 to 7 simultaneous items). Excessive stimuli induce cognitive overload and block neural schema formation.',
    practicalAction: 'We present a single conceptual core at a time, mapping prerequisites before introducing mechanical complexity.',
    iconName: 'Layers',
  },
  {
    id: 'desirable_difficulties',
    name: 'Desirable Difficulties',
    scientist: 'Robert & Elizabeth Bjork (2011)',
    neuroBasis: 'Study conditions that induce productive struggle in the present promote neuroplasticity and long-term retention, whereas easy, passive study creates a fleeting illusion of mastery.',
    practicalAction: 'Embrace temporary uncertainty. Conscious mental struggle is the biological trigger for lasting synaptic consolidation.',
    iconName: 'Flame',
  },
  {
    id: 'metacognitive_calibration',
    name: 'Metacognition & Calibration',
    scientist: 'John Flavell (1979) / Kruger & Dunning',
    neuroBasis: 'Activation of the dorsolateral prefrontal cortex monitors the accuracy of personal beliefs, counteracting overconfidence and confirmation bias.',
    practicalAction: 'Assess your certainty level before checking the answer, deliberately recalibrating your cognitive blind spots.',
    iconName: 'Target',
  },
];

export const NEUROSCIENCE_PILLARS_PT: PedagogicalPillar[] = [
  {
    id: 'retrieval_practice',
    name: 'Prática de Recuperação (Active Recall)',
    scientist: 'Roediger & Karpicke (2006)',
    neuroBasis: 'A recuperação forçada da informação ativa o córtex pré-frontal e o hipocampo, disparando a Potenciação de Longa Duração (LTP) e aumentando a densidade sináptica de receptores AMPA/NMDA.',
    practicalAction: 'Em vez de reler notas ou grifar textos (ilusão de fluência), você deve responder a perguntas ou reconstruir o conhecimento do zero sem consultar a fonte.',
    iconName: 'Zap',
  },
  {
    id: 'feynman_technique',
    name: 'Técnica de Feynman & Desconstrução',
    scientist: 'Richard Feynman (Nobel de Física)',
    neuroBasis: 'Quebra a "ilusão de profundidade explicativa" (Rozenblit & Keil). Obriga o cérebro a traduzir jargões abstratos em representações sensoriais e conceituais de base sólida.',
    practicalAction: 'Explique o conceito em linguagem tão simples que uma criança ou pessoa leiga seja capaz de entender, substituindo termos técnicos por analogias reais.',
    iconName: 'Sparkles',
  },
  {
    id: 'socratic_inquiry',
    name: 'Interrogação Elaborativa & Método Socrático',
    scientist: 'Sócrates / Pressley et al. (1992)',
    neuroBasis: 'Estimula a integração de novos dados com a rede semântica pré-existente no neocórtex através de conexões causais ("Por que isso faz sentido?").',
    practicalAction: 'O agente nunca entrega a resposta final; ele desmonta o problema em premissas e conduz você a deduzir a mecânica através de perguntas direcionadas.',
    iconName: 'MessageSquareText',
  },
  {
    id: 'cognitive_load',
    name: 'Teoria da Carga Cognitiva',
    scientist: 'John Sweller (1988)',
    neuroBasis: 'A memória de trabalho possui capacidade ultralimitada (apenas 4 a 7 elementos simultâneos). O excesso de estímulos causa sobrecarga cognitiva e bloqueia a formação de esquemas neurais.',
    practicalAction: 'Apresentamos um único núcleo conceitual por vez, mapeando pré-requisitos antes de introduzir complexidade mecânica.',
    iconName: 'Layers',
  },
  {
    id: 'desirable_difficulties',
    name: 'Dificuldades Desejáveis',
    scientist: 'Robert & Elizabeth Bjork (2011)',
    neuroBasis: 'Condições de estudo que geram esforço produtivo no presente promovem neuroplasticidade e retenção de longo prazo, enquanto o estudo passivo e fácil ilude com sensação passageira de domínio.',
    practicalAction: 'Abrace a sensação de incerteza temporária. O esforço mental consciente é o gatilho biológico para a consolidação duradoura.',
    iconName: 'Flame',
  },
  {
    id: 'metacognitive_calibration',
    name: 'Metacognição & Calibração',
    scientist: 'John Flavell (1979) / Kruger & Dunning',
    neuroBasis: 'A ativação do córtex pré-frontal dorsolateral monitora a precisão das próprias crenças, combatendo o excesso de confiança e o viés de confirmação.',
    practicalAction: 'Avalie seu grau de certeza antes de verificar a resposta, ajustando seus pontos cegos de forma deliberada.',
    iconName: 'Target',
  },
];

export const INITIAL_PRESET_FLASHCARDS_EN: Flashcard[] = [
  {
    id: 'fc_demo_1',
    topic: 'Learning Neuroscience',
    question: 'Why is retrieval practice (Active Recall) biologically superior to passive rereading for long-term retention?',
    answer: 'Deliberate recall requires the prefrontal cortex and hippocampus to actively reconstruct the neural memory trace. This triggers Long-Term Potentiation (LTP) and signals the brain that the information is vital for survival, initiating synaptic protein synthesis. Passive rereading merely creates an "illusion of fluency" within the visual cortex.',
    keyConcept: 'Long-Term Potentiation (LTP) and Illusion of Fluency',
    neuroTip: 'Imagine each retrieval like walking across tall grass: the more you tread upon it, the clearer and faster the neural pathway becomes.',
    intervalDays: 1,
    repetitions: 1,
    easeFactor: 2.5,
    nextReviewDate: Date.now(),
    masteryLevel: 1,
  },
  {
    id: 'fc_demo_2',
    topic: 'Cognitive Pedagogy',
    question: 'What is the neurocognitive distinction between intrinsic cognitive load and extraneous cognitive load?',
    answer: 'Intrinsic load stems from the inherent complexity of the subject matter and the interactions among its conceptual elements. Extraneous load is the unnecessary friction imposed by how information is presented (confusing layouts, distractions, unneeded jargon). The pedagogical goal is to minimize extraneous load to free working memory for germane load (schema construction).',
    keyConcept: "Sweller's Cognitive Load Theory",
    neuroTip: 'Working memory is a tiny workbench: clear away the clutter (extraneous load) to make room for the actual study material.',
    intervalDays: 2,
    repetitions: 1,
    easeFactor: 2.5,
    nextReviewDate: Date.now() + 86400000,
    masteryLevel: 2,
  },
  {
    id: 'fc_demo_3',
    topic: 'Feynman Technique',
    question: 'How does prohibiting technical terms in the Feynman Technique unmask the illusion of explanatory depth?',
    answer: 'We often employ technical terms as "mental shortcuts" (verbal labels) that foster a subjective sense of understanding without truly grasping the underlying causal mechanics. By disallowing technical terms, the brain is forced to articulate the phenomenon using cause, effect, and foundational entities.',
    keyConcept: 'Illusion of Explanatory Depth (Rozenblit & Keil)',
    neuroTip: 'If you cannot explain how something works using everyday vocabulary, you have memorized a label, not a principle.',
    intervalDays: 4,
    repetitions: 2,
    easeFactor: 2.6,
    nextReviewDate: Date.now() + 86400000 * 3,
    masteryLevel: 3,
  },
];

export const INITIAL_PRESET_FLASHCARDS_PT: Flashcard[] = [
  {
    id: 'fc_demo_1',
    topic: 'Neurociência do Aprendizado',
    question: 'Por que a prática de recuperação (Active Recall) é biologicamente superior à releitura passiva para a retenção?',
    answer: 'A evocação deliberada requer que o córtex pré-frontal e o hipocampo reconstruam ativamente o caminho neural da memória. Isso dispara a Potenciação de Longa Duração (LTP) e sinaliza ao cérebro que aquela informação é vital para a sobrevivência, provocando síntese proteica sináptica. A releitura passiva gera apenas "ilusão de fluência" no córtex visual.',
    keyConcept: 'Potenciação de Longa Duração (LTP) e Ilusão de Fluência',
    neuroTip: 'Imagine que cada recuperação é como pisar numa trilha de grama alta: quanto mais você caminha por ela, mais nítido e rápido se torna o caminho neural.',
    intervalDays: 1,
    repetitions: 1,
    easeFactor: 2.5,
    nextReviewDate: Date.now(),
    masteryLevel: 1,
  },
  {
    id: 'fc_demo_2',
    topic: 'Pedagogia Cognitiva',
    question: 'Qual é a diferença neurocognitiva entre carga cognitiva intrínseca e carga cognitiva extrínseca?',
    answer: 'A carga intrínseca refere-se à complexidade inerente da matéria e às interações entre seus elementos conceituais. A carga extrínseca é o ruído inútil imposto pela forma inadequada como a informação é apresentada (layout confuso, distrações, jargões desnecessários). O objetivo pedagógico é minimizar a carga extrínseca para liberar a memória de trabalho para a carga germana (construção de esquemas).',
    keyConcept: 'Teoria da Carga Cognitiva de Sweller',
    neuroTip: 'A memória de trabalho é uma mesa de trabalho minúscula: tire o lixo (carga extrínseca) para caber o material de estudo real.',
    intervalDays: 2,
    repetitions: 1,
    easeFactor: 2.5,
    nextReviewDate: Date.now() + 86400000,
    masteryLevel: 2,
  },
  {
    id: 'fc_demo_3',
    topic: 'Técnica de Feynman',
    question: 'Como a proibição de termos técnicos na Técnica de Feynman desmascara a ilusão de profundidade explicativa?',
    answer: 'Muitas vezes usamos termos técnicos como "atalhos mentais" (rótulos verbais) que dão a sensação subjetiva de saber, sem que realmente compreendamos o mecanismo causal subjacente. Ao ser proibido de usar a palavra técnica, o cérebro é forçado a descrever o fenômeno em termos de causa, efeito e entidades fundamentais.',
    keyConcept: 'Ilusão de Profundidade Explicativa (Rozenblit & Keil)',
    neuroTip: 'Se você não consegue explicar como funciona usando apenas palavras de uso diário, você memorizou um nome, não um princípio.',
    intervalDays: 4,
    repetitions: 2,
    easeFactor: 2.6,
    nextReviewDate: Date.now() + 86400000 * 3,
    masteryLevel: 3,
  },
];

export function getNeurosciencePillars(language: 'en' | 'pt' = 'en'): PedagogicalPillar[] {
  return language === 'pt' ? NEUROSCIENCE_PILLARS_PT : NEUROSCIENCE_PILLARS_EN;
}

export function getInitialPresetFlashcards(language: 'en' | 'pt' = 'en'): Flashcard[] {
  return language === 'pt' ? INITIAL_PRESET_FLASHCARDS_PT : INITIAL_PRESET_FLASHCARDS_EN;
}

// Default export in English
export const NEUROSCIENCE_PILLARS = NEUROSCIENCE_PILLARS_EN;
export const INITIAL_PRESET_FLASHCARDS = INITIAL_PRESET_FLASHCARDS_EN;
