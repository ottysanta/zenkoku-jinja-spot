import base64
import os
from pathlib import Path
import anthropic
from dotenv import load_dotenv
from config import ANTHROPIC_API_KEY

load_dotenv(Path(__file__).parent.parent.parent / ".env")
MOCK_MODE = os.getenv("MOCK_MODE", "false").lower() == "true"

MOCK_RESPONSES = {
    "outfit": (
        "[MOCK] Oversized cream-colored trench coat, double-breasted with belt. "
        "Smooth polyester/cotton blend, clean minimalist silhouette. "
        "Paired with a ribbed white knit crop top underneath. Feminine minimalist aesthetic."
    ),
    "accessories": (
        "[MOCK] Layered silver chain necklaces of varying lengths — delicate thin chains "
        "with small geometric pendants. Pearl clip barrette in hair. Minimalist K-pop idol style."
    ),
    "shoes": (
        "[MOCK] Platform Mary Jane shoes in black patent leather. "
        "Chunky platform sole approximately 4cm, round toe, single strap with buckle closure. "
        "Dr. Martens style aesthetic."
    ),
    "bag": (
        "[MOCK] Small black leather crossbody bag with gold chain strap. "
        "Structured rectangular shape, magnetic clasp closure, single exterior pocket. "
        "Classic feminine style."
    ),
    "background": (
        "[MOCK] Urban airport arrival hall setting. Modern glass and steel architecture, "
        "bright overhead lighting. Clean neutral color palette — white, grey, beige tones. "
        "Contemporary minimalist interior vibe."
    ),
}

_client = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        if not ANTHROPIC_API_KEY or ANTHROPIC_API_KEY == "your_api_key_here":
            raise ValueError("ANTHROPIC_API_KEY is not set. Please edit .env file.")
        _client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
    return _client


PROMPTS = {
    "outfit": """You are a fashion item analyzer for an idol merchandise finder app.
Analyze this image and describe the CLOTHING (tops, bottoms, dresses, coats, etc.) visible on the person.

For each clothing item, describe:
- Item type (e.g., blouse, skirt, dress, jacket, coat, pants)
- Primary color(s)
- Material or texture clues (e.g., satin, knit, denim, chiffon)
- Silhouette or cut (e.g., A-line, oversized, cropped, wrap)
- Notable design details (e.g., ruffles, lace trim, print pattern, buttons)
- Any visible brand logos or labels
- Style aesthetic (e.g., feminine, Y2K, minimalist, streetwear)

Focus ONLY on clothing items. Be specific and detailed.
Output a concise structured description suitable for fashion similarity search.""",

    "accessories": """You are a fashion accessory analyzer for an idol merchandise finder app.
Analyze this image and describe the ACCESSORIES visible on the person.

For each accessory, describe:
- Item type (e.g., necklace, earrings, bracelet, ring, hair clip, headband, hat, belt, sunglasses)
- Primary color(s) and material (e.g., gold chain, pearl, rhinestone, fabric)
- Size and shape (e.g., oversized hoop, delicate pendant, wide brim)
- Notable design details (e.g., logo charm, floral motif, layered)
- Any visible brand logos or labels

Focus ONLY on accessories and jewelry. Be specific and detailed.
Output a concise structured description suitable for fashion similarity search.""",

    "shoes": """You are a footwear analyzer for an idol merchandise finder app.
Analyze this image and describe the SHOES or FOOTWEAR visible on the person.

For each footwear item, describe:
- Item type (e.g., sneakers, heels, boots, sandals, loafers, platforms)
- Primary color(s)
- Material (e.g., leather, suede, canvas, patent)
- Sole height and style (e.g., chunky platform, stiletto, flat)
- Notable design details (e.g., lace-up, buckle, pointed toe, logo)
- Any visible brand logos or labels

Focus ONLY on shoes and footwear. Be specific and detailed.
Output a concise structured description suitable for fashion similarity search.""",

    "bag": """You are a bag and handbag analyzer for an idol merchandise finder app.
Analyze this image and describe any BAGS or PURSES visible.

For each bag, describe:
- Item type (e.g., tote, shoulder bag, clutch, backpack, crossbody, mini bag)
- Primary color(s)
- Material (e.g., leather, canvas, PVC, fabric)
- Size (e.g., mini, small, medium, large, oversized)
- Notable design details (e.g., chain strap, logo print, embroidery, hardware)
- Any visible brand logos or labels

Focus ONLY on bags and purses. Be specific and detailed.
Output a concise structured description suitable for fashion similarity search.""",

    "background": """You are a location and setting analyzer for an idol content finder app.
Analyze this image and describe the BACKGROUND and LOCATION visible.

Describe:
- Setting type (e.g., urban street, studio, park, beach, cafe, concert hall, rooftop)
- Architectural features (e.g., brick wall, neon signs, marble interior, wooden floor)
- Natural elements (e.g., cherry blossoms, ocean, mountains, greenery)
- Lighting mood (e.g., golden hour, neon-lit night, soft studio light)
- Color palette of the environment
- Any notable landmarks or distinctive visual elements
- Overall aesthetic or vibe (e.g., Tokyo Harajuku, vintage cafe, industrial, dreamy)

Focus ONLY on the background and location, not on the person.
Output a concise structured description suitable for location similarity search.""",
}

# Default fallback
PROMPTS["outfit_full"] = """You are a fashion item analyzer for an idol merchandise finder app.
Analyze this image and describe any clothing or accessory items visible on the person.

For each item, describe:
- Item type (e.g., coat, necklace, skirt, shoes, bag, hat)
- Primary color(s)
- Material or texture clues (e.g., leather, knit, satin, denim)
- Silhouette or cut (e.g., oversized, cropped, A-line, slim-fit)
- Notable design details (e.g., double-breasted, plaid pattern, platform sole, pearl embellishment)
- Any visible brand logos or labels
- Style era or aesthetic (e.g., Y2K, minimalist, streetwear, feminine)

Focus ONLY on what the person is wearing. Be specific and detailed.
Output a concise structured description suitable for fashion similarity search.
If multiple items are visible, describe the most prominent/distinctive one first."""


def describe_image(image_bytes: bytes, media_type: str = "image/jpeg", focus: str = "outfit") -> str:
    if MOCK_MODE:
        return MOCK_RESPONSES.get(focus, MOCK_RESPONSES["outfit"])

    client = _get_client()
    encoded = base64.standard_b64encode(image_bytes).decode("utf-8")
    prompt = PROMPTS.get(focus, PROMPTS["outfit"])

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=512,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": encoded,
                        },
                    },
                    {
                        "type": "text",
                        "text": prompt,
                    },
                ],
            }
        ],
    )

    return message.content[0].text
