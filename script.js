

  // ✅ Firebase Init
  const firebaseConfig = {
    apiKey: "AIzaSyBwS-oxd1oVOxPd_CCwiE-uALTEB7ZTEG4",
    authDomain: "dlc-chatbot-9a4cf.firebaseapp.com",
    projectId: "dlc-chatbot-9a4cf",
    storageBucket: "dlc-chatbot-9a4cf.appspot.com",
    messagingSenderId: "326100772782",
    appId: "1:326100772782:web:1c471cc9ee484413904a3f"
  };
  const app = firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  // ✅ FAQ Map
  const faqMap = {
    "paytm": "To send money using Paytm: Open the app > Tap 'Pay' > Scan QR or enter number > Enter amount > Tap 'Pay'.",
    "whatsapp": "To send a message on WhatsApp: Open the app > Select a contact > Type your message > Tap send.",
    "google maps": "To navigate using Google Maps: Open the app > Search destination > Tap 'Directions' > Choose mode > Start.",
    "facebook": "To use Facebook: Open the app or site > Log in > Post status, like pages, add friends, or browse feed.",
    "instagram": "To upload a photo on Instagram: Tap '+' > Choose photo > Apply filters > Add caption > Share.",
    "telegram": "To use Telegram: Download the app > Sign in > Start chats, join channels or groups.",
    "phonepe": "To pay with PhonePe: Open app > Select 'To Contact' or 'Scan QR' > Enter amount > Pay.",
    "google meet": "To schedule a meeting: Go to Google Calendar > Create event > Add Meet link > Save > Share invite.",
    "google drive": "To use Google Drive: Open drive.google.com > Upload files > Organize in folders > Share or access anytime.",
    "dropbox": "To use Dropbox: Sign in > Upload your files > Share via link or keep them synced across devices.",
    "netflix": "To watch Netflix: Open the app > Sign in > Choose a show or movie > Tap play.",
    "spotify": "To use Spotify: Open the app > Browse or search songs > Tap play > Create playlists if desired.",
    "canva": "To create designs on Canva: Open Canva > Choose template > Add elements/text > Download or share.",
    "twitter": "To use Twitter: Sign in > Post tweets > Follow accounts > Like or retweet content.",
    "linkedin": "To use LinkedIn: Sign in > Update your profile > Connect with professionals > Apply for jobs or post updates.",
    "google calendar": "To create events: Open Google Calendar > Click on date/time > Add title & details > Save."
  };

  // ✅ UI Helpers
  function toggleDark() {
    document.body.classList.toggle("dark");
  }

  function addMessage(type, text) {
    const chatWindow = document.getElementById("chat-window");
    const msg = document.createElement("div");
    msg.className = 'message ${type}';
    msg.textContent = text;
    chatWindow.appendChild(msg);
    msg.scrollIntoView({ behavior: "smooth" });
  }

  function showTyping() {
    const typing = document.createElement("div");
    typing.className = "message bot typing";
    typing.id = "typing-msg";
    typing.textContent = "🤖 typing...";
    document.getElementById("chat-window").appendChild(typing);
  }

  function removeTyping() {
    const typing = document.getElementById("typing-msg");
    if (typing) typing.remove();
  }

  // ✅ Speech Synthesis
  function speak(text) {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }

  // ✅ Smart Response with FAQ fallback
  async function getBotReply(question) {
    const lowerQ = question.toLowerCase();
    for (const key in faqMap) {
      if (lowerQ.includes(key)) return faqMap[key];
    }

    // 🔄 OpenAI fallback
    try {
      const OPENAI_API_KEY = "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";
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: question }],
          temperature: 0.7,
          max_tokens: 300
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: 'Bearer ${OPENAI_API_KEY}'
          }
        }
      );
      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error("OpenAI API Error:", error);
      return "Sorry, I am having trouble answering that right now.";
    }
  }

  // ✅ Send message
  async function sendMessage() {
    const input = document.getElementById("user-input");
    const userText = input.value.trim();
    if (!userText) return;

    addMessage("user", userText);
    input.value = "";
    showTyping();

    const botReply = await getBotReply(userText);
    removeTyping();
    document.getElementById("bot-sound").play();
    addMessage("bot", botReply);
    speak(botReply);

    try {
      await db.collection("chats").add({
        user: "Anonymous",
        question: userText,
        answer: botReply,
        timestamp: new Date()
      });
    } catch (e) {
      console.error("Firebase error:", e);
    }
  }

  // ✅ FAQ quick reply
  function quickAsk(text) {
    document.getElementById("user-input").value = text;
    sendMessage();
  }

  // ✅ Enter key trigger
  document.getElementById("user-input").addEventListener("keydown", e => {
    if (e.key === "Enter") sendMessage();
  });

  // ✅ Speech to Text
  const micBtn = document.getElementById("mic-btn");
  let recognition;
  if ('webkitSpeechRecognition' in window) {
    recognition = new webkitSpeechRecognition();
  } else if ('SpeechRecognition' in window) {
    recognition = new SpeechRecognition();
  }
  if (recognition) {
    recognition.continuous = false;
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = event => {
      const speechResult = event.results[0][0].transcript;
      document.getElementById("user-input").value = speechResult;
      sendMessage();
    };
    recognition.onerror = e => console.error("Speech recognition error", e);
  } else {
    micBtn.style.display = "none";
  }

  micBtn.onclick = () => {
    if (recognition) {
      recognition.start();
      micBtn.textContent = "🎙";
      setTimeout(() => {
        micBtn.textContent = "🎤";
      }, 4000);
    }
  };
