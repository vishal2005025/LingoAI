import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [prompt, setPrompt] = useState('');
  const [conversation, setConversation] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');

  useEffect(() => {
    const loadVoices = () => {
      const synth = window.speechSynthesis;
      let voiceList = synth.getVoices();

      if (voiceList.length === 0) {
        synth.onvoiceschanged = () => {
          voiceList = synth.getVoices();
          setVoices(voiceList);
          if (voiceList.length > 0 && !selectedVoice) {
            setSelectedVoice(voiceList[0].name);
          }
        };
      } else {
        setVoices(voiceList);
        if (voiceList.length > 0 && !selectedVoice) {
          setSelectedVoice(voiceList[0].name);
        }
      }
    };

    loadVoices();
  }, [selectedVoice]);

  const fetchGeneratedText = async (newPrompt) => {
    try {
      const response = await axios.get('http://localhost:5000/generate-text', {
        params: { prompt: newPrompt },
      });
      const sanitizedText = sanitizeText(response.data.text);
      const formattedText = formatTextAsList(sanitizedText);
      const newResponse = { prompt: newPrompt, response: formattedText };
      setConversation((prev) => [...prev, newResponse]);
      speakText(formattedText);
    } catch (error) {
      console.error('Error fetching text:', error);
      const errorResponse = { prompt: newPrompt, response: 'Failed to load text' };
      setConversation((prev) => [...prev, errorResponse]);
      speakText('Failed to load text');
    }
  };

  const sanitizeText = (text) => {
    return text.replace(/\*\*\*|[*]/g, '').trim();
  };

  const formatTextAsList = (text) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    return lines.map((line, index) => `${index + 1}. ${line.trim()}`).join('\n');
  };

  const speakText = (text) => {
    const synth = window.speechSynthesis;
    if (synth.speaking) {
      synth.cancel(); // Cancel any ongoing speech synthesis
    }
    const utterance = new SpeechSynthesisUtterance(text.replace(/\n/g, '. '));
    const voice = synth.getVoices().find((v) => v.name === selectedVoice);
    if (voice) {
      utterance.voice = voice;
    }
    utterance.volume = 1; // Ensure volume is max
    synth.speak(utterance);
  };

  const stopSpeaking = () => {
    const synth = window.speechSynthesis;
    synth.cancel(); // Stop any ongoing speech synthesis
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (prompt.trim()) {
      fetchGeneratedText(prompt);
      setPrompt(''); // Clear the input field after submission
    }
  };

  const handlePromptChange = (event) => {
    setPrompt(event.target.value);
  };

  const handleVoiceChange = (event) => {
    setSelectedVoice(event.target.value);
  };

  const startListening = () => {
    if (!isListening) {
      const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const spokenPrompt = event.results[0][0].transcript;
        setPrompt(spokenPrompt);
        fetchGeneratedText(spokenPrompt); // Automatically send the spoken prompt
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Chat with AI Assistant</h1>
        <div className="voice-select">
          <label htmlFor="voice">Select Voice/Language: </label>
          <select id="voice" value={selectedVoice} onChange={handleVoiceChange}>
            {voices.map((voice, index) => (
              <option key={index} value={voice.name}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </div>
        <div className="chat-box">
          {conversation.map((entry, index) => (
            <div key={index} className="chat-entry">
              <p><strong>You:</strong> {entry.prompt}</p>
              <pre>{entry.response}</pre>
            </div>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="chat-form">
          <input
            type="text"
            value={prompt}
            onChange={handlePromptChange}
            placeholder="Enter your prompt"
          />
          <button type="submit">Send</button>
          <button type="button" onClick={startListening}>
            {isListening ? 'Listening...' : 'Speak'}
          </button>
          <button type="button" onClick={stopSpeaking}>Stop</button>
        </form>
      </header>
    </div>
  );
}

export default App;
