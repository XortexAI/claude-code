import { XMemClient } from 'xmem-ai'

const apiUrl = process.env.XMEM_API_URL || 'http://localhost:8000'
const apiKey = process.env.XMEM_API_KEY || ''

export const xmemClient = new XMemClient(apiUrl, apiKey)
