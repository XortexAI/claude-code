import type { Command } from '../../types/command.js'

const xingest: Command = {
  type: 'local',
  name: 'xingest',
  description: 'Ingest current conversation into XMem memory',
  supportsNonInteractive: true,
  load: () => import('./xingest.js'),
}

export default xingest
