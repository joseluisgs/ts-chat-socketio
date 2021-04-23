/**
* FUNCIONALIDAD DEL SOCKET.IO
*/

// Librerías
import * as socketio from 'socket.io';
import http from 'http';
import chalk from 'chalk';

// Creamos el módulo de configurar. Es una función que recibe Up
export default (servicio: http.Server) => {
  // Lanzamos la parte de Socket.io
  const activeUsers = new Set(); // Usuarios activos

  // Creamos el socket asociado a nuestro servicio
  const io = new socketio.Server();
  io.attach(servicio);

  // Si nos llega el evento de connexión
  io.on('connection', (socket: any) => {
    socket.emit('status', '👋 Hola desde el servidor');

    // Cuando nos llegue el evento de nuevo usuario
    socket.on('new user', (data: any) => {
      // eslint-disable-next-line no-param-reassign
      socket.userId = data;
      activeUsers.add(data);
      // Emitimos el evento de nuevo usuario
      io.emit('new user', [...activeUsers]);
      console.log(chalk.cyan(`-> Nuevo cliente ${socket.userId} conectado: ${new Date().toLocaleString()}`));
    });

    // Si nos llega el evento de desconectar
    socket.on('disconnect', () => {
      activeUsers.delete(socket.userId);
      // Emitimos que se ha desconectado
      io.emit('user disconnected', socket.userId);
      console.log(chalk.yellow(`<- Cliente ${socket.userId} desconectado: ${new Date().toLocaleString()}`));
    });

    // Nos llega un mensaje
    socket.on('chat message', (data: any) => {
      // Emitimos le mensaje
      io.emit('chat message', data);
    });

    // Si nos llega el evento escribiendo
    socket.on('typing', (data: any) => {
      // Emitimos a todos que estamos tecleando
      socket.broadcast.emit('typing', data);
    });
  });
};
