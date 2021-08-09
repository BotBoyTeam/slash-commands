import {
  ButtonStyle,
  CommandContext,
  ComponentActionRow,
  ComponentButtonLink,
  ComponentContext,
  ComponentType
} from 'slash-create';

export interface APISnazIntegerFormat {
  estimate: string;
  formatted: string;
  value: number;
}

export interface APISnazError {
  error: string;
  ok: false;
}

export interface SplitOptions {
  /** Maximum character length per message piece */
  maxLength?: number;
  /** Character to split the message with */
  char?: string;
  /** Text to prepend to every piece except the first */
  prepend?: string;
  /** Text to append to every piece except the last */
  append?: string;
}

/**
 * Splits a string into multiple chunks at a designated character that do not exceed a specific length.
 * @param string text Content to split
 * @param options Options controlling the behavior of the split
 */
export function splitMessage(
  text: string,
  { maxLength = 2000, char = '\n', prepend = '', append = '' }: SplitOptions = {}
) {
  if (text.length <= maxLength) return [text];
  const splitText = text.split(char);
  if (splitText.some((chunk) => chunk.length > maxLength)) throw new RangeError('SPLIT_MAX_LEN');
  const messages = [];
  let msg = '';
  for (const chunk of splitText) {
    if (msg && (msg + char + chunk + append).length > maxLength) {
      messages.push(msg + append);
      msg = prepend;
    }
    msg += (msg && msg !== prepend ? char : '') + chunk;
  }
  return messages.concat(msg).filter((m) => m);
}

/**
 * Checks to make sure the user who did the command is the one
 * touching the buttons.
 * @param btnCtx The component context
 * @param ctx The main context
 */
export async function ensureUserCtx(btnCtx: ComponentContext, ctx: CommandContext) {
  if (btnCtx.user.id !== ctx.user.id) {
    await btnCtx.send('Only the user who invoked this command can use the controls!', {
      ephemeral: true
    });
    return true;
  }
  return false;
}

/**
 * Convert a date into a common format string.
 * @param date The date to use
 */
export function dateFormat(date: number, format: string = 'f') {
  return `<t:${date / 1000}:${format}> (<t:${date / 1000}:R>)`;
}

/**
 * Convert a string list into a common format string.
 * @param list The string list
 * @param limit The amount of items to show
 * @param sep The seperating string
 */
export async function formatStringList(list: string[], limit = 10, sep = '\n') {
  return [...list.slice(0, 10), list.length > limit ? `*(${(list.length - limit).toLocaleString()} more)*` : '']
    .filter((v) => !!v)
    .join(sep);
}

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randArray<T = any>(array: T[]): T {
  return array[randInt(0, array.length - 1)];
}

export function shuffleArray<T = any>(array: T[]): T[] {
  return array.sort(() => Math.random() - 0.5);
}

export function times(number: number, func: (i: number) => any) {
  return ' '
    .repeat(number)
    .split('')
    .map((_, i) => func(i));
}

export function cutoffText(text: string, limit = 2000) {
  return text.length > limit ? text.slice(0, limit - 1) + '…' : text;
}

export function quickLinkButton(btn: Omit<ComponentButtonLink, 'type' | 'style'>): ComponentActionRow {
  return {
    type: ComponentType.ACTION_ROW,
    components: [
      {
        type: ComponentType.BUTTON,
        style: ButtonStyle.LINK,
        ...btn
      }
    ]
  };
}
