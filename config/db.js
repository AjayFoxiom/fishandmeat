const { PrismaClient } = require('@prisma/client')

let prisma;

if (!global.prisma) {
    global.prisma = new PrismaClient()
}

prisma = global.prisma;

prisma.$connect()
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((err) => {
        console.error('Error connecting to MongoDB:', err);
    });


module.exports = prisma;

