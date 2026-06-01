import type { GameState } from './types'
import { evaluateHand } from './hand'

export function settleHands(state: GameState): GameState {
  const dealerEval = evaluateHand(state.dealerHand)
  const dealerBust = dealerEval.isBust
  const dealerBJ = dealerEval.isBlackjack
  const dealerValue = dealerEval.value

  const players = state.players.map((player) => {
    let totalPayout = 0
    const hands = player.hands.map((hand) => {
      if (hand.isSurrendered) return hand

      const playerEval = evaluateHand(hand.cards)
      const playerBJ = playerEval.isBlackjack
      const playerValue = playerEval.value

      let result: typeof hand.result = 'pending'
      let payoutMult = 0

      if (playerBJ && dealerBJ) {
        result = 'push'; payoutMult = 0
      } else if (playerBJ) {
        result = 'blackjack'
        payoutMult = state.rules.blackjackPayout === '3:2' ? 1.5 : 1.2
      } else if (dealerBJ) {
        result = 'lose'; payoutMult = 0
      } else if (playerEval.isBust) {
        result = 'lose'; payoutMult = 0
      } else if (dealerBust) {
        result = 'win'; payoutMult = 1
      } else if (playerValue > dealerValue) {
        result = 'win'; payoutMult = 1
      } else if (playerValue < dealerValue) {
        result = 'lose'; payoutMult = 0
      } else {
        result = 'push'; payoutMult = 0
      }

      const payout = payoutMult === 0 ? 0 : Math.floor(hand.bet * payoutMult)
      if (result === 'lose') {
        totalPayout += 0
      } else {
        totalPayout += hand.bet + payout
      }
      return { ...hand, result, payout }
    })

    return { ...player, chips: player.chips + totalPayout, hands }
  })

  return { ...state, players, phase: 'round_end' }
}
