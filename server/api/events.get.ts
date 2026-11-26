import { addClient } from '../utils/events'

export default defineEventHandler((event) => addClient(event))
