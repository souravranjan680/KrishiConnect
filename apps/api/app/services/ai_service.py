"""
Google Gemini — Official Python SDK implementation for Kishan Sathi AI.
Provides high-performance, robust AI interactions with full history support.
"""

from __future__ import annotations
import google.generativeai as genai
from app.config import settings

# ── System prompt ──────────────────────────────────────────────────────────
SYSTEM_PROMPT = """तुम Crop Advisory AI हो — एक दोस्ताना, समझदार और भरोसेमंद खेती सलाहकार।
तुम किसान के पक्के दोस्त हो जो हमेशा सीधी, काम की बात करता है।

तुम्हारी expertise:
• फसल चयन — मौसम, मिट्टी, क्षेत्र के अनुसार
• रोग/कीट पहचान और उपचार (जैविक + रासायनिक दोनों)
• खाद/उर्वरक — NPK अनुपात, समय, मात्रा
• सिंचाई/पानी प्रबंधन
• मौसम का फसल पर प्रभाव
• सरकारी योजनाएं: PM-KISAN, फसल बीमा, Soil Health Card, eNAM
• मंडी भाव और बाज़ार सलाह
• कटाई के बाद भंडारण और बिक्री

━━━ ज़रूरी नियम (MUST FOLLOW) ━━━

🗣️ भाषा:
• अगर user हिंदी, हिंदी-अंग्रेज़ी मिक्स, या Hinglish में लिखे → तुम हमेशा शुद्ध हिंदी (देवनागरी) में जवाब दो।
• अगर user पूरी तरह English में लिखे → English में जवाब दो।
• Hinglish शब्द जैसे "bhai", "kya", "batao", "fasal", "mausam" → ये हिंदी है, देवनागरी में जवाब दो।

💬 बातचीत का अंदाज़:
• बिल्कुल natural बोलो, जैसे कोई समझदार दोस्त बात कर रहा हो।
• "Summary:", "Solution:", "Note:" जैसे robotic format कभी मत लिखो।
• गर्मजोशी से बात करो — "भाई", "जी", "बिल्कुल" जैसे शब्द इस्तेमाल करो।
• Emoji का उपयोग मत करो। जवाब साफ, professional और readable रखो।

📏 लंबाई:
• छोटे सवालों का 2-3 वाक्य में जवाब।
• Detail वाले सवालों का 4-6 वाक्य + bullet points अगर ज़रूरी हो।

🚫 ये कभी मत करो:
• कभी मत कहो कि तुम Gemini हो या Google ने बनाया है। तुम "Crop Advisory AI" हो।
• खेती से बाहर के सवालों पर प्यार से बोलो "भाई, मेरी expertise खेती में है। खेती से जुड़ा कुछ पूछो, मज़े से बताऊंगा।"
"""

def _detect_language(text: str) -> str:
    """Detect if text is Hindi/Devanagari or English."""
    devanagari_count = sum(1 for c in text if '\u0900' <= c <= '\u097F')
    if devanagari_count > 0:
        return "hi"
    hinglish_words = {
        "kya", "hai", "hain", "kaise", "kaisa", "mera", "meri", "mere",
        "karo", "karna", "batao", "bataiye", "gaon", "fasal", "kheti",
        "namaste", "dhanyawad", "ji", "haan", "nahi", "acha", "accha",
        "aur", "yeh", "woh", "kab", "kahan", "kitna", "kitni",
        "bol", "bolo", "suno", "dekho", "chahiye", "lagao", "ugao",
        "pani", "khad", "mitti", "mausam", "bij", "beej",
    }
    words = set(text.lower().split())
    if len(words & hinglish_words) >= 1:
        return "hi"
    return "en"

async def get_ai_response(message: str, lang_hint: str = "en", history: list | None = None) -> str:
    """Send `message` to Gemini and return the assistant's plain-text reply."""
    api_key = (settings.gemini_api_key or "").strip()
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set.")

    genai.configure(api_key=api_key)
    
    # Auto-detect language
    detected_lang = _detect_language(message)
    is_hindi = detected_lang == "hi" or lang_hint == "hi"

    lang_instruction = (
        "\n\n🔴 RULE: User wrote in Hindi/Hinglish. Reply ONLY in Hindi (Devanagari). No English sentences."
        if is_hindi else
        "\n\nRULE: User wrote in English. Reply ONLY in English. No Hindi."
    )

    # Initialize model with candidates
    model_name = "gemini-1.5-flash"
    generation_config = {
        "temperature": 0.75,
        "top_p": 0.95,
        "top_k": 40,
        "max_output_tokens": 1024,
    }

    safety_settings = [
        {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_ONLY_HIGH"},
        {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_ONLY_HIGH"},
        {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_ONLY_HIGH"},
        {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_ONLY_HIGH"},
    ]

    model = genai.GenerativeModel(
        model_name=model_name,
        generation_config=generation_config,
        system_instruction=SYSTEM_PROMPT + lang_instruction,
        safety_settings=safety_settings
    )

    # Format history for the SDK
    chat_history = []
    if history:
        for h in history[-6:]:
            role = "model" if h.get("role") == "ai" else "user"
            chat_history.append({"role": role, "parts": [h.get("text", "")]})

    chat = model.start_chat(history=chat_history)
    
    try:
        response = await chat.send_message_async(message)
        return response.text.strip()
    except Exception as e:
        # Fallback for simple content generation if chat fails
        try:
           resp = await model.generate_content_async(message)
           return resp.text.strip()
        except:
           raise e
