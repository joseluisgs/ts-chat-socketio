// Iniciamos el cliente de socket.io
const socket = io();

// Elementos del DOM que necesitamos 
const inboxPeople = document.querySelector(".inbox__people");
const inputField = document.querySelector(".message_form__input");
const messageForm = document.querySelector(".message_form");
const messageBox = document.querySelector(".messages__history");
const fallback = document.querySelector(".fallback");

let userName = "";

/**
 * Nos llega un usuario. Emitimos el evento y lo añadimos a la lista
 * @param {*} user 
 */
const newUserConnected = (user) => {
  userName = user || `User${Math.floor(Math.random() * 1000000)}`;
  // Emitimos el evento
  socket.emit("new user", userName);
  addToUsersBox(userName);
};

/**
 * Añade un usuario a la lista si no existe ya
 * @param {*} userName 
 * @returns 
 */
const addToUsersBox = (userName) => {
  if (!!document.querySelector(`.${userName}-userlist`)) {
    return;
  }
  // Creamos el elemento
  const userBox = `
    <div class="chat_ib ${userName}-userlist">
      <h5>${userName}</h5>
    </div>
  `;
  // Los añadimos
  inboxPeople.innerHTML += userBox;
};

/**
 * Añadimos un mensaje
 * @param {*} param0 
 */
const addNewMessage = ({ user, message }) => {
  const time = new Date();
  const formattedTime = time.toLocaleString("es-ES", { hour: "numeric", minute: "numeric" });

  // Si el mensaje es recibido
  const receivedMsg = `
  <div class="incoming__message">
    <div class="received__message">
      <p>${message}</p>
      <div class="message__info">
        <span class="message__author">${user}</span>
        <span class="time_date">${formattedTime}</span>
      </div>
    </div>
  </div>`;

  // Si el mensaje es nuestro
  const myMsg = `
  <div class="outgoing__message">
    <div class="sent__message">
      <p>${message}</p>
      <div class="message__info">
        <span class="time_date">${formattedTime}</span>
      </div>
    </div>
  </div>`;

  // Añadimos uno u otro según sea el nombre de usuario
  messageBox.innerHTML += (user === userName) ? myMsg : receivedMsg;
};

// Nos conectamos, lanzamos la función
newUserConnected();

/**
 * Enviamos el mensaje, emitiendo el evento
 */
messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!inputField.value) {
    return;
  }
  // Emitimos el evento
  socket.emit("chat message", {
    message: inputField.value,
    nick: userName,
  });
  // Limpiamos
  inputField.value = "";
});

/**
 * Si tecleamos
 */
inputField.addEventListener("keyup", () => {
  // Emitimos el evento
  socket.emit("typing", {
    isTyping: inputField.value.length > 0,
    nick: userName,
  });
});

/** RECEPCION DE EVENTOS */
// Si nos llega el evento de nuevo usuaro
socket.on("new user", (data) => {
  // Recibimos la lista de usuarios y los añadimos (si no están, ver función)
  data.map((user) => addToUsersBox(user));
});

// Evento de desconexion, si nos llega
socket.on("user disconnected", (userName) => {
  // Lo quitamos de la lista
  document.querySelector(`.${userName}-userlist`).remove();
});

// Si nos llega un nuevo mensaje
socket.on("chat message", (data) => {
  // Añadimos los mensajes
  addNewMessage({ user: data.nick, message: data.message });
});

// Si nos llega el evento escribiendo
socket.on("typing", (data) => {
  // Decostruimos los datos
  const { isTyping, nick } = data;

  if (!isTyping) {
    fallback.innerHTML = "";
    return;
  }
  // Lo pintamos
  fallback.innerHTML = `<p>${nick} esá escribiendo...</p>`;
});