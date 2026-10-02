export function closestCardIndex(cards: { offsetLeft: number; offsetWidth: number }[], center: number): number {
  return cards.reduce((best, card, index) => Math.abs(card.offsetLeft + card.offsetWidth / 2 - center)
    < Math.abs(cards[best].offsetLeft + cards[best].offsetWidth / 2 - center) ? index : best, 0);
}
