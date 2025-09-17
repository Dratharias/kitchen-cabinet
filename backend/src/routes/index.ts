import { FastifyInstance } from 'fastify';
import { RouteRegistry } from '../utils/route-registry.js';
import { authGuard, loginHandler } from '../controllers/authController.js';
import { publicationController } from '../controllers/publicationController.js';

export default async function createRoutes(fastify: FastifyInstance) {
  const registry = new RouteRegistry(fastify, authGuard);

  // Public authentication route
  registry.registerCustomRoute('POST', '/api/auth/login', loginHandler);

  // Protected CRUD routes
  registry.registerCrud(publicationController, {
    path: '/api/publications',
    protected: true
  });

  // Public CRUD routes with restricted methods
  registry.registerCrud(publicationController, {
    path: '/api/public/publications',
    methods: ['findMany', 'findById', 'search']
  });
}
