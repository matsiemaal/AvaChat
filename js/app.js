import { 
  sendConnectionRequest,
  sendDisconnectRequest,
  sendRenderRequest
} from '../api/did-stream-api.js';
import { 
  chatGPTRequest
} from '../api/official-openai-api.js';
import { 
  openAIQARequest
} from '../api/openai-chat-api.js';
import { 
  llamaQARequest
} from '../api/llama2-70b-api.js';
import {
  claudeQARequest
} from '../api/claude-chat-api.js';
// Models and their corresponding request functions
const models = [
  { name: 'ChatGPT Third party', requestFunction: openAIQARequest },
  { name: 'ChatGPT', requestFunction: chatGPTRequest },
  { name: 'Llama Chat', requestFunction: llamaQARequest },
  { name: 'Claude Chat', requestFunction: claudeQARequest },
];


// Populate the select_model dropdown with available models
function populateModelDropdown() {
  const selectModelDropdown = document.getElementById('select_model');

  models.forEach((model) => {
    const option = document.createElement('option');
    option.value = model.name;
    option.textContent = model.name;
    selectModelDropdown.appendChild(option);
  });
}

// Call the selected request based on the chosen model
async function sendRequestUsingSelectedModel(userInput) {
  const selectedModelName = document.getElementById('select_model').value;
  const selectedModel = models.find((model) => model.name === selectedModelName);

  if (selectedModel) {
    return selectedModel.requestFunction(userInput);
  } else {
    throw new Error('Selected model not found.');
  }
}

// Populate the model dropdown when the DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
  populateModelDropdown();
});

// Sent text element
function createSentMessageElement() {
  const sentDiv = document.createElement('div');
  sentDiv.id = 'sent';
  sentDiv.setAttribute('class', 'd-flex flex-row justify-content-end mb-2 pt-1 text-start');

  const sentMessageP = document.createElement('p');
  sentMessageP.setAttribute('class', 'sent-message p-2 me-3 mb-2 text-white rounded-3 bg-primary');

  const senderImage = document.createElement('img');
  senderImage.setAttribute('src', './images/jaward.png');
  senderImage.setAttribute('class', 'rounded-3 mt-1');
  senderImage.setAttribute('alt', 'avatar 1');
  senderImage.setAttribute('height', '50');
  senderImage.setAttribute('width', '50');

  sentDiv.appendChild(sentMessageP);
  sentDiv.appendChild(senderImage);

  return sentDiv;
}

// Send message
function sendMessage() {
  const userInput = document.getElementById('user-text');
  const text = userInput.value;
  addSentMessageToDOM(text);
  userInput.value = "";
}

// Add a new sent message to the DOM
function addSentMessageToDOM(message) {
  const responseDiv = document.getElementById('results');
  const sentDiv = createSentMessageElement();
  const sentMessageP = sentDiv.querySelector('.sent-message');
  sentMessageP.textContent = message;
  responseDiv.appendChild(sentDiv);
}

// Sent text response
const submitTextButton = document.getElementById('send-text-button');
submitTextButton.onclick = async () => {
    const user_input = document.getElementById('user-text');
  
    // send to llm and render response
    const resultsDiv = document.getElementById("results");
    sendRequestUsingSelectedModel(user_input.value)
    .then(async (answer) => {
      const responseDiv = document.createElement("div");
      responseDiv.id = "response";
      responseDiv.classList.add("d-flex", "flex-row", "justify-content-start", "pt-2", "mb-2");

      const avatarImg = document.createElement("img");
      avatarImg.src = "./images/jaward.png";
      avatarImg.classList.add("rounded-3", "mt-1");
      avatarImg.alt = "avatar 1";
      avatarImg.height = 50;
      avatarImg.width = 50;
      responseDiv.appendChild(avatarImg);

      const responseMessageP = document.createElement("p");
      responseMessageP.id = "response-message";
      responseMessageP.classList.add("small", "p-2", "ms-3", "mb-2", "rounded-3");
      responseMessageP.style.backgroundColor = "#f5f6f7";

      responseMessageP.innerText = answer;

      responseDiv.appendChild(responseMessageP);
      resultsDiv.appendChild(responseDiv);

      let displayedAnswer = ""; 

      sendRenderRequest(answer);
      for (let i = 0; i < answer.length; i++) {
        displayedAnswer += answer[i];
        responseMessageP.textContent = displayedAnswer; 
        await wait(20); 
        responseMessageP.scrollTop = responseMessageP.scrollHeight;
      }
      resultsDiv.scrollTop = responseDiv.scrollHeight;
  })
  .catch((error) => {
      console.error(error);
  });
}

// Wait for response
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Call sendMessage on send
document.querySelector('.speech-button').addEventListener('click', () => {
  const userInput = document.querySelector('.input');
  const message = userInput.value;
  if (message) {
    sendMessage(message);
  }
});

// Clear chat
const clearButton = document.getElementById('clear_button');
clearButton.addEventListener('click', clearChat);
function clearChat() {
  const sentDivs = document.querySelectorAll('#sent');
  const responseDivs = document.querySelectorAll('#response');

  sentDivs.forEach((sentDiv) => {
    sentDiv.innerHTML = ''; 
  });
  responseDivs.forEach((responseDiv) => {
    responseDiv.innerHTML = '';
  });
}

// Access to microphone
const connectButton = document.getElementById('connect-button');
connectButton.onclick = async ()=> {
    await sendConnectionRequest();
}

// Disconnect DID Stream
const destroyButton = document.getElementById('destroy-button');
destroyButton.onclick = async () =>  {
    await sendDisconnectRequest();
}

// Download Chat
const downloadButton = document.getElementById('download');
downloadButton.addEventListener('click', downloadChatHistory);
function generateUniqueId() {
  return Math.random().toString(36).substr(2, 9);
}

function downloadChatHistory() {
  const sentMessages = document.querySelectorAll('.sent-message');
  const responseMessages = document.querySelectorAll('#response-message');
  
  // Combine sent messages and response messages into a single chat history
  let chatHistory = '';
  for (let i = 0; i < sentMessages.length; i++) {
    const timestamp = new Date().toLocaleString(); // Get the current timestamp
    const sentMessage = sentMessages[i].innerText.trim();
    const responseMessage = responseMessages[i].innerText.trim();
    chatHistory += `${timestamp}\nYou: ${sentMessage}\nAvaChat: ${responseMessage}\n\n`;
  }
  
  const uniqueId = generateUniqueId();
  const filename = `chat_history_${uniqueId}.txt`; // Concatenate unique ID to the filename
  
  // Blob with the chat history
  const blob = new Blob([chatHistory], { type: 'text/plain' });
  
  // URL for the Blob
  const url = URL.createObjectURL(blob);
  
  // dummy anchor element to trigger the download
  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.download = filename; // Use the filename with the unique ID
  
  // Append the anchor to the document and trigger the download
  document.body.appendChild(downloadLink);
  downloadLink.click();
  
  // Clean up by removing the anchor and revoking the URL
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
}

// Get references to the textarea and the button
const textarea = document.getElementById('user-text');
const button = document.getElementById('send-text-button');

button.disabled = true;
button.style.backgroundColor = '#9e9e9e57';

function handleTextareaInput() {
  if (textarea.value.trim() !== '') {
    button.disabled = false;
    button.style.backgroundColor = '#129b5c';
  } else {
    button.disabled = true;
    button.style.backgroundColor = '#5c5c5c91';
  }
}
textarea.addEventListener('input', handleTextareaInput);
handleTextareaInput();

const themButton = document.getElementById('theme-btn');
function toggleTheme() {
  var body = document.body;
  var currentClass = body.className;
  if (currentClass == "light-mode") {
      body.className = "dark-mode";
      localStorage.setItem("theme", "dark-mode");
  } else {
      body.className = "light-mode";
      localStorage.setItem("theme", "light-mode");
  }
}
themButton.addEventListener('click', toggleTheme());

window.onload = function() {
  var storedTheme = localStorage.getItem("theme");
  if (storedTheme) {
      document.body.className = storedTheme;
  }
};



  
  
