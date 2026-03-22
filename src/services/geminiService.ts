import { GoogleGenAI, Type, PersonGeneration } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "dummy_key_to_prevent_crash" });

/**
 * Generic retry wrapper for Gemini API calls to handle 429 (Resource Exhausted) errors.
 */
const withRetry = async <T>(fn: () => Promise<T>, retries: number = 2): Promise<T> => {
  try {
    return await fn();
  } catch (err: unknown) {
    const e = err as { message?: string; status?: number; response?: { status?: number } };
    const is429 = e.message?.includes('429') || e.status === 429 || (e.response?.status === 429);
    if (retries > 0 && is429) {
      console.warn(`Quota exceeded (429). Retrying in 2s... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return withRetry(fn, retries - 1);
    }
    throw e;
  }
};

export interface GeneratedSlide {
  title: string;
  subtitle: string;
  imagePrompt: string;
  layout?: 'centered' | 'split' | 'editorial' | 'minimal';
}

export interface CarouselContent {
  slides: GeneratedSlide[];
}

export type ContentFramework = 'standard' | 'aida' | 'pas' | 'listicle' | 'storytelling';
export type TwitterFramework = 'viral_hook' | 'storytelling' | 'aida' | 'pas' | 'thought_leader' | 'cold_outreach' | 'listicle';

export const generateAIImage = async (
  prompt: string, 
  userDirection: string = "", 
  aspectRatio: "4:5" | "9:16" = "4:5",
  model: string = "gemini-2.5-flash-image",
  retries: number = 2
): Promise<string> => {
  const finalPrompt = `High-end professional background image for an Instagram carousel slide. 
THEMATIC CONTEXT: ${prompt}.
${userDirection ? `USER STYLE DIRECTION: ${userDirection}.` : ''}
VISUAL STYLE:
- Dramatic cinematic lighting, rich color palette, professional composition.
- The center must be clean and dark enough to place white text on top.
- No text, no logos, no faces (unless specified). Photorealistic.
- Perfectly complements the theme: ${prompt}.`;

  try {
    // gemini-2.5-flash-image uses the generateImages endpoint (free, 500/day)
    const response = await withRetry(() => ai.models.generateImages({
      model: model,
      prompt: finalPrompt,
      config: {
        numberOfImages: 1,
        aspectRatio: aspectRatio === "9:16" ? "9:16" : "3:4",
        personGeneration: PersonGeneration.DONT_ALLOW,
      },
    }), retries);

    const image = response.generatedImages?.[0];
    if (image?.image?.imageBytes) {
      return `data:image/png;base64,${image.image.imageBytes}`;
    }
    throw new Error("No image bytes in response");
  } catch (err) {
    console.warn("Gemini image gen failed, using Picsum fallback:", err);
    // picsum.photos is 100% free, no auth, always works, no CORS issues
    const seed = Math.floor(Math.random() * 1000);
    const w = 1080;
    const h = aspectRatio === "9:16" ? 1920 : 1350;
    return `https://picsum.photos/seed/${seed}/${w}/${h}`;
  }
};


export const generateCaption = async (
  carouselContent: string, 
  brandTone: string, 
  length: 'short' | 'medium' | 'long' = 'medium',
  style: 'persuasive' | 'educational' | 'minimalist' = 'persuasive'
): Promise<string> => {
  try {
    const lengthInstructions = {
      short: "Keep it under 150 characters, very punchy.",
      medium: "Standard Instagram length, around 500 characters.",
      long: "Detailed storytelling style, up to 1500 characters."
    };

    const styleInstructions = {
      persuasive: "Focus on conversion, benefits, and strong CTAs.",
      educational: "Focus on teaching, step-by-step value, and clarity.",
      minimalist: "Very clean, lots of white space, direct and elegant."
    };

    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a viral Instagram caption for this carousel content: "${carouselContent}". 
      Tone of voice: ${brandTone}.
      Length: ${lengthInstructions[length]}
      Style: ${styleInstructions[style]}
      
      Include:
      1. A strong hook.
      2. Value-driven body text.
      3. A clear Call to Action (CTA).
      4. 5-7 relevant hashtags.`,
    }));

    return response.text || "";
  } catch (err) {
    console.error("Failed to generate caption", err);
    return "Erro ao gerar legenda. Tente novamente.";
  }
};

export const generateCarouselContent = async (
  theme: string, 
  brandInstructions: string, 
  brandTone: string,
  brandContext: string,
  targetAudience: string,
  slidesCount: number,
  framework: ContentFramework = 'standard'
): Promise<CarouselContent> => {
  try {
    const frameworkPrompts = {
      standard: "General high-impact copywriting. Hook -> Value -> CTA.",
      aida: "AIDA Framework: Attention (Slide 1: Big Hook), Interest (Slide 2: The 'Why'), Desire (Slides 3 to N-1: The Transformation/Value), Action (Last Slide: Strong CTA).",
      pas: "PAS Framework: Problem (Slide 1: Pain Point), Agitation (Slide 2: Why it hurts), Solution (Slides 3 to N-1: The Fix), Action (Last Slide: Strong CTA).",
      listicle: "Listicle: 'X Ways to...', 'Top X...'. Each slide is a point. Last slide is the CTA.",
      storytelling: "Narrative Arc: The Hook -> The Conflict -> The Resolution -> The Lesson -> The CTA."
    };

    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are an ELITE COPYWRITER specializing in viral Instagram carousels. 
      Your goal is to create a "viciante" (addictive) sequence of ${slidesCount} slides that flows perfectly.
      
      Theme: "${theme}". 
      
      BRAIN CONTEXT (Use this to tailor the copy perfectly):
      - Business/Brand Context: ${brandContext}
      - Target Audience: ${targetAudience}
      - Brand Tone: ${brandTone}
      - Brand Voice/Instructions: ${brandInstructions}
      
      STRATEGY:
      - Framework: ${frameworkPrompts[framework]}
      - COHESION: Every slide must COMPLEMENT the previous one, creating a narrative or logical progression that builds tension or interest.
      - FLOW: The content must feel like a single cohesive story or lesson, not isolated tips.
      - HOOK: Slide 1 must be an unstoppable scroll-stopper.
      - CTA: The LAST SLIDE must ALWAYS be a clear, high-conversion Call to Action (CTA) that is the logical conclusion of the entire sequence.
      
      For each slide, provide:
      1. Title: Short, punchy, high-impact (max 40 chars).
      2. Subtitle: Compelling body copy that expands on the title (max 120 chars).
      3. Image Prompt: A descriptive prompt for a background image that matches the slide's specific content and the overall brand aesthetic.
      4. Layout: Choose the best visual arrangement ('centered', 'split', 'editorial', 'minimal').`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            slides: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  subtitle: { type: Type.STRING },
                  imagePrompt: { type: Type.STRING },
                  layout: { type: Type.STRING, enum: ['centered', 'split', 'editorial', 'minimal'] },
                },
                required: ["title", "subtitle", "imagePrompt", "layout"],
              },
            },
          },
          required: ["slides"],
        },
      },
    }));

    return JSON.parse(response.text || '{"slides": []}');
  } catch (err) {
    console.error("Failed to generate carousel content", err);
    // Fallback content in case of API failure
    return {
      slides: Array(slidesCount).fill(null).map((_, i) => ({
        title: `Slide Title ${i + 1}`,
        subtitle: `Subtitle for slide ${i + 1} with brand context.`,
        imagePrompt: `High-end abstract background for ${theme}`,
        layout: 'centered'
      }))
    };
  }
};

export const generateTwitterThread = async (
  theme: string,
  brandInstructions: string,
  brandTone: string,
  brandContext: string,
  targetAudience: string,
  slidesCount: number,
  framework: TwitterFramework = 'viral_hook'
): Promise<CarouselContent> => {
  try {
    const frameworkPrompts: Record<TwitterFramework, string> = {
      viral_hook: `Viral Hook Framework: Tweet 1 is an outrageous, bold, scroll-stopping claim or question. Tweets 2-${slidesCount-1} deliver rapid-fire value. Last tweet CTA is ultra-specific (e.g. 'RT this thread if you agree' or 'DM me the word X').`,
      storytelling: `Narrative Arc: Tweet 1 opens with a compelling personal story or scene. Build tension across tweets. Last tweet delivers the lesson + a soft CTA to follow or share.`,
      aida: `AIDA: Tweet 1=Attention (headline statement), Tweet 2=Interest (the WHY), Tweets 3-${slidesCount-1}=Desire (transformation/proof), Last tweet=Action (direct offer or ask).`,
      pas: `PAS: Tweet 1=Problem (painful reality), Tweet 2=Agitation (why it's getting worse), Tweets 3-${slidesCount-1}=Solution (step-by-step fix), Last tweet=Strong CTA to act now.`,
      thought_leader: `Thought Leadership: Tweet 1 is a bold contrarian opinion. Each following tweet backs it with data, frameworks, or first-principles thinking. Last tweet invites discussion (e.g. 'What do you think? Reply below.').`,
      cold_outreach: `Authority Builder: Tweet 1 states a specific result achieved ('I helped 47 clients 10x their X in 90 days. Here's the exact system:'). Each tweet reveals one step. Last tweet has clear offer/book-a-call CTA.`,
      listicle: `Listicle: Tweet 1 is the promise ('${slidesCount - 1} ways to [result] that nobody talks about:'). Each following tweet covers one item with a micro-insight. Last tweet wraps up with a follow/share CTA.`
    };

    const ctaStyles: Record<TwitterFramework, string> = {
      viral_hook: 'End with: RT this if it resonated. Or drop a \u2764\ufe0f and follow for more.',
      storytelling: 'End with a reflection + soft CTA: \u2018If this resonated, follow me\u2014I post threads like this every week.\u2019',
      aida: 'End with a direct offer: clear link, DM, or booking link.',
      pas: 'End with urgency: \u2018Stop losing [X]. Start [Y] today. Here\u2019s how \u2192 [link/DM].\u2019',
      thought_leader: 'End with an open question to spark replies and debate.',
      cold_outreach: 'End with a specific, low-friction offer: \u2018DM me \u2018SYSTEM\u2019 and I\u2019ll send you the full breakdown.\u2019',
      listicle: 'End with: \u2018Follow for more no-BS threads like this. RT the first tweet to help a friend.\u2019'
    };

    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are an ELITE GHOSTWRITER for viral Twitter (X) threads. 
      Your goal is to create ${slidesCount} tweets that are impossible to scroll past.
      
      Theme: "${theme}".
      
      BRAIN CONTEXT:
      - Brand/Business Context: ${brandContext}
      - Target Audience: ${targetAudience}
      - Tone of Voice: ${brandTone}
      - Voice/Instructions: ${brandInstructions}
      
      CHOSEN FRAMEWORK: ${frameworkPrompts[framework]}
      
      CTA STYLE FOR LAST TWEET: ${ctaStyles[framework]}
      
      For each tweet provide:
      1. Title: The main hook or point (max 60 chars, punchy).
      2. Subtitle: The body — conversational, high-value, scannable (max 240 chars). Use line breaks for readability.
      3. Image Prompt: A minimal, clean background image that does not distract from the text.
      4. Layout: Always 'minimal' for Twitter.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            slides: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  subtitle: { type: Type.STRING },
                  imagePrompt: { type: Type.STRING },
                  layout: { type: Type.STRING, enum: ['centered', 'split', 'editorial', 'minimal'] },
                },
                required: ["title", "subtitle", "imagePrompt", "layout"],
              },
            },
          },
          required: ["slides"],
        },
      },
    }));

    return JSON.parse(response.text || '{"slides": []}');
  } catch (err) {
    console.error("Failed to generate twitter thread", err);
    return {
      slides: Array(slidesCount).fill(null).map((_, i) => ({
        title: i === 0 ? `Hook: ${theme}` : `Ponto ${i}`,
        subtitle: `Conteúdo do tweet ${i + 1} sobre ${theme}.`,
        imagePrompt: `High-end abstract background for ${theme}`,
        layout: 'minimal'
      }))
    };
  }
};

export const suggestTrends = async (niche: string): Promise<string[]> => {
  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Suggest 5 trending topics for Instagram carousels in the niche: "${niche}". Return only the topics as a list.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    }));

    return JSON.parse(response.text || "[]");
  } catch {
    return ["Estratégias de IA", "Design Brutalista", "SaaS Growth", "Networking de Elite", "Marketing Autônomo"];
  }
};

export const generateBatchIdeas = async (macroTheme: string, count: number): Promise<string[]> => {
  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate ${count} unique and viral carousel titles based on the macro-theme: "${macroTheme}".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    }));

    return JSON.parse(response.text || "[]");
  } catch {
    return Array(count).fill(0).map((_, i) => `Título Viral ${i + 1}: ${macroTheme}`);
  }
};
