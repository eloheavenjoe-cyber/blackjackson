import type { GameRules } from '../../engine/types'

type Props = {
  rules: GameRules
  onChange: (rules: GameRules) => void
}

export function RulesConfig({ rules, onChange }: Props) {
  function update<K extends keyof GameRules>(key: K, value: GameRules[K]) {
    onChange({ ...rules, [key]: value })
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gold">Game Rules</h3>
      <div className="grid grid-cols-2 gap-4">
        <SelectField label="Decks" value={rules.decks} options={[1,2,3,4,5,6,7,8]} onChange={(v) => update('decks', Number(v) as any)} />
        <SelectField label="Dealer Soft 17" value={rules.dealerSoft17} options={['stand','hit']} onChange={(v) => update('dealerSoft17', v as any)} />
        <SelectField label="Blackjack Payout" value={rules.blackjackPayout} options={['3:2','6:5']} onChange={(v) => update('blackjackPayout', v as any)} />
        <SelectField label="Surrender" value={rules.surrender} options={['none','late']} onChange={(v) => update('surrender', v as any)} />
        <SelectField label="Insurance" value={rules.insurance ? 'on' : 'off'} options={['on','off']} onChange={(v) => update('insurance', v === 'on')} />
        <SelectField label="Double Down" value={rules.doubleDown} options={['any','9-10-11','none']} onChange={(v) => update('doubleDown', v as any)} />
        <SelectField label="Splits" value={rules.splits} options={['none','once','twice','unlimited']} onChange={(v) => update('splits', v as any)} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <NumberField label="Starting Chips" value={rules.startingChips} min={100} max={10000} step={100} onChange={(v) => update('startingChips', v)} />
        <NumberField label="Min Bet" value={rules.minBet} min={1} max={rules.maxBet} step={1} onChange={(v) => update('minBet', v)} />
        <NumberField label="Max Bet" value={rules.maxBet} min={rules.minBet} max={rules.startingChips} step={10} onChange={(v) => update('maxBet', v)} />
        <NumberField label="Turn Timer (s)" value={rules.turnTimeLimit} min={0} max={120} step={5} onChange={(v) => update('turnTimeLimit', v)} />
      </div>
    </div>
  )
}

function SelectField({ label, value, options, onChange }: { label: string; value: any; options: any[]; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm text-gray-400">{label}</span>
      <select
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-white text-sm focus:border-gold focus:outline-none"
      >
        {options.map((opt) => (
          <option key={String(opt)} value={String(opt)}>{String(opt)}</option>
        ))}
      </select>
    </label>
  )
}

function NumberField({ label, value, min, max, step, onChange }: { label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="text-sm text-gray-400">{label}</span>
      <input
        type="number"
        value={value}
        min={min} max={max} step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 block w-full rounded-lg bg-gray-800 border border-white/10 px-3 py-2 text-white text-sm focus:border-gold focus:outline-none"
      />
    </label>
  )
}
