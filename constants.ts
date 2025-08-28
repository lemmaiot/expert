import { v4 as uuidv4 } from 'uuid';
import { Message, Sender } from './types';

export const MAX_MESSAGES_PER_DAY = 20;

export const INITIAL_MESSAGE_LOCATION: Message = {
  id: uuidv4(),
  sender: Sender.AI,
  text: 'To get you the best help, which state in Nigeria are you based in?',
};

export const INITIAL_MESSAGE_PROMPT: Message = {
  id: uuidv4(),
  sender: Sender.AI,
  text: 'Thanks! How can I help with your business tech today? Describe your problem or idea.',
};

export const LOGO_URL = "https://loveemma.carrd.co/assets/images/gallery02/d3788757.png";
export const ICON_URL = "https://i.ibb.co/3S4kXn9/icon.png";
export const AI_AVATAR_URL = "https://loveemma.carrd.co/assets/images/gallery02/8e283846.png";
