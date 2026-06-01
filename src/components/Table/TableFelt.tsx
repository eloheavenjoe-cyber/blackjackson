import type { ReactNode } from 'react'

export function TableFelt({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-felt-dark flex flex-col">
      <div
        className="flex-1 m-2 sm:m-4 rounded-[3rem] bg-felt border-8 border-amber-900/50 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] overflow-hidden"
        style={{
          backgroundImage: 'radial-gradient(ellipse at center, #0d5e2e 0%, #094a24 100%)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
