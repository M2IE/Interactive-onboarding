import { spawn } from 'node:child_process'

const commands = [
  ['vite', ['build', '--watch']],
  ['tsup', ['--watch']],
]

const processes = commands.map(([command, args]) =>
  spawn(command, args, {
    cwd: new URL('..', import.meta.url),
    shell: true,
    stdio: 'inherit',
  }),
)

function stop() {
  for (const child of processes) {
    child.kill('SIGTERM')
  }
}

process.on('SIGINT', stop)
process.on('SIGTERM', stop)

await Promise.all(
  processes.map(
    (child) =>
      new Promise((resolve) => {
        child.on('exit', resolve)
      }),
  ),
)
