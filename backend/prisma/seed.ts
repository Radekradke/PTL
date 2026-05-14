import { createHash } from "crypto"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex")
}

async function createEmployeeIfNotExists(name: string, sectorId: number, username: string, password: string) {
  const employee = await prisma.employee.findFirst({
    where: {
      name,
      sectorId,
    },
  })

  if (!employee) {
    await prisma.employee.create({
      data: {
        name,
        sectorId,
        username,
        passwordHash: hashPassword(password),
      },
    })
    return
  }

  await prisma.employee.update({
    where: {
      id: employee.id,
    },
    data: {
      username: employee.username || username,
      passwordHash: employee.passwordHash || hashPassword(password),
    },
  })
}

async function main() {
  const sectors = [
    { name: "Financeiro", pin: "1234" },
    { name: "RH", pin: "4321" },
    { name: "Operações", pin: "9999" },
    { name: "Compras", pin: "5678" },
    { name: "Diretoria", pin: "0000" },
    { name: "TI", pin: "7777" },
  ]

  for (const sector of sectors) {
    await prisma.sector.upsert({
      where: {
        name: sector.name,
      },
      update: {
        pin: sector.pin,
      },
      create: sector,
    })
  }

  const ti = await prisma.sector.findUnique({ where: { name: "TI" } })
  const financeiro = await prisma.sector.findUnique({ where: { name: "Financeiro" } })

  if (ti) {
    await createEmployeeIfNotExists("André", ti.id, "andre.ti", "123456")
    await createEmployeeIfNotExists("Lucas", ti.id, "lucas.ti", "123456")
  }

  if (financeiro) {
    await createEmployeeIfNotExists("Carlos", financeiro.id, "carlos.financeiro", "123456")
    await createEmployeeIfNotExists("Fernanda", financeiro.id, "fernanda.financeiro", "123456")
  }

  console.log("Seed finalizado com sucesso 🚀")
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
