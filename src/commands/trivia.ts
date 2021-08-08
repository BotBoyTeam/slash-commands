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
import { shuffleArray } from '../util';
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
      guildIDs: process.env.COMMANDS_DEV_GUILD || [],
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
        }
      ],
      throttling: {
        usages: 1,
        duration: 10
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
            name: `${question.category}\nDifficulty: ${question.difficulty}`
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
    }
    await btnCtx.editParent(opts);
  }

  async run(ctx: CommandContext) {
    await ctx.defer();
    const response = await needle(
      'get',
      `https://opentdb.com/api.php?amount=1${ctx.options.difficulty ? `&difficulty=${ctx.options.difficulty}` : ''}`
    );
    const question = (response.body as TriviaResponse).results[0];
    const choices = shuffleArray([question.correct_answer, ...question.incorrect_answers]);

    await ctx.send({
      embeds: [
        {
          author: {
            name: `${question.category}\nDifficulty: ${question.difficulty}`
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
