import {
  SlashCommand,
  CommandOptionType,
  SlashCreator,
  CommandContext,
  ComponentContext,
  ComponentType,
  ButtonStyle,
  ComponentButton,
  EditMessageOptions
} from 'slash-create';
import needle from 'needle';
import { capitalize, shuffleArray } from '../util';
import { decode } from 'html-entities';
import { stripIndents } from 'common-tags';

export interface TriviaResponse {
  response_code: number;
  results: {
    category: string;
    type: string;
    difficulty: string;
    question: string;
    correct_answer: string;
    incorrect_answers: string[];
  }[];
}

const btnLabels = ['A', 'B', 'C', 'D'];
const btnStyles = [ButtonStyle.SUCCESS, ButtonStyle.DESTRUCTIVE, ButtonStyle.PRIMARY, ButtonStyle.SECONDARY];

export default class TriviaCommand extends SlashCommand {
  constructor(creator: SlashCreator) {
    super(creator, {
      name: 'trivia',
      description: 'Do some trivia.',
      options: [
        {
          type: CommandOptionType.STRING,
          name: 'difficulty',
          description: 'How hard do you want the question to be?',
          choices: [
            { name: 'Easy', value: 'easy' },
            { name: 'Medium', value: 'medium' },
            { name: 'Hard', value: 'hard' }
          ]
        },
        {
          type: CommandOptionType.INTEGER,
          name: 'category',
          description: 'Which category do you want to play in?',
          choices: [
            { name: 'General Knowledge', value: 9 },
            { name: 'Entertainment: Books', value: 10 },
            { name: 'Entertainment: Film', value: 11 },
            { name: 'Entertainment: Music', value: 12 },
            { name: 'Entertainment: Musicals & Theatres', value: 13 },
            { name: 'Entertainment: Television', value: 14 },
            { name: 'Entertainment: Video Games', value: 15 },
            { name: 'Entertainment: Board Games', value: 16 },
            { name: 'Science & Nature', value: 17 },
            { name: 'Science: Computers', value: 18 },
            { name: 'Science: Mathematics', value: 19 },
            { name: 'Mythology', value: 20 },
            { name: 'Sports', value: 21 },
            { name: 'Geography', value: 22 },
            { name: 'History', value: 23 },
            { name: 'Politics', value: 24 },
            { name: 'Art', value: 25 },
            { name: 'Celebrities', value: 26 },
            { name: 'Animals', value: 27 },
            { name: 'Vehicles', value: 28 },
            { name: 'Entertainment: Comics', value: 29 },
            { name: 'Science: Gadgets', value: 30 },
            { name: 'Entertainment: Japanese Anime & Manga', value: 31 },
            { name: 'Entertainment: Cartoon & Animations', value: 32 }
          ]
        }
      ],
      throttling: {
        usages: 1,
        duration: 20
      }
    });
  }

  async answer(
    btnCtx: ComponentContext,
    ctx: CommandContext,
    response: TriviaResponse,
    choices: string[],
    choiceSelected: number
  ) {
    if (btnCtx.user.id !== ctx.user.id) {
      await btnCtx.send('Someone else is answering this!', { ephemeral: true });
      return;
    }

    const selected = choices[choiceSelected];
    const question = response.results[0];

    const opts: EditMessageOptions = {
      embeds: [
        {
          author: {
            name: `${question.category}\nDifficulty: ${capitalize(question.difficulty)}`
          }
        }
      ],
      components: []
    };

    if (selected === question.correct_answer) {
      opts.embeds[0].description = stripIndents`
        ${decode(question.question)}

        ${choices
          .map((choice, i) =>
            choice === question.correct_answer
              ? `**\`${btnLabels[i]}.\` ${decode(choice)}**`
              : `**\`${btnLabels[i]}.\`** ${decode(choice)}`
          )
          .join('\n')}

        **Correct!**
      `;
      opts.embeds[0].color = 0x2ecc71;
    } else {
      opts.embeds[0].description = stripIndents`
        ${decode(question.question)}

        ${choices
          .map((choice, i) =>
            choice === selected
              ? `~~**\`${btnLabels[i]}.\`** ${decode(choice)}~~`
              : choice === question.correct_answer
              ? `**\`${btnLabels[i]}.\` ${decode(choice)}**`
              : `**\`${btnLabels[i]}.\`** ${decode(choice)}`
          )
          .join('\n')}

        **Nope, try again next time!**
      `;
      opts.embeds[0].color = 0xe74c3c;
    }
    await btnCtx.editParent(opts);
  }

  async run(ctx: CommandContext) {
    await ctx.defer();
    const response = await needle(
      'get',
      `https://opentdb.com/api.php?amount=1${ctx.options.difficulty ? `&difficulty=${ctx.options.difficulty}` : ''}${
        ctx.options.category ? `&category=${ctx.options.category}` : ''
      }`
    );
    const question = (response.body as TriviaResponse).results[0];
    const choices = shuffleArray([question.correct_answer, ...question.incorrect_answers]);

    await ctx.send({
      embeds: [
        {
          author: {
            name: `${question.category}\nDifficulty: ${capitalize(question.difficulty)}`
          },
          description: stripIndents`
            ${decode(question.question)}

            ${choices.map((choice, i) => `**\`${btnLabels[i]}.\`** ${decode(choice)}`).join('\n')}
          `
        }
      ],
      components: [
        {
          type: ComponentType.ACTION_ROW,
          components: choices.map(
            (_, i) =>
              ({
                type: ComponentType.BUTTON,
                style: btnStyles[i],
                label: btnLabels[i],
                custom_id: `trivia_answer_${i}`
              } as ComponentButton)
          )
        }
      ]
    });

    choices.map((_, i) =>
      ctx.registerComponent(`trivia_answer_${i}`, (btnCtx) => this.answer(btnCtx, ctx, response.body, choices, i))
    );
  }
}
