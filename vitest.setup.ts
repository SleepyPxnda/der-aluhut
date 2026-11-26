import { realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'

const nuxtDirectory = realpathSync(join(import.meta.dirname, 'node_modules', 'nuxt'))
const { createError } = createRequire(join(nuxtDirectory, 'package.json'))('h3')

Object.assign(globalThis, { createError })
