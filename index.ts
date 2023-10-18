import { start } from './src/sign'

start()
  .catch(e => {
      console.error(e)
      process.exit(1)
    })
  