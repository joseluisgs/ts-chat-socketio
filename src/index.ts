import express from 'express';
import http from 'http';
import chalk from 'chalk';
import { AddressInfo } from 'node:net';
import * as socketio from 'socket.io';

import config from './config';

const PORT = 5000;

/**
 * Clase servidor del CHAT
 */
class Server {
  private app: express.Express;

  private servicio!: http.Server;

  private io!:socketio.Server;

  /**
   * Constructor
   */
  constructor() {
    // Cargamos express como servidor
    this.app = express();
  }

  /**
   * Inicia el Servidor
   * @returns instancia del servidor http Server
   */
  async start() {
    // Le apliacamos la configuracion a nuestro Servidor
    config(this.app);

    // Nos ponemos a escuchar a un puerto definido en la configuracion
    this.servicio = this.app.listen(PORT, () => {
      const address = this.servicio.address() as AddressInfo;
      const host = address.address === '::' ? 'localhost' : address.address; // dependiendo de la dirección asi configuramos
      const { port } = address; // el puerto
      if (process.env.NODE_ENV !== 'test') {
        console.log(chalk.green.bold(`🟢 Servidor CHAT escuchando ✅ -> http://${host}:${port}`));
      }
    });
    this.initIO();
    return this.servicio; // Devolvemos la instancia del servidor
  }

  /**
   * Cierra el Servidor y con ello también nos desconectamos de los servicios que tengamos como MongoDB
   */
  async close() {
    // Desconectamos el socket server
    this.servicio.close();
    if (process.env.NODE_ENV !== 'test') {
      this.io.close();
      console.log(chalk.grey.bold('⚪️ Servidor parado ❎'));
    }
  }

  initIO() {
    // Lanzamos la parte de Socket.io
    const activeUsers = new Set(); // Usuarios activos
    this.io = new socketio.Server();
    this.io.attach(this.servicio);

    // Si nos llega el evento de connexión
    this.io.on('connection', (socket: any) => {
      socket.emit('status', '👋 Hola desde el servidor');

      // Cuando nos llegue el evento de nuevo usuario
      socket.on('new user', (data: any) => {
        // eslint-disable-next-line no-param-reassign
        socket.userId = data;
        activeUsers.add(data);
        // Emitimos el evento de nuevo usuario
        this.io.emit('new user', [...activeUsers]);
        console.log(chalk.cyan(`-> Nuevo cliente ${socket.userId} conectado: ${new Date().toLocaleString()}`));
      });

      // Si nos llega el evento de desconectar
      socket.on('disconnect', () => {
        activeUsers.delete(socket.userId);
        // Emitimos que se ha desconectado
        this.io.emit('user disconnected', socket.userId);
        console.log(chalk.yellow(`<- Cliente ${socket.userId} desconectado: ${new Date().toLocaleString()}`));
      });

      // Nos llega un mensaje
      socket.on('chat message', (data: any) => {
        // Emitimos le mensaje
        this.io.emit('chat message', data);
      });

      // Si nos llega el evento escribiendo
      socket.on('typing', (data: any) => {
        // Emitimos a todos que estamos tecleando
        socket.broadcast.emit('typing', data);
      });
    });
  }
}

/**
 * Devuelve la instancia de conexión siempre la misma, singleton
 */
const server = new Server();
// Exportamos el servidor inicializado
export default server;

// La siguiente sección de código sólo se ejecutará si este fichero es el punto de entrada del programa principal
// Lo hacemos porque también lo llamamos en test.
// https://nodejs.org/api/deprecations.html#DEP0144
if (require.main === module) {
  server.start();
}

process.on('unhandledRejection', (err) => {
  console.log(chalk.red('❌ Custom Error: An unhandledRejection occurred'));
  console.log(chalk.red(`❌ Custom Error: Rejection: ${err}`));
});
