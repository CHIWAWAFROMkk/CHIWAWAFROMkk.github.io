![A campus walkway and library scene](/assets/editorial/campus-courtyard.webp)
*AI-generated illustration · not a real project scene or product screenshot*

A study that starts from university life: when AI can write the answer, how do we know the task is really done?

## An answer is not yet a finished task

Writing a notice, explaining a concept, planning an event. The most ordinary campus tasks often carry dates, conditions and responsibilities at once. After the text is generated, someone still has to check what it left out.

The project grounds the question in real tasks: in which situations do students use AI, and does "it felt helpful" mean the task was done better?

## More kinds of input, more specific questions

From text chat to images and audio, and on to operating a screen, the tools can reach more information. Research has to shift from "what can it do" to "under which conditions is it reliable".

- 2022.11 · ChatGPT: text conversation ([release](https://openai.com/index/chatgpt/))
- 2024.05 · GPT-4o: multimodal interaction ([release](https://openai.com/index/hello-gpt-4o/))
- 2024.10 · Claude: Computer Use public preview ([release](https://www.anthropic.com/news/3-5-models-and-computer-use))
- 2025 · Claude Code: into the project workflow ([release](https://www.anthropic.com/news/claude-3-7-sonnet))

Selected product releases, showing how the way we interact has changed.

## Putting verification back into the process

The study analyses the user's perception, the quality of the task and independent judgement separately, giving clear dimensions for evaluation. Preparing input, waiting for generation, revising and checking: all four count towards the cost of a task.

![From question to a repeatable method (diagram in Chinese)](/assets/editorial/campus-method.svg)

A sketch of the study's structure: task input and the basis for checking together support experiments and feedback. It does not mean experimental results have been obtained.

## How is the data handled?

The Python 3.13 standard library validates fields, dates, categories and ratings; every record sharing a response ID is quarantined. Missing data stays empty, and non-users' helpfulness ratings are not counted as zero.

The program is published with its tests. Without questionnaire data, proportions and means come out as null. [Questionnaire and definitions (in Chinese)](/downloads/campus/questionnaire.md)

### Run it locally

Download these three files into one folder and open PowerShell there: [analysis program](/downloads/campus/analysis.py) · [tests](/downloads/campus/test_analysis.py) · [blank input](/downloads/campus/input_template.json)

```
py -3.13 -B -m unittest -v test_analysis
py -3.13 analysis.py --input input_template.json --period-start 2026-09-01 --period-end 2026-09-30
```

## Paper and evidence

[Download the paper (in Chinese)](/downloads/campus/research.md) · [Download the evidence ledger (in Chinese)](/downloads/campus/evidence.md)

### Research question

AI can take part in coursework, organising material, campus errands and everyday planning. Using published literature, this study compares the conditions under which these tasks are done and analyses how tool output, task quality and a person's independent judgement relate. Its outcome is a literature synthesis, a scenario analysis and a five-stage task evaluation framework.

### Sources and method

The core evidence is representative studies and official guidance published between January 2023 and April 2024, grouped by student perception, ways of learning, knowledge tasks, citation reliability and complex planning. Comparisons keep the differences in subjects, design and versions. Later product releases are used to show how interaction has changed.

### Finding 1: subjective approval must be kept apart from objective performance

Chan and Hu surveyed 399 students at six Hong Kong universities on their perceptions, uses and concerns about generative AI. Convenience sampling and a cross-sectional design mean it can describe attitudes, not prove that grades improved. ([Chan & Hu, 2023, journal article](https://link.springer.com/article/10.1186/s41239-023-00411-8))

So situations of use, perceived help and quality of completion should be reported separately. Satisfaction answers how the user felt; correctness and total time answer how the task went.

### Finding 2: the way people work with AI shapes how learning is judged

Lee and colleagues compared a guided ChatGPT tool with plain ChatGPT among 61 students. It gives evidence about how guidance shapes learning; the comparison is between two ways of using AI and cannot be restated as AI versus no AI. ([Lee et al., 2024, journal article](https://link.springer.com/article/10.1186/s41239-024-00447-4))

The workflow drawn from it: try on your own first, then get hints, revise, and finally explain the key steps without the tool. An explanation that looks clear and a learner who can do it alone should be judged separately.

### Finding 3: task gains come with conditions

Noy and Zhang's writing experiment with 453 professionals supports short-term gains in speed and quality from generative AI on specific professional writing tasks. Its subjects and tasks differ from long-term university learning, and that difference has to be kept when applying it to campus life. ([Noy & Zhang, 2023, paper record](https://pubmed.ncbi.nlm.nih.gov/37440646/))

The cost of a task should include preparing input, waiting for generation, revising and checking. Fast generation is only one step.

### Finding 4: citations and complex constraints need outside checking

Walters and Wilder checked 636 references generated by GPT-3.5 and GPT-4, recording fabricated citations and bibliographic errors. The results belong to those models and prompts at that time and cannot be used as a fixed error rate for every tool. ([Walters & Wilder, 2023, paper record](https://pubmed.ncbi.nlm.nih.gov/37679503/))

TravelPlanner v1 breaks trip planning into many real-world constraints and records how language agents struggle with tool use and constraint satisfaction. It shows why time, budget, place and similar requirements should be checked one by one. ([TravelPlanner, 2024, v1](https://arxiv.org/abs/2402.01622v1))

### Scenario analysis

| Scenario | Where AI helps | Basis for sign-off |
|---|---|---|
| Coursework | Explaining concepts, giving practice hints | The textbook and answering independently |
| Learning to code | Explaining errors, suggesting what to check | Code that runs, tests and an explanation of the logic |
| Literature | Suggesting search terms, organising full texts already obtained | DOI, publisher page and the original text |
| Campus errands | Pulling tasks and deadlines out of notices | Item-by-item comparison with the official notice |
| Event budgets | Drafting purchase plans and itemised sums | Recomputing unit prices, quantities, totals and constraints |
| Everyday planning | Collecting options and ways to compare them | Official real-time information and the specific conditions |

### Conclusion

Published research shows that judging AI in use has to be tied to specific tasks and ways of use. This synthesis treats subjective perception, objective performance, reliability and independent judgement separately, and turns them into a task evaluation framework for campus and everyday situations.
