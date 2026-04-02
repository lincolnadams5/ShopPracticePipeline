import { exec } from 'child_process'

export async function POST() {
  return new Promise((resolve) => {
    exec('python run_scoring.py', () => {
      resolve(Response.json({ success: true }))
    })
  })
}