#!/usr/bin/env node
import { pbkdf2Sync, randomBytes } from "node:crypto"
import readline from "node:readline"

const ITERATIONS = 210000
const KEYLEN = 32
const DIGEST = "sha256"

function askHidden(query) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    })

    const stdin = process.stdin
    const onData = (char) => {
      const key = char.toString("utf8")
      if (key === "\u0003") {
        process.stdout.write("\n")
        process.exit(1)
      }
      process.stdout.write("*")
    }

    process.stdout.write(query)
    stdin.on("data", onData)
    rl.question("", (answer) => {
      stdin.off("data", onData)
      rl.close()
      process.stdout.write("\n")
      resolve(answer)
    })
  })
}

async function main() {
  const password = String(await askHidden("Enter admin password (input hidden): ")).trim()
  if (!password) {
    process.stderr.write("Password cannot be empty.\n")
    process.exit(1)
  }

  const confirm = String(await askHidden("Confirm password: ")).trim()
  if (password !== confirm) {
    process.stderr.write("Password confirmation mismatch.\n")
    process.exit(1)
  }

  const salt = randomBytes(16)
  const derived = pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, DIGEST)
  const encoded = `pbkdf2$sha256$${ITERATIONS}$${salt.toString("base64")}$${derived.toString("base64")}`

  process.stdout.write("\nADMIN_PASSWORD_HASH value:\n")
  process.stdout.write(`${encoded}\n`)
  process.stdout.write("\nSet this in environment (never store plaintext password).\n")
}

main().catch(() => {
  process.stderr.write("Failed to generate password hash.\n")
  process.exit(1)
})
