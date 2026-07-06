import { sendRuntimeMessage } from '../shared/messaging';
import { InteractionBehavior } from '../shared/types';

let currentBehavior: InteractionBehavior = 'stop';
let armed = false;

export function armUserInteraction(behavior: InteractionBehavior): void {
  currentBehavior = behavior;
  if (armed) {
    return;
  }
  armed = true;
  document.addEventListener('mousedown', reportInteraction, true);
  document.addEventListener('keydown', reportInteraction, true);
  document.addEventListener('scroll', reportInteraction, true);
}

export function disarmUserInteraction(): void {
  armed = false;
  document.removeEventListener('mousedown', reportInteraction, true);
  document.removeEventListener('keydown', reportInteraction, true);
  document.removeEventListener('scroll', reportInteraction, true);
}

function reportInteraction(): void {
  if (!armed) {
    return;
  }
  void sendRuntimeMessage({ type: 'USER_INTERACTION', behavior: currentBehavior });
  if (currentBehavior !== 'restart') {
    disarmUserInteraction();
  }
}
