import type { Command } from '../../types/command.js'

const xsearch: Command = {
  type: 'local',
  name: 'xsearch',
  description: 'Search XMem memory and retrieve relevant context',
  supportsNonInteractive: true,
  load: () => import('./xsearch.js'),
}

export default xsearch
