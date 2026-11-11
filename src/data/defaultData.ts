import { Subject, StudyDocument, Highlight, Annotation, StudyTask, SavedQuiz } from '../types';

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'subj-bio',
    name: 'Cellular Biology',
    code: 'BIO 101',
    color: 'emerald',
    icon: 'Dna',
    description: 'Cell mechanics, energy transfer, metabolic pathways, and molecular genetics',
    totalMinutesStudied: 185,
    targetHours: 15,
  },
  {
    id: 'subj-calc',
    name: 'Calculus & Series',
    code: 'MATH 201',
    color: 'sky',
    icon: 'Binary',
    description: 'Taylor & Maclaurin expansions, radius of convergence, and multidimensional optimization',
    totalMinutesStudied: 240,
    targetHours: 20,
  },
  {
    id: 'subj-neuro',
    name: 'Cognitive Neuroscience',
    code: 'NEURO 310',
    color: 'purple',
    icon: 'Brain',
    description: 'Synaptic plasticity, long-term potentiation (LTP), and hippocampal memory systems',
    totalMinutesStudied: 120,
    targetHours: 12,
  },
  {
    id: 'subj-cs',
    name: 'Operating Systems',
    code: 'CS 240',
    color: 'amber',
    icon: 'Cpu',
    description: 'Virtual memory management, paging architectures, TLB caches, and thread concurrency',
    totalMinutesStudied: 95,
    targetHours: 18,
  },
];

export const INITIAL_DOCUMENTS: StudyDocument[] = [
  {
    id: 'doc-bio-1',
    subjectId: 'subj-bio',
    title: 'Cellular Respiration & ATP Chemiosmosis (Ch. 9)',
    author: 'Prof. H. Campbell & L. Urry',
    totalPages: 5,
    fileType: 'bundled',
    uploadedAt: '2026-11-08',
    bookmarks: [1, 3],
    pages: [
      {
        pageNumber: 1,
        title: 'Section 9.1: Cellular Energy Currency & Catabolic Principles',
        content: `Living cells require continuous transfusions of energy from external sources to perform vital cellular work. Catabolic pathways release stored energy by breaking down complex organic molecules. Fermentation is a partial degradation of sugars that occurs without the use of oxygen, whereas cellular respiration is the most prevalent and efficient catabolic pathway, in which oxygen is consumed as a reactant along with organic fuels.

The overall summary equation for cellular respiration using glucose is:
C6H12O6 + 6 O2 → 6 CO2 + 6 H2O + Energy (ATP + heat)
This catabolic process is exergonic, with a standard free-energy change (ΔG) of -686 kcal/mol (-2,870 kJ/mol) of glucose under standard biochemical conditions.

Redox Reactions: Transferring Electrons
How do catabolic pathways that decompose glucose yield energy? The answer is the transfer of electrons during chemical reactions. In a redox (oxidation-reduction) reaction, the loss of electrons from one substance is called oxidation, and the addition of electrons to another substance is called reduction. Glucose is oxidized into carbon dioxide, while oxygen is reduced into water.`,
        subsections: [
          {
            title: 'Key Biochemical Equation',
            body: 'C₆H₁₂O₆ + 6 O₂ ➔ 6 CO₂ + 6 H₂O + ~30-32 ATP (ΔG = -686 kcal/mol)',
            equation: 'ΔG° = -2870 kJ/mol',
          },
          {
            title: 'Role of Electron Carriers (NAD+ and FAD)',
            body: 'Electrons are not transferred directly to oxygen in a single explosive step. Instead, hydrogen atoms are stripped from glucose and passed to NAD+ (nicotinamide adenine dinucleotide) via dehydrogenase enzymes, forming NADH.',
          },
        ],
        keyTerms: [
          { term: 'Catabolism', definition: 'Metabolic pathways that break down molecules, releasing energy.' },
          { term: 'Oxidation', definition: 'Loss of electrons or hydrogen atoms from a chemical substrate.' },
          { term: 'NAD+', definition: 'Coenzyme functioning as an oxidizing agent and primary electron carrier.' },
        ],
      },
      {
        pageNumber: 2,
        title: 'Section 9.2: Glycolysis: Splitting the 6-Carbon Backbone',
        content: `Glycolysis, which occurs in the cytosol, begins catabolism by breaking glucose into two molecules of a three-carbon compound called pyruvate. Glycolysis consists of ten individual enzymatic steps, universally partitioned into two distinct phases:
1. The Energy Investment Phase (steps 1-5): The cell spends 2 molecules of ATP to phosphorylate glucose, converting it into fructose-1,6-bisphosphate, which is then cleaved into two isomers of glyceraldehyde-3-phosphate (G3P).
2. The Energy Payoff Phase (steps 6-10): G3P is oxidized and phosphorylated; electrons are transferred to NAD+ to form 2 NADH, and 4 ATP molecules are produced via substrate-level phosphorylation.

Net Yield of Glycolysis per 1 Glucose molecule:
• 2 Pyruvate molecules (3C each)
• 2 Net ATP (4 generated minus 2 invested)
• 2 NADH + 2 H+

Notice that glycolysis occurs whether or not O2 is present. If O2 is absent, pyruvate undergoes fermentation. If O2 is present, the chemical energy stored in pyruvate and NADH can be extracted by pyruvate oxidation and the citric acid cycle inside the mitochondrial matrix.`,
        subsections: [
          {
            title: 'Substrate-Level Phosphorylation',
            body: 'A smaller amount of ATP is formed directly in a few reactions of glycolysis and the citric acid cycle by substrate-level phosphorylation. This occurs when an enzyme transfers a phosphate group from a substrate molecule to ADP.',
          },
          {
            title: 'Phosphofructokinase (PFK-1): The Pacemaker',
            body: 'Step 3 of glycolysis is catalyzed by phosphofructokinase, an allosteric enzyme inhibited by high ATP and citrate, and activated by AMP. This serves as the master feedback regulator of cellular respiration.',
          },
        ],
        keyTerms: [
          { term: 'Pyruvate', definition: '3-carbon end product of glycolysis that enters mitochondria.' },
          { term: 'PFK-1', definition: 'Rate-limiting enzyme of glycolysis regulated by allosteric feedback.' },
        ],
      },
      {
        pageNumber: 3,
        title: 'Section 9.3: Pyruvate Oxidation & The Citric Acid (Krebs) Cycle',
        content: `Upon entering the mitochondrion via active transport, pyruvate is converted to acetyl coenzyme A (acetyl CoA). This junction between glycolysis and the citric acid cycle is carried out by the multienzyme pyruvate dehydrogenase complex (PDC):
1. Pyruvate's carboxyl group (-COO-) is removed as a molecule of CO2.
2. The remaining two-carbon fragment is oxidized, forming acetate while extracting electrons to reduce NAD+ to NADH.
3. Coenzyme A is attached via an unstable sulfur bond to form high-energy Acetyl CoA.

The Citric Acid Cycle (Matrix Reactions):
The cycle functions as a metabolic furnace that oxidizes organic fuel derived from pyruvate. The acetyl group of acetyl CoA enters the cycle by combining with the 4-carbon compound oxaloacetate to form 6-carbon citrate. The next seven steps decompose citrate back to oxaloacetate, making it a regenerative cycle.

For each turn of the cycle (one acetyl CoA):
• 2 Carbons enter as acetyl CoA, and 2 different Carbons leave as CO2
• 3 molecules of NAD+ are reduced to 3 NADH
• 1 molecule of FAD is reduced to 1 FADH2
• 1 ATP (or GTP) is produced by substrate-level phosphorylation

Since 1 glucose yields 2 pyruvates, multiply all outputs by 2 per glucose molecule!`,
        subsections: [
          {
            title: 'Total Yield from Citric Acid Cycle per Glucose',
            body: '6 NADH, 2 FADH₂, 2 ATP, and 4 CO₂ waste molecules.',
          },
        ],
        keyTerms: [
          { term: 'Acetyl CoA', definition: 'Entry compound for the citric acid cycle formed from pyruvate.' },
          { term: 'Oxaloacetate', definition: 'Four-carbon acceptor molecule regenerated at the end of the Krebs cycle.' },
        ],
      },
      {
        pageNumber: 4,
        title: 'Section 9.4: Oxidative Phosphorylation & The Electron Transport Chain',
        content: `Up to this point, glycolysis and the citric acid cycle have produced only 4 net ATP molecules per glucose molecule. Most of the energy extracted from food remains locked in the high-energy electrons held by NADH and FADH2.

The Electron Transport Chain (ETC):
The inner mitochondrial membrane (cristae) houses electron transport chains consisting of multi-protein complexes labeled I through IV, along with prosthetic groups and mobile electron shuttles (Ubiquinone / Coenzyme Q, and Cytochrome c).
• Complex I (NADH dehydrogenase) receives electrons from NADH and pumps protons (H+) from the mitochondrial matrix into the intermembrane space.
• Complex II (succinate dehydrogenase) accepts electrons from FADH2 without direct proton pumping.
• Electrons pass down an electronegativity gradient through Complex III to Cytochrome c, then through Complex IV to oxygen, the terminal electron acceptor.
• Oxygen binds two electrons and two protons from the matrix to form water: 1/2 O2 + 2 H+ + 2 e- → H2O.

As electrons descend the chain, free energy drops, and complexes I, III, and IV pump protons into the intermembrane space, creating a steep proton-motive force (both a concentration gradient and an electrical membrane potential).`,
        subsections: [
          {
            title: 'Proton-Motive Force (PMF)',
            body: 'The H+ gradient across the inner membrane stores potential energy. The pH in the intermembrane space drops to ~7.0 while the matrix remains ~7.8.',
          },
        ],
        keyTerms: [
          { term: 'Cytochrome c', definition: 'Iron-containing heme protein shuttling electrons between complexes III and IV.' },
          { term: 'Terminal Acceptor', definition: 'Molecular oxygen (O₂), which possesses the highest electronegativity in the chain.' },
        ],
      },
      {
        pageNumber: 5,
        title: 'Section 9.5: Chemiosmosis: The ATP Synthase Rotary Motor',
        content: `Chemiosmosis is the energy-coupling mechanism that harnesses energy stored in the form of a hydrogen ion gradient across a membrane to drive cellular work, specifically the synthesis of ATP.

ATP Synthase Architecture:
Populating the inner mitochondrial membrane are millions of copies of ATP synthase, a molecular rotary machine consisting of four main parts:
1. Stator: Anchored in the membrane, provides a channel for H+ to enter.
2. Rotor: A ring of c-subunits within the membrane that spins as protons bind to specific amino acid residues (like aspartate), neutralizing charge and completing a rotation before exiting into the matrix.
3. Internal Rod (γ-subunit): Attached to the rotor, this asymmetric shaft spins inside the catalytic knob.
4. Catalytic Knob (F1 head): Stationary α and β hexamer subunits in the matrix. As the internal rod turns, it alters the three-dimensional conformation of the catalytic β subunits, forcing ADP and inorganic phosphate (Pi) together into ATP.

ATP Accounting Summary per Glucose:
• Glycolysis: 2 ATP (substrate-level) + 2 NADH (~3-5 ATP)
• Pyruvate Oxidation: 2 NADH (~5 ATP)
• Citric Acid Cycle: 2 ATP (substrate-level) + 6 NADH (~15 ATP) + 2 FADH2 (~3 ATP)
• Total theoretical yield: 30 to 32 ATP per glucose molecule, representing roughly 34% thermodynamic efficiency!`,
        subsections: [
          {
            title: 'Rotary Mechanism',
            body: 'Paul Boyer and John Walker received the 1997 Nobel Prize in Chemistry for elucidating the rotational catalysis mechanism of ATP synthase.',
          },
        ],
        keyTerms: [
          { term: 'Chemiosmosis', definition: 'Coupling of transmembrane proton movement down its gradient with ATP synthesis.' },
          { term: 'ATP Synthase', definition: 'Nanoscale rotary motor complex converting proton-motive force into chemical energy.' },
        ],
      },
    ],
  },
  {
    id: 'doc-calc-1',
    subjectId: 'subj-calc',
    title: 'Taylor Series, Maclaurin Expansions & Convergence (Ch. 11)',
    author: 'Prof. James Stewart',
    totalPages: 4,
    fileType: 'bundled',
    uploadedAt: '2026-11-09',
    bookmarks: [2],
    pages: [
      {
        pageNumber: 1,
        title: 'Section 11.10: Taylor and Maclaurin Polynomials',
        content: `When approximating smooth, infinitely differentiable functions f(x) by polynomials near a base point x = a, we construct Taylor polynomials.
The n-th degree Taylor polynomial of f at a is:
Tn(x) = f(a) + f'(a)(x - a) + (f''(a)/2!)(x - a)^2 + ... + (f^(n)(a)/n!)(x - a)^n = Σ [f^(k)(a)/k!] * (x - a)^k from k=0 to n.

When the base center is a = 0, this special case is termed the Maclaurin Series:
f(x) = Σ [f^(n)(0)/n!] * x^n.

Taylor's Inequality (Remainder Bound):
If |f^(n+1)(x)| ≤ M for |x - a| ≤ d, then the remainder Rn(x) = f(x) - Tn(x) satisfies the bound:
|Rn(x)| ≤ [M / (n + 1)!] * |x - a|^(n + 1) for all |x - a| ≤ d.
Because (n + 1)! in the denominator grows faster than any exponential power |x - a|^(n + 1), the remainder Rn(x) converges to 0 as n approaches infinity for all x within the radius of convergence.`,
        subsections: [
          {
            title: 'Standard Maclaurin Expansions to Memorize',
            body: 'e^x = Σ x^n / n! = 1 + x + x²/2! + x³/3! + ... (R = ∞)\nsin(x) = Σ (-1)^n x^(2n+1) / (2n+1)! = x - x³/3! + x⁵/5! - ... (R = ∞)\ncos(x) = Σ (-1)^n x^(2n) / (2n)! = 1 - x²/2! + x⁴/4! - ... (R = ∞)\n1 / (1 - x) = Σ x^n = 1 + x + x² + x³ + ... (for |x| < 1)',
          },
        ],
        keyTerms: [
          { term: 'Taylor Series', definition: 'Power series representation of a differentiable function around center a.' },
          { term: 'Radius of Convergence', definition: 'Distance R such that the series converges for |x - a| < R.' },
        ],
      },
      {
        pageNumber: 2,
        title: 'Section 11.11: Convergence Tests: The Ratio & Root Tests',
        content: `To determine the exact interval and radius of convergence R of any power series Σ c_n (x - a)^n, the Ratio Test is the principal analytical tool.

The Ratio Test:
Let L = lim (n → ∞) | a_(n+1) / a_n |.
1. If L < 1, the series converges absolutely.
2. If L > 1 (or L = ∞), the series diverges.
3. If L = 1, the test is inconclusive; endpoints must be tested independently using the Alternating Series Test or p-Series Test.

Example Computation:
Consider f(x) = Σ (x - 3)^n / (n * 2^n).
Apply the ratio test to the terms:
lim (n → ∞) | [(x - 3)^(n+1) / ((n+1) * 2^(n+1))] / [(x - 3)^n / (n * 2^n)] |
= lim (n → ∞) | (x - 3) / 2 | * (n / (n + 1)) = |x - 3| / 2.
For absolute convergence, require |x - 3| / 2 < 1 ⟹ |x - 3| < 2.
Hence the radius of convergence R = 2, centered at a = 3, yielding preliminary interval (1, 5).
Testing endpoints:
At x = 5: Σ 1/n diverges (Harmonic series, p = 1).
At x = 1: Σ (-1)^n / n converges (Alternating harmonic series).
Interval of convergence: [1, 5).`,
        keyTerms: [
          { term: 'Ratio Test', definition: 'Limit test comparing consecutive term magnitudes to determine convergence.' },
          { term: 'Harmonic Series', definition: 'The divergent infinite series Σ (1/n).' },
        ],
      },
      {
        pageNumber: 3,
        title: 'Section 11.12: Differentiating & Integrating Power Series Term-by-Term',
        content: `A central theorem of real analysis establishes that within its interior interval of convergence (|x - a| < R), a power series is infinitely differentiable and integrable term-by-term.
If f(x) = Σ c_n (x - a)^n, then:
f'(x) = Σ n * c_n (x - a)^(n - 1)
∫ f(x) dx = C + Σ [c_n / (n + 1)] * (x - a)^(n + 1).

The radius of convergence R remains identical after term-by-term differentiation or integration, although convergence behavior at the boundary endpoints may change.

Application: Deriving arctan(x) series:
We know 1 / (1 + t^2) = Σ (-1)^n t^(2n) for |t| < 1.
Integrating both sides from 0 to x:
arctan(x) = ∫ [1 / (1 + t^2)] dt = Σ [(-1)^n * x^(2n+1) / (2n + 1)] = x - x^3/3 + x^5/5 - x^7/7 + ...
Evaluating at x = 1 yields Leibniz's famous formula for π:
π / 4 = 1 - 1/3 + 1/5 - 1/7 + ...`,
        keyTerms: [
          { term: 'Term-by-term integration', definition: 'Integrating an infinite polynomial term individually within radius R.' },
        ],
      },
      {
        pageNumber: 4,
        title: 'Section 11.13: Euler\'s Identity & Complex Exponential Bridge',
        content: `By extending the Maclaurin series of e^x to the complex plane with pure imaginary argument x = iθ (where i^2 = -1):
e^(iθ) = Σ (iθ)^n / n!
= 1 + iθ + (iθ)^2/2! + (iθ)^3/3! + (iθ)^4/4! + (iθ)^5/5! + ...
= (1 - θ^2/2! + θ^4/4! - ...) + i(θ - θ^3/3! + θ^5/5! - ...)
Notice that the real group is precisely the Maclaurin expansion of cos(θ), and the imaginary coefficient group is sin(θ)!

Hence, Euler's Formula:
e^(iθ) = cos(θ) + i sin(θ)

Substituting θ = π:
e^(iπ) = cos(π) + i sin(π) = -1 + 0 = -1.
Rearranging yields Euler's Identity:
e^(iπ) + 1 = 0.
Widely celebrated as the most beautiful equation in mathematics, it interweaves the five fundamental mathematical constants: e, i, π, 1, and 0 using the three fundamental arithmetic operations: addition, multiplication, and exponentiation.`,
        keyTerms: [
          { term: "Euler's Formula", definition: 'e^(iθ) = cos(θ) + i sin(θ), connecting complex exponentials with trigonometry.' },
        ],
      },
    ],
  },
];

export const INITIAL_HIGHLIGHTS: Highlight[] = [
  {
    id: 'hl-1',
    docId: 'doc-bio-1',
    page: 1,
    text: 'C6H12O6 + 6 O2 → 6 CO2 + 6 H2O + Energy (ATP + heat)',
    color: 'yellow',
    note: 'Master equation for cellular respiration. Memorize ΔG = -686 kcal/mol.',
    createdAt: '2026-11-09',
  },
  {
    id: 'hl-2',
    docId: 'doc-bio-1',
    page: 2,
    text: 'Phosphofructokinase, an allosteric enzyme inhibited by high ATP and citrate, and activated by AMP',
    color: 'pink',
    note: 'PFK-1 is the key pacemaker regulation point in glycolysis!',
    createdAt: '2026-11-09',
  },
  {
    id: 'hl-3',
    docId: 'doc-bio-1',
    page: 5,
    text: 'Chemiosmosis is the energy-coupling mechanism that harnesses energy stored in the form of a hydrogen ion gradient across a membrane to drive cellular work, specifically the synthesis of ATP.',
    color: 'green',
    note: 'Peter Mitchell chemiosmotic hypothesis: PMF drives ATP rotary synthesis.',
    createdAt: '2026-11-10',
  },
];

export const INITIAL_ANNOTATIONS: Annotation[] = [
  {
    id: 'ann-1',
    docId: 'doc-bio-1',
    page: 2,
    x: 75,
    y: 28,
    content: 'Prof mentioned this will definitely be on Midterm 2 (Question on PFK-1 allosteric regulators).',
    color: '#eab308',
    createdAt: '2026-11-09',
  },
  {
    id: 'ann-2',
    docId: 'doc-bio-1',
    page: 4,
    x: 80,
    y: 62,
    content: 'Remember: Cyanide and CO inhibit Complex IV by binding heme Fe2+ preventing oxygen reduction.',
    color: '#ec4899',
    createdAt: '2026-11-10',
  },
];

export const INITIAL_TASKS: StudyTask[] = [
  {
    id: 'task-1',
    subjectId: 'subj-bio',
    title: 'Review Citric Acid Cycle & Chemiosmosis diagrams',
    priority: 'high',
    completed: false,
    estimatedPomodoros: 3,
    completedPomodoros: 2,
    dueDate: '2026-11-12',
    createdAt: '2026-11-09',
  },
  {
    id: 'task-2',
    subjectId: 'subj-bio',
    title: 'Run Quiz Buster on Cellular Respiration (Pages 1-5)',
    priority: 'medium',
    completed: true,
    estimatedPomodoros: 1,
    completedPomodoros: 1,
    dueDate: '2026-11-10',
    createdAt: '2026-11-09',
  },
  {
    id: 'task-3',
    subjectId: 'subj-calc',
    title: 'Practice 10 Ratio Test problems with endpoints convergence',
    priority: 'high',
    completed: false,
    estimatedPomodoros: 4,
    completedPomodoros: 1,
    dueDate: '2026-11-14',
    createdAt: '2026-11-10',
  },
  {
    id: 'task-4',
    subjectId: 'subj-neuro',
    title: 'Read Chapter 2 on Long-Term Potentiation (LTP)',
    priority: 'medium',
    completed: false,
    estimatedPomodoros: 2,
    completedPomodoros: 0,
    dueDate: '2026-11-15',
    createdAt: '2026-11-10',
  },
  {
    id: 'task-5',
    subjectId: 'subj-cs',
    title: 'Simulate LRU vs Clock Page Replacement algorithms',
    priority: 'low',
    completed: false,
    estimatedPomodoros: 2,
    completedPomodoros: 0,
    dueDate: '2026-11-16',
    createdAt: '2026-11-10',
  },
];

export const INITIAL_QUIZZES: SavedQuiz[] = [
  {
    id: 'quiz-saved-1',
    subjectId: 'subj-bio',
    docId: 'doc-bio-1',
    title: 'ATP Chemiosmosis & Redox Mastery Check',
    topic: 'Cellular Respiration & Chemiosmosis',
    pageReference: 'Pages 1-5',
    summary: 'Evaluates understanding of redox reactions, glycolysis regulation, and proton-motive force.',
    score: 80,
    totalQuestions: 5,
    completedAt: '2026-11-10',
    createdAt: '2026-11-09',
    questions: [
      {
        id: 'q1',
        type: 'multiple_choice',
        question: 'Which enzyme serves as the primary allosteric pacemaker of glycolysis, inhibited by high ATP and stimulated by AMP?',
        options: ['Hexokinase', 'Phosphofructokinase-1 (PFK-1)', 'Pyruvate kinase', 'Aldolase'],
        correctAnswer: 'Phosphofructokinase-1 (PFK-1)',
        explanation: 'PFK-1 catalyzes the irreversible phosphorylation of fructose-6-phosphate to fructose-1,6-bisphosphate and is allosterically regulated by ATP, AMP, and citrate.',
        userAnswer: 'Phosphofructokinase-1 (PFK-1)',
        isCorrect: true,
      },
      {
        id: 'q2',
        type: 'true_false',
        question: 'In cellular respiration, glucose is reduced into CO2 and oxygen is oxidized into H2O.',
        options: ['True', 'False'],
        correctAnswer: 'False',
        explanation: 'The opposite is true: glucose is oxidized (loses electrons/hydrogens to become CO2) and oxygen is reduced (gains electrons to become H2O).',
        userAnswer: 'False',
        isCorrect: true,
      },
      {
        id: 'q3',
        type: 'multiple_choice',
        question: 'What immediate energy source directly drives the catalytic rotary synthesis of ATP by ATP synthase?',
        options: [
          'Direct hydrolysis of GTP',
          'Proton-motive force (H+ gradient) across the inner mitochondrial membrane',
          'Phosphorylation of Cytochrome c',
          'Oxidation of NADH in the cytosol',
        ],
        correctAnswer: 'Proton-motive force (H+ gradient) across the inner mitochondrial membrane',
        explanation: 'As protons flow through the stator and rotor of ATP synthase down their electrochemical gradient into the matrix, the rotor spins, forcing conformational changes in the F1 catalytic head that synthesize ATP.',
        userAnswer: 'Proton-motive force (H+ gradient) across the inner mitochondrial membrane',
        isCorrect: true,
      },
      {
        id: 'q4',
        type: 'multiple_choice',
        question: 'How many net ATP molecules are generated per molecule of glucose strictly through substrate-level phosphorylation across glycolysis and the citric acid cycle combined?',
        options: ['2 ATP', '4 ATP', '30-32 ATP', '38 ATP'],
        correctAnswer: '4 ATP',
        explanation: '2 net ATP are produced in glycolysis and 2 ATP (or GTP) are produced in the citric acid cycle (1 per turn × 2 turns per glucose) via substrate-level phosphorylation, equaling 4 net ATP.',
        userAnswer: '2 ATP',
        isCorrect: false,
      },
      {
        id: 'q5',
        type: 'multiple_choice',
        question: 'What is the terminal electron acceptor in the mitochondrial electron transport chain under aerobic conditions?',
        options: ['NAD+', 'FAD', 'Molecular oxygen (O2)', 'Cytochrome oxidase'],
        correctAnswer: 'Molecular oxygen (O2)',
        explanation: 'Oxygen has the highest electronegativity in the chain and acts as the final electron sink, combining with electrons and protons to form water.',
        userAnswer: 'Molecular oxygen (O2)',
        isCorrect: true,
      },
    ],
  },
];
