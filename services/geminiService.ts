
import { GoogleGenAI, Type, Modality, LiveServerMessage, FunctionDeclaration } from "@google/genai";
import { Language, Product, StyleState, DynamicSuggestion, LiveSessionConfig } from "../types";

export const analyzeLookAndGenerateSuggestions = async (
  imageBase64: string,
  lang: Language
): Promise<{ gender: 'male' | 'female', suggestions: DynamicSuggestion[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
  const languageName = lang === 'de' ? 'German' : 'English';

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
        { text: `Analyze this person and provide:
          1. Detected Gender (male or female).
          2. Exactly 5 unique, REALISTIC, high-end styling ideas (label and prompt) based on their appearance.
          Respond in ${languageName}. 
          STRICT RULES:
          - NO Cyberpunk, NO Sci-Fi, NO costumes, NO fantasy.
          - Focus on realistic high-fashion: e.g., "Quiet Luxury", "Old Money", "Modern Minimalist", "Parisian Chic", "Italian Tailoring".
          - Keep the original background completely unchanged.` }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          gender: { type: Type.STRING, enum: ['male', 'female'] },
          suggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING, description: 'Elegantes Label (z.B. "Minimalist Elegance")' },
                prompt: { type: Type.STRING, description: 'Detaillierter, realistischer Fashion-Prompt' },
                category: { type: Type.STRING, description: 'z.B. "Elegant", "Casual Luxury", "Business"' }
              },
              required: ["label", "prompt", "category"]
            }
          }
        },
        required: ["gender", "suggestions"]
      }
    }
  });

  try {
    const data = JSON.parse(response.text);
    return {
      gender: data.gender,
      suggestions: data.suggestions.map((s: any) => ({ ...s, isGenerating: false }))
    };
  } catch (e) {
    console.error("Failed to analyze look", e);
    return { gender: 'female', suggestions: [] };
  }
};

export const generateStyledImage = async (originalImageBase64: string, prompt: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = originalImageBase64.includes(',') ? originalImageBase64.split(',')[1] : originalImageBase64;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
        { text: `Realistic Virtual Try-On: ${prompt}. Natural textures, photorealistic clothing. Maintain identity. KEEP ORIGINAL BACKGROUND.` }
      ]
    }
  });

  let imageUrl = '';
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      break;
    }
  }
  return imageUrl;
};

export const parseStyleIntent = async (userInput: string, currentState: StyleState, lang: Language): Promise<StyleState> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `User wants a style change: "${userInput}". 
    Current: ${JSON.stringify(currentState)}. 
    Update fields realistically (no costumes). Return JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          hair: { type: Type.STRING },
          outfit: { type: Type.STRING },
          accessories: { type: Type.STRING },
          gender: { type: Type.STRING, enum: ['male', 'female'] },
          ageGroup: { type: Type.STRING, enum: ['young', 'adult', 'mature'] },
          baseStyle: { type: Type.STRING, enum: ['modern', 'vintage', 'opera', 'casual'] }
        },
        required: ["hair", "outfit", "accessories", "gender", "ageGroup", "baseStyle"]
      }
    }
  });
  try { return JSON.parse(response.text); } catch (e) { return currentState; }
};

export const editAppearance = async (originalImageBase64: string, style: StyleState): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = originalImageBase64.includes(',') ? originalImageBase64.split(',')[1] : originalImageBase64;
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
        { text: `High-end Fashion Change: ${style.outfit}, hair ${style.hair}, accessories ${style.accessories}. 
        Extremely realistic, luxury fabric textures. NO fantasy/costumes. Keep background.` }
      ]
    }
  });
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("AI failed.");
};

export const findMatchingProducts = async (style: StyleState, lang: Language): Promise<Product[]> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const genderTerm = style.gender === 'male' ? 'Herren' : 'Damen';
  const amazonBase = `https://www.amazon.de/s?k=`;

  if (style.baseStyle === 'modern' || style.baseStyle === 'casual') {
    return [
      { 
        id: 'p1', 
        name: 'Kaschmir-Pullover Premium', 
        brand: 'Luxury Basics', 
        price: '149,00 €', 
        url: `${amazonBase}kaschmir+pullover+${genderTerm}`, 
        thumbnail: '🧶' 
      },
      { 
        id: 'p2', 
        name: 'Chino-Hose Slim Fit', 
        brand: 'Atelier Selection', 
        price: '89,00 €', 
        url: `${amazonBase}chino+hose+${genderTerm}`, 
        thumbnail: '👖' 
      },
      { 
        id: 'p3', 
        name: 'Minimalistische Leder-Sneaker', 
        brand: 'Urban Elite', 
        price: '120,00 €', 
        url: `${amazonBase}sneaker+leder+minimalistisch+${genderTerm}`, 
        thumbnail: '👟' 
      }
    ];
  } else {
    return [
      { 
        id: 'p4', 
        name: 'Tailored Business Blazer', 
        brand: 'Sartorial Pro', 
        price: '259,00 €', 
        url: `${amazonBase}blazer+tailored+${genderTerm}`, 
        thumbnail: '🧥' 
      },
      { 
        id: 'p5', 
        name: 'Seidenhemd Premium', 
        brand: 'Silk & Co', 
        price: '115,00 €', 
        url: `${amazonBase}seidenhemd+${genderTerm}`, 
        thumbnail: '👔' 
      },
      { 
        id: 'p6', 
        name: 'Klassische Leder-Oxfords', 
        brand: 'Legacy Footwear', 
        price: '199,00 €', 
        url: `${amazonBase}oxford+schuhe+leder+${genderTerm}`, 
        thumbnail: '👞' 
      }
    ];
  }
};

/**
 * LIVE API INTEGRATION
 */

const takePhotoFunction: FunctionDeclaration = {
  name: 'takePhoto',
  parameters: {
    type: Type.OBJECT,
    description: 'Call this IMMEDIATELY to trigger the camera shutter.',
    properties: {},
    required: []
  }
};

const resetStudioFunction: FunctionDeclaration = {
  name: 'resetStudio',
  parameters: {
    type: Type.OBJECT,
    description: 'Call this to go back to the camera booth for a new starting photo.',
    properties: {},
    required: []
  }
};

const applyStyleFunction: FunctionDeclaration = {
  name: 'applyStyling',
  parameters: {
    type: Type.OBJECT,
    description: 'Call this to apply a new fashion style or garment to the current photo.',
    properties: {
      styleDescription: {
        type: Type.STRING,
        description: 'Realistic fashion description (e.g., "A beige cashmere coat with a silk scarf").'
      }
    },
    required: ['styleDescription']
  }
};

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const connectStylistLive = async (config: LiveSessionConfig & { onTakePhoto: () => void }, lang: Language) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  let nextStartTime = 0;
  const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
  const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
  const outputNode = outputAudioContext.createGain();
  outputNode.connect(outputAudioContext.destination);
  const sources = new Set<AudioBufferSourceNode>();
  
  let currentInputTranscription = '';
  let currentOutputTranscription = '';

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    callbacks: {
      onopen: () => {
        const source = inputAudioContext.createMediaStreamSource(stream);
        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
          const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
          const l = inputData.length;
          const int16 = new Int16Array(l);
          for (let i = 0; i < l; i++) {
            int16[i] = inputData[i] * 32768;
          }
          const pcmBlob = {
            data: encode(new Uint8Array(int16.buffer)),
            mimeType: 'audio/pcm;rate=16000',
          };
          sessionPromise.then((session) => {
            session.sendRealtimeInput({ media: pcmBlob });
          });
        };
        source.connect(scriptProcessor);
        scriptProcessor.connect(inputAudioContext.destination);
      },
      onmessage: async (message: LiveServerMessage) => {
        if (message.serverContent?.outputTranscription) {
          currentOutputTranscription += message.serverContent.outputTranscription.text;
          config.onTranscription(currentOutputTranscription, 'assistant');
        } else if (message.serverContent?.inputTranscription) {
          currentInputTranscription += message.serverContent.inputTranscription.text;
          config.onTranscription(currentInputTranscription, 'user');
        }

        if (message.serverContent?.turnComplete) {
          currentInputTranscription = '';
          currentOutputTranscription = '';
        }

        if (message.toolCall) {
          for (const fc of message.toolCall.functionCalls) {
            if (fc.name === 'applyStyling') {
              config.onApplyStyle((fc.args as any).styleDescription);
              sessionPromise.then(s => s.sendToolResponse({
                functionResponses: { id: fc.id, name: fc.name, response: { result: "Look rendering started." } }
              }));
            } else if (fc.name === 'takePhoto') {
              config.onTakePhoto();
              sessionPromise.then(s => s.sendToolResponse({
                functionResponses: { id: fc.id, name: fc.name, response: { result: "Photo captured." } }
              }));
            } else if (fc.name === 'resetStudio') {
              config.onReset?.();
              sessionPromise.then(s => s.sendToolResponse({
                functionResponses: { id: fc.id, name: fc.name, response: { result: "Ready for new scan." } }
              }));
            }
          }
        }

        const modelTurn = message.serverContent?.modelTurn;
        if (modelTurn) {
          for (const part of modelTurn.parts) {
            if (part.inlineData?.data) {
              const base64EncodedAudioString = part.inlineData.data;
              if (outputAudioContext.state === 'suspended') {
                await outputAudioContext.resume();
              }
              nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64EncodedAudioString), outputAudioContext, 24000, 1);
              const source = outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNode);
              source.addEventListener('ended', () => { sources.delete(source); });
              source.start(nextStartTime);
              nextStartTime = nextStartTime + audioBuffer.duration;
              sources.add(source);
            }
          }
        }

        if (message.serverContent?.interrupted) {
          for (const source of sources.values()) {
            try { source.stop(); } catch(e) {}
            sources.delete(source);
          }
          nextStartTime = 0;
        }
      },
      onerror: (e) => config.onError(e),
      onclose: () => console.log("Live Stylist disconnected"),
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
      },
      outputAudioTranscription: {},
      inputAudioTranscription: {},
      tools: [{ functionDeclarations: [takePhotoFunction, resetStudioFunction, applyStyleFunction] }],
      systemInstruction: `Du bist ein Weltklasse Creative Director für High-End REALISTISCHE MODE. 
      Sprache: ${lang === 'de' ? 'Deutsch' : 'Englisch'}.
      
      VERHALTEN:
      - Sei proaktiv und charismatisch. Warte nicht nur ab.
      - Greet the user by complimenting their aura/appearance.
      - Frage direkt: "Was sollen wir heute mit Ihrem Look machen?" oder "Wie können wir Ihren Stil heute veredeln?"
      - STRENG VERBOTEN: Keine Kostüme, kein Cyberpunk, kein Sci-Fi, keine SEK-Anzüge. Nur tragbare, luxuriöse Mode.
      
      MODUS:
      1. CAMERA BOOTH (Vor dem Foto):
         - Gib kurze Anweisungen zur Pose.
         - Rufe 'takePhoto' SOFORT auf, wenn der User "bereit", "foto", "snapshot" oder "jetzt" sagt.
      
      2. STYLING UNIT (Nach dem Foto):
         - Analysiere kurz, was dem User gut steht (z.B. "Ihre Silhouette ist perfekt für italienische Schnitte").
         - Schlage realistische Transformationen vor (z.B. "Ein beige Kaschmir-Mantel würde Ihre Eleganz unterstreichen").
         - Rufe 'applyStyling' auf, wenn der User zustimmt oder einen Wunsch äußert.
         - Rufe 'resetStudio' auf, wenn er ein neues Bild machen will.
      
      Halte deine Sätze elegant und professionell.`
    }
  });

  return {
    stop: async () => {
      const session = await sessionPromise;
      session.close();
      stream.getTracks().forEach(t => t.stop());
      await inputAudioContext.close();
      await outputAudioContext.close();
    }
  };
};
