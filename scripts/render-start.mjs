import { spawn } from 'child_process'

const env = {
  ...process.env,
  PORT: process.env.PORT || '5000',
  UPLOAD_DIR: process.env.UPLOAD_DIR || '/var/data/uploads',
  OUTPUT_DIR: process.env.OUTPUT_DIR || '/var/data/outputs',
  FRONTEND_DIST: process.env.FRONTEND_DIST || '/app/frontend/dist',
  PYTHON_PATH: process.env.PYTHON_PATH || '/opt/venv/bin/python'
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      env,
      shell: false,
      ...options
    })

    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`${command} ${args.join(' ')} exited with ${code ?? signal}`))
      }
    })
  })
}

function start(name, command, args) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    env,
    shell: false
  })

  child.on('exit', (code, signal) => {
    console.error(`${name} exited with ${code ?? signal}`)
    shutdown(code || 1)
  })

  return child
}

let shuttingDown = false
const children = []

function shutdown(code = 0) {
  if (shuttingDown) return
  shuttingDown = true

  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM')
  }

  setTimeout(() => process.exit(code), 1000).unref()
}

process.on('SIGTERM', () => shutdown(0))
process.on('SIGINT', () => shutdown(0))

try {
  await run('npm', ['run', 'migrate', '--workspace=plan2render-backend'])

  children.push(start('backend', 'npm', ['run', 'start', '--workspace=plan2render-backend']))
  children.push(start('worker', 'npm', ['run', 'start', '--workspace=plan2render-worker']))
} catch (error) {
  console.error(error)
  shutdown(1)
}
