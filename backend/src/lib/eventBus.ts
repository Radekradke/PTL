import type { Response } from "express"

const clients = new Set<Response>()

export function addSseClient(res: Response): void {
  clients.add(res)
  res.on("close", () => clients.delete(res))
}

export function broadcastTicketChange(): void {
  const payload = "event: ticket:changed\ndata: {}\n\n"
  for (const client of clients) {
    try {
      client.write(payload)
    } catch {
      clients.delete(client)
    }
  }
}
