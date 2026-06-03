export type PlaylistTrack = {
  title: string
  url: string
}

export const PLAYLIST_TRACKS: PlaylistTrack[] = [
  { title: 'Casino Lounge (Pixabay)', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_6d5c9b6a1e.mp3' },
  { title: 'Smooth Jazz (Pixabay)', url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_5a3f2b8c9d.mp3' },
  { title: 'Night Vibes (Pixabay)', url: 'https://cdn.pixabay.com/audio/2022/05/17/audio_7e8d1c4f2a.mp3' },
  { title: 'Lo-Fi Chill (Pixabay)', url: 'https://cdn.pixabay.com/audio/2022/01/20/audio_2b4e6f8a1c.mp3' },
  { title: 'Jazz Club (Pixabay)', url: 'https://cdn.pixabay.com/audio/2022/10/25/audio_9a1b3c5d7e.mp3' },
  { title: 'Ambient Casino (Pixabay)', url: 'https://cdn.pixabay.com/audio/2022/08/14/audio_4f6d2e8a0b.mp3' },
]

import type { DealerPersona } from '../engine/types'

export const DEALER_IMAGES: Record<DealerPersona, string> = {
  default: '/dealers/default.svg',
  lady_gold: '/dealers/lady_gold.svg',
  mr_velvet: '/dealers/mr_velvet.svg',
  the_house: '/dealers/the_house.svg',
}
