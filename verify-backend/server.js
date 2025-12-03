// gemini-2.5-flash-preview-09-2025

// 1. Load our secret keys from the .env file
require('dotenv').config();

// 2. Import all our libraries
const express = require('express');
const cors = require('cors');
const axios = require('axios'); 
const { URL } = require('url');

// NEW: Import the Google Gemini library
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

// 3. Store our secret keys in variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY; 

// 4. Initialize our Express application
const app = express();
const PORT = 3001; 
app.use(cors()); 
app.use(express.json({ limit: '10mb' })); 

// 5. Define API URLs
const GOOGLE_FACT_CHECK_API_URL = 'https://factchecktools.googleapis.com/v1alpha1/claims:search';

// 6. NEW: Initialize Google Gemini Client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// =================================================================
// 🤖 MODEL SELECTOR
// =================================================================
// Currently set to 2.0 Flash Lite (0/30 RPM) as per your quota.
const geminiModelName = "gemini-2.0-flash";

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

/**
 * =================================================================
 * HELPER: Delay function to prevent Rate Limiting
 * =================================================================
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * =================================================================
 * HELPER: Sanitize text (MINIMAL VERSION)
 * =================================================================
 */
function sanitizeText(text) {
  if (typeof text !== 'string') {
    text = String(text);
  }
  return text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') 
    .trim();
}

/**
 * =================================================================
 * NEW CENTRAL HELPER FUNCTION: callGemini
 * =================================================================
 */
async function callGemini(systemPrompt, userPrompt, schema, useWebSearch = false) {
  try {
    const sanitizedPrompt = sanitizeText(userPrompt);
    
    const modelConfig = {
      model: geminiModelName,
      safetySettings,
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0,
      }
    };

    if (useWebSearch) {
      modelConfig.tools = [{ "google_search": {} }];
    }

    const model = genAI.getGenerativeModel(modelConfig);
    const result = await model.generateContent(sanitizedPrompt);
    const response = await result.response;
    const text = response.text();

    try {
      return JSON.parse(text);
    } catch (e) {
      const jsonMatch = text.match(/\{[\s\S]*\}/); 
      if (!jsonMatch) {
        console.error("Gemini Response (non-JSON):", text);
        throw new Error("Gemini responded with non-JSON text.");
      }
      return JSON.parse(jsonMatch[0]);
    }

  } catch (error) {
    console.error(`Error in callGemini (Prompt: "${systemPrompt.substring(0, 40)}..."):`, error.message);
    
    let errorMessage = `Gemini API call failed: ${error.message}`;
    if (error.message?.includes('API key not valid')) {
        errorMessage = "Gemini API call failed: The API key is not valid. Please check your .env file.";
    } else if (error.message?.includes('429')) {
        errorMessage = "Gemini API call failed: Rate limit exceeded. Please wait a minute.";
    } else if (error.message?.includes('404')) {
        errorMessage = `Gemini API call failed: Model '${geminiModelName}' not found. Check your API access.`;
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * =================================================================
 * FUNCTION 1: extractClaims
 * =================================================================
 */
async function extractClaims(articleText) {
  console.log("Extracting claims with Gemini...");
  const systemPrompt = `You are a fact-checking assistant. Your job is to read the following article and extract the main factual claims.

IMPORTANT:
1. Extract 5-7 of the most important factual claims.
2. DO NOT include any citations (e.g., [1][5]).
3. Simplify the claim.
4. For each claim, you MUST also provide the ORIGINAL SENTENCE from the article text. 
   - This MUST be the EXACT sentence, character-for-character.
   - COPY IT EXACTLY. Do NOT fix typos. Do NOT remove spacing.`;
  
  const schema = {
    type: "OBJECT",
    properties: {
      claims: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            claim: { type: "STRING", description: "The simplified, clean claim text" },
            originalSentence: { type: "STRING", description: "The EXACT character-for-character sentence from the text" }
          },
          required: ['claim', 'originalSentence']
        },
      },
    },
    required: ['claims'],
  };

  const result = await callGemini(systemPrompt, articleText, schema, false);
  return result.claims;
}

/**
 * =================================================================
 * FUNCTION 2: verifyClaim
 * =================================================================
 */
async function verifyClaim(claimText) {
  console.log(`Verifying claim: "${claimText}"`);
  
  try {
    const googleResponse = await axios.get(GOOGLE_FACT_CHECK_API_URL, {
      params: { query: claimText, key: GOOGLE_API_KEY }
    });

    if (googleResponse.data.claims && googleResponse.data.claims.length > 0) {
      const firstClaim = googleResponse.data.claims[0];
      const claimReview = firstClaim.claimReview[0];
      const rating = claimReview.textualRating; 

      console.log(`   -> Google Found: ${rating} (Source: ${claimReview.publisher.name})`);

      let status = "Questionable";
      if (rating.toLowerCase().includes("true")) status = "Verified";
      if (rating.toLowerCase().includes("false") || rating.toLowerCase().includes("misleading")) status = "Disputed";
      
      return {
        claim: claimText,
        status: status,
        source: claimReview.publisher.name,
        sourceUrl: claimReview.url,
        explanation: `Rating: ${rating}`,
        sourceScore: 95,
        sourceReputation: 'High'
      };
    }

    console.log("   -> Google found nothing. Corroborating with Gemini...");
    return await corroborateWithGemini(claimText); 

  } catch (error) {
    console.error(`   -> Error verifying claim "${claimText}":`, error.message);
    return {
      claim: claimText,
      status: "Questionable",
      source: "Error during verification",
      sourceUrl: null,
      explanation: error.message,
      sourceScore: 0,
      sourceReputation: 'Unknown'
    };
  }
}

/**
 * =================================================================
 * FUNCTION 3: corroborateWithGemini
 * =================================================================
 */
async function corroborateWithGemini(claimText) {
  const systemPrompt = `You are a fact-check researcher. You will be given a factual claim. Your job is to use Google Search to determine if the claim is "Verified" (true), "Disputed" (false), or "Questionable" (unverified).

You MUST find the *single best* source (e.g., a reputable news article or encyclopedia) that supports your conclusion.

For this source, you MUST also analyze its reputability:
1. Provide a "sourceScore" (0-100) where 100 is highly reputable/trustworthy.
2. Provide a "sourceReputation" label ("High", "Mixed", "Low").

You MUST respond with only a valid JSON object.
{
  "status": "Verified" | "Disputed" | "Questionable",
  "explanation": "A brief explanation of your findings.",
  "sourceName": "The name of the best source",
  "sourceUrl": "The full URL of that source",
  "sourceScore": 85,
  "sourceReputation": "High"
}
If you cannot find a specific source URL, return empty string "" for sourceUrl and 0 for score.`;
  
  const schema = {
    type: "OBJECT",
    properties: {
      status: { type: "STRING", enum: ['Verified', 'Disputed', 'Questionable'] },
      explanation: { type: "STRING" },
      sourceName: { type: "STRING" },
      sourceUrl: { type: "STRING" },
      sourceScore: { type: "NUMBER" },
      sourceReputation: { type: "STRING", enum: ['High', 'Mixed', 'Low', 'Unknown'] }
    },
    required: ['status', 'explanation', 'sourceName', 'sourceUrl', 'sourceScore', 'sourceReputation'],
  };

  const result = await callGemini(systemPrompt, claimText, schema, true);
  
  // FIX: Normalize score if AI returns 0.9 instead of 90
  let finalScore = result.sourceScore;
  if (finalScore <= 1 && finalScore > 0) {
    finalScore = Math.round(finalScore * 100);
  }

  console.log(`   -> Gemini Corroboration: ${result.status}. Score: ${finalScore}`);
    
  return {
    claim: claimText,
    status: result.status, 
    source: result.sourceName,
    sourceUrl: result.sourceUrl,
    explanation: result.explanation,
    sourceScore: finalScore,
    sourceReputation: result.sourceReputation
  };
}

/**
 * =================================================================
 * FUNCTION 4: analyzeSentiment
 * =================================================================
 */
async function analyzeSentiment(articleText) {
  console.log("Analyzing sentiment and bias...");
  const systemPrompt = `You are an expert media analyst. Your job is to analyze the given news article for its language, sentiment, and potential bias.
- **Sentiment**: Is the overall tone Positive, Negative, or Neutral?
- **Bias**: Is the language objective, or does it use emotionally charged words? Rate the bias as "Objective", "Biased", or "Strongly Biased".`;
  
  const schema = {
    type: "OBJECT",
    properties: {
      sentiment: { type: "STRING", enum: ['Positive', 'Negative', 'Neutral'] },
      bias: { type: "STRING", enum: ['Objective', 'Biased', 'Strongly Biased'] },
      explanation: { type: "STRING", description: "A brief explanation for your ratings, pointing to specific language." },
    },
    required: ['sentiment', 'bias', 'explanation'],
  };

  const result = await callGemini(systemPrompt, articleText, schema, false);
  console.log(`   -> Sentiment Analysis Complete: ${result.bias} (${result.sentiment})`);
  return result; 
}

/**
 * =================================================================
 * FUNCTION 5: analyzeAuthorship
 * =================================================================
 */
async function analyzeAuthorship(articleText) {
  console.log("Analyzing AI authorship...");
  const systemPrompt = `You are an expert AI text detector. Analyze the given text's linguistic patterns (like perplexity and burstiness) to determine the probability that it was written by an AI.`;
  
  const schema = {
    type: "OBJECT",
    properties: {
      authorship: { type: "STRING", enum: ['Likely AI-Generated', 'Likely Human-Written'] },
      probability_ai_generated: { type: "NUMBER", minimum: 0, maximum: 100 },
      explanation: { type: "STRING", description: "A brief explanation for your analysis, referencing the text's style." },
    },
    required: ['authorship', 'probability_ai_generated', 'explanation'],
  };

  const result = await callGemini(systemPrompt, articleText, schema, false);
  console.log(`   -> Authorship Analysis Complete: ${result.authorship} (${result.probability_ai_generated}%)`);
  return result; 
}

/**
 * =================================================================
 * FUNCTION 6: analyzeSite
 * =================================================================
 */
async function analyzeSite(articleUrl) {
  console.log("Analyzing site reputation...");
  let domain;
  try {
    const url = new URL(articleUrl);
    domain = url.hostname.replace(/^www\./, '');
  } catch (e) {
    console.error("   -> Error parsing URL:", e.message);
    return { domain: "Invalid URL", reputation: "Unknown", politicalBias: "Unknown", biasContext: "N/A", explanation: "The provided URL was invalid." };
  }
  
  console.log(`   -> Analyzing domain: ${domain}`);
  
  const systemPrompt = `You are an expert media analyst. You will be given a domain name. Your job is to use Google Search to analyze its general reputation, trustworthiness, and political bias.

You MUST respond with *only* a valid JSON object.
{
  "domain": "${domain}",
  "reputation": "High" | "Mixed" | "Low" | "Unknown",
  "politicalBias": "Left" | "Center-Left" | "Center" | "Center-Right" | "Right" | "Non-Partisan" | "N/A",
  "biasContext": "US Politics" | "Global" | "Tech Industry" | "Finance" | "N/A" | "Other",
  "explanation": "A brief 1-2 sentence summary."
}`;
  
  const schema = {
    type: "OBJECT",
    properties: {
      domain: { type: "STRING" },
      reputation: { type: "STRING", enum: ['High', 'Mixed', 'Low', 'Unknown'] },
      politicalBias: { type: "STRING", enum: ['Left', 'Center-Left', 'Center', 'Center-Right', 'Right', 'Non-Partisan', 'N/A'] },
      biasContext: { type: "STRING" },
      explanation: { type: "STRING", description: "A brief summary of the site's reputation and why you gave these ratings." },
    },
    required: ['domain', 'reputation', 'politicalBias', 'biasContext', 'explanation'],
  };

  const result = await callGemini(systemPrompt, domain, schema, true);
  console.log(`   -> Site Analysis Complete: ${result.reputation} Bias: ${result.politicalBias}`);
  return result; 
}

/**
 * =================================================================
 * ENDPOINT: /analyze
 * =================================================================
 */
app.post('/analyze', async (req, res) => {
  try {
    const { articleText, articleUrl } = req.body;
    
    if (!articleText || !articleUrl) {
      return res.status(400).json({ error: "articleText and articleUrl are required" });
    }

    console.log("===================================");
    console.log("NEW V2+ (Gemini) ANALYSIS REQUEST");
    console.log(`On URL: ${articleUrl}`);
    console.log("===================================");

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const sendEvent = (type, data) => {
      const eventData = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
      res.write(eventData);
      if (res.flush) res.flush();
    };

    try {
      console.log("Step 1: Running tasks SEQUENTIALLY to avoid Rate Limit...");
      sendEvent('status', { message: 'Extracting claims and analyzing article...' });
      
      const rawClaims = await extractClaims(articleText);
      await delay(1000); 

      const sentimentResult = await analyzeSentiment(articleText);
      await delay(1000); 

      const authorshipResult = await analyzeAuthorship(articleText);
      await delay(1000); 

      const siteResult = await analyzeSite(articleUrl);
      await delay(1000); 
      
      sendEvent('step1', {
        siteAnalysis: siteResult,
        sentiment: sentimentResult,
        authorship: authorshipResult,
        rawClaimsCount: rawClaims.length
      });
      
      console.log("Step 2: Verifying claims one by one...");
      sendEvent('status', { message: `Verifying ${rawClaims.length} claims...` });
      
      const verificationResults = []; 
      for (let i = 0; i < rawClaims.length; i++) {
        const rawClaimObj = rawClaims[i];
        const claimText = typeof rawClaimObj === 'string' ? rawClaimObj : rawClaimObj.claim;
        const originalSentence = typeof rawClaimObj === 'string' ? null : rawClaimObj.originalSentence;
        
        const cleanClaim = claimText.replace(/\[.*?\]/g, '').trim();
        if (cleanClaim.length < 10) {
          continue; 
        }
        
        sendEvent('status', { message: `Verifying claim ${i + 1}/${rawClaims.length}...` });
        
        await delay(1000); 
        
        const result = await verifyClaim(cleanClaim);
        
        // VITAL: Ensure the highlighter can find the text by passing back the original sentence
        result.originalSentence = originalSentence || cleanClaim;
        
        verificationResults.push(result);
        sendEvent('claim', result);
      }
      
      sendEvent('complete', {
        status: "success",
        totalClaims: verificationResults.length
      });

      res.end();

    } catch (error) {
      console.error("Error during analysis:", error.message);
      sendEvent('error', { error: error.message });
      res.end();
    }

  } catch (error) {
    console.error("Error in /analyze endpoint:", error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: "An internal server error occurred." });
    }
  }
});

/**
 * =================================================================
 * ENDPOINT: /additional-sources
 * =================================================================
 */
app.post('/additional-sources', async (req, res) => {
  try {
    const { claim, currentSource } = req.body;
    
    if (!claim) {
      return res.status(400).json({ error: "claim is required" });
    }

    console.log("===================================");
    console.log("ADDITIONAL SOURCES REQUEST");
    console.log(`Claim: "${claim}"`);
    console.log("===================================");

    const systemPrompt = `You are a research assistant helping to verify claims by finding additional credible sources.

Given a claim, search the web and find 3-5 additional credible sources that discuss, verify, or dispute this claim.

For each source, provide:
1. The title of the article/source
2. A brief summary of what the source says about the claim
3. The source name (e.g., "BBC News", "Nature Journal", "Reuters")
4. The URL
5. Publication date if available
6. A reputability score (0-100) where 100 is highly reputable/trustworthy.
7. A reputability label ("High", "Mixed", "Low").

Focus on credible, authoritative sources. Avoid personal blogs.`;

    const schema = {
      type: 'OBJECT',
      properties: {
        sources: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              title: { type: 'STRING' },
              summary: { type: 'STRING' },
              source: { type: 'STRING' },
              url: { type: 'STRING' },
              date: { type: 'STRING' },
              sourceScore: { type: 'NUMBER' },
              sourceReputation: { type: 'STRING', enum: ['High', 'Mixed', 'Low'] }
            },
            required: ['title', 'summary', 'source', 'sourceScore', 'sourceReputation']
          }
        }
      },
      required: ['sources']
    };

    const result = await callGemini(systemPrompt, claim, schema, true); 
    
    // FIX: Normalize scores here too (e.g., convert 0.9 to 90)
    if (result.sources) {
        result.sources.forEach(s => {
            if (s.sourceScore && s.sourceScore <= 1 && s.sourceScore > 0) {
                s.sourceScore = Math.round(s.sourceScore * 100);
            }
        });
    }

    console.log(`   -> Found ${result.sources.length} additional sources`);

    res.json({
      status: "success",
      sources: result.sources
    });

  } catch (error) {
    console.error("Error in /additional-sources endpoint:", error.message);
    res.status(500).json({ error: "Failed to fetch additional sources." });
  }
});

/**
 * =================================================================
 * NEW ENDPOINT: /deep-research
 * =================================================================
 */
app.post('/deep-research', async (req, res) => {
  try {
    const { claim } = req.body;
    
    if (!claim) {
      return res.status(400).json({ error: "claim is required" });
    }

    console.log("===================================");
    console.log("DEEP RESEARCH REQUEST");
    console.log(`Claim: "${claim}"`);
    console.log("===================================");

    const systemPrompt = `You are an expert investigative journalist and researcher.
    Your goal is to provide a "Deep Dive" analysis of the given claim.
    
    1. Investigate the claim thoroughly using Google Search.
    2. Look for nuances, context, and history that simple "True/False" checks might miss.
    3. Identify if there is a scientific or historical consensus.
    4. Find valid counter-arguments or conflicting viewpoints.
    
    You MUST respond with only a valid JSON object.
    {
      "summary": "A comprehensive executive summary of the topic.",
      "key_points": ["Point 1", "Point 2", "Point 3"],
      "consensus": "What is the general consensus?",
      "counter_arguments": "What are the main opposing views?",
      "timeline": "Brief timeline of relevant events if applicable (or 'N/A')."
    }`;

    const schema = {
      type: 'OBJECT',
      properties: {
        summary: { type: 'STRING' },
        key_points: { 
          type: 'ARRAY',
          items: { type: 'STRING' }
        },
        consensus: { type: 'STRING' },
        counter_arguments: { type: 'STRING' },
        timeline: { type: 'STRING' }
      },
      required: ['summary', 'key_points', 'consensus', 'counter_arguments', 'timeline']
    };

    const result = await callGemini(systemPrompt, claim, schema, true); 
    console.log(`   -> Deep Research Complete`);

    res.json({
      status: "success",
      data: result
    });

  } catch (error) {
    console.error("Error in /deep-research endpoint:", error.message);
    res.status(500).json({ error: "Failed to perform deep research." });
  }
});

/**
 * =================================================================
 * Server Startup
 * =================================================================
 */
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  
  if (GEMINI_API_KEY) {
    console.log("Gemini API Key loaded successfully!");
  } else {
    console.error("ERROR: GEMINI_API_KEY not found. Did you create .env and add it?");
  }
  
  if (GOOGLE_API_KEY) {
    console.log("Google Fact Check API Key loaded successfully!");
  } else {
    console.error("ERROR: GOOGLE_API_KEY not found.");
  }
});