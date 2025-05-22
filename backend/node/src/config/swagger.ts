import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'MemeVersus API Documentation',
      version: '1.0.0',
      description: 'API documentation for the MemeVersus game platform',
      contact: {
        name: 'API Support',
        email: 'support@memeversus.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.memeversus.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            }
          }
        },
        Player: {
          type: 'object',
          properties: {
            walletAddress: {
              type: 'string',
              description: 'Player\'s wallet address'
            },
            username: {
              type: 'string',
              description: 'Player\'s username'
            },
            totalGames: {
              type: 'number',
              description: 'Total number of games played'
            },
            wins: {
              type: 'number',
              description: 'Number of games won'
            },
            losses: {
              type: 'number',
              description: 'Number of games lost'
            },
            draws: {
              type: 'number',
              description: 'Number of games drawn'
            },
            rating: {
              type: 'number',
              description: 'Player\'s rating'
            }
          }
        },
        GameRoom: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Game room ID'
            },
            mode: {
              type: 'string',
              enum: ['FrameRace', 'TimeAttack', 'Survival'],
              description: 'Game mode'
            },
            status: {
              type: 'string',
              enum: ['waiting', 'in_progress', 'completed'],
              description: 'Game status'
            },
            players: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'List of player wallet addresses'
            }
          }
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: ['./src/routes/*.ts', './src/models/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options); 