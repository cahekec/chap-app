const socket = io();

const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $sendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");
const $sidebar = document.querySelector("#sidebar");

// Templates

const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-message-template")
  .innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Options

const { username, room } = Qs.parse(location.search.substr(1), {
  ignoreQuieryPrefix: true
});

const autoscroll = () => {
  // new Message

  const $newMessage = $messages.lastElementChild;

  // Height of the new message

  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // Visible height

  const visibleHeight = $messages.offsetHeight;

  // Height of messages container

  const contantHeight = $messages.scrollHeight;

  // How far have I scroll

  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (contantHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = contantHeight;
  }
};

socket.on("message", message => {
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("HH:mm")
  });

  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("locationMessage", message => {
  const html = Mustache.render(locationTemplate, {
    username: message.username,
    url: message.text,
    createdAt: moment(message.createdAt).format("HH:mm")
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("roomData", data => {
  const html = Mustache.render(sidebarTemplate, {
    ...data
  });
  $sidebar.innerHTML = html;
});

$messageForm.addEventListener("submit", e => {
  e.preventDefault();

  if ($messageFormInput.value === "") {
    return;
  }

  $messageFormButton.setAttribute("disabled", "disabled");

  const message = $messageFormInput.value;

  socket.emit("sendMessage", message, error => {
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();
    console.log(error || "The message was delivered");
  });
});

$sendLocationButton.addEventListener("click", () => {
  $sendLocationButton.setAttribute("disabled", "disabled");

  navigator.geolocation.getCurrentPosition(function(position) {
    socket.emit(
      "sendLocation",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      },
      () => {
        console.log("Location is shared");
        $sendLocationButton.removeAttribute("disabled");
      }
    );
  });
});

socket.emit("join", { username, room }, error => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
