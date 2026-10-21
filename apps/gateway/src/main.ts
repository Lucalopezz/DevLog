import { createGatewayServer } from './server.js'

// Vercel captures a listening Node server and invokes it per request.
createGatewayServer().listen(Number(process.env.PORT ?? 3000))
