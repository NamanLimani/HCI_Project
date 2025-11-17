// // 1. Load our secret keys from the .env file
// require('dotenv').config();

// // 2. Import all our libraries
// const express = require('express');
// const cors = require('cors');
// const axios = require('axios'); 
// const { URL } = require('url'); 

// // 3. Store our secret keys in variables
// const PPLX_API_KEY = process.env.PERPLEXITY_API_KEY;
// const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY; 

// // 4. Initialize our Express application
// const app = express();
// const PORT = 3001; 
// app.use(cors()); 
// app.use(express.json()); 

// // 5. Define API URLs
// const PPLX_API_URL = 'https://api.perplexity.ai/chat/completions'; 
// const GOOGLE_FACT_CHECK_API_URL = 'https://factchecktools.googleapis.com/v1alpha1/claims:search';


// /**
//  * =================================================================
//  * FUNCTION 1: extractClaims(text)
//  * =================================================================
//  */
// async function extractClaims(articleText) {
//   const systemPrompt = `You are a fact-checking assistant. Your job is to read the following article and extract the main factual claims.

// A "factual claim" is a statement that can be verified with evidence, such as "The Eiffel Tower is 300 meters tall."
// It is NOT an opinion, a question, or a vague statement, such as "That movie was good."

// IMPORTANT:
// 1.  Extract between 5 and 7 of the most important factual claims.
// 2.  DO NOT include any citations or bracketed numbers (e.g., [1][5]).
// 3.  Simplify the claim. For example, "The claim that 'the earth is flat' contradicts evidence[2]" should become "The earth is flat."
// `;

//   const jsonSchema = {
//     type: 'object',
//     properties: {
//       claims: {
//         type: 'array',
//         items: {
//           type: 'string',
//         },
//       },
//     },
//     required: ['claims'],
//   };

//   try {
//     const response = await axios.post(
//       PPLX_API_URL,
//       {
//         model: 'sonar-pro', 
//         messages: [
//           { role: 'system', content: systemPrompt }, 
//           { role: 'user', content: articleText }, 
//         ],
//         response_format: {
//           type: 'json_schema',
//           json_schema: {
//             schema: jsonSchema
//           }
//         }, 
//       },
//       {
//         headers: {
//           'Authorization': `Bearer ${PPLX_API_KEY}`, 
//           'Content-Type': 'application/json',
//         },
//       }
//     );
//     const responseData = JSON.parse(response.data.choices[0].message.content);
//     return responseData.claims;
//   } catch (error) {
//     if (error.response) {
//       console.error("Error calling Perplexity API:", JSON.stringify(error.response.data, null, 2));
//     } else {
//       console.error("Error calling Perplexity API:", error.message);
//     }
//     throw new Error("Failed to get claims from Perplexity");
//   }
// }


// /**
//  * =================================================================
//  * FUNCTION 2: verifyClaim(claimText)
//  * =================================================================
//  */
// async function verifyClaim(claimText) {
//   console.log(`Verifying claim: "${claimText}"`);
  
//   try {
//     const googleResponse = await axios.get(GOOGLE_FACT_CHECK_API_URL, {
//       params: {
//         query: claimText, 
//         key: GOOGLE_API_KEY 
//       }
//     });

//     if (googleResponse.data.claims && googleResponse.data.claims.length > 0) {
//       const firstClaim = googleResponse.data.claims[0];
//       const claimReview = firstClaim.claimReview[0];
//       const rating = claimReview.textualRating; 

//       console.log(`   -> Google Found: ${rating} (Source: ${claimReview.publisher.name})`);

//       let status = "Questionable";
//       if (rating.toLowerCase().includes("true")) status = "Verified";
//       if (rating.toLowerCase().includes("false") || rating.toLowerCase().includes("misleading")) status = "Disputed";
      
//       return {
//         claim: claimText,
//         status: status,
//         source: claimReview.publisher.name,
//         sourceUrl: claimReview.url
//       };
//     }

//     console.log("   -> Google found nothing. Corroborating with Perplexity...");
//     return await corroborateWithPerplexity(claimText);

//   } catch (error) {
//     console.error(`   -> Error verifying claim "${claimText}":`, error.message);
//     return {
//       claim: claimText,
//       status: "Questionable",
//       source: "Error during verification",
//       sourceUrl: null
//     };
//   }
// }

// /**
//  * =================================================================
//  * FUNCTION 3: corroborateWithPerplexity(claimText)
//  * =================================================================
//  */
// async function corroborateWithPerplexity(claimText) {
//   const systemPrompt = `You are a fact-check researcher. You will be given a factual claim.
// Your job is to perform a web search and determine if the claim is "Verified" (true), "Disputed" (false), or "Questionable" (unverified).

// You MUST respond in the following JSON format. Do not add any other text.
// {
//   "status": "Verified | Disputed | Questionable",
//   "explanation": "A brief explanation of your findings and the sources you found."
// }
// `;

//   const jsonSchema = {
//     type: 'object',
//     properties: {
//       status: {
//         type: 'string',
//         enum: ['Verified', 'Disputed', 'Questionable'],
//       },
//       explanation: {
//         type: 'string',
//       },
//     },
//     required: ['status', 'explanation'],
//   };

//   try {
//     const response = await axios.post(
//       PPLX_API_URL,
//       {
//         model: 'sonar-pro',
//         messages: [
//           { role: 'system', content: systemPrompt },
//           { role: 'user', content: claimText }
//         ],
//         response_format: {
//           type: 'json_schema',
//           json_schema: {
//             schema: jsonSchema
//           }
//         },
//       },
//       {
//         headers: {
//           'Authorization': `Bearer ${PPLX_API_KEY}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     );
    
//     const result = JSON.parse(response.data.choices[0].message.content);
//     console.log(`   -> Perplexity Corroboration: ${result.status}.`);
    
//     return {
//       claim: claimText,
//       status: result.status, 
//       source: "Perplexity Web Search",
//       sourceUrl: null 
//     };

//   } catch (error) {
//     console.error(`   -> Error in Perplexity corroboration:`, error.message);
//     return {
//       claim: claimText,
//       status: "Questionable",
//       source: "Error during corroboration",
//       sourceUrl: null
//     };
//   }
// }

// /**
//  * =================================================================
//  * FUNCTION 4: analyzeSentiment(articleText)
//  * =================================================================
//  */
// async function analyzeSentiment(articleText) {
//   console.log("Analyzing sentiment and bias...");
//   const systemPrompt = `You are an expert media analyst. You will be given a news article.
// Your job is to analyze its language for sentiment and potential bias.

// You MUST respond in the following JSON format. Do not add any other text.
// {
//   "sentiment": "Positive | Negative | Neutral",
//   "bias": "Strongly Biased | Biased | Objective",
//   "explanation": "A brief explanation for your ratings, pointing to specific examples of language used in the text."
// }
// `;
//   const jsonSchema = {
//     type: 'object',
//     properties: {
//       sentiment: { type: 'string', enum: ['Positive', 'Negative', 'Neutral'] },
//       bias: { type: 'string', enum: ['Objective', 'Biased', 'Strongly Biased'] },
//       explanation: { type: 'string' },
//     },
//     required: ['sentiment', 'bias', 'explanation'],
//   };

//   try {
//     const response = await axios.post(
//       PPLX_API_URL,
//       {
//         model: 'sonar-pro',
//         messages: [
//           { role: 'system', content: systemPrompt },
//           { role: 'user', content: articleText } 
//         ],
//         response_format: {
//           type: 'json_schema',
//           json_schema: {
//             schema: jsonSchema
//           }
//         },
//       },
//       {
//         headers: {
//           'Authorization': `Bearer ${PPLX_API_KEY}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     );
    
//     const result = JSON.parse(response.data.choices[0].message.content);
//     console.log(`   -> Sentiment Analysis Complete: ${result.bias} (${result.sentiment})`);
//     return result; 

//   } catch (error) {
//     console.error(`   -> Error in analyzeSentiment:`, error.message);
//     return {
//       sentiment: "Unknown",
//       bias: "Unknown",
//       explanation: "Failed to analyze sentiment due to an error."
//     };
//   }
// }

// /**
//  * =================================================================
//  * FUNCTION 5: analyzeAuthorship(articleText)
//  * =================================================================
//  */
// async function analyzeAuthorship(articleText) {
//   console.log("Analyzing AI authorship...");
//   const systemPrompt = `You are an expert AI text detector. You will be given a piece of text.
// Your job is to analyze its linguistic patterns to determine the probability that it was written by an AI.

// You MUST respond in the following JSON format. Do not add any other text.
// {
//   "authorship": "Likely AI-Generated | Likely Human-Written",
//   "probability_ai_generated": 85,
//   "explanation": "A brief explanation for your analysis, referencing the text's style."
// }
// `;
//   const jsonSchema = {
//     type: 'object',
//     properties: {
//       authorship: { type: 'string', enum: ['Likely AI-Generated', 'Likely Human-Written'] },
//       probability_ai_generated: { type: 'number', minimum: 0, maximum: 100 },
//       explanation: { type: 'string' },
//     },
//     required: ['authorship', 'probability_ai_generated', 'explanation'],
//   };

//   try {
//     const response = await axios.post(
//       PPLX_API_URL,
//       {
//         model: 'sonar-pro',
//         messages: [
//           { role: 'system', content: systemPrompt },
//           { role: 'user', content: articleText } 
//         ],
//         response_format: {
//           type: 'json_schema',
//           json_schema: {
//             schema: jsonSchema
//           }
//         },
//       },
//       {
//         headers: {
//           'Authorization': `Bearer ${PPLX_API_KEY}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     );
    
//     const result = JSON.parse(response.data.choices[0].message.content);
//     console.log(`   -> Authorship Analysis Complete: ${result.authorship} (${result.probability_ai_generated}%)`);
//     return result; 

//   } catch (error) {
//     console.error(`   -> Error in analyzeAuthorship:`, error.message);
//     return {
//       authorship: "Unknown",
//       probability_ai_generated: 0,
//       explanation: "Failed to analyze authorship due to an error."
//     };
//   }
// }

// /**
//  * =================================================================
//  * V2+ FUNCTION (UPDATED): analyzeSite(articleUrl)
//  * =================================================================
//  */
// async function analyzeSite(articleUrl) {
//   console.log("Analyzing site reputation...");
  
//   let domain;
//   try {
//     const url = new URL(articleUrl);
//     domain = url.hostname; 
//     domain = domain.replace(/^www\./, ''); 
//   } catch (e) {
//     console.error("   -> Error parsing URL:", e.message);
//     return {
//       domain: "Invalid URL",
//       reputation: "Unknown",
//       politicalBias: "Unknown",
//       biasContext: "N/A", // NEW
//       explanation: "The provided URL was invalid."
//     };
//   }
  
//   console.log(`   -> Analyzing domain: ${domain}`);

//   // NEW: Updated System Prompt
//   const systemPrompt = `You are an expert media analyst. You will be given a domain name.
// Your job is to analyze its general reputation, trustworthiness, and political bias.

// You MUST respond in the following JSON format. Do not add any other text.
// {
//   "domain": "example.com",
//   "reputation": "High | Mixed | Low | Unknown",
//   "politicalBias": "Left-Leaning | Center-Left | Center | Center-Right | Right-Leaning | Non-Partisan | N/A",
//   "biasContext": "A 1-3 word description of the political context (e.g., 'US Politics', 'UK Politics', 'Social Issues', 'Global').",
//   "explanation": "A brief summary of the site's reputation, what it's known for, and why you gave these ratings."
// }
// `;
  
//   // NEW: Updated JSON Schema
//   const jsonSchema = {
//     type: 'object',
//     properties: {
//       domain: { type: 'string' },
//       reputation: { type: 'string', enum: ['High', 'Mixed', 'Low', 'Unknown'] },
//       politicalBias: { type: 'string', enum: ['Left-Leaning', 'Center-Left', 'Center', 'Center-Right', 'Right-Leaning', 'Non-Partisan', 'N/A'] },
//       biasContext: { type: 'string' }, // NEW FIELD
//       explanation: { type: 'string' },
//     },
//     required: ['domain', 'reputation', 'politicalBias', 'biasContext', 'explanation'],
//   };

//   try {
//     const response = await axios.post(
//       PPLX_API_URL,
//       {
//         model: 'sonar-pro',
//         messages: [
//           { role: 'system', content: systemPrompt },
//           { role: 'user', content: domain } 
//         ],
//         response_format: {
//           type: 'json_schema',
//           json_schema: {
//             schema: jsonSchema
//           }
//         },
//       },
//       {
//         headers: {
//           'Authorization': `Bearer ${PPLX_API_KEY}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     );
    
//     const result = JSON.parse(response.data.choices[0].message.content);
//     console.log(`   -> Site Analysis Complete: ${result.reputation} Bias: ${result.politicalBias} (${result.biasContext})`);
//     return result; 

//   } catch (error) {
//     console.error(`   -> Error in analyzeSite:`, error.message);
//     return {
//       domain: domain,
//       reputation: "Unknown",
//       politicalBias: "Unknown",
//       biasContext: "N/A", // NEW
//       explanation: "Failed to analyze site reputation due to an error."
//     };
//   }
// }


// /**
//  * =================================================================
//  * ENDPOINT: /analyze (No changes needed here)
//  * =================================================================
//  */
// app.post('/analyze', async (req, res) => {
//   try {
//     const { articleText, articleUrl } = req.body;
    
//     if (!articleText || !articleUrl) {
//       return res.status(400).json({ error: "articleText and articleUrl are required" });
//     }

//     console.log("===================================");
//     console.log("NEW V2+ (Full) ANALYSIS REQUEST");
//     console.log(`On URL: ${articleUrl}`);
//     console.log("===================================");

//     console.log("Step 1: Running parallel tasks (Claims, Sentiment, Authorship, Site)...");
    
//     const [rawClaims, sentimentResult, authorshipResult, siteResult] = await Promise.all([
//       extractClaims(articleText),
//       analyzeSentiment(articleText),
//       analyzeAuthorship(articleText),
//       analyzeSite(articleUrl) 
//     ]);
    
//     console.log(`Step 1 Complete: Found ${rawClaims.length} raw claims.`);
    
//     console.log("Step 2: Verifying claims one by one...");
    
//     const verificationResults = []; 

//     for (const rawClaim of rawClaims) {
      
//       const cleanClaim = rawClaim.replace(/\[.*?\]/g, '').trim();

//       if (cleanClaim.length < 10) {
//         console.log(`Skipping junk claim: "${rawClaim}"`);
//         continue; 
//       }

//       const result = await verifyClaim(cleanClaim);
      
//       verificationResults.push(result);
//     }
    
//     console.log("Step 2 Complete: All claims verified.");
//     console.log("===================================");

//     res.json({
//       status: "success",
//       siteAnalysis: siteResult,     
//       sentiment: sentimentResult,   
//       authorship: authorshipResult, 
//       results: verificationResults  
//     });

//   } catch (error) {
//     console.error("Error in /analyze endpoint:", error.message);
//     res.status(500).json({ error: "An internal server error occurred." });
//   }
// });

// /**
//  * =================================================================
//  * Server Startup
//  * =================================================================
//  */
// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
  
//   if (PPLX_API_KEY) {
//     console.log("Perplexity APIKey loaded successfully!");
//   } else {
//     console.error("ERROR: PERPLEXITY_API_KEY not found.");
//   }
  
//   if (GOOGLE_API_KEY) {
//     console.log("Google API Key loaded successfully!");
//   } else {
//     console.error("ERROR: GOOGLE_API_KEY not found.");
//   }
// });










// // 1. Load our secret keys from the .env file
// require('dotenv').config();

// // 2. Import all our libraries
// const express = require('express');
// const cors = require('cors');
// const axios = require('axios'); // We still need axios for the Google Fact Check API
// const { URL } = require('url');

// // NEW: Import the Google Gemini library
// const {
//   GoogleGenerativeAI,
//   HarmCategory,
//   HarmBlockThreshold,
// } = require("@google/generative-ai");

// // 3. Store our secret keys in variables
// const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // NEW
// const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY; 

// // 4. Initialize our Express application
// const app = express();
// const PORT = 3001; 
// app.use(cors()); 
// app.use(express.json()); 

// // 5. Define API URLs
// const GOOGLE_FACT_CHECK_API_URL = 'https://factchecktools.googleapis.com/v1alpha1/claims:search';

// // 6. NEW: Initialize Google Gemini Client
// const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
// const geminiModelName = "gemini-2.5-flash-preview-09-2025";

// // NEW: We must set safety settings to be non-restrictive
// const safetySettings = [
//   { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
//   { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
//   { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
//   { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
// ];

// /**
//  * =================================================================
//  * HELPER: Sanitize text to remove problematic Unicode characters
//  * =================================================================
//  */
// function sanitizeText(text) {
//   // Convert to string if not already
//   if (typeof text !== 'string') {
//     text = String(text);
//   }
  
//   // Replace problematic Unicode characters with ASCII equivalents or remove them
//   return text
//     // Keep basic ASCII and common Latin-1 (codes 0-255) but remove high Unicode
//     .replace(/[\u0300-\u036F]/g, '') // Remove combining diacritical marks
//     .replace(/[\u0400-\uFFFF]/g, '') // Remove Cyrillic, CJK, and other high Unicode
//     .replace(/\s+/g, ' ') // Normalize whitespace
//     .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
//     .trim();
// }

// /**
//  * =================================================================
//  * NEW CENTRAL HELPER FUNCTION: callGemini (with Bugfix)
//  * =================================================================
//  */
// async function callGemini(systemPrompt, userPrompt, schema, useWebSearch = false) {
//   try {
//     // Sanitize the user prompt to remove problematic Unicode characters
//     const sanitizedPrompt = sanitizeText(userPrompt);
    
//     const modelConfig = {
//       model: geminiModelName,
//       safetySettings,
//       systemInstruction: { parts: [{ text: systemPrompt }] },
//     };

//     if (useWebSearch) {
//       // For web search, we CANNOT force a JSON mime type.
//       // We just ask for a low temperature.
//       modelConfig.tools = [{ "google_search": {} }];
//       modelConfig.generationConfig = {
//         temperature: 0,
//       };
//     } else {
//       // For tasks *without* web search, we CAN force JSON.
//       modelConfig.generationConfig = {
//         responseMimeType: "application/json",
//         responseSchema: schema,
//         temperature: 0,
//       };
//     }

//     const model = genAI.getGenerativeModel(modelConfig);
//     const result = await model.generateContent(sanitizedPrompt);
//     const response = await result.response;
//     const text = response.text();

//     if (useWebSearch) {
//       // If we used web search, the response is text. We must find the JSON inside it.
//       const jsonMatch = text.match(/\{[\s\S]*\}/); // Find the first JSON block
//       if (!jsonMatch) {
//         console.error("Gemini Response (non-JSON):", text);
//         throw new Error("Gemini responded with non-JSON text.");
//       }
//       return JSON.parse(jsonMatch[0]);
//     } else {
//       // If we didn't use search, the text *is* the JSON.
//       return JSON.parse(text);
//     }

//   } catch (error) {
//     console.error(`Error in callGemini (Prompt: "${systemPrompt.substring(0, 40)}..."):`, error.message);
//     if (error.response) {
//       console.error("Gemini API Error Response:", JSON.stringify(error.response, null, 2));
//     }
    
//     let errorMessage = `Gemini API call failed: ${error.message}`;
//     if (error.message?.includes('API key not valid')) {
//         errorMessage = "Gemini API call failed: The API key is not valid. Please check your .env file.";
//     } else if (error.message?.includes('400 Bad Request')) {
//         errorMessage = `Gemini API call failed: Bad Request. This may be due to the prompt or a temporary API issue. ${error.message}`;
//     }
    
//     throw new Error(errorMessage);
//   }
// }

// /**
//  * =================================================================
//  * FUNCTION 1: extractClaims (Rewritten for Gemini)
//  * =================================================================
//  */
// async function extractClaims(articleText) {
//   console.log("Extracting claims with Gemini...");
//   const systemPrompt = `You are a fact-checking assistant. Your job is to read the following article and extract the main factual claims. A "factual claim" is a statement that can be verified with evidence. It is NOT an opinion, a question, or a vague statement.

// IMPORTANT:
// 1. Extract 5-7 of the most important factual claims.
// 2. DO NOT include any citations (e.g., [1][5]).
// 3. Simplify the claim. For example, "The claim that 'the earth is flat' contradicts evidence[2]" should become "The earth is flat."`;
  
//   const schema = {
//     type: "OBJECT",
//     properties: {
//       claims: {
//         type: "ARRAY",
//         items: { type: "STRING" },
//       },
//     },
//     required: ['claims'],
//   };

//   const result = await callGemini(systemPrompt, articleText, schema, false);
//   return result.claims;
// }

// /**
//  * =================================================================
//  * FUNCTION 2: verifyClaim (Unchanged, still uses Google Fact Check API)
//  * =================================================================
//  */
// async function verifyClaim(claimText) {
//   console.log(`Verifying claim: "${claimText}"`);
  
//   try {
//     const googleResponse = await axios.get(GOOGLE_FACT_CHECK_API_URL, {
//       params: { query: claimText, key: GOOGLE_API_KEY }
//     });

//     if (googleResponse.data.claims && googleResponse.data.claims.length > 0) {
//       const firstClaim = googleResponse.data.claims[0];
//       const claimReview = firstClaim.claimReview[0];
//       const rating = claimReview.textualRating; 

//       console.log(`   -> Google Found: ${rating} (Source: ${claimReview.publisher.name})`);

//       let status = "Questionable";
//       if (rating.toLowerCase().includes("true")) status = "Verified";
//       if (rating.toLowerCase().includes("false") || rating.toLowerCase().includes("misleading")) status = "Disputed";
      
//       return {
//         claim: claimText,
//         status: status,
//         source: claimReview.publisher.name,
//         sourceUrl: claimReview.url,
//         explanation: `Rating: ${rating}`
//       };
//     }

//     console.log("   -> Google found nothing. Corroborating with Gemini...");
//     return await corroborateWithGemini(claimText); 

//   } catch (error) {
//     console.error(`   -> Error verifying claim "${claimText}":`, error.message);
//     return {
//       claim: claimText,
//       status: "Questionable",
//       source: "Error during verification",
//       sourceUrl: null,
//       explanation: error.message
//     };
//   }
// }

// /**
//  * =================================================================
//  * FUNCTION 3: corroborateWithGemini (Rewritten for Gemini)
//  * =================================================================
//  */
// async function corroborateWithGemini(claimText) {
//   const systemPrompt = `You are a fact-check researcher. You will be given a factual claim. Your job is to use Google Search to determine if the claim is "Verified" (true), "Disputed" (false), or "Questionable" (unverified).
  
//   You MUST respond with only a valid JSON object. Do not add any other text.
//   Your JSON object must follow this exact schema:
//   {
//     "status": "Verified" | "Disputed" | "Questionable",
//     "explanation": "A brief explanation of your findings."
//   }
//   You MUST use one of the three specified strings for the "status" field.`;
  
//   const schema = {
//     type: "OBJECT",
//     properties: {
//       status: { type: "STRING", enum: ['Verified', 'Disputed', 'Questionable'] },
//       explanation: { type: "STRING" },
//     },
//     required: ['status', 'explanation'],
//   };

//   const result = await callGemini(systemPrompt, claimText, schema, true); // Web search IS needed
//   console.log(`   -> Gemini Corroboration: ${result.status}.`);
    
//   return {
//     claim: claimText,
//     status: result.status, 
//     source: "Gemini Web Search",
//     sourceUrl: null,
//     explanation: result.explanation
//   };
// }

// /**
//  * =================================================================
//  * FUNCTION 4: analyzeSentiment (Rewritten for Gemini)
//  * =================================================================
//  */
// async function analyzeSentiment(articleText) {
//   console.log("Analyzing sentiment and bias...");
//   const systemPrompt = `You are an expert media analyst. Your job is to analyze the given news article for its language, sentiment, and potential bias.
// - **Sentiment**: Is the overall tone Positive, Negative, or Neutral?
// - **Bias**: Is the language objective, or does it use emotionally charged words? Rate the bias as "Objective", "Biased", or "Strongly Biased".`;
  
//   const schema = {
//     type: "OBJECT",
//     properties: {
//       sentiment: { type: "STRING", enum: ['Positive', 'Negative', 'Neutral'] },
//       bias: { type: "STRING", enum: ['Objective', 'Biased', 'Strongly Biased'] },
//       explanation: { type: "STRING", description: "A brief explanation for your ratings, pointing to specific language." },
//     },
//     required: ['sentiment', 'bias', 'explanation'],
//   };

//   const result = await callGemini(systemPrompt, articleText, schema, false); // No web search needed
//   console.log(`   -> Sentiment Analysis Complete: ${result.bias} (${result.sentiment})`);
//   return result; 
// }

// /**
//  * =================================================================
//  * FUNCTION 5: analyzeAuthorship (Rewritten for Gemini)
//  * =================================================================
//  */
// async function analyzeAuthorship(articleText) {
//   console.log("Analyzing AI authorship...");
//   const systemPrompt = `You are an expert AI text detector. Analyze the given text's linguistic patterns (like perplexity and burstiness) to determine the probability that it was written by an AI.`;
  
//   const schema = {
//     type: "OBJECT",
//     properties: {
//       authorship: { type: "STRING", enum: ['Likely AI-Generated', 'Likely Human-Written'] },
//       probability_ai_generated: { type: "NUMBER", minimum: 0, maximum: 100 },
//       explanation: { type: "STRING", description: "A brief explanation for your analysis, referencing the text's style." },
//     },
//     required: ['authorship', 'probability_ai_generated', 'explanation'],
//   };

//   const result = await callGemini(systemPrompt, articleText, schema, false); // No web search needed
//   console.log(`   -> Authorship Analysis Complete: ${result.authorship} (${result.probability_ai_generated}%)`);
//   return result; 
// }

// /**
//  * =================================================================
//  * FUNCTION 6: analyzeSite (REWRITTEN WITH STRICTER PROMPT)
//  * =================================================================
//  */
// async function analyzeSite(articleUrl) {
//   console.log("Analyzing site reputation...");
//   let domain;
//   try {
//     const url = new URL(articleUrl);
//     domain = url.hostname.replace(/^www\./, '');
//   } catch (e) {
//     console.error("   -> Error parsing URL:", e.message);
//     return { domain: "Invalid URL", reputation: "Unknown", politicalBias: "Unknown", biasContext: "N/A", explanation: "The provided URL was invalid." };
//   }
  
//   console.log(`   -> Analyzing domain: ${domain}`);
  
//   // ============================================================
//   // THE FIX IS HERE: A much stricter prompt for the AI.
//   // ============================================================
//   const systemPrompt = `You are an expert media analyst. You will be given a domain name. Your job is to use Google Search to analyze its general reputation, trustworthiness, and political bias.

// You MUST respond with *only* a valid JSON object and no other text.
// The JSON object MUST conform to this exact schema. You MUST use *only* the single-word strings from the 'enum' options.

// {
//   "domain": "${domain}",
//   "reputation": "High" | "Mixed" | "Low" | "Unknown",
//   "politicalBias": "Left" | "Center-Left" | "Center" | "Center-Right" | "Right" | "Non-Partisan" | "N/A",
//   "biasContext": "US Politics" | "Global" | "Tech Industry" | "Finance" | "N/A" | "Other",
//   "explanation": "A brief 1-2 sentence summary of the site's reputation and why you gave these ratings."
// }`;
  
//   const schema = {
//     type: "OBJECT",
//     properties: {
//       domain: { type: "STRING" },
//       reputation: { type: "STRING", enum: ['High', 'Mixed', 'Low', 'Unknown'] },
//       politicalBias: { type: "STRING", enum: ['Left', 'Center-Left', 'Center', 'Center-Right', 'Right', 'Non-Partisan', 'N/A'] },
//       biasContext: { type: "STRING" },
//       explanation: { type: "STRING", description: "A brief summary of the site's reputation and why you gave these ratings." },
//     },
//     required: ['domain', 'reputation', 'politicalBias', 'biasContext', 'explanation'],
//   };

//   // We ask Gemini for the domain. We pass the schema for the helper function's use.
//   const result = await callGemini(systemPrompt, domain, schema, true); // Web search IS needed
//   console.log(`   -> Site Analysis Complete: ${result.reputation} Bias: ${result.politicalBias}`);
//   return result; 
// }

// /**
//  * =================================================================
//  * ENDPOINT: /analyze (This logic is unchanged!)
//  * =================================================================
//  */
// app.post('/analyze', async (req, res) => {
//   try {
//     const { articleText, articleUrl } = req.body;
    
//     if (!articleText || !articleUrl) {
//       return res.status(400).json({ error: "articleText and articleUrl are required" });
//     }

//     console.log("===================================");
//     console.log("NEW V2+ (Gemini) ANALYSIS REQUEST");
//     console.log(`On URL: ${articleUrl}`);
//     console.log("===================================");

//     console.log("Step 1: Running parallel tasks (Claims, Sentiment, Authorship, Site)...");
    
//     const [rawClaims, sentimentResult, authorshipResult, siteResult] = await Promise.all([
//       extractClaims(articleText),
//       analyzeSentiment(articleText),
//       analyzeAuthorship(articleText),
//       analyzeSite(articleUrl)
//     ]);
    
//     console.log(`Step 1 Complete: Found ${rawClaims.length} raw claims.`);
//     console.log("Step 2: Verifying claims one by one...");
    
//     const verificationResults = []; 
//     for (const rawClaim of rawClaims) {
//       const cleanClaim = rawClaim.replace(/\[.*?\]/g, '').trim();
//       if (cleanClaim.length < 10) {
//         console.log(`Skipping junk claim: "${rawClaim}"`);
//         continue; 
//       }
//       const result = await verifyClaim(cleanClaim);
//       verificationResults.push(result);
//     }
    
//     console.log("Step 2 Complete: All claims verified.");
//     console.log("===================================");

//     res.json({
//       status: "success",
//       siteAnalysis: siteResult,
//       sentiment: sentimentResult,
//       authorship: authorshipResult,
//       results: verificationResults
//     });

//   } catch (error) {
//     console.error("Error in /analyze endpoint:", error.message);
//     res.status(500).json({ error: "An internal server error occurred." });
//   }
// });

// /**
//  * =================================================================
//  * Server Startup (Now checks for Gemini key)
//  * =================================================================
//  */
// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
  
//   if (GEMINI_API_KEY) {
//     console.log("Gemini API Key loaded successfully!");
//   } else {
//     console.error("ERROR: GEMINI_API_KEY not found. Did you create .env and add it?");
//   }
  
//   if (GOOGLE_API_KEY) {
//     console.log("Google Fact Check API Key loaded successfully!");
//   } else {
//     console.error("ERROR: GOOGLE_API_KEY not found.");
//   }
// });




// 1. Load our secret keys from the .env file
require('dotenv').config();

// 2. Import all our libraries
const express = require('express');
const cors = require('cors');
const axios = require('axios'); // We still need axios for the Google Fact Check API
const { URL } = require('url');

// NEW: Import the Google Gemini library
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

// 3. Store our secret keys in variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // NEW
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY; 

// 4. Initialize our Express application
const app = express();
const PORT = 3001; 
app.use(cors()); 
app.use(express.json()); 

// 5. Define API URLs
const GOOGLE_FACT_CHECK_API_URL = 'https://factchecktools.googleapis.com/v1alpha1/claims:search';

// 6. NEW: Initialize Google Gemini Client
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const geminiModelName = "gemini-2.5-flash-preview-09-2025";

// NEW: We must set safety settings to be non-restrictive
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

/**
 * =================================================================
 * HELPER: Sanitize text to remove problematic Unicode characters
 * =================================================================
 */
function sanitizeText(text) {
  // Convert to string if not already
  if (typeof text !== 'string') {
    text = String(text);
  }
  
  // Replace problematic Unicode characters with ASCII equivalents or remove them
  return text
    .replace(/[\u0300-\u036F]/g, '') // Remove combining diacritical marks
    .replace(/[\u0400-\uFFFF]/g, '') // Remove Cyrillic, CJK, and other high Unicode
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .trim();
}

/**
 * =================================================================
 * NEW CENTRAL HELPER FUNCTION: callGemini (with Bugfix)
 * =================================================================
 */
async function callGemini(systemPrompt, userPrompt, schema, useWebSearch = false) {
  try {
    // Sanitize the user prompt to remove problematic Unicode characters
    const sanitizedPrompt = sanitizeText(userPrompt);
    
    const modelConfig = {
      model: geminiModelName,
      safetySettings,
      systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    if (useWebSearch) {
      modelConfig.tools = [{ "google_search": {} }];
      modelConfig.generationConfig = {
        temperature: 0,
      };
    } else {
      modelConfig.generationConfig = {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0,
      };
    }

    const model = genAI.getGenerativeModel(modelConfig);
    const result = await model.generateContent(sanitizedPrompt);
    const response = await result.response;
    const text = response.text();

    if (useWebSearch) {
      const jsonMatch = text.match(/\{[\s\S]*\}/); // Find the first JSON block
      if (!jsonMatch) {
        console.error("Gemini Response (non-JSON):", text);
        throw new Error("Gemini responded with non-JSON text.");
      }
      return JSON.parse(jsonMatch[0]);
    } else {
      return JSON.parse(text);
    }

  } catch (error) {
    console.error(`Error in callGemini (Prompt: "${systemPrompt.substring(0, 40)}..."):`, error.message);
    if (error.response) {
      console.error("Gemini API Error Response:", JSON.stringify(error.response, null, 2));
    }
    
    let errorMessage = `Gemini API call failed: ${error.message}`;
    if (error.message?.includes('API key not valid')) {
        errorMessage = "Gemini API call failed: The API key is not valid. Please check your .env file.";
    } else if (error.message?.includes('400 Bad Request')) {
        errorMessage = `Gemini API call failed: Bad Request. This may be due to the prompt or a temporary API issue. ${error.message}`;
    }
    
    throw new Error(errorMessage);
  }
}

/**
 * =================================================================
 * FUNCTION 1: extractClaims (Rewritten for Gemini)
 * =================================================================
 */
async function extractClaims(articleText) {
  console.log("Extracting claims with Gemini...");
  const systemPrompt = `You are a fact-checking assistant. Your job is to read the following article and extract the main factual claims. A "factual claim" is a statement that can be verified with evidence. It is NOT an opinion, a question, or a vague statement.

IMPORTANT:
1. Extract 5-7 of the most important factual claims.
2. DO NOT include any citations (e.g., [1][5]).
3. Simplify the claim. For example, "The claim that 'the earth is flat' contradicts evidence[2]" should become "The earth is flat."
4. For each claim, you MUST also provide the ORIGINAL SENTENCE from the article text where this claim appears. This should be the exact sentence as it appears in the article, not a simplified version.`;
  
  const schema = {
    type: "OBJECT",
    properties: {
      claims: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            claim: { type: "STRING", description: "The simplified, clean claim text" },
            originalSentence: { type: "STRING", description: "The exact original sentence from the article where this claim appears" }
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
 * FUNCTION 2: verifyClaim (Unchanged, still uses Google Fact Check API)
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
        explanation: `Rating: ${rating}`
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
      explanation: error.message
    };
  }
}

/**
 * =================================================================
 * FUNCTION 3: corroborateWithGemini (UPDATED TO INCLUDE URLS)
 * =================================================================
 */
async function corroborateWithGemini(claimText) {
  // ============================================================
  // THE FIX IS HERE: Updated prompt and schema
  // ============================================================
  const systemPrompt = `You are a fact-check researcher. You will be given a factual claim. Your job is to use Google Search to determine if the claim is "Verified" (true), "Disputed" (false), or "Questionable" (unverified).

You MUST find the *single best* source (e.g., a reputable news article or encyclopedia) that supports your conclusion.

You MUST respond with only a valid JSON object. Do not add any other text.
Your JSON object must follow this exact schema:
{
  "status": "Verified" | "Disputed" | "Questionable",
  "explanation": "A brief explanation of your findings.",
  "sourceName": "The name of the best source (e.g., 'Reuters', 'Wikipedia')",
  "sourceUrl": "The full URL of that source"
}
You MUST use one of the three specified strings for the "status" field. If you cannot find a specific source URL, you MUST return an empty string "" for sourceUrl.`;
  
  const schema = {
    type: "OBJECT",
    properties: {
      status: { type: "STRING", enum: ['Verified', 'Disputed', 'Questionable'] },
      explanation: { type: "STRING" },
      sourceName: { type: "STRING" }, // NEW
      sourceUrl: { type: "STRING" },  // NEW
    },
    required: ['status', 'explanation', 'sourceName', 'sourceUrl'], // NEW
  };

  const result = await callGemini(systemPrompt, claimText, schema, true); // Web search IS needed
  console.log(`   -> Gemini Corroboration: ${result.status}.`);
    
  // ============================================================
  // THE FIX IS HERE: We now return the source info from the AI
  // ============================================================
  return {
    claim: claimText,
    status: result.status, 
    source: result.sourceName,
    sourceUrl: result.sourceUrl,
    explanation: result.explanation
  };
}

/**
 * =================================================================
 * FUNCTION 4: analyzeSentiment (Rewritten for Gemini)
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

  const result = await callGemini(systemPrompt, articleText, schema, false); // No web search needed
  console.log(`   -> Sentiment Analysis Complete: ${result.bias} (${result.sentiment})`);
  return result; 
}

/**
 * =================================================================
 * FUNCTION 5: analyzeAuthorship (Rewritten for Gemini)
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

  const result = await callGemini(systemPrompt, articleText, schema, false); // No web search needed
  console.log(`   -> Authorship Analysis Complete: ${result.authorship} (${result.probability_ai_generated}%)`);
  return result; 
}

/**
 * =================================================================
 * FUNCTION 6: analyzeSite (REWRITTEN WITH STRICTER PROMPT)
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

You MUST respond with *only* a valid JSON object and no other text.
The JSON object MUST conform to this exact schema. You MUST use *only* the single-word strings from the 'enum' options.

{
  "domain": "${domain}",
  "reputation": "High" | "Mixed" | "Low" | "Unknown",
  "politicalBias": "Left" | "Center-Left" | "Center" | "Center-Right" | "Right" | "Non-Partisan" | "N/A",
  "biasContext": "US Politics" | "Global" | "Tech Industry" | "Finance" | "N/A" | "Other",
  "explanation": "A brief 1-2 sentence summary of the site's reputation and why you gave these ratings."
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

  const result = await callGemini(systemPrompt, domain, schema, true); // Web search IS needed
  console.log(`   -> Site Analysis Complete: ${result.reputation} Bias: ${result.politicalBias}`);
  return result; 
}

/**
 * =================================================================
 * ENDPOINT: /analyze (This logic is unchanged!)
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

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Helper function to send SSE events
    const sendEvent = (type, data) => {
      const eventData = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
      res.write(eventData);
      // Force flush to ensure data is sent immediately
      if (res.flush) res.flush();
    };

    try {
      console.log("Step 1: Running parallel tasks (Claims, Sentiment, Authorship, Site)...");
      sendEvent('status', { message: 'Extracting claims and analyzing article...' });
      
      const [rawClaims, sentimentResult, authorshipResult, siteResult] = await Promise.all([
        extractClaims(articleText),
        analyzeSentiment(articleText),
        analyzeAuthorship(articleText),
        analyzeSite(articleUrl)
      ]);
      
      console.log(`Step 1 Complete: Found ${rawClaims.length} raw claims.`);
      
      // Send Step 1 results as they complete
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
        // Handle both old format (string) and new format (object)
        const claimText = typeof rawClaimObj === 'string' ? rawClaimObj : rawClaimObj.claim;
        const originalSentence = typeof rawClaimObj === 'string' ? null : rawClaimObj.originalSentence;
        
        const cleanClaim = claimText.replace(/\[.*?\]/g, '').trim();
        if (cleanClaim.length < 10) {
          console.log(`Skipping junk claim: "${claimText}"`);
          continue; 
        }
        
        sendEvent('status', { message: `Verifying claim ${i + 1}/${rawClaims.length}...` });
        const result = await verifyClaim(cleanClaim);
        
        // Add the original sentence to the result
        result.originalSentence = originalSentence || cleanClaim;
        
        verificationResults.push(result);
        
        // Send each claim as it's verified
        sendEvent('claim', result);
      }
      
      console.log("Step 2 Complete: All claims verified.");
      console.log("===================================");

      // Send final complete event
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

Focus on credible, authoritative sources like:
- Major news organizations (Reuters, AP, BBC, NYT, WSJ)
- Academic journals and research institutions
- Government sources and official statistics
- Established fact-checking organizations (Snopes, FactCheck.org, PolitiFact)

Avoid personal blogs, social media posts, or unreliable sources.`;

    const schema = {
      type: 'object',
      properties: {
        sources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              summary: { type: 'string' },
              source: { type: 'string' },
              url: { type: 'string' },
              date: { type: 'string' }
            },
            required: ['title', 'summary', 'source']
          }
        }
      },
      required: ['sources']
    };

    const result = await callGemini(systemPrompt, claim, schema, true); // Web search enabled
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
 * Server Startup (Now checks for Gemini key)
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