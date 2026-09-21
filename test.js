// WanderWise api/test.js — diagnostic endpoint

export const config = { runtime: 'edge' };

export default async function handler(req) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  const checks = {
    api_key_present: !!apiKey,
    api_key_prefix: apiKey ? apiKey.substring(0, 14) + '...' : 'MISSING',
    timestamp: new Date().toISOString(),
    runtime: 'edge'
  };

  if (!apiKey) {
    return new Response(JSON.stringify({
      status: 'FAIL',
      problem: 'ANTHROPIC_API_KEY is not set in Vercel Environment Variables',
      fix: 'Go to Vercel → your project → Settings → Environment Variables → Add ANTHROPIC_API_KEY',
      checks
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  // Test actual Anthropic call
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 30,
        messages: [{ role: 'user', content: 'Say: WanderWise AI is working!' }]
      })
    });

    const data = await resp.json();

    if (data.error) {
      return new Response(JSON.stringify({
        status: 'FAIL',
        problem: 'Anthropic API rejected the key: ' + data.error.message,
        fix: 'Your API key may be invalid or revoked. Create a fresh key at console.anthropic.com',
        checks
      }, null, 2), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const text = data.content?.[0]?.text || '';
    return new Response(JSON.stringify({
      status: 'SUCCESS ✓',
      message: 'Everything is working perfectly!',
      ai_response: text,
      checks
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      status: 'FAIL',
      problem: 'Network error: ' + err.message,
      checks
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
